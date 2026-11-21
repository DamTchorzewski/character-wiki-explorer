// The home page search: one very large field that answers while you type, with characters, episodes and
// locations from the static index. Without JavaScript it is a plain form that opens the character list.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { rankSearch } from "../lib/filter";
import type { SearchEntry } from "../lib/types";

interface Props {
  base: string;
  /** Names the placeholder types out, one after another. */
  examples: string[];
  /** Number of characters, for the random pick. */
  total: number;
}

const KIND = { c: "Character", e: "Episode", l: "Location" } as const;
const PATH = { c: "characters", e: "episodes", l: "locations" } as const;

export default function HeroSearch({ base, examples, total }: Props) {
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [q, setQ] = useState("");
  const [placeholder, setPlaceholder] = useState(examples[0] ?? "");
  const loading = useRef(false);
  const statusId = useId();

  function load() {
    if (index || loading.current) return;
    loading.current = true;
    fetch(`${base}data/search.json`)
      .then((r) => (r.ok ? (r.json() as Promise<SearchEntry[]>) : Promise.reject(r.status)))
      .then(setIndex)
      .catch(() => (loading.current = false));
  }

  // the placeholder types each example out and erases it; one still example with reduced motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || examples.length < 2)
      return;
    let word = 0;
    let length = examples[0].length;
    let typing = false;
    let timer = 0;
    const tick = () => {
      const current = examples[word];
      if (typing) {
        length += 1;
        if (length >= current.length) {
          typing = false;
          setPlaceholder(current);
          timer = window.setTimeout(tick, 2200);
          return;
        }
      } else {
        length -= 1;
        if (length <= 0) {
          word = (word + 1) % examples.length;
          typing = true;
          length = 0;
        }
      }
      setPlaceholder(examples[word].slice(0, length));
      timer = window.setTimeout(tick, typing ? 80 : 35);
    };
    timer = window.setTimeout(tick, 2400);
    return () => window.clearTimeout(timer);
  }, [examples]);

  const results = useMemo(() => (index ? rankSearch(index, q, 6) : []), [index, q]);
  const typed = q.trim().length > 0;
  // the best character match comes out of the portal as a card
  const star = typed ? results.find((r) => r.k === "c") : undefined;
  const status = !typed
    ? ""
    : !index
      ? "Searching…"
      : results.length
        ? `${results.length === 6 ? "Top 6" : results.length} ${results.length === 1 ? "match" : "matches"}`
        : `Nothing matches “${q.trim()}”. Try part of a name.`;

  function random() {
    const id = 1 + Math.floor(Math.random() * total);
    window.location.assign(`${base}characters/${id}/`);
  }

  return (
    <div className="hero-search">
      <form action={`${base}characters/`} method="get" role="search" className="hero-form">
        <label htmlFor="hero-q" className="visually-hidden">
          Search characters, episodes and locations
        </label>
        <input
          id="hero-q"
          name="q"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-describedby={statusId}
          value={q}
          onFocus={load}
          onPointerEnter={load}
          onChange={(e) => {
            load();
            setQ(e.target.value);
          }}
        />
        <button type="submit" className="hero-go" aria-label="Search the character list">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <circle
              cx="10.5"
              cy="10.5"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            />
            <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      <p id={statusId} className="hero-status" role="status">
        {status}
      </p>

      {typed && results.length > 0 ? (
        <ul className="hero-results">
          {results.map((r) => (
            <li key={`${r.k}${r.id}`}>
              <a href={`${base}${PATH[r.k]}/${r.id}/`}>
                {r.k === "c" ? (
                  <img
                    src={`https://rickandmortyapi.com/api/character/avatar/${r.id}.jpeg`}
                    alt=""
                    width="56"
                    height="56"
                  />
                ) : (
                  <span className={`hero-glyph hero-glyph-${r.k}`} aria-hidden="true">
                    {r.k === "e" ? r.s.slice(3) : r.n.slice(0, 1)}
                  </span>
                )}
                <span className="hero-result-text">
                  <span className="hero-result-name">{r.n}</span>
                  <span className="hero-result-kind">
                    {KIND[r.k]}
                    {r.k === "e" ? `, ${r.s}` : r.s && r.s !== "unknown" ? `, ${r.s}` : ""}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        !typed && (
          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={random}>
              Open a portal to a random character
            </button>
            <a className="button" href={`${base}characters/`}>
              Browse all characters
            </a>
          </div>
        )
      )}

      {star && (
        // a mouse shortcut to the first character result, which the list above already links
        <a
          key={star.id}
          className="portal-card"
          href={`${base}characters/${star.id}/`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={`https://rickandmortyapi.com/api/character/avatar/${star.id}.jpeg`}
            alt=""
            width="300"
            height="300"
          />
          <span className="portal-card-name">{star.n}</span>
          <span className="portal-card-kind">{star.s}</span>
        </a>
      )}
    </div>
  );
}
