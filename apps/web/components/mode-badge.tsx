export function ModeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "mode-badge compact" : "mode-badge"}>
      <span aria-hidden="true" className="mode-dot" />
      Demo mode
      {!compact && (
        <span className="mode-detail">Mock Minds · local Discord</span>
      )}
    </span>
  );
}
