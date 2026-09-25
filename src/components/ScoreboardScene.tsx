"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { use3DMode } from "@/lib/use-3d";
import Scoreboard3DFallback, { type YearRow } from "./Scoreboard3DFallback";

const Scoreboard3D = dynamic(() => import("./Scoreboard3D"), { ssr: false, loading: () => null });


function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue("--accent").trim() || "#007acc",
    secondary: styles.getPropertyValue("--accent-2").trim() || "#22c55e",
    bg: styles.getPropertyValue("--bg").trim() || "#0e1116",
  };
}

export default function ScoreboardScene({ rows, caption, yearLabel, countLabel }: { rows: YearRow[]; caption: string; yearLabel: string; countLabel: string }) {
  const { theme } = useTheme();
  const { enabled: show3D, ready, markReady } = use3DMode();
  const [colors, setColors] = useState({ accent: "#007acc", secondary: "#22c55e", bg: "#0e1116" });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setColors(readThemeColors()));
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  return (
    <>
    {/* The bars are decorative; screen readers get the same numbers as a table. */}
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead><tr><th scope="col">{yearLabel}</th><th scope="col">{countLabel}</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.year}><th scope="row">{r.year}</th><td>{r.count}</td></tr>)}</tbody>
    </table>
    <div className="relative h-[280px] md:h-[360px]" aria-hidden="true" data-testid="scoreboard-scene">
      <div className={`absolute inset-0 transition-opacity duration-200 ease-out ${ready ? "opacity-0" : "opacity-100"}`}>
        <Scoreboard3DFallback rows={rows} />
      </div>
      {show3D ? (
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <Scoreboard3D
            rows={rows}
            accentColor={colors.accent}
            secondaryColor={colors.secondary}
            bgColor={colors.bg}
            onReady={markReady}
          />
        </div>
      ) : null}
    </div>
    </>
  );
}
