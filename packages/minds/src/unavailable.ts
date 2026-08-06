import { TEND_PROMPT_VERSION } from "@tend/core";
import type {
  AnalyzeIncidentInput,
  MindsAdapter,
  MindsAnalysisResult,
  MindsReference,
  TeachMemoryInput,
} from "./types";

export class UnavailableMindsAdapter implements MindsAdapter {
  readonly mode = "unavailable" as const;

  constructor(private readonly reason: string) {}

  async teach(_input: TeachMemoryInput): Promise<MindsReference> {
    await Promise.resolve();
    return {
      provider: "unavailable",
      conversationAlias: null,
      responseFingerprint: null,
      promptVersion: TEND_PROMPT_VERSION,
    };
  }

  async analyzeIncident(
    _input: AnalyzeIncidentInput,
  ): Promise<MindsAnalysisResult> {
    await Promise.resolve();
    return {
      decision: {
        summary:
          "Minds is not configured; manual moderator review is required.",
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
            content: "Review this incident manually.",
            rationale: this.reason,
          },
        ],
        followUps: [],
        reasoningForModerator: this.reason,
        uncertainties: ["No external Minds decision was available."],
      },
      reference: {
        provider: "unavailable",
        conversationAlias: null,
        responseFingerprint: null,
        promptVersion: TEND_PROMPT_VERSION,
      },
      status: "manual_review",
      notice: "No hidden model fallback was used.",
    };
  }
}
