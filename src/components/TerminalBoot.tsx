"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import logsData from "@/data/logs.json";
import { useUiStore } from "@/store/ui";

type BootLog = {
  id: string;
  timestamp: string;
  level: string;
  message: { pt: string; en: string; es: string };
  delay?: number;
};

function localeKey(locale: string): "pt" | "en" | "es" {
  if (locale === "en") return "en";
  if (locale === "es") return "es";
  return "pt";
}

function levelColor(level: string) {
  if (level === "WARN") return "text-yellow-300";
  if (level === "SUCCESS") return "text-emerald-300";
  if (level === "SYSTEM") return "text-white";
  return "text-green-400";
}

export default function TerminalBoot({ locale, onComplete }: { locale: string; onComplete: () => void }) {
  const t = useTranslations("Boot");
  const requestSkip = useUiStore((s) => s.requestSkip);
  const skipRequested = useUiStore((s) => s.skipRequested);
  const logs = useMemo(() => logsData as BootLog[], []);
  const k = localeKey(locale);
  const [lines, setLines] = useState<BootLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (reduced || skipRequested) {
      setLines(logs);
      timeoutRef.current = setTimeout(() => onCompleteRef.current(), 250);
      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }

    setLines([]);
    let cancelled = false;
    let index = 0;
    const tick = () => {
      if (cancelled) return;
      if (skipRequested) {
        setLines(logs);
        timeoutRef.current = setTimeout(() => onCompleteRef.current(), 250);
        return;
      }
      if (index >= logs.length) {
        timeoutRef.current = setTimeout(() => onCompleteRef.current(), 500);
        return;
      }
      const entry = logs[index++];
      setLines((prev) => prev.some((p) => p.id === entry.id) ? prev : [...prev, entry]);
      timeoutRef.current = setTimeout(tick, Math.max(30, entry.delay ?? 140));
    };
    tick();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [logs, skipRequested]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") requestSkip(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [requestSkip]);

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col bg-black font-mono text-green-400"
      initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 1.04 }}
      transition={{ duration: 0.55, ease: "easeOut" }}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-xs text-white/70">:: Spring Boot :: (v3.x)</div>
        <button type="button" onClick={requestSkip}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10 focus:ring-2 focus:ring-white/30">
          {t("skip")} <span className="text-white/50">({t("hint")})</span>
        </button>
      </div>
      <div ref={scrollRef} className="scrollbar-terminal flex-1 overflow-y-auto px-4 py-3">
        {lines.map((line) => (
          <div key={line.id} className={`whitespace-pre-wrap break-words text-sm ${levelColor(line.level)}`}>
            <span className="mr-2 text-white/40">{line.timestamp}</span>
            <span className="mr-2 text-white/50">{line.level.padEnd(7, " ")}</span>
            <span className="opacity-95">{line.message[k]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
