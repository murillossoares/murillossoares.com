"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useMessages, useTranslations } from "next-intl";

import { isPdfThemeName, type PdfThemeName } from "@/lib/pdf-themes";
import type { CVPdfContent } from "@/components/pdf/CVDocument";
import { formatPeriod } from "@/lib/period";
import { careerFile, educationLabel, getCareerHistory, getHeadline } from "@/services/careerData";
import { absoluteUrl } from "@/lib/site";

type MessagesShape = {
  App?: { title?: string };
  Dashboard?: { eventHistoryTitle?: string };
};

export default function DownloadCVButton({ label, showLabel = false }: { label?: string; showLabel?: boolean }) {
  const { theme } = useTheme();
  const locale = useLocale();
  const tHeader = useTranslations("Header");
  const messages = useMessages() as MessagesShape;
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const pdfTheme: PdfThemeName = isPdfThemeName(theme) ? theme : "vscode-dark";
  const content = useMemo<CVPdfContent>(() => {
    const title = messages?.App?.title ?? "Murillo Soares";
    const headline = getHeadline(locale);
    const experienceTitle = messages?.Dashboard?.eventHistoryTitle ?? "Runtime Logs (Experience)";
    const now = new Date();
    const careerHistory = getCareerHistory(locale).map((e) => ({
      year: formatPeriod(e, locale, now), role: e.role, company: e.company, desc: e.desc, stack: e.stack,
    }));

    const { links, location } = careerFile.person;
    const site = absoluteUrl(`/${locale}`);
    const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    return {
      title,
      headline,
      identity: `${careerFile.person.fullName} · ${educationLabel(locale)}`,
      locale,
      location: [location.city, location.country].filter(Boolean).join(", "),
      contacts: [site, links.linkedin, links.github, links.telegram].filter(Boolean).map((href) => ({ label: bare(href), href })),
      footer: tHeader("cvFooter", { site: bare(absoluteUrl("/")) }),
      theme: pdfTheme,
      sections: { experienceTitle },
      careerHistory,
    };
  }, [locale, messages, pdfTheme, tHeader]);

  const fileName = `cv-murillo-${locale}-${pdfTheme}.pdf`;
  const buttonLabel = label ?? tHeader("downloadCv");

  const handleDownload = async () => {
    if (loading) return;
    setFailed(false);
    setLoading(true);
    try {
      const [{ pdf }, { CVDocument }] = await Promise.all([import("@react-pdf/renderer"), import("@/components/pdf/CVDocument")]);
      const blob = await pdf(<CVDocument content={content} />).toBlob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (error) {
      console.error("Failed to generate CV PDF", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleDownload} disabled={loading} aria-busy={loading}
      className="group flex items-center gap-2 rounded border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-black/50 px-3 py-2 transition-all hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
      aria-label={buttonLabel}>
      {loading ? <Loader2 size={14} className="animate-spin text-[var(--accent)]" aria-hidden="true" /> : <Download size={14} className="text-[var(--accent)]" aria-hidden="true" />}
      <span role={failed ? "alert" : undefined} aria-live="polite" className={`${showLabel || failed ? "inline" : "hidden md:inline"} text-xs font-mono uppercase text-[var(--muted)] group-hover:text-white`}>
        {loading ? tHeader("building") : failed ? tHeader("downloadError") : buttonLabel}
      </span>
    </button>
  );
}
