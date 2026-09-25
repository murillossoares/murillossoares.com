# LinkedIn export (manual source)

The site reads `Positions.csv` from this folder on every build, in addition to the weekly LinkedIn API sync.
Use it when the API token has expired or while the LinkedIn profile is deactivated.

## Updating

Dates are month and year (`Feb 2025`); days are never used.

- **By hand:** fill in `Positions.template.csv` (replace every `MMM`, and `YYYY` in *Finished On*; leave *Finished On*
  empty for the current role), save it as `Positions.csv`, commit and push.
- **From a LinkedIn export:** LinkedIn → Settings → Data privacy → **Get a copy of your data** → **Positions**. Copy
  **only `Positions.csv`** from the ZIP into this folder, or let `scripts/linkedin/ingest-export.sh <zip>` do it.
- **Automatically on a Ubuntu machine:** see [`docs/linkedin-export-automation.md`](../../docs/linkedin-export-automation.md).

After a push the Netlify build applies it immediately; the LinkedIn sync workflow also records it in
`src/data/career.json` through a pull request.

## Never commit anything else from the export

The archive also contains private messages, connections, e-mail addresses and phone numbers, and this repository
is public. `.gitignore` blocks every other file in this folder except the template, and a test fails if `Positions.csv` has columns
other than `Company Name, Title, Description, Location, Started On, Finished On`.

## How the sources are combined

- `src/data/career.json` is what the site renders. LinkedIn provides **facts** (dates, current position, new
  positions); the curated translated texts, stack and architecture in `career.json` are kept.
- A given `Positions.csv` is applied only once (its hash is stored in `career.json`), so an old export never
  overwrites newer data from the API.
- A missing, malformed or partial file is skipped with a warning; it never breaks the build.
