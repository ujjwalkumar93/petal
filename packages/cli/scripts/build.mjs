/**
 * Build pipeline for @petal/cli:
 *   esbuild — bundle all TypeScript into a single minified CJS binary
 *
 * Run via: node scripts/build.mjs
 */
import { build } from "esbuild"

const OUT_FILE = "dist/index.js"

await build({
  entryPoints: ["src/index.ts"],
  bundle:      true,
  platform:    "node",
  target:      "node18",
  format:      "cjs",
  outfile:     OUT_FILE,
  external:    ["node:*"],
  banner:      { js: "#!/usr/bin/env node" },
  minify:      true,
})

console.log("  ✔ esbuild bundled + minified →", OUT_FILE)
