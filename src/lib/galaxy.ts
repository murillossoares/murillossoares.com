import type { ArchType, CareerMetric } from "@/models/metrics";
import { yearOf } from "@/models/metrics";
import { hasMonth } from "@/lib/period";
import { resolveTech } from "@/lib/tech";

export interface GalaxyNode {
  id: string;
  label: string;
  year: number;
  archType: ArchType;
  current: boolean;
  /** Normalised 0..1 position on the time axis. */
  t: number;
  position: [number, number, number];
  radius: number;
}
export interface GalaxyEdge { from: string; to: string; shared: string[]; }
export interface GalaxyLayout { nodes: GalaxyNode[]; edges: GalaxyEdge[]; years: number[]; min: number; span: number; }

const WIDTH = 10;

/** Start as a fractional year: "2023-07" → 2023.5, "2023" → 2023. */
function startPosition(start: string): number {
  const year = yearOf(start);
  return hasMonth(start) ? year + (Number(start.slice(5, 7)) - 1) / 12 : year;
}

/**
 * Deterministic layout shared by the 3D scene and its 2D fallback: x = start date (month-precise when known),
 * spread on y/z among positions that start in the same year.
 */
export function buildGalaxy(events: CareerMetric[], minShared = 2): GalaxyLayout {
  const starts = events.filter((e) => yearOf(e.start)).map((e) => startPosition(e.start));
  if (starts.length === 0) return { nodes: [], edges: [], years: [], min: 0, span: 1 };
  const min = Math.floor(Math.min(...starts));
  const max = Math.max(...starts);
  const span = Math.max(1, max - min);
  const perYear = new Map<number, number>();

  const nodes = [...events]
    .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id))
    .map((e) => {
      const year = yearOf(e.start);
      const slot = perYear.get(year) ?? 0;
      perYear.set(year, slot + 1);
      const t = (startPosition(e.start) - min) / span;
      const angle = slot * 2.4 + year * 0.9;
      const spread = slot === 0 ? 0.35 : 1.25;
      return {
        id: e.id,
        label: e.company,
        year,
        archType: e.archType,
        current: e.current,
        t,
        position: [t * WIDTH - WIDTH / 2, Math.sin(angle) * spread, Math.cos(angle) * spread] as [number, number, number],
        radius: 0.16 + Math.min(e.stack.length, 8) * 0.025,
      };
    });

  const techs = new Map(events.map((e) => [e.id, new Set(e.stack.flatMap(resolveTech).map((r) => r.canonical.toLowerCase()))]));
  const edges: GalaxyEdge[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = techs.get(events[i].id)!;
      const shared = [...techs.get(events[j].id)!].filter((x) => a.has(x));
      if (shared.length >= minShared) edges.push({ from: events[i].id, to: events[j].id, shared });
    }
  }

  const years: number[] = [];
  for (let y = min; y <= Math.floor(max); y++) years.push(y);
  return { nodes, edges, years, min, span };
}

/** Normalised 0..1 position of a year tick on the same axis as the nodes. */
export function yearToT(year: number, layout: Pick<GalaxyLayout, "min" | "span">): number {
  return (year - layout.min) / layout.span;
}

export function yearToX(year: number, layout: Pick<GalaxyLayout, "min" | "span">): number {
  return yearToT(year, layout) * WIDTH - WIDTH / 2;
}
