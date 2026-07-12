# UI component boundaries

Use this repo's UI as a layered system:

- Keep route-level containers and top-level components thin.
- Put data normalization, inference, and filtering logic in pure helper modules that are easy to unit test.
- Let stateful view components orchestrate selection and layout, but pass translated copy in through props instead of pulling translation hooks deep into the tree.
- Extract large visual sections into focused subcomponents once a file mixes layout, state, and data shaping.

Current local convention:

- `src/components/Dashboard.tsx` is a container that reads `next-intl` messages and builds view props.
- `src/components/dashboard/*` holds Dashboard-specific helpers and presentational sections.
- Shared site-wide controls such as theme/language/download stay in `src/components/` unless they become dashboard-only.

Avoid in this repo:

- hardcoding translated UI strings inside presentational subcomponents
- embedding data normalization inside large JSX trees
- broad redesigns during refactors that are meant to preserve the current visual experience
