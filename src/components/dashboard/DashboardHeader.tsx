import type { ElementType } from "react";
import { Github, Linkedin, Send } from "lucide-react";

import DownloadCVButton from "@/components/DownloadCVButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

type DashboardHeaderProps = {
  systemOnline: string;
  title: string;
  headline: string;
};

type SocialBadgeProps = {
  icon: ElementType;
  label: string;
  href: string;
  color: string;
  status?: string;
};

function SocialBadge({ icon: Icon, label, href, color, status = "CONN" }: SocialBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label}: ${status}`}
      className="group flex items-center gap-2 rounded border border-[var(--border)] bg-black/50 px-3 py-2 transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <Icon size={14} className={color} />
      <span className="hidden text-[10px] font-mono text-[var(--muted)] transition-colors group-hover:text-white md:inline">
        {label}::{status}
      </span>
    </a>
  );
}

export default function DashboardHeader({ systemOnline, title, headline }: DashboardHeaderProps) {
  return (
    <header className="relative z-10 mb-8 flex flex-col items-start justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <div className="relative">
            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-20" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-green-500">{systemOnline}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
        <p className="mt-1 font-mono text-sm text-[var(--muted)]">{headline}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SocialBadge icon={Linkedin} label="LINKEDIN" href="https://www.linkedin.com/in/murillossoares" color="text-blue-400" />
        <SocialBadge icon={Github} label="GITHUB" href="https://github.com/mhsscel" color="text-purple-400" />
        <SocialBadge icon={Send} label="TELEGRAM" href="http://t.me/murillossoares" color="text-sky-400" status="ENCRYPTED" />
        <DownloadCVButton label="GET_CV.pdf" />
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
