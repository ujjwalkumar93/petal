import { existsSync, readFileSync } from "fs"
import { join } from "path"
import pc from "picocolors"
import { resolveAppDevPort, spawnAppDevProcesses } from "../lib/spawn-app-dev"

interface DevOptions {
  port?: string
  shell?: string
}

export async function devApp(options: DevOptions = {}): Promise<void> {
  const cwd = process.cwd()

  if (!existsSync(join(cwd, "package.json"))) {
    console.error(pc.red("\n  ✗ No package.json found. Run `petal dev` from your app directory.\n"))
    process.exit(1)
  }

  const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8")) as { name?: string }
  const appName = pkg.name ?? "app"

  const viteBin = join(cwd, "node_modules", ".bin", "vite")
  if (!existsSync(viteBin)) {
    console.error(pc.red(`\n  ✗ Vite not found in node_modules. Run \`pnpm install\` first.\n`))
    process.exit(1)
  }

  const port = options.port ?? resolveAppDevPort(cwd)

  const shellUrl = options.shell ?? "http://localhost:3000"

  console.log(
    `\n  ${pc.bold(pc.green("◆"))} ${pc.bold("petal dev")} ${pc.dim("—")} ` +
    `${pc.cyan(appName)} ${pc.dim("→ http://localhost:" + port + "/petal.hooks.js")}\n`,
  )
  console.log(pc.dim(`  Watching for changes. Shell at ${shellUrl} reloads automatically after each rebuild.\n`))

  const processes = spawnAppDevProcesses(cwd, { port, appName, pipeOutput: true, shellUrl })
  if (!processes) {
    console.error(pc.red(`\n  ✗ Failed to start dev server for ${appName}.\n`))
    process.exit(1)
  }

  const { builder, server } = processes

  const shutdown = (): void => {
    console.log(pc.dim("\n  Stopping...\n"))
    builder.kill("SIGTERM")
    server.kill("SIGTERM")
    process.exit(0)
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  await new Promise<never>(() => {})
}
