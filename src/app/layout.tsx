import "./globals.css";

// The <html> element lives in [locale]/layout.tsx so it can carry the right `lang`.
// Rendering it here as well produced two nested <html> tags in every exported page.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
