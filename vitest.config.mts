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
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.*", "**/*.d.ts"],
    },
  },
})
