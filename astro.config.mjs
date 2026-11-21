// @ts-check
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// SITE_URL (set by the deploy workflow from the Pages settings) gives the origin and the base path,
// e.g. https://damtchorzewski.github.io/rick-and-morty-wiki/ → base "/rick-and-morty-wiki/".
const siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;

export default defineConfig({
  site: siteUrl?.origin,
  base: siteUrl?.pathname ?? "/",
  trailingSlash: "always",
  integrations: [react()],
  build: { inlineStylesheets: "never" },
  // no code blocks on the site; Shiki's inline styles would need a looser CSP
  markdown: { syntaxHighlight: false },
  // small font files stay files: a data: URL would break the strict font-src of the CSP
  vite: { build: { assetsInlineLimit: 0 } },
  security: {
    // A CSP <meta> on every page with the hash of each script and style Astro writes.
    // GitHub Pages cannot send headers, so this is the policy the browser enforces.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://rickandmortyapi.com",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
      // the portal and the bars set a custom property in a style attribute; no inline <style> or script
      styleDirective: { resources: [{ resource: "'unsafe-inline'", kind: "attribute" }] },
    },
  },
});
