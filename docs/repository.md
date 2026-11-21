# Repository: name, description and topics

What is set in GitHub by hand, because it cannot live in the repository files. Project overview: [README](../README.md).

## Name

Standard for repository names: `reops/standards/repo-names.md`. The repository was called `Rick-and-Morty-Wiki` (a
Create React App course project) until 2026-11-21. It was rebuilt with Astro and a new design and renamed, first to
`rick-and-morty-wiki` and on the same day to `character-wiki-explorer`: a description of what the project is and does
(rule 4), without the show's name, like the owner's other repositories. The site itself keeps the title "Rick and Morty
Wiki". GitHub redirects the old clone addresses, but **the GitHub Pages address changed each time**; the site is at
`https://damtchorzewski.github.io/character-wiki-explorer/` and the old `/Rick-and-Morty-Wiki/` and
`/rick-and-morty-wiki/` addresses no longer serve it.

## Description and topics (About)

GitHub: the repository page → ⚙ next to "About". The description has a limit of 350 characters; topics are lower case with
hyphens, at most 20.

**Description:**

```text
An unofficial Rick and Morty wiki built with Astro and React: every character, episode and location of the Rick and Morty API as fast static pages, with instant search, filters, a WebGL portal and light and dark themes.
```

**Website:**

```text
https://damtchorzewski.github.io/character-wiki-explorer/
```

**Topics:**

```text
rick-and-morty rick-and-morty-api wiki fan-site astro react typescript webgl static-site search accessibility wcag dark-mode responsive-design github-pages front-end
```

The same with the GitHub CLI:

```bash
gh repo edit DamTchorzewski/character-wiki-explorer --homepage "https://damtchorzewski.github.io/character-wiki-explorer/" --description "An unofficial Rick and Morty wiki built with Astro and React: every character, episode and location of the Rick and Morty API as fast static pages, with instant search, filters, a WebGL portal and light and dark themes." --add-topic rick-and-morty --add-topic rick-and-morty-api --add-topic wiki --add-topic fan-site --add-topic astro --add-topic react --add-topic typescript --add-topic webgl --add-topic static-site --add-topic search --add-topic accessibility --add-topic wcag --add-topic dark-mode --add-topic responsive-design --add-topic github-pages --add-topic front-end
```

## Settings (state on 2026-11-21)

Standard: `reops/standards/github-settings.md`.

| Where (GitHub)                           | Setting                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Settings → General → Pull Requests       | merge commits and rebase merging on, **squash merging off**, delete head branches off |
| Pull request creation                    | all users (public repository)                                                         |
| Settings → Pages                         | Source: **GitHub Actions** (published by `deploy.yml`)                                |
| Settings → Environments → `github-pages` | deployment branches: `main` only                                                      |
| Settings → Actions → General             | workflow permissions: read repository contents; fork pull requests need approval      |
| Settings → Code security                 | Dependabot alerts and security updates, secret scanning and push protection           |
| Default branch                           | `main`                                                                                |

No branch ruleset (decision of 2026-11-19, see the standard). The old `master` branch (the last Create React App build)
is kept until the owner deletes it.
