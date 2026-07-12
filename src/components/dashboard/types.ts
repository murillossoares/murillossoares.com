export const jobTypes = ["INFO", "WARN", "ERROR", "SUCCESS"] as const;
export type JobType = (typeof jobTypes)[number];

export const archTypes = ["microservices", "monolith", "soa", "hybrid"] as const;
export type ArchType = (typeof archTypes)[number];

export type JobData = {
  id: string;
  year: string;
  role: string;
  company: string;
  type: JobType;
  desc: string;
  stack: string[];
  archType: ArchType;
};

export type DashboardKpi = {
  label: string;
  value: string;
  sub: string;
};

export type DashboardCopy = {
  systemOnline: string;
  title: string;
  headline: string;
  kpis: {
    uptime: DashboardKpi;
    stack: DashboardKpi;
    arch: DashboardKpi;
  };
  eventHistoryTitle: string;
  eventHistoryHint: string;
  eventHistoryEmpty: string;
  dependenciesTitle: string;
  dependenciesGroups: {
    backend: string;
    frontend: string;
  };
  dependenciesEmpty: string;
  architectureViewLabel: string;
  serviceMapNodeLabels: {
    server: string;
    gateway: string;
    client: string;
  };
};
