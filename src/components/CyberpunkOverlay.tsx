"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Box,
  Cpu,
  Dice5,
  Sparkles,
  Terminal,
  Zap,
  Blocks,
  Tv,
  Gamepad2,
  Rocket,
  Dices,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import personaData from "@/data/persona.json";
import { useUiStore } from "@/store/ui";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PersonaStat = {
  id: string;
  short: string;
  label: { pt: string; en: string; es: string };
  value: number;
  color: string;
};

type PersonaModule = {
  id: string;
  icon: string;
  title: string;
  desc: { pt: string; en: string; es: string };
  tags: string[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function localeKey(locale: string): "pt" | "en" | "es" {
  if (locale === "en") return "en";
  if (locale === "es") return "es";
  return "pt";
}

const iconMap: Record<string, React.ElementType> = {
  Box,
  Cpu,
  Dice5,
  Sparkles,
  Terminal,
  Zap,
  Blocks,
  Tv,
  Gamepad2,
  Rocket,
  Dices,
};

const interestIconMap: Record<string, React.ElementType> = {
  blockchain: Blocks,
  anime: Tv,
  rpg: Dices,
  dnd: Dices,
  cyberpunk2077: Gamepad2,
  scifi: Rocket,
};

/* ------------------------------------------------------------------ */
/*  RadarChart                                                         */
/* ------------------------------------------------------------------ */

function RadarChart({
  stats,
  labelKey,
}: {
  stats: PersonaStat[];
  labelKey: "pt" | "en" | "es";
}) {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const angleStep = (Math.PI * 2) / stats.length;

  const points = stats.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  const dataPoints = stats.map((s, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = radius * (s.value / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  const dataPoly = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={points
            .map((p) => {
              const dx = p.x - center;
              const dy = p.y - center;
              return `${center + dx * scale},${center + dy * scale}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(0,240,255,0.15)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {points.map((p, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={p.x}
          y2={p.y}
          stroke="rgba(0,240,255,0.15)"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoly}
        fill="rgba(252,238,10,0.15)"
        stroke="#fcee0a"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={stats[i].color} />
      ))}

      {/* Labels */}
      {stats.map((s, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const lx = center + (radius + 18) * Math.cos(angle);
        const ly = center + (radius + 18) * Math.sin(angle);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#d4d4d4"
            fontSize={10}
            fontFamily="var(--font-mono), monospace"
          >
            {s.short}
          </text>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Overlay                                                       */
/* ------------------------------------------------------------------ */

export default function CyberpunkOverlay() {
  const locale = useLocale();
  const t = useTranslations("Persona");
  const { cyberpunkOpen, closeCyberpunk } = useUiStore();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const k = localeKey(locale);

  const stats = useMemo(() => personaData.stats as PersonaStat[], []);
  const modules = useMemo(() => personaData.modules as PersonaModule[], []);
  const interests = useMemo(() => personaData.interests, []);

  useEffect(() => {
    if (!cyberpunkOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCyberpunk();
      if (e.key === "Tab") {
        const focusable = ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (focusable.length === 1 || (e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [cyberpunkOpen, closeCyberpunk]);

  const overlayVariants = {
    hidden: { clipPath: "inset(50% 0 50% 0)", opacity: 0 },
    visible: { clipPath: "inset(0 0 0 0)", opacity: 1 },
    exit: { clipPath: "inset(0 50% 0 50%)", opacity: 0 },
  };

  return (
    <AnimatePresence>
      {cyberpunkOpen && (
        <motion.div
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="persona-title"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={reduced ? {} : overlayVariants}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/95 p-4 focus:outline-none"
          onClick={closeCyberpunk}
        >
          {/* Grid overlay */}
          {!reduced && (
            <div
              className="pointer-events-none fixed inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,240,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.14) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
              aria-hidden="true"
            />
          )}

          {/* Scanline */}
          {!reduced && (
            <div
              className="pointer-events-none fixed inset-0 animate-scanline"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.05) 2px, rgba(0,240,255,0.05) 4px)",
                backgroundSize: "100% 4px",
              }}
              aria-hidden="true"
            />
          )}

          {/* Radial gradient vignette */}
          <div
            className="pointer-events-none fixed inset-0"
            style={{
              background:
                "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%)",
            }}
            aria-hidden="true"
          />

          {/* Glitch flash */}
          {!reduced && (
            <motion.div
              className="pointer-events-none fixed inset-0 bg-cyber-yellow/20"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: [0, 0.8, 0], x: [0, -8, 10, 0] }}
              transition={{ duration: 0.35, times: [0, 0.3, 1] }}
              aria-hidden="true"
            />
          )}

          {/* Card */}
          <motion.div
            initial={reduced ? {} : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? {} : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-10 w-full max-w-3xl border border-cyber-yellow/50 bg-cyber-black/90 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative corners */}
            <div className="absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2 border-cyber-yellow" />
            <div className="absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2 border-cyber-yellow" />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-cyber-yellow" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-cyber-yellow" />

            {/* Sticky header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-cyber-yellow/30 bg-cyber-black/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-cyber-yellow" />
                <span className="font-mono text-xs tracking-widest text-cyber-yellow">
                  PERSONA.EXE
                </span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeCyberpunk}
                className="flex items-center gap-2 border border-cyber-yellow/50 px-3 py-1.5 font-mono text-xs text-cyber-yellow transition-colors hover:bg-cyber-yellow hover:text-black focus:ring-2 focus:ring-cyber-yellow"
                aria-label={t("close")}
              >
                <X size={14} />
                {t("close")}
              </button>
            </div>

            {/* Content */}
            <div className="space-y-8 p-6 md:p-8">
              {/* Profile */}
              <section>
                <h2
                  id="persona-title"
                  className="glitch-text mb-2 font-mono text-2xl font-bold text-cyber-yellow md:text-3xl"
                  data-text={personaData.profile.alias}
                >
                  {personaData.profile.alias}
                </h2>
                <div className="flex flex-wrap gap-3 font-mono text-xs text-cyber-blue">
                  <span className="border border-cyber-blue/30 px-2 py-1">
                    {personaData.profile.class[k]}
                  </span>
                  <span className="border border-cyber-blue/30 px-2 py-1">
                    {personaData.profile.origin[k]}
                  </span>
                </div>
              </section>

              {/* Interests */}
              <section>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-cyber-pink">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((item) => {
                    const Icon = interestIconMap[item.key] || Terminal;
                    return (
                      <span
                        key={item.key}
                        className="flex items-center gap-1.5 border border-cyber-blue/30 bg-cyber-blue/5 px-2 py-1 font-mono text-xs text-cyber-blue"
                      >
                        <Icon size={12} />
                        {item.label[k]}
                      </span>
                    );
                  })}
                </div>
              </section>

              {/* Core Stats */}
              <section>
                <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-cyber-pink">
                  {t("coreStatsTitle")}
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <RadarChart stats={stats} labelKey={k} />
                  <div className="space-y-3">
                    {stats.map((s) => (
                      <div key={s.id}>
                        <div className="mb-1 flex justify-between font-mono text-xs">
                          <span className="text-cyber-blue">
                            {s.label[k]}
                          </span>
                          <span style={{ color: s.color }}>{s.value}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/10">
                          <motion.div
                            className="h-full"
                            style={{ backgroundColor: s.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.value}%` }}
                            transition={{
                              duration: 1,
                              delay: 0.3,
                              ease: "easeOut",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Installed Modules */}
              <section>
                <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-cyber-pink">
                  {t("modulesTitle")}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {modules.map((m) => {
                    const Icon = iconMap[m.icon] || Terminal;
                    return (
                      <div
                        key={m.id}
                        className="border border-cyber-blue/20 bg-cyber-blue/5 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Icon size={16} className="text-cyber-yellow" />
                          <span className="font-mono text-xs font-bold text-cyber-yellow">
                            {m.title}
                          </span>
                        </div>
                        <p className="mb-3 font-mono text-xs leading-relaxed text-cyber-blue/80">
                          {m.desc[k]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border border-cyber-pink/30 px-1.5 py-0.5 font-mono text-[10px] text-cyber-pink"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Footer */}
              <footer className="border-t border-cyber-yellow/20 pt-4 text-center font-mono text-[10px] text-cyber-yellow/50">
                {t("footer")}
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
