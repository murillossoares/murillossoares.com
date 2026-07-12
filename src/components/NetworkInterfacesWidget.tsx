"use client";

import { Github, Linkedin, Mail, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import interfacesData from "@/data/networkInterfaces.json";

type IconName = "Github" | "Linkedin" | "Mail" | "Send";

const iconMap: Record<IconName, LucideIcon> = {
  Github,
  Linkedin,
  Mail,
  Send,
};

type InterfaceEndpoint = {
  id: string;
  icon: IconName;
  label: string;
  status: string;
  ip: string;
  url: string;
};

function EndpointRow({ endpoint }: { endpoint: InterfaceEndpoint }) {
  const Icon = iconMap[endpoint.icon] ?? Send;

  return (
    <a
      href={endpoint.url}
      target={endpoint.url.startsWith("http") ? "_blank" : undefined}
      rel={endpoint.url.startsWith("http") ? "noopener noreferrer" : undefined}
      className="group/endpoint flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 transition-colors hover:border-[color:var(--accent)]/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0 text-[color:var(--accent)] opacity-70 transition-opacity group-hover/endpoint:opacity-100 group-focus-visible/endpoint:opacity-100" />
          <div className="min-w-0">
          <div className="truncate font-mono text-xs text-white/75 transition-colors group-hover/endpoint:text-white group-focus-visible/endpoint:text-white">
              {endpoint.label}
            </div>
            <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover/endpoint:opacity-100 group-focus-visible/endpoint:opacity-100">
              <span className="font-mono text-[10px] text-[color:var(--accent-2)]">{endpoint.ip}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
              <span className="font-mono text-[10px] text-white/40">hop=0 ttl=64</span>
            </div>
          </div>
        </div>
      </div>

      <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/55 transition-colors group-hover/endpoint:border-[color:var(--accent-2)]/40 group-hover/endpoint:text-[color:var(--accent-2)] group-focus-visible/endpoint:border-[color:var(--accent-2)]/40 group-focus-visible/endpoint:text-[color:var(--accent-2)]">
        {endpoint.status}
      </span>
    </a>
  );
}

export default function NetworkInterfacesWidget() {
  const t = useTranslations("Dashboard");
  const endpoints = (interfacesData.endpoints ?? []) as InterfaceEndpoint[];

  return (
    <section className="relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.10]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(11,87,208,0.18),transparent_35%),radial-gradient(circle_at_85%_18%,rgba(34,197,94,0.18),transparent_40%)]" />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
            {t("networkTitle")}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--accent-2)] shadow-[0_0_12px_rgba(34,197,94,0.35)]" />
            <span className="font-mono text-[10px] text-white/60">{t("networkSubtitle")}</span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2 text-[color:var(--accent)]">
          <Send className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-4 grid gap-2">
        {endpoints.map((endpoint) => (
          <EndpointRow key={endpoint.id} endpoint={endpoint} />
        ))}
      </div>
    </section>
  );
}
