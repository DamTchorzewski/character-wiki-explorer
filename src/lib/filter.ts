// Search, filters, sorting and paging of the indexes. Shared by the build (first page in the HTML) and the
// browser (the explorers), so the first paint and the hydrated page show the same thing.
import type { CharacterRow, LocationRow, SearchEntry } from "./types";

export const PAGE_SIZE = 24;

export type CharacterSort = "id" | "name" | "episodes";

export interface CharacterQuery {
  q: string;
  status: string;
  gender: string;
  species: string;
  sort: CharacterSort;
  page: number;
}

export const EMPTY_QUERY: CharacterQuery = {
  q: "",
  status: "",
  gender: "",
  species: "",
  sort: "id",
  page: 1,
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/** Lower case without accents, so "Señor" matches "senor". */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function filterCharacters(rows: CharacterRow[], query: CharacterQuery): CharacterRow[] {
  const q = fold(query.q);
  const out = rows.filter(
    (r) =>
      (!q || fold(r.name).includes(q)) &&
      (!query.status || r.status === query.status) &&
      (!query.gender || r.gender === query.gender) &&
      (!query.species || r.species === query.species),
  );
  if (query.sort === "name") out.sort((a, b) => collator.compare(a.name, b.name) || a.id - b.id);
  else if (query.sort === "episodes") out.sort((a, b) => b.episodes - a.episodes || a.id - b.id);
  else out.sort((a, b) => a.id - b.id);
  return out;
}

export function pageCount(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

export function paginate<T>(rows: T[], page: number, size = PAGE_SIZE): T[] {
  const safe = Math.min(Math.max(1, page), pageCount(rows.length, size));
  return rows.slice((safe - 1) * size, safe * size);
}

/** Page numbers to show, with null for a gap: 1 … 4 5 6 … 35. */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

/** Distinct values of one field with their counts, most common first. */
export function facet<T>(rows: T[], pick: (row: T) => string): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(pick(row), (counts.get(pick(row)) ?? 0) + 1);
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || collator.compare(a.value, b.value));
}

/** URL query string ⇄ character query; unknown values fall back to the defaults. */
export function readQuery(search: string): CharacterQuery {
  const p = new URLSearchParams(search);
  const sort = p.get("sort");
  const page = Number(p.get("page"));
  return {
    q: p.get("q") ?? "",
    status: p.get("status") ?? "",
    gender: p.get("gender") ?? "",
    species: p.get("species") ?? "",
    sort: sort === "name" || sort === "episodes" ? sort : "id",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function writeQuery(query: CharacterQuery): string {
  const p = new URLSearchParams();
  if (query.q.trim()) p.set("q", query.q.trim());
  if (query.status) p.set("status", query.status);
  if (query.gender) p.set("gender", query.gender);
  if (query.species) p.set("species", query.species);
  if (query.sort !== "id") p.set("sort", query.sort);
  if (query.page > 1) p.set("page", String(query.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function filterLocations(rows: LocationRow[], q: string, type: string): LocationRow[] {
  const needle = fold(q);
  return rows.filter(
    (r) =>
      (!type || r.type === type) &&
      (!needle || fold(r.name).includes(needle) || fold(r.dimension).includes(needle)),
  );
}

/** Quick search: names that start with the text first, then a word start, then anywhere; among equal
 *  matches the better-known entry (more episodes, a bigger cast, more residents) comes first. */
export function rankSearch(entries: SearchEntry[], q: string, limit = 9): SearchEntry[] {
  const needle = fold(q);
  if (!needle) return [];
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of entries) {
    const name = fold(entry.n);
    const at = name.indexOf(needle);
    if (at < 0) continue;
    const score = at === 0 ? 0 : /\s|-|\(/.test(name[at - 1]) ? 1 : 2;
    scored.push({ entry, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || b.entry.w - a.entry.w || a.entry.id - b.entry.id)
    .slice(0, limit)
    .map((s) => s.entry);
}
