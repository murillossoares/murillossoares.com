import { setRequestLocale } from "next-intl/server";

import Dashboard from "@/components/Dashboard";
import BootExperience from "@/components/BootExperience";
import CyberpunkOverlay from "@/components/CyberpunkOverlay";
import MysteryButton from "@/components/MysteryButton";
import { personJsonLd } from "@/lib/agent-content";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Fixed at build time and passed down, so server HTML and client hydration compute the same facts.
  const asOf = new Date().toISOString();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(locale, undefined, new Date(asOf))).replace(/</g, "\\u003c") }} />
      <BootExperience>
        <Dashboard locale={locale} asOf={asOf} />
        <CyberpunkOverlay />
        <MysteryButton />
      </BootExperience>
    </>
  );
}
