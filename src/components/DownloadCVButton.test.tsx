import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DownloadCVButton from "./DownloadCVButton";

const { toBlob } = vi.hoisted(() => ({
  toBlob: vi.fn().mockRejectedValue(new Error("pdf failed")),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "vscode-dark" }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useMessages: () => ({
    App: { title: "Murillo Soares" },
    Dashboard: { headline: "Senior Full Stack Engineer", eventHistoryTitle: "Experience" },
    careerHistory: [],
  }),
  useTranslations: () => (key: string) =>
    ({ downloadCv: "Download CV", downloadError: "Could not generate the CV. Try again." })[key] ?? key,
}));

vi.mock("@react-pdf/renderer", () => ({
  pdf: () => ({ toBlob }),
}));

vi.mock("@/components/pdf/CVDocument", () => ({
  CVDocument: () => null,
}));

describe("DownloadCVButton", () => {
  it("shows a localized error and re-enables retry when PDF generation fails", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<DownloadCVButton />);
    const button = await screen.findByRole("button", { name: /download cv/i });

    await user.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not generate the CV. Try again.");
    expect(button).toBeEnabled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
