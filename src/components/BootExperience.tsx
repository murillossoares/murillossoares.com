"use client";

import { AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";

import CyberpunkOverlay from "@/components/CyberpunkOverlay";
import Dashboard from "@/components/Dashboard";
import MysteryButton from "@/components/MysteryButton";
import TerminalBoot from "@/components/TerminalBoot";
import { useUiStore } from "@/store/ui";

export default function BootExperience() {
  const locale = useLocale();
  const booted = useUiStore((s) => s.booted);
  const setBooted = useUiStore((s) => s.setBooted);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait" initial={false}>
        {!booted ? (
          <TerminalBoot key="boot" locale={locale} onComplete={() => setBooted(true)} />
        ) : (
          <Dashboard key="dash" />
        )}
      </AnimatePresence>

      {booted ? (
        <>
          <MysteryButton />
          <CyberpunkOverlay locale={locale} />
        </>
      ) : null}
    </div>
  );
}

