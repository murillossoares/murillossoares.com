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
- commits `data/linkedin/Positions.csv` and pushes it to `master` (Netlify rebuilds; the sync workflow opens a PR for
  new positions),
- deletes the ZIP (it holds private data). On failure the ZIP is moved to `~/Downloads/linkedin-export-failed/`.

## Filling months by hand instead

`data/linkedin/Positions.template.csv` lists the current positions with `MMM` placeholders. Replace each `MMM` with the
month as LinkedIn writes it (`Jan`, `Feb` … `Dec`; Portuguese and Spanish abbreviations also work, e.g. `fev`, `dic`),
replace `YYYY` in *Finished On* with the year, leave *Finished On* empty for the current role, save it as
`data/linkedin/Positions.csv`, commit and push. Days are never used. Until every `MMM` is filled the file is rejected,
so a half-filled template cannot reach the site.

## Setup on the mini PC

Run these once, in order. Steps 1–4 prepare access and a dedicated clone, step 5 tests safely, step 6 turns the
watcher on.

**1. Prerequisites** — git, unzip and Node.js 22.18 or newer:

```bash
sudo apt install -y git unzip
node --version   # 22.18+; if missing: curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && nvm install 22
```

**2. Write access limited to this repository** — a deploy key, not your personal credentials:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/murillossoares_deploy -N "" -C "mini-pc linkedin export"
cat ~/.ssh/murillossoares_deploy.pub
```

Add the printed key at <https://github.com/murillossoares/murillossoares.com/settings/keys> → **Add deploy key**, tick
**Allow write access**. Then:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-murillossoares
  HostName github.com
  User git
  IdentityFile ~/.ssh/murillossoares_deploy
  IdentitiesOnly yes
EOF
ssh -T github-murillossoares   # "successfully authenticated"
```

**3. Dedicated clone** — used only by the automation, never edited by hand:

```bash
git clone git@github-murillossoares:murillossoares/murillossoares.com.git ~/automation/murillossoares.com
cd ~/automation/murillossoares.com && npm ci
git config user.name "Murillo" && git config user.email "mhsscel@users.noreply.github.com"
```

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
sudo loginctl enable-linger "$USER"   # keeps it running without an open session
```

From now on, downloading a LinkedIn export on this machine publishes its `Positions.csv` automatically.

### Safety notes

- Only `data/linkedin/Positions.csv` is ever committed. The export ZIP and its other files never enter the repository.
- The deploy key can only reach this repository; revoke it in the repository settings if the machine is lost.
- Do not automate logging in to LinkedIn; request and download the export yourself.

## Troubleshooting

- `journalctl --user -u linkedin-export.service -e` shows each run.
- Nothing happens after a download: `systemctl --user status linkedin-export.path`; check the ZIP name contains
  `LinkedInDataExport` and is in the watched folder.
- `has local changes`: someone edited the automation clone; `git -C ~/automation/murillossoares.com status`.
- `failed validation`: the CSV has extra columns or contact data; open it from `~/Downloads/linkedin-export-failed/`.
- `skipped`: the export matched too few site positions (partial) or has unreadable dates. Re-run with `--force` only
  if the file is right.
