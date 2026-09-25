export type YearRow = { year: number; count: number };

/** Static bar chart with the same scale as the 3D view; also the reduced-motion / mobile / no-WebGL rendering. */
export default function Scoreboard3DFallback({ rows }: { rows: YearRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex h-full min-h-[280px] flex-col rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 md:min-h-[360px] md:p-6">
      <ol className="flex flex-1 items-end gap-1.5 md:gap-2">
        {rows.map((row, index) => (
          <li key={row.year} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="font-mono text-xs tabular-nums text-strong">{row.count}</span>
            <span
              className={`w-full rounded-t ${index % 2 === 0 ? "bg-[var(--accent)]" : "bg-[var(--accent-2)]"}`}
              style={{ height: `${Math.max(2, (row.count / max) * 100)}%`, opacity: row.count ? 0.9 : 0.25 }}
            />
            <span className="font-mono text-[10px] text-[var(--muted)]">{String(row.year).slice(2)}&apos;</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
