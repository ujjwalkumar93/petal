import { existsSync, writeFileSync } from "fs"
import { join } from "path"
import prompts from "prompts"
import pc from "picocolors"
import { findPetalCoreDir } from "../lib/apps-config"

export async function setupPetal(): Promise<void> {
  const coreDir = findPetalCoreDir()
  if (!coreDir) {
    console.error(pc.red("\n  ✖ Could not find a Petal core directory. Run from inside your petal monorepo.\n"))
    process.exit(1)
  }
  const configPath  = join(coreDir, "petal.config.ts")
  const envPath     = join(coreDir, ".env.local")
  const composePath = join(coreDir, "docker-compose.yml")
  const appsPath    = join(coreDir, "petal.apps.json")

  const alreadyExists = existsSync(configPath) || existsSync(envPath)
  if (alreadyExists) {
    console.log(pc.yellow("\n  ⚠  petal.config.ts or .env.local already exists."))
    const { overwrite } = await prompts(
      { type: "confirm", name: "overwrite", message: "Overwrite with new settings?", initial: false },
      { onCancel: () => process.exit(0) },
    )
    if (!overwrite) { console.log(pc.dim("  Aborted.\n")); process.exit(0) }
  }

  console.log(`\n  ${pc.bold(pc.green("◆"))} ${pc.bold("petal setup")} ${pc.dim("— configure your Petal installation")}\n`)

  const main = await prompts(
    [
      {
        type: "text",
        name: "backendUrl",
        message: "Frappe backend URL (internal server-side address)",
        initial: "http://127.0.0.1:8000",
      },
      {
        type: "text",
        name: "site",
        message: "Frappe site hostname (e.g. billing.local)",
        initial: "localhost",
      },
      {
        type: "text",
        name: "primaryColor",
        message: "Primary brand color (hex)",
        initial: "#16a34a",
      },
      {
        type: "text",
        name: "petalPort",
        message: "Port to run Petal on",
        initial: "3000",
      },
    ],
    { onCancel: () => process.exit(0) },
  )

  // ── petal.config.ts ──────────────────────────────────────────────────────
  // Apps are NOT stored here — they go in petal.apps.json (managed by `petal app add`).
  // This file is gitignored; it only holds theme. Backend URL lives in .env.local.
  const petalConfigContent =
`import type { PetalConfig } from "@petal/sdk"

// Theme only — backend URL is in .env.local, apps are in petal.apps.json
// Run \`petal app add\` to register custom apps (no rebuild needed).
const config: PetalConfig = {
  apps: [],
  theme: {
    primaryColor: "${main.primaryColor}",
  },
}

export default config
`

  // ── .env.local ────────────────────────────────────────────────────────────
  const envContent =
`# Frappe Backend — server-side only, never sent to the browser
FRAPPE_INTERNAL_URL=${main.backendUrl}
NEXT_PUBLIC_FRAPPE_SITE=${main.site}

# Frontend
NEXT_PUBLIC_FRONTEND_URL=http://localhost:${main.petalPort}
NEXT_PUBLIC_APP_NAME=Petal Enterprise
NEXT_PUBLIC_APP_VERSION=1.0.0
`

  // ── docker-compose.yml ────────────────────────────────────────────────────
  const composeContent =
`services:
  petal:
    image: ghcr.io/petalframework/petal:latest
    ports:
      - "${main.petalPort}:3000"
    env_file:
      - .env.local
    environment:
      # Override PETAL_APPS here for Docker deployments (no petal.apps.json needed).
      # Format: JSON array — same schema as petal.apps.json
      # PETAL_APPS: '[{"name":"my-app","version":"1.0.0","url":"https://cdn.example.com/my-app/petal.hooks.js"}]'
    restart: unless-stopped
`

  // ── petal.apps.json ───────────────────────────────────────────────────────
  // Only create if it doesn't exist — preserve any apps already registered.
  const appsContent = "[\n]\n"

  writeFileSync(configPath,  petalConfigContent)
  writeFileSync(envPath,     envContent)
  writeFileSync(composePath, composeContent)
  if (!existsSync(appsPath)) {
    writeFileSync(appsPath, appsContent)
  }

  console.log(`\n  ${pc.green("✓")} Created ${pc.cyan("petal.config.ts")}   ${pc.dim("(gitignored — theme)")}`)
  console.log(`  ${pc.green("✓")} Created ${pc.cyan(".env.local")}         ${pc.dim("(gitignored — secrets)")}`)
  console.log(`  ${pc.green("✓")} Created ${pc.cyan("docker-compose.yml")}`)
  if (!existsSync(appsPath)) {
    console.log(`  ${pc.green("✓")} Created ${pc.cyan("petal.apps.json")}    ${pc.dim("(gitignored — registered apps)")}`)
  }

  console.log(`\n  ${pc.bold("Start Petal:")}\n`)
  console.log(`  ${pc.cyan("petal start")}            ${pc.dim("# dev mode on :" + main.petalPort)}`)
  console.log(`  ${pc.cyan("petal start --prod")}     ${pc.dim("# production mode (after petal build)")}`)

  console.log(`\n  ${pc.bold("Register custom apps:")}\n`)
  console.log(`  ${pc.cyan("petal create my-app")}    ${pc.dim("# scaffold + auto-register")}`)
  console.log(`  ${pc.cyan("petal app list")}         ${pc.dim("# show registered apps")}`)
  console.log(`  ${pc.cyan("petal app add")}          ${pc.dim("# register an existing app")}`)
  console.log()
}
