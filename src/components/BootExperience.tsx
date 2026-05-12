"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useUiStore } from "@/store/ui";

export default function BootExperience() {
  const { booted, setBooted, skipRequested, requestSkip } = useUiStore();
  const t = useTranslations("Boot");
  const bootLines = useMemo(() => [
    t("lines.kernelStarted"),
    t("lines.mountedCareer"),
    t("lines.networkingStack"),
    t("lines.mountedExperience"),
    t("lines.cvService"),
    t("lines.networkTarget"),
    t("lines.portfolioStarted"),
    "",
    t("lines.modules"),
    t("lines.uptime"),
    "",
    t("lines.ready"),
  ], [t]);
  const [lines, setLines] = useState<string[]>([]);
  const [showSkip, setShowSkip] = useState(true);
  useEffect(() => {
    if (booted) return;
    let i = 0;
    const iv = setInterval(() => {
      if (skipRequested) { setLines(bootLines); setBooted(true); clearInterval(iv); return; }
      if (i < bootLines.length) { setLines((p) => [...p, bootLines[i]]); i++; }
      else { setTimeout(() => setBooted(true), 400); clearInterval(iv); }
    }, 180);
    return () => clearInterval(iv);
  }, [bootLines, booted, setBooted, skipRequested]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { requestSkip(); setShowSkip(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [requestSkip]);
  if (booted) return null;
  return (
    <AnimatePresence>
      <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 bg-[var(--bg)] text-[var(--text)] font-mono p-6 md:p-10 text-xs md:text-sm overflow-auto">
        {lines.map((line, i) => <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>{line || "\u00A0"}</motion.div>)}
        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-[var(--accent)] ml-1 align-middle" />
        {showSkip && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
            onClick={() => { requestSkip(); setShowSkip(false); }}
            className="fixed bottom-6 right-6 text-[10px] font-mono text-[var(--muted)] hover:text-white transition-colors focus:ring-2 focus:ring-[var(--accent)]">
            {t("hint")}
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
