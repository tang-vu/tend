import type { FollowUp } from "@tend/core";
import type {
  FollowUpCompletion,
  FollowUpProcessor,
  TendRepository,
} from "@tend/db";
import type { MindsAdapter } from "@tend/minds";

export interface FreshDiscordMessage {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface DiscordObservationGateway {
  fetchAfter(
    channelId: string,
    afterMessageId: string,
  ): Promise<FreshDiscordMessage[]>;
}

const RESOLUTION_CONFIDENCE = 0.75;

export class DiscordMindsFollowUpProcessor implements FollowUpProcessor {
  constructor(
    private readonly repository: TendRepository,
    private readonly gateway: DiscordObservationGateway,
    private readonly minds: MindsAdapter,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async process(followUp: FollowUp): Promise<FollowUpCompletion> {
    const context = this.repository.getFollowUpContext(followUp.id);
    if (!context) throw new Error("Follow-up context is unavailable.");
    if (context.community.mode !== "live") {
      throw new Error("Discord observation can complete only live follow-ups.");
    }
    const channelId = context.incident.sourceChannelId;
    if (!channelId) {
      throw new Error(
        "The incident has no persisted allowlisted source channel for observation.",
      );
    }

    const freshMessages = (
      await this.gateway.fetchAfter(
        channelId,
        context.incident.externalMessageId,
      )
    ).slice(0, 50);
    const analysis = await this.minds.analyzeFollowUp({
      community: context.community,
      tenets: context.tenets,
      activeMemories: context.activeMemories,
      incident: context.incident,
      purpose: followUp.purpose,
      observedAt: this.clock().toISOString(),
      freshMessages,
    });
    if (analysis.status !== "ok" || analysis.reference.provider !== "live") {
      throw new Error(
        "No validated live Minds follow-up assessment was available.",
      );
    }

    const observedIds = new Set(freshMessages.map((message) => message.id));
    if (
      analysis.assessment.observedMessageIds.some(
        (messageId) => !observedIds.has(messageId),
      )
    ) {
      throw new Error(
        "The follow-up assessment referenced a message outside the fresh observation.",
      );
    }

    const hasGroundedEvidence =
      freshMessages.length > 0 &&
      analysis.assessment.observedMessageIds.length > 0;
    const canResolve =
      analysis.assessment.incidentStatus === "resolved" &&
      analysis.assessment.confidence >= RESOLUTION_CONFIDENCE &&
      hasGroundedEvidence;
    const incidentStatus = canResolve ? "resolved" : "manual_review";
    const summary = canResolve
      ? analysis.assessment.summary
      : analysis.assessment.incidentStatus === "resolved"
        ? "Fresh Discord evidence was insufficient for autonomous resolution; moderator review is required."
        : analysis.assessment.summary;

    return {
      incidentStatus,
      evidenceKind: "live_observation",
      summary,
      ...(canResolve && analysis.assessment.headline
        ? { headline: analysis.assessment.headline }
        : {}),
      ...(canResolve && analysis.assessment.positivePrompt
        ? { positivePrompt: analysis.assessment.positivePrompt }
        : {}),
      evidenceReference: {
        provider: "live",
        conversationAlias: analysis.reference.conversationAlias,
        responseFingerprint: analysis.reference.responseFingerprint,
        promptVersion: analysis.reference.promptVersion,
        observedMessageCount: freshMessages.length,
      },
    };
  }
}
