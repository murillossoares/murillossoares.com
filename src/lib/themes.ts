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

/** "Follow the system" is the default choice; it resolves to one of these themes. */
export const SYSTEM = "system";
export const SYSTEM_THEMES: Record<"light" | "dark", ThemeId> = { light: "bluloco-light", dark: "vscode-dark" };

/** next-themes `value` map: every theme name, plus the system's light/dark, to the data-theme attribute value. */
export const THEME_ATTRIBUTE_VALUES: Record<string, ThemeId> = {
  ...Object.fromEntries(THEME_IDS.map((id) => [id, id])),
  ...SYSTEM_THEMES,
};

/** The theme actually on screen for next-themes' resolvedTheme ("light"/"dark" while following the system). */
export function activeTheme(resolvedTheme: string | undefined): ThemeId {
  return (resolvedTheme && THEME_ATTRIBUTE_VALUES[resolvedTheme]) || DEFAULT_THEME;
}
