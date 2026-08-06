"use client";

import { useState } from "react";
import type { ProposedAction } from "@tend/core";
import { ArrowIcon } from "./icons";

export function IncidentControls({ action }: { action: ProposedAction }) {
  const [content, setContent] = useState(action.content);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(kind: "approve" | "reject") {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/actions/${action.id}/${kind}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const result = (await response.json()) as { ok: boolean; error?: string };
    setMessage(
      result.ok
        ? `${kind === "approve" ? "Approved" : "Rejected"}. Reloading persisted state…`
        : (result.error ?? "Request failed."),
    );
    setBusy(false);
    if (result.ok) window.location.reload();
  }

  if (action.status !== "proposed") {
    return (
      <div className="alert info">
        <strong>Action {action.status}</strong>
        <span>
          {action.executionResult ??
            "The audit timeline contains the latest state."}
        </span>
      </div>
    );
  }

  return (
    <div className="incident-controls">
      <label htmlFor="action-copy">Edit draft before approval</label>
      <textarea
        id="action-copy"
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        value={content}
      />
      <p className="field-help">
        Editing here changes the approval payload shown to the creator. Demo
        delivery remains local-only.
      </p>
      {message && <p role="status">{message}</p>}
      <div>
        <button
          className="button button-primary"
          disabled={busy}
          onClick={() => void submit("approve")}
          type="button"
        >
          Approve response <ArrowIcon />
        </button>
        <button
          className="button button-quiet"
          disabled={busy}
          onClick={() => void submit("reject")}
          type="button"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
