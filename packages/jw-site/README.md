# JW Site (Subtree Placeholder)

This directory reserves the logical package slot for the public / marketing / mixed Svelte/Astro site ("JW-Site") inside the AtlasIT monorepo.

## Current State

The actual JW-Site source still lives in a separate repository: `git@github.com:JW-Flo/JW-Site.git`.

We have **not** yet imported the codebase here. This placeholder enables:

- Monorepo scripts & workspace patterns to prepare for integration.
- A stable path (`packages/jw-site`) for future shared imports (e.g. `@atlasit/jw-site-auth`).

## Planned Integration (git subtree)

Recommended (preserves history without nested repo pitfalls):

```bash
# Add remote alias if not present
git remote add jw-site-origin git@github.com:JW-Flo/JW-Site.git

# One-time import (no squash keeps full history)
git subtree add --prefix=packages/jw-site jw-site-origin main

# Pull future updates
git subtree pull --prefix=packages/jw-site jw-site-origin main
```

If history size becomes a concern, you may add `--squash` (but future merges will always create synthetic commits).

## After Import – Follow-Up Tasks

1. Remove this placeholder README (replace with real project README).
2. Align `package.json` (name it `"@atlasit/jw-site"`, mark private).
3. Unify ESLint & TS configs (extend root `tsconfig.base.json`).
4. Extract duplicated auth/session code into `packages/auth` and refactor imports.
   - Replace local imports: `import { verifyJWT, sessionStore } from '@atlasit/auth'`.
   - Use `signUser()` / `verifyToken()` from `@atlasit/auth` for JWT flows.
5. Add build+deploy scripts: `build:jw-site`, `deploy:jw-site` in root package.
6. Add to `pnpm-workspace.yaml` if pattern not matching (already covered by `packages/*`).
7. Integrate e2e tests referencing both console & jw-site (Playwright multi-project).

## Alternative: git submodule (Not Recommended)

Submodules introduce extra CI steps (`git submodule update --init --recursive`) and are easy to forget. Subtrees are simpler for this use case.

## Rollback

Remove directory & commit:

```bash
git rm -r packages/jw-site
git commit -m "chore: remove jw-site placeholder"
```

## Questions

Open a discussion or issue in the main monorepo if integration blockers arise.
