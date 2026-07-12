import { Terminal } from "lucide-react";

import type { JobData, JobType } from "./types";

type CareerHistoryPanelProps = {
  title: string;
  hint: string;
  emptyLabel: string;
  jobs: JobData[];
  activeJobId?: string;
  onSelect: (job: JobData) => void;
};

function StatusBadge({ type }: { type: JobType }) {
  const styles: Record<JobType, string> = {
    INFO: "border-blue-500/30 bg-blue-500/20 text-blue-400",
    WARN: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    ERROR: "border-red-500/30 bg-red-500/10 text-red-400",
    SUCCESS: "border-green-500/30 bg-green-500/10 text-green-400",
  };

  return <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${styles[type]}`}>{type}</span>;
}

export default function CareerHistoryPanel({
  title,
  hint,
  emptyLabel,
  jobs,
  activeJobId,
  onSelect,
}: CareerHistoryPanelProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-black/40 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[var(--muted)]">
          <Terminal size={16} /> {title}
        </h2>
        <span className="font-mono text-[10px] text-gray-600">{hint}</span>
      </div>

      {jobs.length === 0 ? (
        <div className="font-mono text-xs text-[color:var(--muted)]">{emptyLabel}</div>
      ) : (
        <div className="custom-scrollbar max-h-[400px] space-y-3 overflow-y-auto pr-2">
          {jobs.map((job) => {
            const isActive = activeJobId === job.id;

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelect(job)}
                aria-pressed={isActive}
                className={`w-full rounded border-l-2 p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                  isActive
                    ? "border-b border-l-green-500 border-r border-t border-white/10 bg-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    : "border-transparent border-l-gray-700 hover:bg-white/5"
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span className="font-mono text-xs text-green-500">[{job.year}]</span>
                  <StatusBadge type={job.type} />
                </div>
                <h3 className="font-bold text-white">
                  {job.role} @ {job.company}
                </h3>
                <p className="mt-1 font-mono text-sm leading-relaxed text-[var(--muted)]">{`> ${job.desc}`}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
