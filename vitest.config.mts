import { defineConfig } from "vitest/config"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    // Exact matches for the package roots: subpaths ("@petal/ui/frappe-chart")
    // resolve through each package's "exports", like they do in the app.
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, "packages/core/src") + "/" },
      { find: /^@petal\/sdk$/, replacement: path.resolve(__dirname, "packages/sdk/src") },
      { find: /^@petal\/ui$/, replacement: path.resolve(__dirname, "packages/ui/src") },
    ],
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Component tests (.tsx) run in jsdom, the rest in Node. A .ts file can
    // still opt into jsdom with a `// @vitest-environment jsdom` comment.
    projects: [
      { extends: true, test: { name: "node", include: ["packages/*/src/**/*.test.ts"], environment: "node" } },
      { extends: true, test: { name: "dom", include: ["packages/*/src/**/*.test.tsx"], environment: "jsdom" } },
    ],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.*", "**/*.d.ts"],
      // CI gate (`pnpm test:coverage`): core must not slip below 60% of lines.
      thresholds: {
        "packages/core/src/**": { lines: 60 },
      },
    },
  },
})
