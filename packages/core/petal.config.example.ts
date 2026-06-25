import type { PetalConfig } from "@petal/sdk"

// ─────────────────────────────────────────────────────────────────────────────
// petal.config.ts  —  Server-local configuration (never committed to git)
//
// Copy this file:  cp petal.config.example.ts petal.config.ts
// Or run:          petal setup
// ─────────────────────────────────────────────────────────────────────────────

const config: PetalConfig = {

  // ── Apps ───────────────────────────────────────────────────────────────────
  // Custom apps built with @petal/sdk. The Frappe workspace sidebar is loaded
  // automatically by Petal core — no entry needed here for it.
  //
  //   name     : internal identifier shown in error messages
  //   version  : used for cache-busting; bump when you deploy a new build
  //   url      : production URL of the compiled petal.hooks.js bundle
  //   devUrl   : local Vite preview URL used in development (optional)
  apps: [
    // {
    //   name:    "my-app",
    //   version: "0.0.1",
    //   url:     "https://cdn.example.com/my-app/petal.hooks.js",
    //   devUrl:  "http://localhost:5174/petal.hooks.js",
    // },
  ],

  // ── Theme ──────────────────────────────────────────────────────────────────
  //   primaryColor : any CSS color value (hex, hsl, rgb)
  theme: {
    primaryColor: "#16a34a",
  },

}

export default config
