export default function Loading() {
  return (
    <main className="route-loading" aria-busy="true" aria-label="Loading TEND">
      <span className="sr-only">Loading TEND…</span>
      <div className="skeleton skeleton-kicker" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <div className="skeleton-grid" aria-hidden="true">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </main>
  );
}
