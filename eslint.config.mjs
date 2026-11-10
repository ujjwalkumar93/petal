import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: "packages/core/" } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      // These eslint-plugin-react-hooks v7 rules check React Compiler
      // compatibility (no ref access or setState-in-effect during render, …).
      // Petal does not enable the compiler, and ~200 existing call sites rely
      // on these patterns. They stay visible as warnings and are tracked as
      // technical debt; promote them to "error" once the backlog is cleared.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    // CommonJS config/build scripts: require() is the module system here.
    files: ["**/*.js", "**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/.next-*/**",
    "**/.petal/**",
    "**/dist/**",
    "coverage/**",
    "**/next-env.d.ts",
  ]),
])
