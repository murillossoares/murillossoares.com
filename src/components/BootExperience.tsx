"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";

import TerminalBoot from "@/components/TerminalBoot";
import { useUiStore } from "@/store/ui";

export const BOOT_FLAG = "booted";

/**
 * The boot sequence is a skippable overlay, never a gate: the page content is always rendered (and present in the
 * static HTML for crawlers). It plays once per browser session; the flag is mirrored on <html data-booted> by an
 * inline script in the layout so returning visitors never see it flash.
 */
export default function BootExperience({ children }: { children?: ReactNode }) {
  const locale = useLocale();
  const booted = useUiStore((s) => s.booted);
  const setBooted = useUiStore((s) => s.setBooted);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (document.documentElement.hasAttribute("data-booted")) setBooted(true);
  }, [setBooted]);

  const complete = () => {
    try { sessionStorage.setItem(BOOT_FLAG, "1"); } catch { /* storage may be unavailable */ }
    setBooted(true);
  };

  return (
    <>
      <div inert={mounted && !booted ? true : undefined}>{children}</div>
      <AnimatePresence initial={false}>
        {!booted ? <TerminalBoot key="boot" locale={locale} onComplete={complete} /> : null}
      </AnimatePresence>
    </>
  );
}
