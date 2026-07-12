"use client";

import { motion } from "framer-motion";
import { Box, Cpu, Dice5, Sparkles, Terminal, X, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import personaData from "@/data/persona.json";
import { useUiStore } from "@/store/ui";

type Persona = typeof personaData;
type IconName = "Box" | "Dice5" | "Cpu" | "Sparkles" | "Terminal" | "Zap";

const iconMap: Record<IconName, LucideIcon> = {
  Box,
  Dice5,
  Cpu,
  Sparkles,
  Terminal,
  Zap,
};

function localeToMessageKey(locale: string): "pt" | "en" | "es" {
  if (locale === "en") return "en";
  if (locale === "es") return "es";
  return "pt";
}

function RadarChart({
  stats,
  labelKey,
}: {
  stats: Persona["stats"];
  labelKey: "pt" | "en" | "es";
}) {
  const size = 260;
  const center = size / 2;
  const radius = 92;
  const angles = stats.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / stats.length);

  const polygonPoints = (scale: number) =>
    angles
      .map((a) => {
        const x = center + Math.cos(a) * radius * scale;
        const y = center + Math.sin(a) * radius * scale;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

  const dataPoints = angles
    .map((a, i) => {
      const value = Math.max(0, Math.min(100, stats[i].value));
      const x = center + Math.cos(a) * radius * (value / 100);
      const y = center + Math.sin(a) * radius * (value / 100);
      return { x, y, short: stats[i].short, label: stats[i].label[labelKey], color: stats[i].color };
    });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-[220px] w-[220px] max-w-full sm:h-[260px] sm:w-[260px]"
    >
      <g>
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <polygon
            key={s}
            points={polygonPoints(s)}
            fill="none"
            stroke="rgba(0,240,255,0.18)"
            strokeWidth="1"
          />
        ))}

        {angles.map((a, i) => (
          <line
            key={stats[i].id}
            x1={center}
            y1={center}
            x2={center + Math.cos(a) * radius}
            y2={center + Math.sin(a) * radius}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
        ))}

        <polygon
          points={dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
          fill="rgba(252,238,10,0.12)"
          stroke="rgba(252,238,10,0.9)"
          strokeWidth="2"
        />

        {dataPoints.map((p) => (
          <circle key={p.short} cx={p.x} cy={p.y} r="3.4" fill={p.color} opacity="0.95" />
        ))}

        {dataPoints.map((p, i) => {
          const a = angles[i];
          const x = center + Math.cos(a) * (radius + 26);
          const y = center + Math.sin(a) * (radius + 26);
          return (
            <text
              key={p.short}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.70)"
              fontSize="10"
            >
              {p.short}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

export default function CyberpunkOverlay({ locale }: { locale: string }) {
  const t = useTranslations("Persona");
  const open = useUiStore((s) => s.cyberpunkOpen);
  const close = useUiStore((s) => s.closeCyberpunk);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const k = localeToMessageKey(locale);
  const data = personaData as Persona;

  const overlayVariants = useMemo(
    () => ({
      hidden: { opacity: 0, scale: 0.985 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
      },
    }),
    []
  );

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      previouslyFocused?.focus();
    };
  }, [open]);

  return open ? (
        <motion.dialog
          ref={dialogRef}
          aria-label={data.profile.alias}
          className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none overflow-x-hidden overflow-y-auto overscroll-contain border-0 bg-black/95 text-cyber-yellow backdrop-blur-sm [-webkit-overflow-scrolling:touch] pt-[calc(1rem+env(safe-area-inset-top))] pr-[calc(1rem+env(safe-area-inset-right))] pb-[calc(1rem+env(safe-area-inset-bottom))] pl-[calc(1rem+env(safe-area-inset-left))]"
          initial="hidden"
          animate="visible"
          variants={overlayVariants}
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const focusable = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
              ),
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }}
        >
          <motion.div
            className="pointer-events-none fixed inset-0 mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              transform: ["translateX(0)", "translateX(-8px)", "translateX(10px)", "translateX(0)"],
            }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,240,255,0.18),transparent,rgba(255,0,255,0.18))]" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(252,238,10,0.18),transparent_35%,rgba(0,240,255,0.14),transparent_70%)]" />
          </motion.div>

          <div className="pointer-events-none fixed inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.14)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,0,255,0.22),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(0,240,255,0.22),transparent_42%)]" />
          </div>

          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">
            <div className="sticky top-0 z-[60] flex justify-end">
              <button
                type="button"
                onClick={close}
                autoFocus
                className="inline-flex items-center gap-2 border border-cyber-yellow bg-black/60 px-3 py-2 font-mono text-xs text-cyber-yellow backdrop-blur transition-colors hover:bg-cyber-yellow hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue"
                aria-label={t("close")}
              >
                <X size={18} /> {t("close")}
              </button>
            </div>

            <motion.div
              className="relative w-full border border-cyber-yellow bg-black/80 p-6 shadow-[0_0_50px_rgba(252,238,10,0.18)] md:p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex flex-col gap-6 border-b border-cyber-yellow/30 pb-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 pr-4">
                  <h2
                    id="persona-title"
                    className="glitch-text text-3xl font-bold uppercase tracking-tight sm:text-4xl md:text-6xl"
                    data-text={data.profile.alias}
                  >
                    {data.profile.alias}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-cyber-blue">
                    <span className="rounded border border-cyber-blue/30 bg-black/40 px-2 py-1">
                      [{data.profile.class[k]}]
                    </span>
                    <span className="rounded border border-cyber-blue/30 bg-black/40 px-2 py-1">
                      :: {data.profile.origin[k]}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 text-white/60">
                      {data.interests.map((i) => {
                        const icon =
                          i.key === "blockchain"
                            ? "Cpu"
                            : i.key === "dnd" || i.key === "rpg"
                              ? "Dice5"
                            : i.key === "cyberpunk2077"
                              ? "Zap"
                              : i.key === "scifi"
                                ? "Box"
                                : "Sparkles";
                        const Icon = iconMap[icon as IconName] ?? Terminal;
                        return (
                          <span
                            key={i.key}
                            className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2 py-1"
                          >
                            <Icon size={14} className="text-cyber-yellow" />
                            <span className="font-mono text-[10px]">{i.label[k]}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
                <div>
                  <h3 className="mb-5 border-l-4 border-cyber-blue pl-3 text-xl font-bold uppercase tracking-widest text-cyber-blue">
                    {t("coreStatsTitle")}
                  </h3>

                  <div className="flex flex-col items-center gap-5">
                    <RadarChart stats={data.stats} labelKey={k} />

                    <div className="w-full space-y-3">
                      {data.stats.map((s, idx) => (
                        <div key={s.id} className="group">
                          <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-white/80">
                            <span className="truncate">{s.label[k]}</span>
                            <span>{s.value}/100</span>
                          </div>
                          <div className="mt-1 h-3 overflow-hidden border border-white/10 bg-black/50">
                            <motion.div
                              className="h-full"
                              style={{ backgroundColor: s.color, transformOrigin: "left" }}
                              initial={{ scaleX: 0.01, opacity: 0 }}
                              animate={{ scaleX: Math.max(0.01, Math.min(1, s.value / 100)), opacity: 1 }}
                              transition={{
                                delay: 0.16 + idx * 0.04,
                                duration: 0.24,
                                ease: [0.23, 1, 0.32, 1],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-5 border-l-4 border-cyber-pink pl-3 text-xl font-bold uppercase tracking-widest text-cyber-pink">
                    {t("modulesTitle")}
                  </h3>

                  <div className="grid gap-4">
                    {data.modules.map((mod, i) => {
                      const Icon = iconMap[mod.icon as IconName] ?? Terminal;
                      return (
                        <motion.div
                          key={mod.id}
                          initial={{ transform: "translateX(16px)", opacity: 0 }}
                          animate={{ transform: "translateX(0)", opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.06, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          className="cursor-crosshair border border-white/10 bg-black/50 p-4 hover:border-cyber-yellow hover:shadow-[0_0_18px_rgba(252,238,10,0.25)]"
                        >
                          <div className="flex items-start gap-4">
                            <div className="border border-white/10 bg-black/40 p-2 text-cyber-yellow">
                              <Icon size={22} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="font-mono text-sm font-bold tracking-widest text-white">
                                  {mod.title}
                                </h4>
                                {mod.tags?.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {mod.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/70"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm text-white/60">{mod.desc[k] ?? mod.desc.en}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="relative mt-10 border-t border-white/10 pt-4 text-center font-mono text-[10px] uppercase tracking-widest text-white/35">
                {t("footer")}
              </div>
            </motion.div>
          </div>
        </motion.dialog>
  ) : null;
}
