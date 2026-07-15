import type { ScoreboardData } from "@/models/metrics";

export default function Scoreboard3DFallback({ data }: { data: ScoreboardData }) {
  return (
    <div className="flex h-full min-h-[280px] items-center rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 md:min-h-[360px] md:p-8">
      <div className="grid w-full grid-cols-2 gap-px overflow-hidden rounded border border-[var(--border)] bg-[var(--border)]">
        {data.metrics.map((metric, index) => (
          <div key={metric.id} className="relative min-h-28 bg-[var(--bg)] p-4">
            <span className={`absolute inset-x-0 top-0 h-px ${index % 2 === 0 ? "bg-[var(--accent)]" : "bg-[var(--accent-2)]"}`} />
            <span className="font-mono text-2xl font-semibold tabular-nums text-white">{metric.value}</span>
            <span className="mt-2 block font-mono text-xs uppercase tracking-wider text-[var(--muted)]">{metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
