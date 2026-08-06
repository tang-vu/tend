export type MindsProviderSelection = "mock" | "live" | "unavailable";

export function selectMindsProvider(
  tendMode: string | undefined,
  mindsMode: string | undefined,
): MindsProviderSelection {
  const applicationMode = tendMode ?? "demo";
  const providerMode = mindsMode ?? "mock";

  if (applicationMode === "demo" && providerMode === "mock") return "mock";
  if (applicationMode === "live" && providerMode === "live") return "live";
  return "unavailable";
}

export function creatorDashboardEnabled(tendMode: string | undefined): boolean {
  return tendMode !== "live";
}
