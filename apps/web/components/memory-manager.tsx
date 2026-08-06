"use client";

import { useState } from "react";
import type { MemoryReceipt } from "@tend/core";
import { MemoryIcon } from "./icons";

export function MemoryManager({
  initialMemories,
}: {
  initialMemories: MemoryReceipt[];
}) {
  const [memories, setMemories] = useState(initialMemories);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function update(
    receipt: MemoryReceipt,
    status: "active" | "corrected" | "archived",
  ) {
    setBusy(receipt.id);
    setMessage(null);
    const response = await fetch(`/api/memories/${receipt.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      error?: string;
      snapshot?: { memories: MemoryReceipt[] };
    };
    if (data.ok && data.snapshot) {
      setMemories(data.snapshot.memories);
      setMessage(
        `Receipt changed to ${status}. Future decisions use active receipts only.`,
      );
    } else {
      setMessage(data.error ?? "Could not change receipt.");
    }
    setBusy(null);
  }

  return (
    <>
      {message && (
        <div className="alert info" role="status">
          {message}
        </div>
      )}
      <div className="memory-list">
        {memories.map((memory) => (
          <article className="memory-row" key={memory.id}>
            <div className="memory-row-icon">
              <MemoryIcon />
            </div>
            <div className="memory-row-main">
              <div>
                <span className={`status-pill ${memory.status}`}>
                  {memory.status}
                </span>
                <span>{memory.subjectType}</span>
              </div>
              <h2>{memory.claim}</h2>
              <p>{memory.whyRelevant}</p>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{memory.sourceReference}</dd>
                </div>
                <div>
                  <dt>Learned</dt>
                  <dd>{new Date(memory.learnedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{Math.round(memory.confidence * 100)}%</dd>
                </div>
                <div>
                  <dt>Mind reference</dt>
                  <dd>{memory.mindReference ?? "None"}</dd>
                </div>
              </dl>
            </div>
            <div
              className="memory-controls"
              aria-label={`Controls for ${memory.claim}`}
            >
              {memory.status !== "corrected" && (
                <button
                  disabled={busy === memory.id}
                  onClick={() => void update(memory, "corrected")}
                  type="button"
                >
                  Mark corrected
                </button>
              )}
              {memory.status !== "archived" && (
                <button
                  disabled={busy === memory.id}
                  onClick={() => void update(memory, "archived")}
                  type="button"
                >
                  Archive
                </button>
              )}
              {memory.status !== "active" && (
                <button
                  disabled={busy === memory.id}
                  onClick={() => void update(memory, "active")}
                  type="button"
                >
                  Restore active
                </button>
              )}
            </div>
          </article>
        ))}
        {memories.length === 0 && (
          <div className="empty-card">
            <MemoryIcon />
            <h3>No memory receipts yet</h3>
            <p>Act 1 records creator-approved facts here.</p>
          </div>
        )}
      </div>
    </>
  );
}
