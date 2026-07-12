# Testing baseline

This repo uses a small but deliberate testing baseline.

Unit/component tests:

- use Vitest + Testing Library
- prioritize pure helpers such as career-history normalization, architecture inference, and stack filtering
- test stateful views through stable visible output, not animation internals

Smoke E2E tests:

- use Playwright for `/pt-br`, `/en`, `/es`, and the `cv-print` route
- prefer stable signals such as headings, buttons, comboboxes, and absence of uncaught page errors
- dismiss the boot sequence in tests with `Escape` instead of asserting frame-by-frame animation timing
- run smoke tests through `scripts/run-playwright.mjs`, which selects a free loopback port and keeps Playwright on the same hostname as `next dev`
- do not add `allowedDevOrigins` just for smoke tests when matching the Playwright host to the Next dev host removes the warning
- keep Playwright artifacts in `test-results/playwright/` and `playwright-report/`

Verification expectations for UI changes:

- `npm test`
- `npm run test:smoke`
- `npm run build`

Add deeper E2E coverage only when a change introduces a user flow that cannot be trusted from unit/component coverage plus smoke routes.
