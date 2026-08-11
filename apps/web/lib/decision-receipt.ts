import "server-only";

import { createHash } from "node:crypto";
import {
  buildDecisionReceipt,
  canonicalReceiptJson,
  decisionReceiptEnvelopeSchema,
  type DecisionReceiptEnvelope,
} from "@tend/core";
import type { TendSnapshot } from "@tend/db";

export function createDecisionReceiptEnvelope(
  snapshot: TendSnapshot,
  incidentId: string,
  exportedAt = new Date(),
): DecisionReceiptEnvelope | null {
  const incident = snapshot.incidents.find((item) => item.id === incidentId);
  if (!incident) return null;

  const receipt = buildDecisionReceipt({
    community: snapshot.community,
    incident,
    memories: snapshot.memories,
    actions: snapshot.actions,
    followUps: snapshot.followUps,
    auditEvents: snapshot.auditEvents,
  });
  const digest = createHash("sha256")
    .update(canonicalReceiptJson(receipt), "utf8")
    .digest("hex");

  return decisionReceiptEnvelopeSchema.parse({
    exportedAt: exportedAt.toISOString(),
    receipt,
    integrity: {
      algorithm: "SHA-256",
      digest,
      covers: "receipt",
      note: "The digest detects changes to the receipt payload; it does not prove signer identity.",
    },
  });
}
