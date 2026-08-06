import { describe, expect, it } from "vitest";
import { evaluatePersistenceProof } from "../src/proof-evaluator";

describe("persistence proof evaluation", () => {
  it.each([
    {
      recalledEarlierBoundary: true,
      recalledFact: null,
      effectOnDecision: "Use a reminder",
      confidence: 0.9,
    },
    {
      recalledEarlierBoundary: true,
      recalledFact: "A different community fact",
      effectOnDecision: "The boundary changes the decision",
      confidence: 0.9,
    },
    {
      recalledEarlierBoundary: true,
      recalledFact: "Kai has a voice boundary",
      effectOnDecision: "No effect recorded",
      confidence: 0.4,
    },
  ])("does not accept an unsupported model assertion", (candidate) => {
    expect(evaluatePersistenceProof(candidate).proven).toBe(false);
  });

  it("requires the recalled fact and its material decision effect", () => {
    expect(
      evaluatePersistenceProof({
        recalledEarlierBoundary: true,
        recalledFact: "Kai asked the community not to joke about their voice.",
        effectOnDecision:
          "The recalled boundary changes an ambiguous joke into a gentle-reminder case.",
        confidence: 0.91,
      }).proven,
    ).toBe(true);
  });
});
