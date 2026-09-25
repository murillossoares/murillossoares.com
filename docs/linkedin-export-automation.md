# LinkedIn export → site, automated on a mini PC (Ubuntu)

The site reads career dates from `data/linkedin/Positions.csv`. This guide makes a Ubuntu machine publish that file
automatically whenever a LinkedIn data export lands in its `~/Downloads` folder.

## What stays manual, and why

Requesting and downloading the export needs your LinkedIn login. Automating it (a bot logging in, scraping, clicking
"Request archive") breaks the LinkedIn User Agreement, which forbids automated access, and risks restricting the very
profile the site promotes. So the human part is about one minute every few months:

1. LinkedIn → **Settings & Privacy → Data privacy → Get a copy of your data**.
2. Choose **"Want something in particular?" → Positions** → **Request archive**. LinkedIn e-mails you when it is ready
   (usually within minutes for a single category).
3. On the mini PC, open the e-mail link in the browser and **Download archive**. The ZIP lands in `~/Downloads`.

Everything after that is automatic: a systemd path unit notices the ZIP and runs
`scripts/linkedin/ingest-export.sh`, which:

- extracts **only** `Positions.csv` (never messages, connections, e-mails or phone numbers),
- validates it with the same test CI runs (expected columns, no contact data),
- previews the merge with the site data and refuses partial or unreadable files,
- commits `data/linkedin/Positions.csv` on top of `master` and pushes that single commit to the drop-box branch
  `linkedin-export/positions` — **never to `master`**,
- the **LinkedIn sync** workflow then takes only the CSV from that branch (it refuses a push that changes anything
  else and never runs the branch's code), applies it, runs lint, tests and build, and opens a pull request. The site
  changes only when you merge that PR.
- deletes the ZIP (it holds private data). On failure the ZIP is moved to `~/Downloads/linkedin-export-failed/`.

## Filling months by hand instead

`data/linkedin/Positions.template.csv` lists the current positions with `MMM` placeholders. Replace each `MMM` with the
month as LinkedIn writes it (`Jan`, `Feb` … `Dec`; Portuguese and Spanish abbreviations also work, e.g. `fev`, `dic`),
replace `YYYY` in *Finished On* with the year, leave *Finished On* empty for the current role, save it as
`data/linkedin/Positions.csv`, commit and push. Days are never used. Rows that still contain `MMM` are ignored by the
build, flagged by CI, and refused by `ingest-export.sh`, so a half-filled template cannot change the site.

## Setup on the mini PC

Run these once, in order. Steps 1–4 prepare access and a dedicated clone, step 5 tests safely, step 6 turns the
watcher on.

**1. Prerequisites** — git, unzip and Node.js 22.18 or newer:

```bash
sudo apt install -y git unzip zip
node --version   # 22.18+; if missing: curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && nvm install 22
```

**2. A dedicated system user** — the token below must not be readable by anything else running on the machine (other
agents, bots, MCP servers). Run the automation as its own user:

```bash
sudo adduser --disabled-password --gecos "" linkedin-export
sudo -iu linkedin-export      # all following steps run as this user
mkdir -p ~/Downloads
```

It needs its own Node.js (nvm, as in step 1) and downloads go to *its* `~/Downloads`
(`/home/linkedin-export/Downloads`). Download the export as that user, or copy the ZIP there
(`sudo install -o linkedin-export -m 600 ~/Downloads/*LinkedInDataExport*.zip /home/linkedin-export/Downloads/`).

If an earlier version of this guide made you add a deploy key (`murillossoares_deploy`), delete it at
<https://github.com/murillossoares/murillossoares.com/settings/keys> and remove the key files from `~/.ssh`.

**3. A token that can push data but not workflows** — a fine-grained personal access token, not a deploy key. A deploy
key with write access can also rewrite `.github/workflows`; a fine-grained token without the *Workflows* permission
cannot, so it cannot change what the sync workflow runs.

At <https://github.com/settings/personal-access-tokens/new>: *Repository access* → **Only select repositories** →
`murillossoares.com`; *Permissions* → **Contents: Read and write** (nothing else, in particular **not** *Workflows*);
expiration of up to one year (put a reminder in your calendar). Then, as `linkedin-export`:

```bash
git clone https://github.com/murillossoares/murillossoares.com.git ~/automation/murillossoares.com
cd ~/automation/murillossoares.com && npm ci
git config user.name "Murillo" && git config user.email "mhsscel@users.noreply.github.com"
git config credential.helper store
printf 'https://murillossoares:%s@github.com\n' 'PASTE_TOKEN_HERE' > ~/.git-credentials && chmod 600 ~/.git-credentials
git push --dry-run origin HEAD:refs/heads/linkedin-export/positions   # no error: the token can push branches
```

**Protect `master` (once, in GitHub)** — so no automation credential can change the site by itself. At
<https://github.com/murillossoares/murillossoares.com/settings/rules> → **New branch ruleset**: target the default
branch, enable **Restrict deletions**, **Block force pushes**, **Require a pull request before merging** and **Require
status checks to pass** (`lint-build-test-smoke`); bypass list: only **Repository admin** (you). A leaked token can
then at most push a branch; `master` changes only through a PR you merge. Pull requests opened by the sync workflow
run their checks inside the workflow itself (GitHub does not start other workflows for them), so merge those as admin
after reading the report in the PR.

**4. Environment for systemd** — systemd does not load your shell profile, so give it the paths it needs:

```bash
mkdir -p ~/.config
printf 'PATH=%s:/usr/local/bin:/usr/bin:/bin\nLINKEDIN_EXPORT_DIR=%s\n' "$(dirname "$(command -v node)")" "$HOME/Downloads" > ~/.config/linkedin-export.env
chmod 600 ~/.config/linkedin-export.env
```

If your downloads go elsewhere, change `LINKEDIN_EXPORT_DIR` here **and** `PathExistsGlob` in
`linkedin-export.path` (step 6) to the same folder.

**5. Safe test before enabling anything** — a ZIP without `Positions.csv` must be refused and nothing committed:

```bash
cd ~/automation/murillossoares.com
mkdir -p /tmp/li-test && printf 'First Name\nTest\n' > /tmp/li-test/Connections.csv && (cd /tmp/li-test && zip -q test.zip Connections.csv)
scripts/linkedin/ingest-export.sh /tmp/li-test/test.zip; echo "exit=$?"   # expect: "Positions.csv not found", exit=65
git status --short                                                           # expect: no output
rm -rf /tmp/li-test
```

**6. Turn the watcher on**:

```bash
mkdir -p ~/.config/systemd/user
cp scripts/linkedin/systemd/linkedin-export.path scripts/linkedin/systemd/linkedin-export.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now linkedin-export.path
sudo loginctl enable-linger linkedin-export   # run from your admin user; keeps it running without a login
```

From now on, a LinkedIn export in `/home/linkedin-export/Downloads` becomes a pull request with its `Positions.csv`
automatically. Review it and merge; Netlify publishes after the merge (and its build runs the unit tests first).

### Safety notes

- Only `data/linkedin/Positions.csv` is ever committed. The export ZIP and its other files never enter the repository.
- The machine can push only to branches, never to `master` (ruleset), and cannot touch workflows (token permissions).
  The workflow never executes code from the pushed branch; it only reads the CSV from it.
- The token is readable only by the `linkedin-export` user. If the machine is lost, revoke it at
  <https://github.com/settings/personal-access-tokens>.
- Do not automate logging in to LinkedIn; request and download the export yourself.

## Troubleshooting

- `journalctl --user -u linkedin-export.service -e` shows each run.
- Nothing happens after a download: `systemctl --user status linkedin-export.path`; check the ZIP name contains
  `LinkedInDataExport` and is in the watched folder.
- `has local changes`: someone edited the automation clone; `git -C ~/automation/murillossoares.com status`.
- `push ... failed`: the token expired or lost access; create a new one (step 3) and update `~/.git-credentials`.
- No pull request appears: check the **LinkedIn sync** run for the `linkedin-export/positions` push in the Actions tab.
- `failed validation`: the CSV has extra columns or contact data; open it from `~/Downloads/linkedin-export-failed/`.
- `skipped`: the export matched too few site positions (partial) or has unreadable dates. Re-run with `--force` only
  if the file is right.
