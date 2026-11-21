# Architecture

How the wiki turns the public Rick and Morty API into a static site. The visual side is in
[frontend.md](frontend.md), publishing in [deployment.md](deployment.md).

## From the API to pages

```
rickandmortyapi.com ──build──▶ src/lib/api.ts ──▶ Wiki { characters, episodes, locations }
                                   │                         │
                                   │                         ├─▶ pages/*.astro       1,008 HTML pages
                                   │                         └─▶ pages/data/*.json   indexes for the browser
                                   └─ node_modules/.cache/character-wiki-explorer/wiki.json (one day)
```

- `getWiki()` (`src/lib/api.ts`) asks each resource for its count, then fetches the records in batches of 200 ids
  (`/character/1,2,…`): about ten requests for the whole API instead of 52 pages, which stays clear of its rate limit.
  A failed request is retried four times with a growing pause (1, 2, 4, 8 s); a build that still fails stops with the
  URL in the message.
- The result is mapped by `src/lib/normalize.ts` to slim types (`src/lib/types.ts`): ids instead of URLs, an ISO air
  date, the season and number from the episode code. Only the fields the pages use are kept.
- A process fetches once (`getWiki` keeps the promise); `pnpm dev` and local builds reuse a cache file for 24 hours.
  CI has no cache, so every release has the API's current data.

## Pages

| Route               | Built from                          | Interactive part                                        |
| ------------------- | ----------------------------------- | ------------------------------------------------------- |
| `/`                 | top characters, seasons, locations  | `HeroSearch` (React), the WebGL portal script           |
| `/characters/`      | the first 24 characters in the HTML | `CharacterExplorer` (React) over `data/characters.json` |
| `/characters/[id]/` | one character and its episodes      | none                                                    |
| `/episodes/`        | all episodes by season              | none                                                    |
| `/episodes/[id]/`   | one episode and its cast            | none                                                    |
| `/locations/`       | all 126 locations as props          | `LocationExplorer` (React)                              |
| `/locations/[id]/`  | one location and its residents      | none                                                    |
| `/404.html`         | static                              | none                                                    |

Every page has the header with `QuickSearch` (React, hydrated when the browser is idle), which loads
`data/search.json` on its first opening only.

## Search and filters in the browser

`src/lib/filter.ts` is shared by the build and the islands, so the HTML the build writes and the first render after
hydration are the same (no hydration mismatch). The explorers read the URL after hydration and keep it in step with
`history.replaceState`, so a filtered list can be shared and the back button leaves the page.

| Index                  | Rows  | Fields                                                                |
| ---------------------- | ----- | --------------------------------------------------------------------- |
| `data/characters.json` | 826   | id, name, status, species, gender, type, last location, episode count |
| `data/search.json`     | 1,003 | kind, id, name, subtitle, weight (episodes, cast or residents)        |

Quick search ranks names that start with the text first, then a word start, then anything else; equal matches are
ordered by weight, so "rick" finds Rick Sanchez before Rick D-99.

## Images

Portraits are `<img>` elements pointing at the API's own files (`/api/character/avatar/<id>.jpeg`, 300 × 300,
`Cache-Control: max-age=7776000`). They carry `width` and `height`, load lazily below the first row and are allowed by
`img-src https://rickandmortyapi.com` in the CSP. Nothing from the show is stored in this repository.
