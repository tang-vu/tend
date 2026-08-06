import { mindDecisionSchema, TEND_PROMPT_VERSION } from "@tend/core";
import demoDecisionFixture from "./fixtures/demo-decision.json" with { type: "json" };
import { stewardAlias } from "./aliases";
import type {
  AnalyzeIncidentInput,
  MindsAdapter,
  MindsAnalysisResult,
  MindsReference,
  TeachMemoryInput,
} from "./types";

export class MockMindsAdapter implements MindsAdapter {
  readonly mode = "mock" as const;

  async teach(input: TeachMemoryInput): Promise<MindsReference> {
    await Promise.resolve();
    return {
      provider: "mock",
      conversationAlias: stewardAlias(input.communityId),
      responseFingerprint: "mock:steward-demo:act-1",
      promptVersion: TEND_PROMPT_VERSION,
    };
  }

  async analyzeIncident(
    input: AnalyzeIncidentInput,
  ): Promise<MindsAnalysisResult> {
    await Promise.resolve();
    const activeIds = new Set(
      input.activeMemories.map((receipt) => receipt.id),
    );
    if (!activeIds.has("memory-kai-voice-boundary")) {
      return {
        decision: {
          summary:
            "The message is ambiguous and TEND lacks enough active context to intervene.",
          classification: "uncertain",
          riskLevel: "low",
          confidence: 0.42,
          needsHumanReview: true,
          policyMatches: [],
          memoryReceipts: [],
          proposedActions: [
            {
              type: "moderator_review",
              targetId: null,
              content: "Review this message with nearby context.",
              rationale: "Relevant active memory was not available.",
            },
          ],
          followUps: [],
          reasoningForModerator:
            "The known boundary receipt is not active, so TEND will not fabricate it.",
          uncertainties: ["Member intent and relevant boundaries are unknown."],
        },
        reference: {
          provider: "mock",
          conversationAlias: stewardAlias(input.community.id),
          responseFingerprint: "mock:manual-review:no-active-memory",
          promptVersion: TEND_PROMPT_VERSION,
        },
        status: "manual_review",
        notice:
          "Demo fixture withheld because the relevant receipt is not active.",
      };
    }

    return {
      decision: mindDecisionSchema.parse(demoDecisionFixture),
      reference: {
        provider: "mock",
        conversationAlias: stewardAlias(input.community.id),
        responseFingerprint: "mock:steward-demo:act-2",
        promptVersion: TEND_PROMPT_VERSION,
      },
      status: "ok",
      notice:
        "Deterministic Mock Minds fixture. No external model call occurred.",
    };
  }
}
