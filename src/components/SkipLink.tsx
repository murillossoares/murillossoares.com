"use client";
export default function SkipLink({ label = "Skip to main content" }: { label?: string }) {
  return (
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-mono">
      {label}
    </a>
  );
}
