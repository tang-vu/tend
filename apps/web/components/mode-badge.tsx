export function ModeBadge({
  compact = false,
  mode = "demo",
}: {
  compact?: boolean;
  mode?: "demo" | "live";
}) {
  return (
    <span className={compact ? "mode-badge compact" : "mode-badge"}>
      <span aria-hidden="true" className="mode-dot" />
      {mode === "live" ? "Live mode" : "Demo mode"}
      {!compact && (
        <span className="mode-detail">
          {mode === "live"
            ? "External integrations · fail-closed"
            : "Mock Minds · local Discord"}
        </span>
      )}
    </span>
  );
}
