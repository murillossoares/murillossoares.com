import { Server } from "lucide-react";

import { pickStackTechnologies } from "./dashboard-data";
import type { JobData } from "./types";

type DependenciesPanelProps = {
  title: string;
  groups: {
    backend: string;
    frontend: string;
  };
  emptyLabel: string;
  activeJob: JobData | null;
};

type TechTagProps = {
  label: string;
  color: string;
};

function TechTag({ label, color }: TechTagProps) {
  return <span className={`rounded border px-2 py-1 font-mono text-xs ${color}`}>{label}</span>;
}

export default function DependenciesPanel({ title, groups, emptyLabel, activeJob }: DependenciesPanelProps) {
  const backendStack = activeJob ? pickStackTechnologies(activeJob.stack, "backend") : [];
  const frontendStack = activeJob ? pickStackTechnologies(activeJob.stack, "frontend") : [];

  return (
    <div className="h-full min-h-[300px] rounded-lg border border-[var(--border)] bg-black/40 p-6 backdrop-blur-md">
      <h2 className="mb-6 flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[var(--muted)]">
        <Server size={16} /> {title}
      </h2>

      <div key={activeJob?.id ?? "empty"}>
        {activeJob ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase text-gray-500">{groups.backend}</h3>
              <div className="flex flex-wrap gap-2">
                {backendStack.map((tech) => (
                  <TechTag key={tech} label={tech} color="border-orange-500/20 bg-orange-500/10 text-orange-400" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-mono text-xs uppercase text-gray-500">{groups.frontend}</h3>
              <div className="flex flex-wrap gap-2">
                {frontendStack.map((tech) => (
                  <TechTag key={tech} label={tech} color="border-blue-500/20 bg-blue-500/10 text-blue-400" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="font-mono text-xs text-[color:var(--muted)]">{emptyLabel}</div>
        )}
      </div>
    </div>
  );
}
