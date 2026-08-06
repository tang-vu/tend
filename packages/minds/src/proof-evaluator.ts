import { z } from "zod";

export const persistenceProofResultSchema = z
  .object({
    recalledEarlierBoundary: z.boolean(),
    recalledFact: z.string().min(1).max(1_000).nullable(),
    effectOnDecision: z.string().min(8).max(2_000),
    confidence: z.number().finite().min(0).max(1),
  })
  .strict();

export type PersistenceProofResult = z.infer<
  typeof persistenceProofResultSchema
>;

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function parsePersistenceProofResponse(text: string): unknown {
  if (Buffer.byteLength(text, "utf8") > 64 * 1024) return null;

  const trimmed = text.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
  ];
  const preformatted = trimmed.match(
    /<pre(?:\s[^>]*)?>([\s\S]*?)<\/pre>/i,
  )?.[1];
  if (preformatted) candidates.push(decodeHtmlEntities(preformatted.trim()));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next supported response envelope.
    }
  }
  return null;
}

export function evaluatePersistenceProof(value: unknown) {
  const parsed = persistenceProofResultSchema.safeParse(value);
  if (!parsed.success) {
    return {
      proven: false as const,
      parsed: null,
      issues: parsed.error.issues,
    };
  }

  const recalledFact = parsed.data.recalledFact?.toLowerCase() ?? "";
  const effect = parsed.data.effectOnDecision.toLowerCase();
  const factMatches =
    recalledFact.includes("kai") && recalledFact.includes("voice");
  const materialEffect =
    effect.includes("boundary") ||
    effect.includes("context") ||
    effect.includes("reminder");
  const proven =
    parsed.data.recalledEarlierBoundary &&
    parsed.data.confidence >= 0.5 &&
    factMatches &&
    materialEffect;

  return {
    proven,
    parsed: parsed.data,
    issues: proven
      ? []
      : [
          {
            code: "custom" as const,
            path: [],
            message:
              "Recall must identify Kai's voice boundary and explain a material decision effect with confidence of at least 0.5.",
          },
        ],
  };
}
