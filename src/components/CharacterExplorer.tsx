// The character list: search by name, filters, sorting and pages, all in the browser over a static index
// (data/characters.json). The state lives in the URL, so a filtered list can be shared or bookmarked.
// The first page is in the HTML from the build; the index loads right after hydration.
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  EMPTY_QUERY,
  PAGE_SIZE,
  filterCharacters,
  pageCount,
  pageWindow,
  paginate,
  readQuery,
  writeQuery,
  type CharacterQuery,
  type CharacterSort,
} from "../lib/filter";
import type { CharacterRow } from "../lib/types";
import CharacterTile from "./CharacterTile";

interface Props {
  base: string;
  initial: CharacterRow[];
  total: number;
  species: { value: string; count: number }[];
  genders: string[];
}

const STATUSES = [
  { value: "", label: "Any" },
  { value: "Alive", label: "Alive" },
  { value: "Dead", label: "Dead" },
  { value: "unknown", label: "Unknown" },
];
const SORTS: { value: CharacterSort; label: string }[] = [
  { value: "id", label: "Order of the API" },
  { value: "name", label: "Name, A to Z" },
  { value: "episodes", label: "Most episodes" },
];
const numbers = new Intl.NumberFormat("en");
const plural = new Intl.PluralRules("en");

export default function CharacterExplorer({ base, initial, total, species, genders }: Props) {
  const [rows, setRows] = useState<CharacterRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState<CharacterQuery>(EMPTY_QUERY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredQ = useDeferredValue(query.q);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const panelId = useId();

  // read the URL once, then load the index
  useEffect(() => {
    // after hydration on purpose: the HTML from the build shows the unfiltered first page
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(readQuery(window.location.search));
    fetch(`${base}data/characters.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CharacterRow[]>) : Promise.reject(r.status)))
      .then(setRows)
      .catch(() => setFailed(true));
  }, [base]);

  // keep the URL in step with the filters
  useEffect(() => {
    const next = `${window.location.pathname}${writeQuery(query)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [query]);

  const filtered = useMemo(
    () => (rows ? filterCharacters(rows, { ...query, q: deferredQ }) : null),
    [rows, query, deferredQ],
  );
  const isDefault = writeQuery({ ...query, page: 1 }) === "";
  const count = filtered ? filtered.length : total;
  const pages = pageCount(count);
  const page = Math.min(query.page, pages);
  const shown = filtered ? paginate(filtered, page) : isDefault ? initial : [];
  const loading = !filtered && !isDefault && !failed;
  const activeFilters = [query.status, query.gender, query.species].filter(Boolean).length;

  function update(patch: Partial<CharacterQuery>) {
    setQuery((q) => ({ ...q, page: 1, ...patch }));
  }

  function goTo(p: number) {
    setQuery((q) => ({ ...q, page: p }));
    resultsHeading.current?.focus({ preventScroll: true });
    resultsHeading.current?.scrollIntoView({ block: "start" });
  }

  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);
  const noun = plural.select(count) === "one" ? "character" : "characters";
  const summary = loading
    ? "Loading the characters…"
    : count === 0
      ? "No characters match"
      : `${numbers.format(from)}–${numbers.format(to)} of ${numbers.format(count)} ${noun}`;

  return (
    <div className="explorer">
      <search className="explorer-search">
        <label className="search-box">
          <span className="visually-hidden">Search characters by name</span>
          <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search by name, e.g. Birdperson"
            autoComplete="off"
            spellCheck={false}
            value={query.q}
            onChange={(e) => update({ q: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="button filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls={panelId}
          onClick={() => setFiltersOpen((o) => !o)}
        >
          Filters{activeFilters > 0 && <span className="badge">{activeFilters}</span>}
        </button>
      </search>

      <div className="explorer-body">
        <aside
          id={panelId}
          className="filters"
          data-open={filtersOpen}
          aria-label="Filters and sorting"
        >
          <fieldset className="field">
            <legend>Status</legend>
            <div className="pills">
              {STATUSES.map((s) => (
                <label key={s.value} className="pill">
                  <input
                    type="radio"
                    name="status"
                    value={s.value}
                    checked={query.status === s.value}
                    onChange={() => update({ status: s.value })}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend>Gender</legend>
            <div className="pills">
              {["", ...genders].map((g) => (
                <label key={g} className="pill">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={query.gender === g}
                    onChange={() => update({ gender: g })}
                  />
                  <span>{g === "" ? "Any" : g === "unknown" ? "Unknown" : g}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Species</span>
            <select
              className="select"
              value={query.species}
              onChange={(e) => update({ species: e.target.value })}
            >
              <option value="">All species</option>
              {species.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value} ({numbers.format(s.count)})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Sort by</span>
            <select
              className="select"
              value={query.sort}
              onChange={(e) => update({ sort: e.target.value as CharacterSort })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="button reset"
            disabled={isDefault}
            onClick={() => setQuery(EMPTY_QUERY)}
          >
            Clear search and filters
          </button>
        </aside>

        <section className="results" aria-labelledby="results-heading" aria-busy={loading}>
          <h2 id="results-heading" className="results-heading" ref={resultsHeading} tabIndex={-1}>
            <span aria-live="polite">{summary}</span>
          </h2>

          {failed && (
            <p className="notice">
              The character index did not load, so search and filters are off. Reload the page to
              try again; the first {PAGE_SIZE} characters are shown below.
            </p>
          )}

          {count === 0 && filtered ? (
            <div className="empty">
              <p>
                Nobody in the multiverse fits all of these filters. Remove one, or search for part
                of a name.
              </p>
              <button type="button" className="button" onClick={() => setQuery(EMPTY_QUERY)}>
                Clear search and filters
              </button>
            </div>
          ) : (
            <ul className="tiles">
              {(failed ? initial : shown).map((c, i) => (
                <li key={c.id}>
                  <CharacterTile
                    base={base}
                    id={c.id}
                    name={c.name}
                    status={c.status}
                    species={c.species}
                    meta={
                      c.location === "unknown" ? "Last seen: unknown" : `Last seen: ${c.location}`
                    }
                    eager={i < 4}
                  />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && !failed && (
            <nav className="pagination" aria-label="Pages of characters">
              <button
                type="button"
                className="page-step"
                disabled={page <= 1}
                onClick={() => goTo(page - 1)}
              >
                Previous
              </button>
              <ol>
                {pageWindow(page, pages).map((p, i) =>
                  p === null ? (
                    <li key={`gap${i}`} className="gap" aria-hidden="true">
                      …
                    </li>
                  ) : (
                    <li key={p}>
                      <button
                        type="button"
                        aria-current={p === page ? "page" : undefined}
                        aria-label={`Page ${p}`}
                        onClick={() => goTo(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ),
                )}
              </ol>
              <button
                type="button"
                className="page-step"
                disabled={page >= pages}
                onClick={() => goTo(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
