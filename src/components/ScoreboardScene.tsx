"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import type { ScoreboardData } from "@/models/metrics";
import Scoreboard3DFallback from "./Scoreboard3DFallback";
const Scoreboard3D = dynamic(() => import("./Scoreboard3D"), { ssr: false });

function useWebGL(): boolean { const [s, setS] = useState(true); useEffect(() => { try { const c = document.createElement("canvas"); setS(!!(c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch { setS(false); } }, []); return s; }
function useReduced(): boolean { const [r, setR] = useState(false); useEffect(() => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); setR(m.matches); const h = (e: MediaQueryListEvent) => setR(e.matches); m.addEventListener("change", h); return () => m.removeEventListener("change", h); }, []); return r; }
function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue("--accent").trim() || "#007acc",
    bg: styles.getPropertyValue("--bg").trim() || "#0e1116",
  };
}

export default function ScoreboardScene({ data }: { data: ScoreboardData }) {
  const webgl = useWebGL();
  const reduced = useReduced();
  const { theme } = useTheme();
  const t = useTranslations("Scoreboard");
  const [colors, setColors] = useState({ accent: "#007acc", bg: "#0e1116" });
  useEffect(() => {
    const frame = requestAnimationFrame(() => setColors(readThemeColors()));
    return () => cancelAnimationFrame(frame);
  }, [theme]);
  const show3D = webgl && !reduced;
  return (
    <section aria-label={t("accessibility.ariaLabel")} className="relative">
      {!show3D && <div className="absolute top-3 right-3 z-20 bg-black/60 text-[10px] font-mono text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">{webgl ? t("scene.fallback") : t("scene.noWebgl")}</div>}
      {show3D ? <Scoreboard3D data={data} accentColor={colors.accent} bgColor={colors.bg} /> : <Scoreboard3DFallback data={data} />}
    </section>
  );
}
