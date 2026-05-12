export const pdfThemes = {
  "vscode-dark": {
    bg: "#0e1116",
    panel: "#1e1e1e",
    panel2: "#161a1f",
    border: "rgba(255, 255, 255, 0.09)",
    text: "#d4d4d4",
    muted: "rgba(212, 212, 212, 0.7)",
    accent: "#007acc",
    accent2: "#22c55e",
  },
  "intellij-darcula": {
    bg: "#1f1f1f",
    panel: "#2b2b2b",
    panel2: "#232323",
    border: "rgba(255, 255, 255, 0.09)",
    text: "#d7dae0",
    muted: "rgba(215, 218, 224, 0.7)",
    accent: "#9876aa",
    accent2: "#ffc66d",
  },
  "sublime-monokai": {
    bg: "#141414",
    panel: "#272822",
    panel2: "#1f201b",
    border: "rgba(255, 255, 255, 0.1)",
    text: "#f8f8f2",
    muted: "rgba(248, 248, 242, 0.7)",
    accent: "#a6e22e",
    accent2: "#f92672",
  },
} as const;

export type PdfThemeName = keyof typeof pdfThemes;

export function isPdfThemeName(value: unknown): value is PdfThemeName {
  return typeof value === "string" && value in pdfThemes;
}
