"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import personaData from "@/data/persona.json";
import { useUiStore } from "@/store/ui";

type TriggerLocale = keyof typeof personaData.trigger_button.idle;

function getTriggerLocale(locale: string): TriggerLocale {
  if (locale === "pt-br" || locale === "en" || locale === "es") return locale;
  return "en";
}

function glitchify(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return input.split("").map((ch) => {
    if (" _-.".includes(ch)) return ch;
    return Math.random() < 0.32 ? alphabet[Math.floor(Math.random() * alphabet.length)] : ch;
  }).join("");
}

export default function MysteryButton() {
  const locale = useLocale();
  const toggleCyberpunk = useUiStore((s) => s.toggleCyberpunk);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [label, setLabel] = useState("");
  const texts = useMemo(() => {
    const l = getTriggerLocale(locale);
    return { idle: personaData.trigger_button.idle[l], hover: personaData.trigger_button.hover[l] };
  }, [locale]);

  useEffect(() => {
    if (hovered) {
      setLabel(texts.hover);
      return;
    }
    setLabel(texts.idle);
    if (reduced) return;
    const iv = window.setInterval(() => {
      setLabel(Math.random() < 0.25 ? texts.hover : glitchify(texts.idle));
    }, 120);
    return () => window.clearInterval(iv);
  }, [hovered, reduced, texts]);

  return (
    <motion.button type="button" onClick={toggleCyberpunk}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      aria-label={texts.hover} className="group fixed bottom-8 right-8 z-40"
      whileHover={reduced ? {} : { scale: 1.05 }} whileTap={reduced ? {} : { scale: 0.95 }}>
      <div className="relative overflow-hidden rounded-lg border-2 border-cyber-yellow bg-black/80 px-5 py-3 shadow-[0_0_18px_rgba(252,238,10,0.45)] backdrop-blur">
        <div className={`absolute inset-0 bg-cyber-yellow opacity-0 transition-opacity duration-150 ${hovered ? "opacity-[0.15] animate-pulse" : ""}`} />
        <div className="relative flex items-center gap-3 font-mono text-xs font-bold tracking-[0.32em] text-cyber-yellow transition-colors group-hover:text-white">
          <Zap size={18} className={hovered && !reduced ? "animate-spin" : ""} aria-hidden="true" />
          <span className="relative uppercase">
            <span className="absolute inset-0 -translate-x-[1px] text-cyber-blue opacity-70">{label}</span>
            <span className="absolute inset-0 translate-x-[1px] text-cyber-pink opacity-60">{label}</span>
            <span className="relative">{label}</span>
          </span>
        </div>
        <div className="absolute left-0 top-0 h-2 w-2 bg-cyber-yellow" />
        <div className="absolute bottom-0 right-0 h-2 w-2 bg-cyber-yellow" />
      </div>
    </motion.button>
  );
}
