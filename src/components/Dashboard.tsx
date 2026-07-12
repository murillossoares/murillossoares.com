"use client";

import { useMemo } from "react";
import { useMessages, useTranslations } from "next-intl";

import DashboardView from "@/components/dashboard/DashboardView";
import { parseCareerHistory } from "@/components/dashboard/dashboard-data";
import type { DashboardCopy } from "@/components/dashboard/types";

type DashboardMessages = Record<string, unknown> & {
  careerHistory?: unknown;
};

export default function Dashboard() {
  const tApp = useTranslations("App");
  const tDash = useTranslations("Dashboard");
  const messages = useMessages() as DashboardMessages;

  const careerHistory = useMemo(() => parseCareerHistory(messages.careerHistory), [messages]);

  const copy: DashboardCopy = {
    systemOnline: tDash("systemOnline"),
    title: tApp("title"),
    headline: tDash("headline"),
    kpis: {
      uptime: {
        label: tDash("kpis.uptimeLabel"),
        value: tDash("kpis.uptimeValue"),
        sub: tDash("kpis.uptimeSub"),
      },
      stack: {
        label: tDash("kpis.stackLabel"),
        value: tDash("kpis.stackValue"),
        sub: tDash("kpis.stackSub"),
      },
      arch: {
        label: tDash("kpis.archLabel"),
        value: tDash("kpis.archValue"),
        sub: tDash("kpis.archSub"),
      },
    },
    eventHistoryTitle: tDash("eventHistoryTitle"),
    eventHistoryHint: tDash("eventHistoryHint"),
    eventHistoryEmpty: tDash("eventHistoryEmpty"),
    dependenciesTitle: tDash("dependenciesTitle"),
    dependenciesGroups: {
      backend: tDash("dependenciesGroups.backend"),
      frontend: tDash("dependenciesGroups.frontend"),
    },
    dependenciesEmpty: tDash("dependenciesEmpty"),
    architectureViewLabel: tDash("architectureViewLabel"),
    serviceMapNodeLabels: {
      server: tDash("serviceMapNodeLabels.server"),
      gateway: tDash("serviceMapNodeLabels.gateway"),
      client: tDash("serviceMapNodeLabels.client"),
    },
  };

  return <DashboardView copy={copy} careerHistory={careerHistory} />;
}
