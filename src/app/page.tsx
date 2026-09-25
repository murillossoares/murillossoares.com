import { DEFAULT_LOCALE, LOCALES, LOCALE_TAGS } from "@/lib/site";

// In production Netlify answers "/" with an HTTP redirect (see netlify.toml), so this page is only
// a no-JS fallback: a meta refresh plus plain links that crawlers can follow.
export default function RootPage() {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content={`0; url=/${DEFAULT_LOCALE}`} />
        <link rel="canonical" href={`/${DEFAULT_LOCALE}`} />
        <title>Murillo Soares</title>
      </head>
      <body>
        <ul>
          {LOCALES.map((l) => <li key={l}><a href={`/${l}`} hrefLang={LOCALE_TAGS[l].hreflang}>{LOCALE_TAGS[l].name}</a></li>)}
        </ul>
      </body>
    </html>
  );
}
