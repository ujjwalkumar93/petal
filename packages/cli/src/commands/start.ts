import { spawn, ChildProcess } from "child_process"
import { existsSync } from "fs"
import { join } from "path"
import pc from "picocolors"
import { findPetalCoreDir, findAppDirectory } from "../lib/apps-config"
import { spawnAppDevProcesses } from "../lib/spawn-app-dev"
import type { PetalAppMeta, PetalConfig } from "@petal/sdk"

function loadAppsFromConfig(coreDir: string): PetalAppMeta[] {
  const configPath = join(coreDir, "petal.config.ts")
  if (!existsSync(configPath)) return []
  try {
    const tsxCjs = join(coreDir, "node_modules/tsx/cjs")
    if (existsSync(tsxCjs)) require(tsxCjs)
    // Clear module cache so restarts pick up changes
    Object.keys(require.cache).forEach((k) => { if (k.includes("petal.config")) delete require.cache[k] })
    const mod = require(configPath) as { default?: PetalConfig }
    return mod.default?.apps ?? []
  } catch {
    return []
  }
}

interface StartOptions {
  prod?: boolean
  port?: string
  skipApps?: boolean
}

interface AppProcess {
  app: PetalAppMeta
  dir: string
  builder: ChildProcess
  server: ChildProcess
}

export async function startPetal(options: StartOptions): Promise<void> {
  const coreDir = findPetalCoreDir()
  if (!coreDir) {
    console.error(pc.red("\n  ✗ Not a Petal core directory (no next.config.js found)."))
    console.error(pc.dim("  Run `petal start` from your workspace, petal monorepo, or petal/packages/core directory.\n"))
    process.exit(1)
  }

  const mode = options.prod ? "start" : "dev"
  const port = options.port ?? "3000"

  const nextBin = join(coreDir, "node_modules", ".bin", "next")
  if (!existsSync(nextBin)) {
    console.error(pc.red("  ✗ next not found in node_modules. Run `pnpm install` first.\n"))
    process.exit(1)
  }

  console.log(
    `\n  ${pc.bold(pc.green("◆"))} ${pc.bold("petal")} ${pc.dim("—")} ` +
    `${pc.cyan("next " + mode)} ${pc.dim("on :" + port)}\n`,
  )

  // ── Load and spawn app dev servers ─────────────────────────────────────────
  const appProcesses: AppProcess[] = []
  const skipApps = options.skipApps || options.prod

  if (!skipApps) {
    const apps = loadAppsFromConfig(coreDir)

    if (apps.length > 0) {
      console.log(pc.dim("  Starting app dev servers...\n"))

      for (const app of apps) {
        const appDir = findAppDirectory(app.name, coreDir)
        if (!appDir) {
          console.warn(pc.yellow(`  ⚠ App directory not found for '${app.name}' (will skip)\n`))
          continue
        }

        const viteBin = join(appDir, "node_modules", ".bin", "vite")
        if (!existsSync(viteBin)) {
          console.warn(pc.yellow(`  ⚠ Vite not found in ${app.name} — run pnpm install in ${appDir}\n`))
          continue
        }

        const processes = spawnAppDevProcesses(appDir, {
          appName: app.name,
          devUrl: app.devUrl,
          pipeOutput: true,
        })

        if (processes) {
          appProcesses.push({
            app,
            dir: appDir,
            builder: processes.builder,
            server: processes.server,
          })
          console.log(pc.dim(`  ✓ ${app.name} → ${app.devUrl || app.url}`))
        }
      }

      if (appProcesses.length > 0) {
        console.log("")
      }
    }
  }

  const proc = spawn(nextBin, [mode, "--port", port], { cwd: coreDir, stdio: "inherit" })

  // ── Graceful shutdown handler ──────────────────────────────────────────────
  const shutdown = (): void => {
    console.log(pc.dim("\n  Stopping...\n"))

    for (const { app, builder, server } of appProcesses) {
      try {
        builder.kill("SIGTERM")
        server.kill("SIGTERM")
      } catch {
        // Process may have already exited
      }
    }

    setTimeout(() => {
      proc.kill("SIGTERM")
      process.exit(0)
    }, 500)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  // ── Display service summary ────────────────────────────────────────────────
  displayServiceSummary(port, appProcesses)

  await new Promise<never>((_, reject) => {
    proc.on("exit", (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`next ${mode} exited with code ${code}`))
      }
    })
  })
}

/**
 * Display a summary of all running services.
 */
function displayServiceSummary(corePort: string, appProcesses: AppProcess[]): void {
  const services = [
    {
      name: "Petal Core",
      url: `http://localhost:${corePort}`,
      label: pc.cyan("[petal]"),
    },
    ...appProcesses.map((ap) => ({
      name: ap.app.name,
      url: ap.app.devUrl || ap.app.url,
      label: pc.magenta(`[${ap.app.name}]`),
    })),
  ]

  if (services.length > 1) {
    console.log(pc.dim("  Running services:"))
    services.forEach((svc) => {
      console.log(`    ${svc.label} ${pc.dim("→")} ${pc.bold(svc.url)}`)
    })
    console.log("")
  }
}

