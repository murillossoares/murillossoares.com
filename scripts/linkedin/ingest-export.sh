#!/usr/bin/env bash
# Publishes the positions from a LinkedIn data-export ZIP to this repository.
#
#   scripts/linkedin/ingest-export.sh <LinkedInDataExport.zip> [--push] [--delete-zip] [--force]
#
# - Extracts ONLY Positions.csv. The rest of the archive (messages, connections, e-mail addresses, phone numbers)
#   is never written to disk outside the ZIP, never copied into the repo and never committed.
# - Validates the file with the same checks CI runs, previews the merge (dry run), then commits
#   data/linkedin/Positions.csv. With --push it pushes to $LINKEDIN_EXPORT_BRANCH (default: master), which triggers
#   the Netlify build and the LinkedIn sync workflow.
# - --delete-zip removes the archive after success, since it holds private data.
# - Meant for a dedicated clone: each run resets the branch to the remote state first, and a failed push drops the
#   local commit again, so one bad run never blocks the next. Unrelated local changes make it refuse to run.
set -euo pipefail

die() { echo "ingest-export: $1" >&2; exit "${2:-1}"; }

ZIP="${1:-}"
[ -n "$ZIP" ] && [ "${ZIP#--}" = "$ZIP" ] || die "usage: $0 <LinkedInDataExport.zip> [--push] [--delete-zip] [--force]" 64
shift
PUSH=0 DELETE_ZIP=0 FORCE=0
for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    --delete-zip) DELETE_ZIP=1 ;;
    --force) FORCE=1 ;;
    *) die "unknown option: $arg" 64 ;;
  esac
done
[ -f "$ZIP" ] || die "ZIP not found: $ZIP" 66
command -v unzip >/dev/null || die "unzip is not installed (sudo apt install unzip)" 69
node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=18)?0:1)' 2>/dev/null \
  || die "Node.js 22.18+ is required (found: $(node --version 2>/dev/null || echo none)); check PATH in ~/.config/linkedin-export.env" 69

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BRANCH="${LINKEDIN_EXPORT_BRANCH:-master}"
TARGET="data/linkedin/Positions.csv"
TMP="$(mktemp -d)"
chmod 700 "$TMP"
trap 'rm -rf "$TMP"' EXIT
cd "$REPO"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "$REPO is not a git clone of the site repository" 66

# 1. Extract only Positions.csv.
entry="$(unzip -Z1 "$ZIP" 2>/dev/null | grep -E '(^|/)Positions\.csv$' | head -n1 || true)"
[ -n "$entry" ] || die "Positions.csv not found in $ZIP (request the archive with 'Positions' selected)" 65
unzip -p "$ZIP" "$entry" > "$TMP/Positions.csv"
[ -s "$TMP/Positions.csv" ] || die "Positions.csv in $ZIP is empty" 65
if grep -qE '(^|,)"?(MMM|YYYY)\b' "$TMP/Positions.csv"; then
  die "Positions.csv still has MMM/YYYY template placeholders; fill in every month and year" 65
fi

# 2. Start from the latest remote state. A previous run that died mid-way may have left only our file changed.
if [ -z "$(git config user.email || true)" ]; then die "git user.email is not set in $REPO (git config user.email ...)" 78; fi
if ! git diff --quiet -- "$TARGET" || ! git diff --cached --quiet -- "$TARGET"; then
  git reset --quiet -- "$TARGET" && git checkout --quiet -- "$TARGET" 2>/dev/null || rm -f -- "$TARGET"
fi
git diff --quiet && git diff --cached --quiet || die "the repository at $REPO has local changes; use a dedicated clone" 75
git fetch --quiet origin "$BRANCH"
git checkout --quiet -B "$BRANCH" "origin/$BRANCH"

restore() { git reset --quiet -- "$TARGET" 2>/dev/null || true; git checkout --quiet -- "$TARGET" 2>/dev/null || rm -f -- "$TARGET"; }
trap 'restore; rm -rf "$TMP"' EXIT   # until the commit exists, any exit puts the file back
cp "$TMP/Positions.csv" "$TARGET"
if git diff --quiet -- "$TARGET" && git ls-files --error-unmatch "$TARGET" >/dev/null 2>&1; then
  echo "ingest-export: Positions.csv is unchanged; nothing to publish."
  [ "$DELETE_ZIP" = 1 ] && rm -f -- "$ZIP"
  exit 0
fi

# 3. Validate exactly as CI does (columns, readable dates, no contact data, only allowed files), then preview.
if ! npx --no-install vitest run scripts/linkedin/repo-file.test.ts >"$TMP/test.log" 2>&1; then
  cat "$TMP/test.log" >&2
  die "Positions.csv failed validation; nothing was committed" 65
fi
if ! preview="$(npm run -s linkedin:sync:file -- --dry-run 2>&1)"; then
  echo "$preview" >&2
  die "the sync preview failed to run; nothing was committed" 70
fi
echo "$preview"
if [ "$FORCE" != 1 ] && ! echo "$preview" | grep -qE '^## .*: (updated|unchanged)$'; then
  die "the sync preview did not accept this file (see above); nothing was committed. Re-run with --force to publish anyway" 65
fi

# 4. Commit (and push).
git add -- "$TARGET"
git commit --quiet -m "data(linkedin): update Positions.csv from LinkedIn export" -- "$TARGET"
trap 'rm -rf "$TMP"' EXIT
echo "ingest-export: committed $(git rev-parse --short HEAD)."
if [ "$PUSH" = 1 ]; then
  if ! git push --quiet origin "HEAD:$BRANCH"; then
    if ! { git pull --quiet --rebase origin "$BRANCH" && git push --quiet origin "HEAD:$BRANCH"; }; then
      # Drop the unpublished commit so the next run starts clean; the ZIP is kept for a retry.
      git rebase --abort 2>/dev/null || true
      git reset --quiet --hard "origin/$BRANCH"
      die "push to $BRANCH failed; nothing was published" 75
    fi
  fi
  echo "ingest-export: pushed to $BRANCH."
fi

if [ "$DELETE_ZIP" = 1 ]; then
  if command -v shred >/dev/null; then shred -u -- "$ZIP"; else rm -f -- "$ZIP"; fi
  echo "ingest-export: deleted $ZIP (it contains private data)."
fi
