import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist", ".astro", ".scratch", "node_modules"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  // accessibility rules for the Astro templates and the React islands
  astro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.tsx"],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
