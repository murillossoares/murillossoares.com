"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { ScoreboardData } from "@/models/metrics";
import Scoreboard3DFallback from "./Scoreboard3DFallback";

const Scoreboard3D = dynamic(() => import("./Scoreboard3D"), { ssr: false, loading: () => null });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue("--accent").trim() || "#007acc",
    secondary: styles.getPropertyValue("--accent-2").trim() || "#22c55e",
    bg: styles.getPropertyValue("--bg").trim() || "#0e1116",
  };
}

export default function ScoreboardScene({ data }: { data: ScoreboardData }) {
  const { theme } = useTheme();
  const [show3D, setShow3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState({ accent: "#007acc", secondary: "#22c55e", bg: "#0e1116" });

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const enabled = desktop.matches && !reduced.matches && supportsWebGL();
      setShow3D(enabled);
      if (!enabled) setReady(false);
    };
    update();
    desktop.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setColors(readThemeColors()));
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  return (
    <div className="relative h-[280px] md:h-[360px]" aria-hidden="true" data-testid="scoreboard-scene">
      <div className={`absolute inset-0 transition-opacity duration-200 ease-out ${ready ? "opacity-0" : "opacity-100"}`}>
        <Scoreboard3DFallback data={data} />
      </div>
      {show3D ? (
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <Scoreboard3D
            data={data}
            accentColor={colors.accent}
            secondaryColor={colors.secondary}
            bgColor={colors.bg}
            onReady={() => setReady(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
