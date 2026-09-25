import { DEFAULT_LOCALE } from "@/lib/site";

export default function NotFound() {
  return (
    <html lang="en">
      <head><meta name="robots" content="noindex" /><title>404 — Murillo Soares</title></head>
      <body style={{ background: "#0e1116", color: "#d4d4d4", fontFamily: "monospace", padding: "2rem" }}>
        <p>404 :: route not found</p>
        <a href={`/${DEFAULT_LOCALE}`} style={{ color: "#22c55e" }}>cd ~/portfolio</a>
      </body>
    </html>
  );
}
