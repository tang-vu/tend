"use client";

import { ArrowIcon } from "./icons";

export function ReceiptActions({ incidentId }: { incidentId: string }) {
  return (
    <div className="receipt-actions">
      <a
        className="button button-primary"
        download
        href={`/api/incidents/${incidentId}/receipt`}
      >
        Download JSON <ArrowIcon />
      </a>
      <button
        className="button button-quiet"
        onClick={() => window.print()}
        type="button"
      >
        Print / save PDF
      </button>
    </div>
  );
}
