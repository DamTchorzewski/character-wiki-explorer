// The quick search index: every character, episode and location by name.
import type { APIRoute } from "astro";
import { getWiki } from "../../lib/api";
import { searchIndex } from "../../lib/normalize";

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(searchIndex(await getWiki())), {
    headers: { "content-type": "application/json" },
  });
