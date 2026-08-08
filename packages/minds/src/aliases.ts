import { createHash } from "node:crypto";

const STEWARD_CONVERSATION_GENERATION = "v2";

function safePart(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 10);
  return `${normalized.slice(0, 30) || "community"}-${hash}`;
}

export function stewardAlias(communityId: string): string {
  return `tend-steward-${STEWARD_CONVERSATION_GENERATION}-${safePart(communityId)}`;
}

export function proofAlias(
  communityId: string,
  session: "teach" | "recall",
): string {
  return `tend-proof-${safePart(communityId)}-${session}`;
}
