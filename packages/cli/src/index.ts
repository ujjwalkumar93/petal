import { Command } from "commander"
import { createApp }  from "./commands/create"
import { devApp }     from "./commands/dev"
import { setupPetal } from "./commands/setup"
import { startPetal } from "./commands/start"
import { listApps, addApp, updateApp, removeApp } from "./commands/app"

const program = new Command()

program
  .name("petal")
  .description("Petal — modern metadata-driven frontend for Frappe")
  .version("0.1.0")

// ── Server commands (run from petal core directory) ───────────────────────────

program
  .command("setup")
  .description("Configure a Petal installation (creates petal.config.ts, .env.local)")
  .action(setupPetal)

program
  .command("start")
  .description("Start the Petal server (Next.js dev or production mode)")
  .option("--prod", "Run in production mode (next start instead of next dev)")
  .option("-p, --port <port>", "Port to listen on", "3000")
  .option("--skip-apps", "Skip starting registered app dev servers")
  .action(startPetal)

// ── Custom app development (run from the app directory) ───────────────────────

program
  .command("create [app-name]")
  .description("Scaffold a new Petal custom app")
  .action(createApp)

program
  .command("dev")
  .description("Start the dev server for a custom app (build watch + preview)")
  .option("-p, --port <port>", "Port to serve the bundle on (auto-detected from vite.config.ts)")
  .option("--shell <url>", "Petal shell URL to reload after each rebuild", "http://localhost:3000")
  .action(devApp)

// ── App registry (petal.apps.json) ───────────────────────────────────────────

const app = program.command("app").description("Manage registered custom apps (petal.apps.json)")

app.command("list").description("List all registered apps").action(listApps)
app.command("add").description("Register a new app").action(addApp)
app.command("update <name>").description("Update version or URLs for a registered app").action(updateApp)
app.command("remove <name>").description("Unregister an app").action(removeApp)

program.parse()
