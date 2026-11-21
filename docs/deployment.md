# Deployment

The site is static (`pnpm build` writes `dist/`) and is published to GitHub Pages by `.github/workflows/deploy.yml`, at
<https://damtchorzewski.github.io/character-wiki-explorer/>. This is level 1 of the workflow standard: one workflow, no
schedule. How the data is built is in [architecture.md](architecture.md).

## What runs when

| Event             | What happens                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| push to `develop` | `pnpm check`, `pnpm build`; the build is kept as a downloadable artifact for 14 days; no deploy |
| push to `main`    | the same, then the build is published to GitHub Pages and `pnpm health` checks the live site    |
| run by hand       | Actions → Build & Deploy → Run workflow, from any branch (only `main` publishes)                |

A change to the documentation only (`*.md`, `docs/`, `LICENSE`, `.env.example`) starts nothing. Every build fetches the
API afresh (about ten requests, a few seconds); if the API is down, the build fails after four retries and the live site
stays as it was.

## Variables

| Name       | Kind     | Where                           | Required | Empty                                                             |
| ---------- | -------- | ------------------------------- | -------- | ----------------------------------------------------------------- |
| `SITE_URL` | variable | repository (custom domain only) | no       | the workflow uses the Pages address; locally a build for the root |

No secrets. The Pages environment `github-pages` accepts deployments from `main` only.

## Health check

`pnpm health` (`scripts/health.mjs`) requests the home page, the character list, one character, one episode, one
location, both JSON indexes (expects 200 and a known text) and a page that does not exist (expects 404). It is
read-only and has no dependencies: `SITE_URL=https://damtchorzewski.github.io/character-wiki-explorer/ pnpm health`.

## Local build

```bash
pnpm build && pnpm preview
```

Without `SITE_URL` the build is made for the root of a host. To test the project-page path, run
`SITE_URL=https://example.github.io/character-wiki-explorer/ pnpm build`.

## Pausing and rollback

Pause: Actions → Build & Deploy → ⋯ → Disable workflow. Rollback: revert the commit on a working branch and release
it the usual way, or re-run an earlier successful run of the workflow on `main`.

## Before 2026-11-21

The repository was a Create React App project published by `gh-pages` to the `master` branch (Pages source: branch
`master`). The Pages source is now **GitHub Actions**; the old `master` branch holds only the last CRA build and is no
longer used.
