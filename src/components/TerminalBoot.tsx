"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import logsData from "@/data/logs.json";
import { useUiStore } from "@/store/ui";

type BootLog = {
  id: string;
  timestamp: string;
  level: "SYSTEM" | "INFO" | "WARN" | "ERROR" | "SUCCESS" | string;
  message: { pt: string; en: string; es: string };
  delay?: number;
};

function localeToMessageKey(locale: string): "pt" | "en" | "es" {
  if (locale === "en") return "en";
  if (locale === "es") return "es";
  return "pt";
}

export default function TerminalBoot({
  locale,
  onComplete,
}: {
  locale: string;
  onComplete: () => void;
}) {
  const t = useTranslations("Boot");
  const requestSkip = useUiStore((s) => s.requestSkip);
  const skipRequested = useUiStore((s) => s.skipRequested);
  const prefersReducedMotion = useReducedMotion();

  const logs = useMemo(() => logsData as BootLog[], []);
  const messageKey = localeToMessageKey(locale);
  const [lines, setLines] = useState<BootLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | undefined>();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (prefersReducedMotion || skipRequested) {
      onCompleteRef.current();
      return;
    }

    setLines([]);

    let cancelled = false;
    let index = 0;

    const tick = () => {
      if (cancelled) return;

      if (skipRequested) {
        setLines(logs);
        timeoutRef.current = window.setTimeout(() => onCompleteRef.current(), 250);
        return;
      }

      if (index >= logs.length) {
        timeoutRef.current = window.setTimeout(() => onCompleteRef.current(), 500);
        return;
      }

      const entry = logs[index];
      index += 1;
      setLines((prev) => (prev.some((p) => p.id === entry.id) ? prev : [...prev, entry]));

      timeoutRef.current = window.setTimeout(tick, Math.max(30, entry.delay ?? 140));
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [logs, prefersReducedMotion, skipRequested]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestSkip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestSkip]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black font-mono text-green-400"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{
        duration: prefersReducedMotion || skipRequested ? 0 : 0.24,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-xs text-white/70">:: Spring Boot :: (v3.x)</div>
        <button
          type="button"
          onClick={requestSkip}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        >
          {t("skip")} <span className="text-white/50">({t("hint")})</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {lines.map((line) => {
          const msg = line.message[messageKey];
          const isWarn = line.level === "WARN";
          const isSuccess = line.level === "SUCCESS";
          const isSystem = line.level === "SYSTEM";

          const color = isWarn
            ? "text-yellow-300"
            : isSuccess
              ? "text-emerald-300"
              : isSystem
                ? "text-white"
                : "text-green-400";

          return (
            <div key={line.id} className={`whitespace-pre-wrap break-words text-sm ${color}`}>
              <span className="mr-2 text-white/40">{line.timestamp}</span>
              <span className="mr-2 text-white/50">{line.level.padEnd(7, " ")}</span>
              <span className="opacity-95">{msg}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
