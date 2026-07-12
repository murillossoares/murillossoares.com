import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DashboardView from "./DashboardView";
import type { DashboardCopy, JobData } from "./types";

vi.mock("@/components/DownloadCVButton", () => ({
  default: ({ label }: { label?: string }) => <button type="button">{label ?? "download"}</button>,
}));

vi.mock("@/components/ThemeSwitcher", () => ({
  default: () => <div>theme-switcher</div>,
}));

vi.mock("@/components/LanguageSwitcher", () => ({
  default: () => <div>language-switcher</div>,
}));

const copy: DashboardCopy = {
  systemOnline: "Sistema online",
  title: "Murillo Soares",
  headline: "Engenheiro Full Stack Sênior",
  kpis: {
    uptime: { label: "TEMPO ATIVO", value: "9+ anos", sub: "Experiência profissional" },
    stack: { label: "STACK", value: "Completo", sub: "Backend + Frontend" },
    arch: { label: "ARQ", value: "Sólida", sub: "Mono -> Micro" },
  },
  eventHistoryTitle: "Logs de Execução (Experiência)",
  eventHistoryHint: "Selecione um log para inspecionar",
  eventHistoryEmpty: "Nenhum evento carregado.",
  dependenciesTitle: "Dependências Ativas",
  dependenciesGroups: {
    backend: "Nó Backend",
    frontend: "Cliente Frontend",
  },
  dependenciesEmpty: "Nenhuma dependência carregada.",
  architectureViewLabel: "Visão de Arquitetura",
  serviceMapNodeLabels: {
    server: "Servidor",
    gateway: "Gateway",
    client: "Cliente",
  },
};

const jobs: JobData[] = [
  {
    id: "job-b",
    year: "2025",
    role: "Senior Full Stack",
    company: "Conkord",
    type: "WARN",
    desc: "Modernized a service platform with Spring and React.",
    stack: ["Java 21", "Spring Boot", "React", "Oracle"],
    archType: "microservices",
  },
  {
    id: "job-a",
    year: "2024",
    role: "Frontend Engineer",
    company: "Studio",
    type: "INFO",
    desc: "Built accessible interfaces with Angular.",
    stack: ["Angular", "HTML"],
    archType: "hybrid",
  },
];

describe("DashboardView", () => {
  it("renders the dashboard shell and active job details", () => {
    render(<DashboardView copy={copy} careerHistory={jobs} />);

    expect(screen.getByRole("heading", { name: "Murillo Soares" })).toBeInTheDocument();
    expect(screen.getByText("GET_CV.pdf")).toBeInTheDocument();
    expect(screen.getByText("Java 21")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText(/Visão de Arquitetura/i)).toBeInTheDocument();
  });

  it("updates the dependencies panel when another job is selected", async () => {
    const user = userEvent.setup();
    render(<DashboardView copy={copy} careerHistory={jobs} />);

    const firstJob = screen.getByRole("button", { name: /Senior Full Stack @ Conkord/i });
    const secondJob = screen.getByRole("button", { name: /Frontend Engineer @ Studio/i });

    expect(firstJob).toHaveAttribute("aria-pressed", "true");
    expect(secondJob).toHaveAttribute("aria-pressed", "false");

    await user.click(secondJob);

    expect(await screen.findByText("Angular")).toBeInTheDocument();
    expect(screen.queryByText("Java 21")).not.toBeInTheDocument();
    expect(firstJob).toHaveAttribute("aria-pressed", "false");
    expect(secondJob).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the selected job active when the history refresh still contains it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DashboardView copy={copy} careerHistory={jobs} />);

    await user.click(screen.getByRole("button", { name: /Frontend Engineer @ Studio/i }));

    rerender(
      <DashboardView
        copy={copy}
        careerHistory={[
          {
            ...jobs[0],
            stack: ["Java 21", "Spring Boot"],
          },
          {
            ...jobs[1],
            desc: "Expanded the design system for client apps.",
            stack: ["Angular", "Redux", "HTML/CSS"],
          },
        ]}
      />,
    );

    expect(await screen.findByText("Redux")).toBeInTheDocument();
    expect(screen.queryByText("Java 21")).not.toBeInTheDocument();
  });

  it("falls back to the first job when the selected job disappears after refresh", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DashboardView copy={copy} careerHistory={jobs} />);

    await user.click(screen.getByRole("button", { name: /Frontend Engineer @ Studio/i }));

    rerender(<DashboardView copy={copy} careerHistory={[jobs[0]]} />);

    expect(await screen.findByText("Java 21")).toBeInTheDocument();
    expect(screen.queryByText("Angular")).not.toBeInTheDocument();
  });

  it("renders empty-state copy when there is no career history", () => {
    render(<DashboardView copy={copy} careerHistory={[]} />);

    expect(screen.getByText("Nenhum evento carregado.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma dependência carregada.")).toBeInTheDocument();
  });
});
