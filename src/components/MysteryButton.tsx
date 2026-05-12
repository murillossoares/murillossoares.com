"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useUiStore } from "@/store/ui";
export default function MysteryButton() {
  const { toggleCyberpunk, cyberpunkOpen } = useUiStore();
  const t = useTranslations("Cyberpunk");
  const reduced = useReducedMotion();
  const active = cyberpunkOpen;
  return (
    <motion.button whileHover={reduced ? {} : { scale: 1.05 }} whileTap={reduced ? {} : { scale: 0.95 }}
      onClick={toggleCyberpunk}
      className={`fixed bottom-4 right-4 z-40 border px-3 py-2 font-mono text-[10px] transition-colors focus:ring-2 focus:ring-cyber-yellow ${
        active
          ? "border-cyber-yellow bg-cyber-yellow text-cyber-black shadow-[0_0_16px_rgba(252,238,10,0.45)]"
          : `border-cyber-yellow/50 bg-cyber-black text-cyber-yellow hover:bg-cyber-yellow hover:text-cyber-black ${reduced ? "" : "animate-cyber-flicker"}`
      }`}
      aria-pressed={active}
      aria-label={active ? t("button.deactivateLabel") : t("button.activateLabel")}>
      {active ? t("button.active") : t("button.inactive")}
    </motion.button>
  );
}
