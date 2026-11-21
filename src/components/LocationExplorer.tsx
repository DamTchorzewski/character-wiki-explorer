// The location list: search by name or dimension and a filter by type. 126 rows, so they come as props and
// are all shown (no paging). The state lives in the URL (?q=…&type=…).
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { filterLocations } from "../lib/filter";
import type { LocationRow } from "../lib/types";

interface Props {
  base: string;
  rows: LocationRow[];
  types: { value: string; count: number }[];
}

const numbers = new Intl.NumberFormat("en");
const plural = new Intl.PluralRules("en");
const residents = (n: number) =>
  n === 0
    ? "No known residents"
    : `${numbers.format(n)} ${plural.select(n) === "one" ? "resident" : "residents"}`;

export default function LocationExplorer({ base, rows, types }: Props) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const deferred = useDeferredValue(q);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // after hydration on purpose: the HTML from the build shows every location
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(p.get("q") ?? "");
    setType(p.get("type") ?? "");
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (type) p.set("type", type);
    const s = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
  }, [q, type]);

  const shown = useMemo(() => filterLocations(rows, deferred, type), [rows, deferred, type]);
  const noun = plural.select(shown.length) === "one" ? "location" : "locations";

  return (
    <div className="explorer">
      <search className="explorer-search location-search">
        <label className="search-box">
          <span className="visually-hidden">Search locations by name or dimension</span>
          <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Name or dimension, e.g. C-137"
            autoComplete="off"
            spellCheck={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="type-select">
          <span className="visually-hidden">Type of location</span>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.value === "unknown" ? "Unknown type" : t.value} ({numbers.format(t.count)})
              </option>
            ))}
          </select>
        </label>
      </search>

      <section className="results" aria-labelledby="results-heading">
        <h2 id="results-heading" className="results-heading">
          <span aria-live="polite">
            {shown.length ? `${numbers.format(shown.length)} ${noun}` : "No locations match"}
          </span>
        </h2>
        {shown.length === 0 ? (
          <div className="empty">
            <p>No place by that name or dimension. Try a shorter part of the name, or all types.</p>
            <button
              type="button"
              className="button"
              onClick={() => {
                setQ("");
                setType("");
              }}
            >
              Clear search and type
            </button>
          </div>
        ) : (
          <ul className="places">
            {shown.map((l) => (
              <li key={l.id} className="place">
                <h3>
                  <a href={`${base}locations/${l.id}/`}>{l.name}</a>
                </h3>
                <p className="place-kind">
                  {l.type === "unknown" ? "Unknown type" : l.type}
                  <span className="place-dim">
                    {l.dimension === "unknown" ? "Unknown dimension" : l.dimension}
                  </span>
                </p>
                <p className="place-count">{residents(l.residents)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
