// Search across characters, episodes and locations from any page: the header button or Ctrl/⌘ + K opens a
// dialog with a combobox. The index (search.json) loads on the first open only.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { rankSearch } from "../lib/filter";
import type { SearchEntry } from "../lib/types";

interface Props {
  base: string;
}

const KIND = { c: "Character", e: "Episode", l: "Location" } as const;
const PATH = { c: "characters", e: "episodes", l: "locations" } as const;

export default function QuickSearch({ base }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [mac, setMac] = useState(false);
  const listId = useId();
  const titleId = useId();

  const results = useMemo(() => (index ? rankSearch(index, q) : []), [index, q]);
  const link = (e: SearchEntry) => `${base}${PATH[e.k]}/${e.id}/`;

  async function open() {
    dialog.current?.showModal();
    input.current?.focus();
    if (index) return;
    try {
      const response = await fetch(`${base}data/search.json`);
      if (!response.ok) throw new Error(String(response.status));
      setIndex((await response.json()) as SearchEntry[]);
    } catch {
      setFailed(true);
    }
  }

  useEffect(() => {
    // the shortcut label depends on the browser, so it is set after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!dialog.current?.open) void open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // open() only reads refs and state setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      window.location.assign(link(results[active]));
    }
  }

  // a click on the backdrop (outside the panel) closes the dialog
  function onDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialog.current) dialog.current.close();
  }

  const status = failed
    ? "The search index did not load. Check the connection and open the search again."
    : !index
      ? "Loading the index…"
      : q.trim() && !results.length
        ? `Nothing matches “${q.trim()}”. Try part of a name, such as “Rick” or “Citadel”.`
        : "";

  return (
    <>
      <button type="button" className="qs-trigger" onClick={() => void open()}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m13 13 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="qs-label">Search</span>
        <kbd aria-hidden="true">{mac ? "⌘" : "Ctrl"} K</kbd>
      </button>

      {/* the backdrop click is a mouse extra; Escape and the Close button close it too */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialog}
        className="qs-dialog"
        aria-labelledby={titleId}
        onClick={onDialogClick}
        onClose={() => setQ("")}
      >
        <div className="qs-panel">
          <h2 id={titleId} className="visually-hidden">
            Search the wiki
          </h2>
          <div className="qs-field">
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={input}
              type="search"
              role="combobox"
              aria-label="Name of a character, episode or location"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              placeholder="Character, episode or location"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
            />
            <button type="button" className="qs-close" onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>

          <ul id={listId} role="listbox" aria-label="Results" className="qs-results">
            {results.map((entry, i) => (
              // keys go to the combobox input (arrows, Enter); the click is the mouse path
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={`${entry.k}${entry.id}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => window.location.assign(link(entry))}
              >
                {entry.k === "c" ? (
                  <img
                    src={`https://rickandmortyapi.com/api/character/avatar/${entry.id}.jpeg`}
                    alt=""
                    width="40"
                    height="40"
                    loading="lazy"
                  />
                ) : (
                  <span className={`qs-glyph qs-${entry.k}`} aria-hidden="true">
                    {entry.k === "e" ? (
                      <>
                        <span>{entry.s.slice(0, 3)}</span>
                        <span>{entry.s.slice(3)}</span>
                      </>
                    ) : (
                      <svg viewBox="0 0 20 20" width="20" height="20">
                        <circle cx="10" cy="10" r="5" fill="currentColor" />
                        <ellipse
                          cx="10"
                          cy="10"
                          rx="9"
                          ry="3.2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          transform="rotate(-20 10 10)"
                        />
                      </svg>
                    )}
                  </span>
                )}
                <span className="qs-text">
                  <span className="qs-name">{entry.n}</span>
                  <span className="qs-sub">
                    {KIND[entry.k]}, {entry.s || "unknown"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="qs-status" role="status">
            {status}
          </p>
          <p className="qs-hint" aria-hidden="true">
            <kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>Enter</kbd> to open, <kbd>Esc</kbd> to close
          </p>
        </div>
      </dialog>
    </>
  );
}
