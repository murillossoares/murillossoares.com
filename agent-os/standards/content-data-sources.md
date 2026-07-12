# Content and data sources

This site is intentionally data-driven.

Source-of-truth rules:

- UI copy and localized career history live in `src/messages/*.json`.
- persona, logs, and network-themed content live in `src/data/*.json`.
- components should tolerate partial or malformed content safely by applying local defaults at the boundary.

When updating content:

- preserve the existing shape of `careerHistory` entries unless a migration is planned
- keep locale files aligned when introducing new keys
- prefer enriching JSON payloads over hardcoding strings in TSX
- validate unknown input before assuming enum-like values such as job type or architecture type

For refactors, preserve compatibility with the current `src/messages/*.json` structure unless the change explicitly includes content/schema updates.
