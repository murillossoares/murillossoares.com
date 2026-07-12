"use client";

import { useEffect, useState } from "react";

import CareerHistoryPanel from "./CareerHistoryPanel";
import DashboardHeader from "./DashboardHeader";
import DependenciesPanel from "./DependenciesPanel";
import KpiGrid from "./KpiGrid";
import ServiceMap from "./ServiceMap";
import type { DashboardCopy, JobData } from "./types";

type DashboardViewProps = {
  copy: DashboardCopy;
  careerHistory: JobData[];
};

export default function DashboardView({ copy, careerHistory }: DashboardViewProps) {
  const [activeJob, setActiveJob] = useState<JobData | null>(careerHistory[0] ?? null);

  useEffect(() => {
    if (careerHistory.length === 0) {
      setActiveJob(null);
      return;
    }

    setActiveJob((previousJob) => {
      if (!previousJob) return careerHistory[0];
      return careerHistory.find((job) => job.id === previousJob.id) ?? careerHistory[0];
    });
  }, [careerHistory]);

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_40%)] bg-fixed p-4 font-sans text-[var(--text)] md:p-8">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-purple-900/10 to-green-900/10" />

      <DashboardHeader systemOnline={copy.systemOnline} title={copy.title} headline={copy.headline} />

      <main className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <KpiGrid items={[copy.kpis.uptime, copy.kpis.stack, copy.kpis.arch]} />

          <CareerHistoryPanel
            title={copy.eventHistoryTitle}
            hint={copy.eventHistoryHint}
            emptyLabel={copy.eventHistoryEmpty}
            jobs={careerHistory}
            activeJobId={activeJob?.id}
            onSelect={setActiveJob}
          />

          {activeJob ? (
            <ServiceMap
              archType={activeJob.archType}
              label={copy.architectureViewLabel}
              nodeLabels={copy.serviceMapNodeLabels}
            />
          ) : null}
        </section>

        <section className="space-y-6">
          <DependenciesPanel
            title={copy.dependenciesTitle}
            groups={copy.dependenciesGroups}
            emptyLabel={copy.dependenciesEmpty}
            activeJob={activeJob}
          />
        </section>
      </main>
    </div>
  );
}
