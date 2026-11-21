import { describe, expect, it } from "vitest";
import {
  EMPTY_QUERY,
  facet,
  filterCharacters,
  filterLocations,
  fold,
  pageWindow,
  paginate,
  rankSearch,
  readQuery,
  writeQuery,
} from "../src/lib/filter";
import { count, formatDate, label } from "../src/lib/format";
import { idFromUrl, isoDate, parseCode, toCharacter, toEpisode } from "../src/lib/normalize";
import type { CharacterRow, LocationRow, SearchEntry } from "../src/lib/types";

const row = (id: number, name: string, extra: Partial<CharacterRow> = {}): CharacterRow => ({
  id,
  name,
  status: "Alive",
  species: "Human",
  gender: "Male",
  type: "",
  location: "Earth",
  episodes: 1,
  ...extra,
});

describe("normalize", () => {
  it("reads the id at the end of an API URL", () => {
    expect(idFromUrl("https://rickandmortyapi.com/api/location/3")).toBe(3);
    expect(idFromUrl("")).toBeNull();
  });

  it("turns the API air date into an ISO date", () => {
    expect(isoDate("December 2, 2013")).toBe("2013-12-02");
    expect(isoDate("sometime")).toBe("sometime");
  });

  it("splits an episode code into season and number", () => {
    expect(parseCode("S03E07")).toEqual({ season: 3, number: 7 });
    expect(parseCode("pilot")).toEqual({ season: 0, number: 0 });
  });

  it("maps a character with unknown origin to a null place id", () => {
    const c = toCharacter({
      id: 1,
      name: "Rick Sanchez",
      status: "Alive",
      species: "Human",
      type: "",
      gender: "Male",
      origin: { name: "unknown", url: "" },
      location: { name: "Citadel of Ricks", url: "https://rickandmortyapi.com/api/location/3" },
      image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
      episode: [
        "https://rickandmortyapi.com/api/episode/1",
        "https://rickandmortyapi.com/api/episode/2",
      ],
    });
    expect(c.origin).toEqual({ id: null, name: "unknown" });
    expect(c.location.id).toBe(3);
    expect(c.episodes).toEqual([1, 2]);
  });

  it("maps an episode with its season and cast ids", () => {
    const e = toEpisode({
      id: 28,
      name: "The Ricklantis Mixup",
      air_date: "September 10, 2017",
      episode: "S03E07",
      characters: ["https://rickandmortyapi.com/api/character/1"],
    });
    expect(e).toMatchObject({ airDate: "2017-09-10", season: 3, number: 7, characters: [1] });
  });
});

describe("filter", () => {
  const rows = [
    row(1, "Rick Sanchez", { episodes: 51 }),
    row(2, "Morty Smith", { episodes: 51 }),
    row(3, "Abradolf Lincler", { status: "Dead", episodes: 2 }),
    row(4, "Señor Rick", { species: "Alien", gender: "unknown" }),
  ];

  it("folds case and accents", () => {
    expect(fold("  Señor ")).toBe("senor");
  });

  it("searches by name and filters by status, species and gender", () => {
    const by = (patch: object) =>
      filterCharacters(rows, { ...EMPTY_QUERY, ...patch }).map((r) => r.id);
    expect(by({ q: "rick" })).toEqual([1, 4]);
    expect(by({ q: "senor" })).toEqual([4]);
    expect(by({ status: "Dead" })).toEqual([3]);
    expect(by({ species: "Alien", gender: "unknown" })).toEqual([4]);
  });

  it("sorts by name and by episodes", () => {
    const sorted = (sort: "name" | "episodes") =>
      filterCharacters(rows, { ...EMPTY_QUERY, sort }).map((r) => r.id);
    expect(sorted("name")).toEqual([3, 2, 1, 4]);
    expect(sorted("episodes")).toEqual([1, 2, 3, 4]);
  });

  it("pages and clamps the page number", () => {
    const list = Array.from({ length: 50 }, (_, i) => i);
    expect(paginate(list, 1, 24)).toHaveLength(24);
    expect(paginate(list, 3, 24)).toEqual([48, 49]);
    expect(paginate(list, 99, 24)).toEqual([48, 49]);
  });

  it("shows a window of page numbers with gaps", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(1, 35)).toEqual([1, 2, 3, 4, null, 35]);
    expect(pageWindow(18, 35)).toEqual([1, null, 17, 18, 19, null, 35]);
    expect(pageWindow(35, 35)).toEqual([1, null, 32, 33, 34, 35]);
  });

  it("counts facet values, most common first", () => {
    expect(facet(rows, (r) => r.species)).toEqual([
      { value: "Human", count: 3 },
      { value: "Alien", count: 1 },
    ]);
  });

  it("round-trips the query through the URL and ignores bad values", () => {
    const q = { ...EMPTY_QUERY, q: "rick", status: "Dead", sort: "name" as const, page: 2 };
    expect(writeQuery(q)).toBe("?q=rick&status=Dead&sort=name&page=2");
    expect(readQuery(writeQuery(q))).toEqual(q);
    expect(readQuery("?sort=bogus&page=-3")).toEqual(EMPTY_QUERY);
    expect(writeQuery(EMPTY_QUERY)).toBe("");
  });

  it("filters locations by name, dimension and type", () => {
    const places: LocationRow[] = [
      { id: 1, name: "Earth (C-137)", type: "Planet", dimension: "Dimension C-137", residents: 27 },
      {
        id: 3,
        name: "Citadel of Ricks",
        type: "Space station",
        dimension: "unknown",
        residents: 101,
      },
    ];
    expect(filterLocations(places, "c-137", "").map((l) => l.id)).toEqual([1]);
    expect(filterLocations(places, "", "Space station").map((l) => l.id)).toEqual([3]);
  });

  it("ranks quick search: start of name, then word start, then the better known", () => {
    const entries: SearchEntry[] = [
      { k: "c", id: 8, n: "Adjudicator Rick", s: "Human", w: 1 },
      { k: "c", id: 1, n: "Rick Sanchez", s: "Human", w: 51 },
      { k: "c", id: 9, n: "Rick D-99", s: "Human", w: 1 },
      { k: "l", id: 3, n: "Citadel of Ricks", s: "Space station", w: 101 },
      { k: "e", id: 5, n: "Meeseeks and Destroy", s: "S01E05", w: 20 },
    ];
    expect(rankSearch(entries, "rick").map((e) => e.id)).toEqual([1, 9, 3, 8]);
    expect(rankSearch(entries, " ")).toEqual([]);
  });
});

describe("format", () => {
  it("formats dates and plurals through Intl", () => {
    expect(formatDate("2013-12-02")).toBe("December 2, 2013");
    expect(count(1, "episode")).toBe("1 episode");
    expect(count(1200, "character")).toBe("1,200 characters");
    expect(label("unknown")).toBe("Unknown");
  });
});
