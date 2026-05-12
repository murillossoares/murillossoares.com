"use client";

import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";

import TerminalBoot from "@/components/TerminalBoot";
import { useUiStore } from "@/store/ui";

export default function BootExperience({ children }: { children?: ReactNode }) {
  const locale = useLocale();
  const booted = useUiStore((s) => s.booted);
  const setBooted = useUiStore((s) => s.setBooted);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!booted ? (
        <TerminalBoot key="boot" locale={locale} onComplete={() => setBooted(true)} />
      ) : (
        <div key="content">{children}</div>
      )}
    </AnimatePresence>
  );
}
