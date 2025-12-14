# `murillossoares.com`

Portfolio/CV em Next.js (App Router):

- **Boot Sequence**: terminal estilo Spring Boot (com “skip” via `Esc`).
- **Dashboard**: CV em grid com visual de IDE.
- **Themes**: alternância entre `vscode-dark`, `intellij-darcula`, `sublime-monokai`.
- **i18n**: `pt-br`, `en`, `es`.
- **Easter egg**: botão “cyberpunk” com overlay de personalidade.

## Rodando localmente

```bash
npm install
npm run dev
```

Se o `cv-print` quebrar no `npm run dev` com erro do tipo `Cannot find module './vendor-chunks/...` (cache corrompido), rode:

```bash
npm run dev:clean
```

Acesse:

- `http://localhost:3000/pt-br`
- `http://localhost:3000/en`
- `http://localhost:3000/es`

## Onde editar conteúdo

- Logs do terminal: `src/data/logs.json`
- Persona (cyberpunk): `src/data/persona.json`
- Textos/UI (i18n): `src/messages/*.json`
