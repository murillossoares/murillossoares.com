import { describe, expect, it } from "vitest";

import { activeTheme, THEME_ATTRIBUTE_VALUES, THEME_IDS } from "./themes";

describe("themes", () => {
  it("maps the system's light and dark to site themes", () => {
    expect(activeTheme("light")).toBe("bluloco-light");
    expect(activeTheme("dark")).toBe("vscode-dark");
    expect(activeTheme("sublime-monokai")).toBe("sublime-monokai");
    expect(activeTheme(undefined)).toBe("vscode-dark");
  });

  it("gives every theme an attribute value (next-themes drops the attribute otherwise)", () => {
    for (const id of THEME_IDS) expect(THEME_ATTRIBUTE_VALUES[id]).toBe(id);
  });
});
