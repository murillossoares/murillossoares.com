import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LOCALE_TAGS, localeAlternates } from "@/lib/site";
import ScoreboardClient from "./ScoreboardClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("scoreboardTitle");
  const description = t("scoreboardDescription");
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/scoreboard`, languages: localeAlternates("/scoreboard") },
    openGraph: { type: "website", url: `/${locale}/scoreboard`, title, description, locale: LOCALE_TAGS[locale]?.og, images: [{ url: "/og.png", width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default async function ScoreboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ScoreboardClient locale={locale} />;
}
