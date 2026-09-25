import { FALLBACK_LOCALE } from "@/lib/site";

// Next.js adds <meta name="robots" content="noindex"> to this page itself.
export default function NotFound() {
  return (
    <html lang="en">
      <head><title>404 — Murillo Soares</title></head>
      <body style={{ background: "#0e1116", color: "#d4d4d4", fontFamily: "monospace", padding: "2rem" }}>
        <p>404 :: route not found</p>
        <a href={`/${FALLBACK_LOCALE}`} style={{ color: "#22c55e" }}>cd ~/portfolio</a>
      </body>
    </html>
  );
}
