"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";

import personaData from "@/data/persona.json";
import { useUiStore } from "@/store/ui";

type TriggerLocale = keyof typeof personaData.trigger_button.idle;

function getTriggerLocale(locale: string): TriggerLocale {
  if (locale === "pt-br" || locale === "en" || locale === "es") return locale;
  return "en";
}

export default function MysteryButton() {
  const locale = useLocale();
  const toggleCyberpunk = useUiStore((s) => s.toggleCyberpunk);
  const [hovered, setHovered] = useState(false);

  const texts = useMemo(() => {
    const l = getTriggerLocale(locale);
    return {
      idle: personaData.trigger_button.idle[l],
      hover: personaData.trigger_button.hover[l],
    };
  }, [locale]);

  const label = hovered ? texts.hover : texts.idle;

  return (
    <motion.button
      type="button"
      onClick={toggleCyberpunk}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      aria-label={texts.hover}
      className="group fixed bottom-8 right-8 z-40 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="relative overflow-hidden rounded-lg border-2 border-cyber-yellow bg-black/80 px-5 py-3 shadow-[0_0_18px_rgba(252,238,10,0.45)] backdrop-blur">
        <div
          className={`absolute inset-0 bg-cyber-yellow opacity-0 transition-opacity duration-150 ${
            hovered ? "opacity-15" : ""
          }`}
        />

        <div className="relative flex items-center gap-3 font-mono text-xs font-bold tracking-[0.32em] text-cyber-yellow transition-colors group-hover:text-white">
          <Zap size={18} />

          <span className="relative uppercase">
            <span className="absolute inset-0 -translate-x-[1px] text-cyber-blue opacity-70">
              {label}
            </span>
            <span className="absolute inset-0 translate-x-[1px] text-cyber-pink opacity-60">
              {label}
            </span>
            <span className="relative">{label}</span>
          </span>
        </div>

        <div className="absolute left-0 top-0 h-2 w-2 bg-cyber-yellow" />
        <div className="absolute bottom-0 right-0 h-2 w-2 bg-cyber-yellow" />
      </div>
    </motion.button>
  );
}
