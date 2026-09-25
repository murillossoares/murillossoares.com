/** Site themes, in the order the switcher lists them. `scheme` drives color-scheme (form controls, scrollbars). */
export const THEMES = [
  { id: "vscode-dark", label: "VS Code Dark", scheme: "dark" },
  { id: "intellij-darcula", label: "IntelliJ Darcula", scheme: "dark" },
  { id: "sublime-monokai", label: "Sublime Monokai", scheme: "dark" },
  { id: "bluloco-light", label: "Bluloco Light", scheme: "light" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "vscode-dark";
export const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];
