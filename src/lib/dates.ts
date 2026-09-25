// Dependency-free helpers shared by the app and the LinkedIn sync script (which runs under Node type stripping).

export function yearOf(date: string | null | undefined): number {
  const year = Number(String(date ?? "").slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : 0;
}

/** Number of date components: "2019" → 1, "2019-03" → 2. */
export function precision(date: string | null | undefined): number {
  return String(date ?? "").split("-").filter(Boolean).length;
}
