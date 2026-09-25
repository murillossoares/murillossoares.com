# LinkedIn export (manual source)

The site reads `Positions.csv` from this folder on every build, in addition to the weekly LinkedIn API sync.
Use it when the API token has expired or while the LinkedIn profile is deactivated.

## Updating

1. LinkedIn → Settings → Data privacy → **Get a copy of your data** → select **Positions** (or the full archive).
2. Open the ZIP you receive and copy **only `Positions.csv`** into this folder, replacing the old one.
3. Commit and push. The Netlify build applies it immediately; the LinkedIn sync workflow also records it in
   `src/data/career.json` through a pull request.

## Never commit anything else from the export

The archive also contains private messages, connections, e-mail addresses and phone numbers, and this repository
is public. `.gitignore` blocks every other file in this folder, and a test fails if `Positions.csv` has columns
other than `Company Name, Title, Description, Location, Started On, Finished On`.

## How the sources are combined

- `src/data/career.json` is what the site renders. LinkedIn provides **facts** (dates, current position, new
  positions); the curated translated texts, stack and architecture in `career.json` are kept.
- A given `Positions.csv` is applied only once (its hash is stored in `career.json`), so an old export never
  overwrites newer data from the API.
- A missing, malformed or partial file is skipped with a warning; it never breaks the build.
