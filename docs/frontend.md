# Front end

The look of the wiki and the decisions behind it, as of 2026-11-21. The data side is in
[architecture.md](architecture.md).

## Direction

A fan wiki of a show about portals, so the portal is the one loud element: it lives in the home hero and comes back
quietly as the ring around a character's portrait, the planet emblem of a location and the lens of the logo. Everything
around it is calm: a cool lab-grey page in the light theme, a teal night in the dark one, generous space, one display
face.

| Token (both themes in `src/styles/global.css`) | Light                           | Dark                  | Used for                            |
| ---------------------------------------------- | ------------------------------- | --------------------- | ----------------------------------- |
| `--bg`                                         | `#eef2ef`                       | `#0b1820`             | page                                |
| `--bg-raised`                                  | `#ffffff`                       | `#12232d`             | tiles, panels, inputs               |
| `--ink` / `--ink-soft`                         | `#0f1f29` / `#435460`           | `#e7f0ec` / `#a3b6b0` | text, secondary text                |
| `--accent`                                     | `#0b6e4f`                       | `#9be38a`             | links, counts, the episode code     |
| `--portal-a`, `-b`, `-c`                       | `#b6f03c`, `#2fd3c5`, `#0a8f6a` | same                  | portal fills and glows, never text  |
| `--alive`, `--dead`, `--unknown`               | green, red, grey                | lighter tints         | status dot, always next to the word |

Type: **Unbounded** (variable, wide geometric display) for headings and the giant episode code; **Hanken Grotesk**
(variable) for text and UI. Both are self-hosted `@fontsource-variable` files; the two Latin files the first screen
needs are preloaded. The theme follows `prefers-color-scheme`; the toggle stores a choice in `localStorage` and an
inline script applies it before the first paint.

## Logo

`src/components/Mark.astro`: a magnifying glass whose lens is a portal (a wiki that searches the multiverse). The ring
and the handle take the text colour, so the mark works on both themes; `public/favicon.svg` switches them with a
media query. Next to it, the name and a "Wiki" tag in portal green. It is the project's own drawing, not the show's
logo.

## The portal (home hero)

- **First paint:** an SVG spiral (tapered Archimedean arms generated at build time in `Portal.astro`) on a radial
  gradient, turned by a CSS animation on the compositor.
- **On the first pointer move, touch, key or scroll** `src/scripts/portal.ts` creates a WebGL context and draws a
  fragment shader over the same spot: noise-driven spiral arms, a soft living edge and a glow, leaning towards the
  pointer. The CSS spiral fades out under it.
- Cost control: the shader compiles with `KHR_parallel_shader_compile` (no long task), renders into a buffer below the
  screen resolution, only inside a scissor box around the portal, only while the hero is on screen and the tab is
  visible. A software renderer (no GPU) keeps the CSS spiral. With `prefers-reduced-motion: reduce` the shader draws one
  still frame and the CSS spiral does not turn.
- Six characters (portraits from the API) sit on the rim at fixed angles (`cos()` and `sin()` in CSS), drift slowly
  and move with the pointer at different depths. They are links to their pages, named for screen readers.
- Typing in the hero field shows the top six matches and hands the best character match out of the portal as a card.

## Accessibility (WCAG 2.2 AA)

- Skip link, one `<h1>` per page, landmarks, `aria-current` on the menu, labelled search fields, `role="status"` for
  result counts, `<dialog>` with `showModal()` for the quick search (combobox with `aria-activedescendant`).
- Visible `:focus-visible` outline of 3 px in the focus colour of each theme; targets of at least 24 px (44 px for the
  main controls).
- Status is a dot and a word, never colour alone. Every motion runs only with `prefers-reduced-motion: no-preference`.
- **Checked on 2026-11-21** with Playwright and `@axe-core/playwright` (tags `wcag2a` to `wcag22aa`) on every page
  template (home, characters, a character, episodes, an episode, locations, a location, 404) in light and dark, at
  1440 × 900 and 390 × 844: no violation, no console error (the CSP included), no horizontal scroll.

## Performance

- Static HTML for every page; React hydrates only the search islands (`client:idle` on the home page and in the
  header, `client:load` on the two explorers). The character index (`data/characters.json`, 14 kB compressed) loads
  after hydration.
- Portraits carry `width` and `height` (no layout shift) and load lazily after the first row.
- Lighthouse, mobile, on the local production build (2026-11-21): accessibility, best practices and SEO 100 on the
  home, character list and character pages; performance 88 to 98 with the simulated throttling (TBT 0 ms, CLS 0) and
  96 on the home page with DevTools throttling (LCP 2.1 s).
- The CSP (`astro.config.mjs`) is written into every page with the hash of each script; small assets are never inlined
  as `data:` URLs, so `font-src 'self'` holds.
