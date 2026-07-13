import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "@/components/Providers";
import { locales } from "@/i18n/routing";
export function generateStaticParams() { return locales.map((l) => ({ locale: l })); }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as never)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body><NextIntlClientProvider messages={await getMessages()}><Providers>{children}</Providers></NextIntlClientProvider></body>
    </html>
  );
}
