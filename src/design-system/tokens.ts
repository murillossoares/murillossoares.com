export type ColorValue = `#${string}` | `rgba(${string})`;
export interface TokenContract {
  name: string;
  colors: {
    bg: ColorValue; panel: ColorValue; "panel-2": ColorValue; border: ColorValue;
    text: ColorValue; muted: ColorValue; accent: ColorValue; "accent-2": ColorValue;
    "glow-accent": ColorValue; "glow-accent-2": ColorValue;
    success: ColorValue; warning: ColorValue; error: ColorValue; info: ColorValue;
    cyber: { yellow: ColorValue; blue: ColorValue; pink: ColorValue; black: ColorValue };
    utility: Record<string, ColorValue>;
  };
}
export const vscodeTokens: TokenContract = {
  name: "vscode-dark",
  colors: { bg: "#0e1116", panel: "#1e1e1e", "panel-2": "#161a1f", border: "rgba(255,255,255,0.09)",
    text: "#d4d4d4", muted: "rgba(212,212,212,0.7)", accent: "#007acc", "accent-2": "#22c55e",
    "glow-accent": "rgba(0,122,204,0.16)", "glow-accent-2": "rgba(34,197,94,0.14)",
    success: "#22c55e", warning: "#eab308", error: "#ef4444", info: "#3b82f6",
    cyber: { yellow: "#fcee0a", blue: "#00f0ff", pink: "#ff00ff", black: "#0a0a0a" },
    utility: { white: "#fff", black: "#000", "gray-500": "#6b7280" } },
} as const;
export const darculaTokens: TokenContract = {
  name: "intellij-darcula",
  colors: { bg: "#1f1f1f", panel: "#2b2b2b", "panel-2": "#232323", border: "rgba(255,255,255,0.09)",
    text: "#d7dae0", muted: "rgba(215,218,224,0.7)", accent: "#9876aa", "accent-2": "#ffc66d",
    "glow-accent": "rgba(152,118,170,0.16)", "glow-accent-2": "rgba(255,198,109,0.16)",
    success: "#6a8759", warning: "#bbb529", error: "#ff6b68", info: "#6897bb",
    cyber: { yellow: "#fcee0a", blue: "#00f0ff", pink: "#ff00ff", black: "#0a0a0a" },
    utility: { white: "#fff", black: "#000", "gray-500": "#6b7280" } },
} as const;
export const monokaiTokens: TokenContract = {
  name: "sublime-monokai",
  colors: { bg: "#141414", panel: "#272822", "panel-2": "#1f201b", border: "rgba(255,255,255,0.1)",
    text: "#f8f8f2", muted: "rgba(248,248,242,0.7)", accent: "#a6e22e", "accent-2": "#f92672",
    "glow-accent": "rgba(166,226,46,0.16)", "glow-accent-2": "rgba(249,38,114,0.16)",
    success: "#a6e22e", warning: "#e6db74", error: "#f92672", info: "#66d9ef",
    cyber: { yellow: "#fcee0a", blue: "#00f0ff", pink: "#ff00ff", black: "#0a0a0a" },
    utility: { white: "#fff", black: "#000", "gray-500": "#6b7280" } },
} as const;
export const allTokens: Record<string, TokenContract> = {
  "vscode-dark": vscodeTokens, "intellij-darcula": darculaTokens, "sublime-monokai": monokaiTokens,
} as const;
export type ThemeName = keyof typeof allTokens;
export function isThemeName(v: string | undefined): v is ThemeName { return v !== undefined && v in allTokens; }
export function getTokens(theme: string | undefined): TokenContract { return isThemeName(theme) ? allTokens[theme] : vscodeTokens; }
