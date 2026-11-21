// Dates, numbers, plurals and links, all through Intl and the site's base path.

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });
const numberFormat = new Intl.NumberFormat("en");
const plural = new Intl.PluralRules("en");

/** "2013-12-02" → "December 2, 2013"; anything else is returned as it is. */
export function formatDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? dateFormat.format(new Date(`${iso}T00:00:00Z`)) : iso;
}

export function year(iso: string): string {
  return iso.slice(0, 4);
}

/** 1 → "1 episode", 51 → "51 episodes". */
export function count(n: number, one: string, other = `${one}s`): string {
  return `${numberFormat.format(n)} ${plural.select(n) === "one" ? one : other}`;
}

export function number(n: number): string {
  return numberFormat.format(n);
}

/** "unknown" from the API reads as "Unknown" on the page. */
export function label(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : "Unknown";
}

/** A link inside the site, with the base path (GitHub Pages serves the site under /<repo>/). */
export function href(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return base + path.replace(/^\//, "");
}

export const avatar = (id: number) => `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`;
