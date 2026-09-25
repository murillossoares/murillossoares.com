"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { ARCH_STYLE } from "@/lib/arch-style";
import { buildGalaxy } from "@/lib/galaxy";
import type { CareerMetric } from "@/models/metrics";

const CareerGalaxy3D = dynamic(() => import("./CareerGalaxy3D"), { ssr: false, loading: () => null });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Chooses between the interactive three.js galaxy (desktop, WebGL, motion allowed) and a static SVG rendering of
 * the same layout. The SVG is what the static HTML ships, so the section is never empty for crawlers or slow devices.
 */
export default function CareerGalaxyScene({ events, activeId, onSelect, label, hint }: {
  events: CareerMetric[]; activeId: string | null; onSelect: (id: string) => void; label: string; hint: string;
}) {
  const layout = useMemo(() => buildGalaxy(events), [events]);
  const [mode, setMode] = useState<"static" | "3d">("static");
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMode(wide.matches && !reduced.matches && supportsWebGL() ? "3d" : "static");
    update();
    wide.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => { wide.removeEventListener("change", update); reduced.removeEventListener("change", update); };
  }, []);

  // Stop rendering frames while the scene is scrolled out of view.
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <figure ref={ref} className="relative h-[240px] md:h-[320px] overflow-hidden rounded-lg border border-[var(--border)] bg-black/40" data-testid="career-galaxy">
      <figcaption className="sr-only">{label}</figcaption>
      <div className={`absolute inset-0 transition-opacity duration-300 ${mode === "3d" && ready ? "opacity-0" : "opacity-100"}`} aria-hidden="true">
        <GalaxySvg layout={layout} activeId={activeId} />
      </div>
      {mode === "3d" ? (
        <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
          <CareerGalaxy3D layout={layout} activeId={activeId} onSelect={onSelect} running={visible} onReady={() => setReady(true)} />
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[var(--muted)]">
        <span className="flex flex-wrap gap-3">
          {(Object.keys(ARCH_STYLE) as (keyof typeof ARCH_STYLE)[]).map((k) => (
            <span key={k} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: ARCH_STYLE[k].hex }} aria-hidden="true" />{k}</span>
          ))}
        </span>
        {mode === "3d" ? <span>{hint}</span> : null}
      </div>
    </figure>
  );
}

function GalaxySvg({ layout, activeId }: { layout: ReturnType<typeof buildGalaxy>; activeId: string | null }) {
  const W = 600, H = 260, pad = 40;
  const x = (t: number) => pad + t * (W - pad * 2);
  const y = (py: number, pz: number) => H / 2 - 16 + py * 38 + pz * 12;
  const pos = new Map(layout.nodes.map((n) => [n.id, { x: x(n.t), y: y(n.position[1], n.position[2]) }]));
  const first = layout.years[0] ?? 0;
  const span = Math.max(1, (layout.years[layout.years.length - 1] ?? 0) - first);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {layout.years.map((yr) => (
        <g key={yr}>
          <line x1={x((yr - first) / span)} x2={x((yr - first) / span)} y1={24} y2={H - 44} stroke="rgba(255,255,255,0.05)" />
          <text x={x((yr - first) / span)} y={H - 30} textAnchor="middle" fontSize="10" fill="rgba(212,212,212,0.55)" fontFamily="monospace">{yr}</text>
        </g>
      ))}
      {layout.edges.map((e) => {
        const a = pos.get(e.from)!, b = pos.get(e.to)!;
        const on = activeId === e.from || activeId === e.to;
        return <line key={`${e.from}-${e.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.1)"} strokeWidth={on ? 1.2 : 0.8} />;
      })}
      {layout.nodes.map((n) => {
        const p = pos.get(n.id)!;
        const active = activeId === n.id;
        return (
          <g key={n.id}>
            {active ? <circle cx={p.x} cy={p.y} r={n.radius * 40 + 7} fill="none" stroke={ARCH_STYLE[n.archType].hex} strokeOpacity={0.6} /> : null}
            <circle cx={p.x} cy={p.y} r={n.radius * 40} fill={ARCH_STYLE[n.archType].hex} fillOpacity={active ? 0.95 : 0.7} />
          </g>
        );
      })}
    </svg>
  );
}
