"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useMessages, useTranslations } from "next-intl";

import { isPdfThemeName, type PdfThemeName } from "@/lib/pdf-themes";
import type { CVPdfContent } from "@/components/pdf/CVDocument";

type MessagesShape = {
  App?: { title?: string };
  Dashboard?: { headline?: string; eventHistoryTitle?: string };
  careerHistory?: CVPdfContent["careerHistory"];
};

export default function DownloadCVButton({ label }: { label?: string }) {
  const { theme } = useTheme();
  const locale = useLocale();
  const tHeader = useTranslations("Header");
  const messages = useMessages() as MessagesShape;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => setMounted(true), []);

  const pdfTheme: PdfThemeName = isPdfThemeName(theme) ? theme : "vscode-dark";
  const content = useMemo<CVPdfContent>(() => {
    const title = messages?.App?.title ?? "Murillo Soares";
    const headline = messages?.Dashboard?.headline ?? "Senior Full Stack Engineer";
    const experienceTitle = messages?.Dashboard?.eventHistoryTitle ?? "Runtime Logs (Experience)";
    const careerHistory = Array.isArray(messages?.careerHistory) ? messages.careerHistory : [];

    return {
      title,
      headline,
      locale,
      theme: pdfTheme,
      sections: { experienceTitle },
      careerHistory,
    };
  }, [locale, messages, pdfTheme]);

  if (!mounted) return null;

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
      className="group flex items-center gap-2 rounded border border-[var(--accent)]/40 bg-black/50 px-3 py-2 transition-all hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
      aria-label={buttonLabel}>
      {loading ? <Loader2 size={14} className="animate-spin text-[var(--accent)]" aria-hidden="true" /> : <Download size={14} className="text-[var(--accent)]" aria-hidden="true" />}
      <span role={failed ? "alert" : undefined} aria-live="polite" className="hidden text-[10px] font-mono uppercase text-[var(--muted)] group-hover:text-white md:inline">
        {loading ? "BUILDING..." : failed ? tHeader("downloadError") : buttonLabel}
      </span>
    </button>
  );
}
