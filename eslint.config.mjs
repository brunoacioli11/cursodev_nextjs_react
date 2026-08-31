import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier/flat";
//import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...nextVitals,
  prettier,
  //...nextTs,
  {
    files: ["**/*.test.js"],
    ...jest.configs["flat/recommended"],
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // TypeScript/JSX files are type-checked by tsc, not linted here.
    "**/*.tsx",
    "**/migration-test.js",
  ]),
]);

export default eslintConfig;
