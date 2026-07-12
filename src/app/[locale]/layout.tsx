import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "@/components/Providers";
import { locales } from "@/i18n/routing";
export function generateStaticParams() { return locales.map((l) => ({ locale: l })); }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const { locale } = params;
  if (!locales.includes(locale as never)) notFound();
  unstable_setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body><NextIntlClientProvider messages={await getMessages()}><Providers>{children}</Providers></NextIntlClientProvider></body>
    </html>
  );
}
