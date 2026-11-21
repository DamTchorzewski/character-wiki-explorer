// Build-time data: every character, episode and location of the public Rick and Morty API, fetched once per
// build (and cached for a day in node_modules/.cache, so `pnpm dev` does not refetch on every reload).
// The browser never calls the API for data; it only loads the portraits the API serves.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { toCharacter, toEpisode, toLocation } from "./normalize";
import type { ApiCharacter, ApiEpisode, ApiLocation, ApiPage, Wiki } from "./types";

export const API = "https://rickandmortyapi.com/api";
const CACHE_FILE = path.resolve("node_modules/.cache/rick-and-morty-wiki/wiki.json");
const CACHE_HOURS = 24;

async function getJson<T>(url: string, attempt = 1): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } }).catch(
    (error: unknown) => ({ ok: false, status: 0, error }) as const,
  );
  if (response.ok) return (await response.json()) as T;
  if (attempt >= 5) throw new Error(`Rick and Morty API: ${url} failed (HTTP ${response.status})`);
  // the API rate-limits bursts (429): wait 1, 2, 4, 8 s and try again
  await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  return getJson<T>(url, attempt + 1);
}

/** Every record of one resource: the count from the first page, then up to 200 ids per request. */
async function getAll<T>(resource: string): Promise<T[]> {
  const { info } = await getJson<ApiPage<T>>(`${API}/${resource}`);
  const ids = Array.from({ length: info.count }, (_, i) => i + 1);
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const batch = await getJson<T | T[]>(`${API}/${resource}/${ids.slice(i, i + 200).join(",")}`);
    out.push(...(Array.isArray(batch) ? batch : [batch]));
  }
  return out;
}

async function fetchWiki(): Promise<Wiki> {
  const [characters, episodes, locations] = await Promise.all([
    getAll<ApiCharacter>("character"),
    getAll<ApiEpisode>("episode"),
    getAll<ApiLocation>("location"),
  ]);
  const byId = <T extends { id: number }>(a: T, b: T) => a.id - b.id;
  return {
    characters: characters.map(toCharacter).sort(byId),
    episodes: episodes.map(toEpisode).sort(byId),
    locations: locations.map(toLocation).sort(byId),
  };
}

async function readCache(): Promise<Wiki | null> {
  try {
    const raw = JSON.parse(await readFile(CACHE_FILE, "utf8")) as { at: number; wiki: Wiki };
    return Date.now() - raw.at < CACHE_HOURS * 3_600_000 ? raw.wiki : null;
  } catch {
    return null;
  }
}

let pending: Promise<Wiki> | undefined;

/** The whole wiki, fetched once per process. */
export function getWiki(): Promise<Wiki> {
  pending ??= (async () => {
    const cached = await readCache();
    if (cached) return cached;
    const wiki = await fetchWiki();
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify({ at: Date.now(), wiki }));
    return wiki;
  })();
  return pending;
}
