"use client";

import { useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      aria-busy={loading}
      className="flex items-center gap-2 bg-panel-2 hover:bg-panel border border-border px-4 py-2 rounded text-xs font-mono transition-colors text-text hover:border-accent disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      <span>{loading ? "BUILDING..." : buttonLabel}</span>
    </button>
  );
}
