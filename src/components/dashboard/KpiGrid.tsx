import type { DashboardKpi } from "./types";

type KpiGridProps = {
  items: [DashboardKpi, DashboardKpi, DashboardKpi];
};

type KpiCardProps = DashboardKpi & {
  color: string;
};

function KpiCard({ label, value, sub, color }: KpiCardProps) {
  return (
    <div className={`rounded border ${color} bg-black/40 p-3 backdrop-blur transition-colors hover:bg-white/5 md:p-4`}>
      <div className="mb-1 font-mono text-[10px] uppercase text-gray-500">{label}</div>
      <div className="mb-1 text-xl font-bold text-white md:text-2xl">{value}</div>
      <div className="text-[10px] text-gray-600">{sub}</div>
    </div>
  );
}

export default function KpiGrid({ items }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <KpiCard {...items[0]} color="border-green-500/30" />
      <KpiCard {...items[1]} color="border-blue-500/30" />
      <KpiCard {...items[2]} color="border-purple-500/30" />
    </div>
  );
}
