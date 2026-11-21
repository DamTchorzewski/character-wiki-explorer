// The character index the explorer filters in the browser.
import type { APIRoute } from "astro";
import { getWiki } from "../../lib/api";
import { characterRow } from "../../lib/normalize";

export const GET: APIRoute = async () => {
  const { characters } = await getWiki();
  return new Response(JSON.stringify(characters.map(characterRow)), {
    headers: { "content-type": "application/json" },
  });
};
