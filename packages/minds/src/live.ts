import { createMindsClient } from "@animocabrands/minds-client-lib";
import {
  buildIncidentPrompt,
  buildRepairPrompt,
  mindDecisionSchema,
  TEND_PROMPT_VERSION,
  type MindDecision,
} from "@tend/core";
import { stewardAlias } from "./aliases";
import type {
  AnalyzeIncidentInput,
  MindsAdapter,
  MindsAnalysisResult,
  MindsReference,
  TeachMemoryInput,
} from "./types";

interface ReplyRecord {
  messageText?: string;
  fingerprint?: string;
}

interface ReplyOutcome {
  timedOut: boolean;
  reply?: ReplyRecord;
}

export interface MindsClientPort {
  listMinds(): Promise<Array<{ mindId: string }>>;
  getMind(mindId: string): Promise<unknown>;
  ensureConversation(alias: string, mindId: string): Promise<unknown>;
  getLatestHistoryFingerprint(alias: string): Promise<string | undefined>;
  sendMessage(input: { alias: string; messageText: string }): Promise<unknown>;
  waitForReply(input: {
    alias: string;
    timeoutMs: number;
    afterFingerprint?: string;
    sentMessageText: string;
  }): Promise<ReplyOutcome>;
}

export interface LiveMindsConfig {
  builderApiKey: string;
  mindId: string;
  replyTimeoutMs?: number;
  client?: MindsClientPort;
}

export class MindsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MindsUnavailableError";
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(unfenced);
}

function safeManualReview(reason: string): MindDecision {
  return {
    summary:
      "Minds response is unavailable or invalid; a moderator must review this incident.",
    classification: "uncertain",
    riskLevel: "medium",
    confidence: 0,
    needsHumanReview: true,
    policyMatches: [],
    memoryReceipts: [],
    proposedActions: [
      {
        type: "moderator_review",
        targetId: null,
        content: "Review the original message and community context manually.",
        rationale: "TEND could not obtain a validated structured decision.",
      },
    ],
    followUps: [],
    reasoningForModerator: reason,
    uncertainties: ["No validated Minds decision is available."],
  };
}

export class LiveMindsAdapter implements MindsAdapter {
  readonly mode = "live" as const;
  private readonly client: MindsClientPort;
  private readonly timeoutMs: number;

  constructor(private readonly config: LiveMindsConfig) {
    this.client =
      config.client ??
      (createMindsClient({
        builderApiKey: config.builderApiKey,
      }) as unknown as MindsClientPort);
    this.timeoutMs = config.replyTimeoutMs ?? 180_000;
  }

  async teach(input: TeachMemoryInput): Promise<MindsReference> {
    const alias = stewardAlias(input.communityId);
    await this.validateMind();
    await this.client.ensureConversation(alias, this.config.mindId);
    const before = await this.client.getLatestHistoryFingerprint(alias);
    const messageText = [
      "TEND creator-approved community context follows.",
      "Remember it for future stewardship conversations associated with this Mind.",
      "Do not infer facts beyond this statement.",
      `<CREATOR_APPROVED_CONTEXT>${input.statement}</CREATOR_APPROVED_CONTEXT>`,
      "Acknowledge concisely what was accepted.",
    ].join("\n");
    await this.client.sendMessage({ alias, messageText });
    const outcome = await this.wait(alias, before, messageText);
    if (outcome.timedOut || !outcome.reply) {
      throw new MindsUnavailableError(
        "Minds timed out while recording creator context.",
      );
    }
    return {
      provider: "live",
      conversationAlias: alias,
      responseFingerprint: outcome.reply.fingerprint ?? null,
      promptVersion: TEND_PROMPT_VERSION,
    };
  }

  async analyzeIncident(
    input: AnalyzeIncidentInput,
  ): Promise<MindsAnalysisResult> {
    const alias = stewardAlias(input.community.id);
    try {
      await this.validateMind();
      await this.client.ensureConversation(alias, this.config.mindId);
      const prompt = buildIncidentPrompt(input);
      const first = await this.sendAndWait(alias, prompt);
      if (first.timedOut || !first.reply?.messageText) {
        throw new MindsUnavailableError(
          "Minds did not reply before the configured timeout.",
        );
      }

      const firstParse = this.parseDecision(first.reply.messageText);
      if (firstParse.success) {
        return {
          decision: firstParse.data,
          reference: {
            provider: "live",
            conversationAlias: alias,
            responseFingerprint: first.reply.fingerprint ?? null,
            promptVersion: TEND_PROMPT_VERSION,
          },
          status: "ok",
          notice: "Validated live Minds response.",
        };
      }

      const repair = buildRepairPrompt(first.reply.messageText);
      const second = await this.sendAndWait(alias, repair);
      if (second.timedOut || !second.reply?.messageText) {
        throw new MindsUnavailableError(
          "Minds timed out during its single structured-output repair.",
        );
      }
      const secondParse = this.parseDecision(second.reply.messageText);
      if (!secondParse.success) {
        throw new MindsUnavailableError(
          "Minds returned invalid structured data after one repair.",
        );
      }
      return {
        decision: secondParse.data,
        reference: {
          provider: "live",
          conversationAlias: alias,
          responseFingerprint: second.reply.fingerprint ?? null,
          promptVersion: TEND_PROMPT_VERSION,
        },
        status: "ok",
        notice: "Validated live Minds response after one schema repair.",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown Minds communication failure.";
      return {
        decision: safeManualReview(message),
        reference: {
          provider: "unavailable",
          conversationAlias: alias,
          responseFingerprint: null,
          promptVersion: TEND_PROMPT_VERSION,
        },
        status: "manual_review",
        notice: "Live Minds unavailable; no hidden LLM fallback was used.",
      };
    }
  }

  private async validateMind(): Promise<void> {
    const minds = await this.client.listMinds();
    if (!minds.some((mind) => mind.mindId === this.config.mindId)) {
      throw new MindsUnavailableError(
        "Configured MINDS_MIND_ID is not available to this Builder key.",
      );
    }
    await this.client.getMind(this.config.mindId);
  }

  private async sendAndWait(
    alias: string,
    messageText: string,
  ): Promise<ReplyOutcome> {
    const before = await this.client.getLatestHistoryFingerprint(alias);
    await this.client.sendMessage({ alias, messageText });
    return this.wait(alias, before, messageText);
  }

  private wait(
    alias: string,
    before: string | undefined,
    sentMessageText: string,
  ) {
    return this.client.waitForReply({
      alias,
      timeoutMs: this.timeoutMs,
      sentMessageText,
      ...(before ? { afterFingerprint: before } : {}),
    });
  }

  private parseDecision(text: string) {
    try {
      return mindDecisionSchema.safeParse(extractJson(text));
    } catch {
      return mindDecisionSchema.safeParse(null);
    }
  }
}

export function createLiveMindsAdapterFromEnv(): LiveMindsAdapter {
  const builderApiKey = process.env.MINDS_BUILDER_API_KEY;
  const mindId = process.env.MINDS_MIND_ID;
  if (!builderApiKey || !mindId) {
    throw new MindsUnavailableError(
      "Set MINDS_BUILDER_API_KEY and MINDS_MIND_ID in ignored server-side environment storage.",
    );
  }
  const parsedTimeout = Number(process.env.MINDS_REPLY_TIMEOUT_MS ?? 180_000);
  return new LiveMindsAdapter({
    builderApiKey,
    mindId,
    replyTimeoutMs: Number.isFinite(parsedTimeout) ? parsedTimeout : 180_000,
  });
}
