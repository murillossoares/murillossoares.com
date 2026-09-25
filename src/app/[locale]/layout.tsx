import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import Providers from "@/components/Providers";
import { locales } from "@/i18n/routing";
import { careerFacts, formatYears } from "@/models/metrics";
import { careerFile, getCareerHistory } from "@/services/careerData";
import { absoluteUrl, googleVerificationTokens, LOCALE_TAGS, localeAlternates, SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// Runs before first paint: returning visitors (same tab session) and link-preview/search bots skip the boot
// overlay entirely, so it never delays content. The dashboard itself is always in the HTML.
const BOOT_FLAG_SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem("booted")==="1"||/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram/i.test(navigator.userAgent))d.setAttribute("data-booted","1")}catch(e){}`;

export function generateStaticParams() { return locales.map((l) => ({ locale: l })); }
export const dynamicParams = false;

export const viewport: Viewport = { themeColor: "#0e1116", colorScheme: "dark" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const facts = careerFacts(getCareerHistory(locale));
  const title = t("title");
  const description = t("description", { years: formatYears(facts), companies: facts.companies });
  const google = googleVerificationTokens();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s" },
    description,
    applicationName: careerFile.person.name,
    authors: [{ name: careerFile.person.name, url: absoluteUrl(`/${locale}`) }],
    creator: careerFile.person.name,
    keywords: [careerFile.person.name, ...careerFile.person.alternateNames, "Java", "Spring Boot", "Microservices", "SOA", "React", "Angular", "Full Stack", "Lisboa", "Lisbon"],
    alternates: {
      canonical: `/${locale}`,
      languages: localeAlternates(),
      types: { "application/json": "/resume.json", "text/plain": "/llms.txt" },
    },
    openGraph: {
      type: "profile",
      url: `/${locale}`,
      siteName: careerFile.person.name,
      title,
      description,
      locale: LOCALE_TAGS[locale]?.og,
      alternateLocale: Object.entries(LOCALE_TAGS).filter(([l]) => l !== locale).map(([, v]) => v.og),
      firstName: careerFile.person.givenName,
      lastName: careerFile.person.familyName,
      images: [{ url: `/og/${locale}.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/og/${locale}.png`] },
    ...(google.length ? { verification: { google } } : {}),
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as never)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={LOCALE_TAGS[locale]?.hreflang ?? locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_FLAG_SCRIPT }} />
        <noscript><style>{"#boot-overlay{display:none}"}</style></noscript>
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <NextIntlClientProvider messages={await getMessages()}><Providers>{children}</Providers></NextIntlClientProvider>
      </body>
    </html>
  );
}
