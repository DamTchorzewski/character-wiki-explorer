# Repository: name, description and topics

What is set in GitHub by hand, because it cannot live in the repository files. Project overview: [README](../README.md).

## Name

Standard for repository names: `reops/standards/repo-names.md`. The repository was called `Rick-and-Morty-Wiki` (a
Create React App course project) until 2026-11-21. It was renamed `rick-and-morty-wiki`, the phrase a developer would
search for (rule 4), and rebuilt with Astro and a new design. GitHub redirects the old clone address, but **the GitHub
Pages address changed** to `https://damtchorzewski.github.io/rick-and-morty-wiki/`; the old
`/Rick-and-Morty-Wiki/` address no longer serves the site.

## Description and topics (About)

GitHub: the repository page → ⚙ next to "About". The description has a limit of 350 characters; topics are lower case with
hyphens, at most 20.

**Description:**

```text
An unofficial Rick and Morty wiki built with Astro and React: every character, episode and location of the Rick and Morty API as fast static pages, with instant search, filters, a WebGL portal and light and dark themes.
```

**Website:**

```text
https://damtchorzewski.github.io/rick-and-morty-wiki/
```

**Topics:**

```text
rick-and-morty rick-and-morty-api wiki fan-site astro react typescript webgl static-site search accessibility wcag dark-mode responsive-design github-pages front-end
```

The same with the GitHub CLI:

```bash
gh repo edit DamTchorzewski/rick-and-morty-wiki --homepage "https://damtchorzewski.github.io/rick-and-morty-wiki/" --description "An unofficial Rick and Morty wiki built with Astro and React: every character, episode and location of the Rick and Morty API as fast static pages, with instant search, filters, a WebGL portal and light and dark themes." --add-topic rick-and-morty --add-topic rick-and-morty-api --add-topic wiki --add-topic fan-site --add-topic astro --add-topic react --add-topic typescript --add-topic webgl --add-topic static-site --add-topic search --add-topic accessibility --add-topic wcag --add-topic dark-mode --add-topic responsive-design --add-topic github-pages --add-topic front-end
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
