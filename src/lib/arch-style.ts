import type { ArchType } from "@/models/metrics";

// One palette for the architecture types, shared by the timeline chips and the 3D scene.
export const ARCH_STYLE: Record<ArchType, { hex: string; chip: string }> = {
  microservices: { hex: "#22c55e", chip: "bg-green-500/10 text-green-400 border-green-500/30 light:text-green-800 light:border-green-600/40" },
  soa: { hex: "#a855f7", chip: "bg-purple-500/10 text-purple-400 border-purple-500/30 light:text-purple-700 light:border-purple-600/40" },
  monolith: { hex: "#f97316", chip: "bg-orange-500/10 text-orange-400 border-orange-500/30 light:text-orange-800 light:border-orange-600/40" },
  hybrid: { hex: "#38bdf8", chip: "bg-sky-500/10 text-sky-400 border-sky-500/30 light:text-sky-800 light:border-sky-600/40" },
};
