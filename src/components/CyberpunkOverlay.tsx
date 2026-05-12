"use client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useUiStore } from "@/store/ui";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
export default function CyberpunkOverlay() {
  const { cyberpunkOpen, closeCyberpunk } = useUiStore();
  const reduced = useReducedMotion();
  const t = useTranslations("Cyberpunk");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cyberpunkOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeCyberpunk(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    if (ref.current) ref.current.focus();
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [cyberpunkOpen, closeCyberpunk]);
  return (
    <AnimatePresence>
      {cyberpunkOpen && (
        <motion.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cyb-title"
          initial={reduced ? {} : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-cyber-black/95 flex items-center justify-center p-4 focus:outline-none">
          <motion.div initial={reduced ? {} : { scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className={`relative w-full max-w-2xl overflow-hidden border border-cyber-yellow/50 bg-cyber-black p-6 md:p-8 ${reduced ? "" : "animate-cyber-glow"}`}>
            {!reduced && <div className="pointer-events-none absolute inset-0 animate-scanline bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,240,255,0.05)_2px,rgba(0,240,255,0.05)_4px)] bg-[length:100%_4px]" aria-hidden="true" />}
            <button onClick={closeCyberpunk} className="absolute top-4 right-4 z-10 text-cyber-yellow hover:text-white focus:ring-2 focus:ring-cyber-yellow" aria-label={t("closeLabel")}><X size={20} /></button>
            <h2 id="cyb-title" className={`relative z-10 mb-6 text-2xl font-mono text-cyber-yellow md:text-3xl ${reduced ? "" : "animate-cyber-glitch"}`}>{t("title")}</h2>
            <div className="relative z-10 grid grid-cols-1 gap-4 font-mono text-xs text-cyber-blue sm:grid-cols-2">
              <div className="border border-cyber-blue/30 p-3">
                <div className="text-cyber-pink mb-2">{t("stats.label")}</div>
                <div>{t("stats.focus")}</div><div>{t("stats.stamina")}</div><div>{t("stats.intellect")}</div>
              </div>
              <div className="border border-cyber-blue/30 p-3">
                <div className="text-cyber-pink mb-2">{t("modules.label")}</div>
                <div>{t("modules.item1")}</div><div>{t("modules.item2")}</div><div>{t("modules.item3")}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
