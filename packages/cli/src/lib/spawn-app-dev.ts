import { spawn, ChildProcess } from "child_process"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { request as httpRequest } from "http"
import pc from "picocolors"

export interface AppDevProcesses {
  builder: ChildProcess
  server: ChildProcess
}

export function resolvePortFromViteConfig(cwd: string): string | undefined {
  const configPath = join(cwd, "vite.config.ts")
  if (!existsSync(configPath)) return undefined
  const src = readFileSync(configPath, "utf-8")
  const m = src.match(/preview\s*:\s*\{[^}]*port\s*:\s*(\d+)/)
  return m ? m[1] : undefined
}

export function resolvePortFromDevUrl(devUrl?: string): string | undefined {
  if (!devUrl) return undefined
  try {
    const url = new URL(devUrl)
    if (url.port) return url.port
  } catch {
    // ignore invalid URLs
  }
  return undefined
}

export function resolveAppDevPort(appDir: string, devUrl?: string): string {
  return resolvePortFromDevUrl(devUrl) ?? resolvePortFromViteConfig(appDir) ?? "5174"
}

function pingHmr(shellUrl: string): void {
  try {
    const url = new URL("/__petal_hmr", shellUrl)
    const req = httpRequest(
      { hostname: url.hostname, port: Number(url.port) || 3000, path: url.pathname, method: "POST" },
      () => {},
    )
    req.on("error", () => {}) // shell might not be running — silently ignore
    req.end()
  } catch {}
}

export function spawnAppDevProcesses(
  appDir: string,
  options: {
    port?: string
    devUrl?: string
    appName?: string
    pipeOutput?: boolean
    shellUrl?: string
  } = {},
): AppDevProcesses | null {
  const viteBin = join(appDir, "node_modules", ".bin", "vite")
  if (!existsSync(viteBin)) {
    return null
  }

  const port = options.port ?? resolveAppDevPort(appDir, options.devUrl)
  const appName = options.appName ?? "app"
  const pipeOutput = options.pipeOutput ?? true
  const shellUrl = options.shellUrl ?? "http://localhost:3000"

  const builder = spawn(viteBin, ["build", "--watch"], { cwd: appDir, stdio: "pipe" })
  const server = spawn(viteBin, ["preview", "--port", port, "--host"], { cwd: appDir, stdio: "pipe" })

  if (pipeOutput) {
    const prefix = pc.magenta(`[${appName}]`)

    function pipe(label: string, color: (s: string) => string) {
      return (data: Buffer): void => {
        data.toString().split("\n").forEach((line) => {
          const t = line.trim()
          if (!t) return
          if (label === "build" && t.includes("built in")) {
            console.log(
              `  ${prefix} ${pc.green("✓ rebuilt")} ${pc.dim(t.replace(/.*built in/, "in").trim())}`,
            )
            pingHmr(shellUrl)
          } else if (label === "serve" && (t.includes("Local:") || t.includes("Network:"))) {
            console.log(`  ${prefix} ${color(`[${label}]`)} ${t}`)
          } else if (!t.includes("watching for file changes") && !t.startsWith("vite v")) {
            console.log(`  ${prefix} ${color(`[${label}]`)} ${pc.dim(t)}`)
          }
        })
      }
    }

    builder.stdout?.on("data", pipe("build", pc.cyan))
    builder.stderr?.on("data", pipe("build", pc.cyan))
    server.stdout?.on("data", pipe("serve", pc.yellow))
    server.stderr?.on("data", pipe("serve", pc.yellow))
  }

  builder.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(pc.red(`  [${appName}] build exited with code ${code}`))
    }
  })
  server.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(pc.red(`  [${appName}] serve exited with code ${code}`))
    }
  })

  return { builder, server }
}
