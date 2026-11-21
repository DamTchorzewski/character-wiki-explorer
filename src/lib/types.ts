// Shapes of the public Rick and Morty API (only the fields the site reads) and of the slim data the site builds.

export type Status = "Alive" | "Dead" | "unknown";

export interface ApiPage<T> {
  info: { count: number; pages: number; next: string | null; prev: string | null };
  results: T[];
}

export interface ApiCharacter {
  id: number;
  name: string;
  status: Status;
  species: string;
  type: string;
  gender: string;
  origin: { name: string; url: string };
  location: { name: string; url: string };
  image: string;
  episode: string[];
}

export interface ApiEpisode {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: string[];
}

export interface ApiLocation {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: string[];
}

/** A link to a location; `id` is null when the API says "unknown". */
export interface PlaceRef {
  id: number | null;
  name: string;
}

export interface Character {
  id: number;
  name: string;
  status: Status;
  species: string;
  /** Sub-species or variant; empty when the API has none. */
  type: string;
  gender: string;
  origin: PlaceRef;
  location: PlaceRef;
  image: string;
  episodes: number[];
}

export interface Episode {
  id: number;
  name: string;
  /** ISO date (YYYY-MM-DD), parsed from the API's "December 2, 2013". */
  airDate: string;
  code: string;
  season: number;
  number: number;
  characters: number[];
}

export interface Location {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: number[];
}

export interface Wiki {
  characters: Character[];
  episodes: Episode[];
  locations: Location[];
}

/** One row of the character index the explorer filters in the browser. */
export interface CharacterRow {
  id: number;
  name: string;
  status: Status;
  species: string;
  gender: string;
  type: string;
  location: string;
  episodes: number;
}

/** One row of the location index. */
export interface LocationRow {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: number;
}

/** One entry of the quick search: c = character, e = episode, l = location. */
export interface SearchEntry {
  k: "c" | "e" | "l";
  id: number;
  n: string;
  s: string;
  /** Weight for equal matches: episodes of a character, cast of an episode, residents of a place. */
  w: number;
}
