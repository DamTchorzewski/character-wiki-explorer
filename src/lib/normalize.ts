// Pure mappers from the API shapes to the site's slim data. No network here, so they are unit-tested.
import type {
  ApiCharacter,
  ApiEpisode,
  ApiLocation,
  Character,
  CharacterRow,
  Episode,
  Location,
  LocationRow,
  PlaceRef,
  SearchEntry,
  Wiki,
} from "./types";

/** The numeric id at the end of an API resource URL, or null for an empty URL. */
export function idFromUrl(url: string): number | null {
  const match = /\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : null;
}

function ids(urls: string[]): number[] {
  return urls.map(idFromUrl).filter((id): id is number => id !== null);
}

function place(ref: { name: string; url: string }): PlaceRef {
  return { id: idFromUrl(ref.url), name: ref.name };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "December 2, 2013" → "2013-12-02"; an unknown format is returned as it is. */
export function isoDate(apiDate: string): string {
  const match = /^([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(apiDate.trim());
  if (!match) return apiDate;
  const month = MONTHS.indexOf(match[1]) + 1;
  if (month === 0) return apiDate;
  return `${match[3]}-${String(month).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

/** "S03E07" → { season: 3, number: 7 }. */
export function parseCode(code: string): { season: number; number: number } {
  const match = /^S(\d+)E(\d+)$/i.exec(code.trim());
  return match ? { season: Number(match[1]), number: Number(match[2]) } : { season: 0, number: 0 };
}

export function toCharacter(c: ApiCharacter): Character {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    species: c.species,
    type: c.type,
    gender: c.gender,
    origin: place(c.origin),
    location: place(c.location),
    image: c.image,
    episodes: ids(c.episode),
  };
}

export function toEpisode(e: ApiEpisode): Episode {
  const { season, number } = parseCode(e.episode);
  return {
    id: e.id,
    name: e.name,
    airDate: isoDate(e.air_date),
    code: e.episode,
    season,
    number,
    characters: ids(e.characters),
  };
}

export function toLocation(l: ApiLocation): Location {
  return {
    id: l.id,
    name: l.name,
    type: l.type,
    dimension: l.dimension,
    residents: ids(l.residents),
  };
}

export function characterRow(c: Character): CharacterRow {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    species: c.species,
    gender: c.gender,
    type: c.type,
    location: c.location.name,
    episodes: c.episodes.length,
  };
}

export function locationRow(l: Location): LocationRow {
  return {
    id: l.id,
    name: l.name,
    // a few places have no type; "unknown" keeps them apart from the "All types" option
    type: l.type || "unknown",
    dimension: l.dimension,
    residents: l.residents.length,
  };
}

export function searchIndex(wiki: Wiki): SearchEntry[] {
  return [
    ...wiki.characters.map((c): SearchEntry => ({
      k: "c",
      id: c.id,
      n: c.name,
      s: c.species,
      w: c.episodes.length,
    })),
    ...wiki.episodes.map((e): SearchEntry => ({
      k: "e",
      id: e.id,
      n: e.name,
      s: e.code,
      w: e.characters.length,
    })),
    ...wiki.locations.map((l): SearchEntry => ({
      k: "l",
      id: l.id,
      n: l.name,
      s: l.type,
      w: l.residents.length,
    })),
  ];
}
