import { motion, useReducedMotion } from "framer-motion";
import { Code, Database, Server, Terminal } from "lucide-react";

import type { ArchType } from "./types";

type ServiceMapProps = {
  archType: ArchType;
  label: string;
  nodeLabels: {
    server: string;
    gateway: string;
    client: string;
  };
};

export default function ServiceMap({ archType, label, nodeLabels }: ServiceMapProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[180px] flex-col justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-black/40 p-6 backdrop-blur-md">
      <h2 className="absolute left-6 top-4 flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[var(--muted)]">
        <Database size={16} /> {label}: <span className="text-white">{archType}</span>
      </h2>

      <div className="relative z-10 mt-6 flex items-center justify-around">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-orange-500/50 bg-orange-500/10 text-orange-500">
            <Server size={20} />
          </div>
          <span className="font-mono text-[10px] text-gray-500">{nodeLabels.server}</span>
        </div>

        <div className="relative mx-4 h-[1px] flex-1 bg-gray-800">
          <motion.div
            className="absolute left-0 top-[-1px] h-[3px] w-8 bg-green-500 shadow-[0_0_10px_#22c55e]"
            animate={
              prefersReducedMotion
                ? { transform: "translateX(180%)", opacity: 0.65 }
                : { transform: ["translateX(0%)", "translateX(400%)"], opacity: [0, 1, 0] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { repeat: Infinity, duration: archType === "monolith" ? 2 : 0.8, ease: "linear" }
            }
          />
        </div>

        {archType === "microservices" ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-purple-500/50 bg-purple-500/10 text-purple-500">
                <Code size={18} />
              </div>
              <span className="font-mono text-[10px] text-gray-500">{nodeLabels.gateway}</span>
            </div>
            <div className="relative mx-4 h-[1px] flex-1 bg-gray-800">
              <motion.div
                className="absolute left-0 top-[-1px] h-[3px] w-8 bg-purple-500"
                animate={
                  prefersReducedMotion
                    ? { transform: "translateX(180%)", opacity: 0.65 }
                    : { transform: ["translateX(0%)", "translateX(400%)"], opacity: [0, 1, 0] }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { repeat: Infinity, duration: 0.8, delay: 0.4, ease: "linear" }
                }
              />
            </div>
          </>
        ) : null}

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-blue-500/50 bg-blue-500/10 text-blue-500">
            <Terminal size={20} />
          </div>
          <span className="font-mono text-[10px] text-gray-500">{nodeLabels.client}</span>
        </div>
      </div>
    </div>
  );
}
