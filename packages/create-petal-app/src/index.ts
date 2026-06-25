#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join, resolve } from "path"
import { execSync } from "child_process"
import prompts from "prompts"
import pc from "picocolors"

// ---------------------------------------------------------------------------
// Template resolution
// In the monorepo: dist/index.js lives at packages/create-petal-app/dist/,
// so ../../core resolves to packages/core — the canonical template.
// When published to npm: dist/index.js is inside node_modules/create-petal-app/dist/,
// so fall back to ../templates/petal-host (bundled at publish time).
// ---------------------------------------------------------------------------
function getTemplatePath(): string {
  const candidates = [
    resolve(__dirname, "../../core"),                  // monorepo
    resolve(__dirname, "../templates/petal-host"),     // npm bundle
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  throw new Error(
    "Petal template not found. Report this at https://github.com/ujjwalkumar93/petal/issues"
  )
}

// Files/dirs to skip when copying the template
const EXCLUDE = new Set([
  "node_modules", ".next", "dist", ".env.local",
  "petal.config.ts", "pnpm-lock.yaml", "package-lock.json",
  "yarn.lock", ".DS_Store",
])

function shouldExclude(src: string): boolean {
  const name = src.replace(/\\/g, "/").split("/").pop() ?? ""
  if (EXCLUDE.has(name)) return true
  if (name.endsWith(".tsbuildinfo")) return true
  return false
}

// ---------------------------------------------------------------------------
// Peer dep versions written into the scaffolded package.json
// workspace:* → real semver
//
// Resolution order:
//   1. Monorepo: read actual version from sibling package.json files
//   2. npm bundle: read from templates/versions.json (baked at publish)
//   3. Fallback: "latest" (always installable, version-unconstrained)
// ---------------------------------------------------------------------------
function resolvePublishedVersions(): Record<string, string> {
  // Attempt 1 — monorepo: sibling packages at ../../<pkg-name>/package.json
  const candidates: Array<[string, string]> = [
    ["@petal/sdk",               resolve(__dirname, "../../sdk/package.json")],
    ["@petal/ui",                resolve(__dirname, "../../ui/package.json")],
    ["@petal/tsconfig",          resolve(__dirname, "../../tooling/tsconfig/package.json")],
    ["@tanstack/react-query",    resolve(__dirname, "../../core/node_modules/@tanstack/react-query/package.json")],
  ]

  const versions: Record<string, string> = {}
  let allResolved = true

  for (const [pkg, pkgPath] of candidates) {
    if (existsSync(pkgPath)) {
      try {
        const meta = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string }
        if (meta.version) {
          versions[pkg] = `^${meta.version}`
          continue
        }
      } catch {}
    }
    allResolved = false
  }

  if (allResolved) return versions

  // Attempt 2 — npm bundle: templates/versions.json baked at publish time
  const baked = resolve(__dirname, "../templates/versions.json")
  if (existsSync(baked)) {
    try {
      return JSON.parse(readFileSync(baked, "utf-8")) as Record<string, string>
    } catch {}
  }

  // Fallback — "latest" is always installable
  return {
    "@petal/sdk":      "latest",
    "@petal/ui":       "latest",
    "@petal/tsconfig": "latest",
  }
}

const PUBLISHED_VERSIONS = resolvePublishedVersions()

function rewritePackageJson(dir: string, projectName: string) {
  const pkgPath = join(dir, "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>

  pkg.name = projectName
  pkg.version = "0.0.1"
  pkg.private = true

  const unresolved: string[] = []

  for (const section of ["dependencies", "devDependencies", "peerDependencies"] as const) {
    const sec = pkg[section] as Record<string, string> | undefined
    if (!sec) continue
    for (const [dep, ver] of Object.entries(sec)) {
      if (ver !== "workspace:*") continue
      const resolved = PUBLISHED_VERSIONS[dep]
      if (resolved) {
        sec[dep] = resolved
      } else {
        sec[dep] = "latest"
        unresolved.push(dep)
      }
    }
  }

  if (unresolved.length > 0) {
    console.warn(
      pc.yellow(`\n  ⚠ Could not resolve published versions for: ${unresolved.join(", ")}`) +
      pc.dim("\n    Falling back to 'latest'. Pin versions manually after install.\n")
    )
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
}

function writePetalConfig(
  dir: string,
  opts: {
    primaryColor: string
    app: { name: string; url: string; devUrl: string } | null
  }
) {
  const appsBlock = opts.app
    ? `[
    {
      name: "${opts.app.name}",
      version: "0.0.1",
      url: "${opts.app.url}",
      devUrl: "${opts.app.devUrl}",
    },
  ]`
    : "[]"

  writeFileSync(
    join(dir, "petal.config.ts"),
    `import type { PetalConfig } from "@petal/sdk"

const config: PetalConfig = {
  apps: ${appsBlock},
  theme: {
    primaryColor: "${opts.primaryColor}",
  },
}

export default config
`
  )
}

function writeEnvLocal(dir: string, opts: { backend: string; site: string }) {
  writeFileSync(
    join(dir, ".env.local"),
    `# Frappe Backend (server-side only — never sent to the browser)
FRAPPE_INTERNAL_URL=${opts.backend}
NEXT_PUBLIC_FRAPPE_SITE=${opts.site}

# Frontend Configuration
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
`
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const nameArg = process.argv[2]

  console.log(
    `\n${pc.bold(pc.green("◆"))} ${pc.bold("create-petal-app")} ` +
    `${pc.dim("— scaffold a new Petal host")}\n`
  )

  const cancel = () => { console.log(pc.dim("\n  Cancelled.\n")); process.exit(0) }

  const main = await prompts(
    [
      {
        type: nameArg ? null : "text",
        name: "name",
        message: "Project name:",
        initial: "my-petal-host",
        validate: (v: string) =>
          /^[a-z0-9-]+$/.test(v) || "Use lowercase letters, numbers, and dashes",
      },
      {
        type: "text",
        name: "backend",
        message: "Frappe backend URL:",
        initial: "http://localhost:8000",
      },
      {
        type: "text",
        name: "site",
        message: "Frappe site name (hostname):",
        initial: "localhost",
      },
      {
        type: "text",
        name: "primaryColor",
        message: "Brand color (hex):",
        initial: "#16a34a",
      },
      {
        type: "confirm",
        name: "addApp",
        message: "Register a custom app now?",
        initial: false,
      },
    ],
    { onCancel: cancel }
  )

  let app: { name: string; url: string; devUrl: string } | null = null
  if (main.addApp) {
    const a = await prompts(
      [
        { type: "text", name: "appName", message: "App name:", initial: "my-app" },
        {
          type: "text",
          name: "devUrl",
          message: "Dev server URL:",
          initial: "http://localhost:5174/petal.hooks.js",
        },
        {
          type: "text",
          name: "url",
          message: "Production bundle URL:",
          initial: "https://cdn.example.com/my-app/petal.hooks.js",
        },
      ],
      { onCancel: cancel }
    )
    app = { name: a.appName, url: a.url, devUrl: a.devUrl }
  }

  const projectName = (nameArg ?? main.name) as string
  const dir = resolve(process.cwd(), projectName)

  if (existsSync(dir)) {
    console.error(pc.red(`\n  Directory "${projectName}" already exists.\n`))
    process.exit(1)
  }

  console.log(`\n  ${pc.dim("Scaffolding")} ${pc.cyan(projectName)}${pc.dim("...")}`)

  // Copy template (skip build artifacts, lock files, env, and config)
  const templatePath = getTemplatePath()
  cpSync(templatePath, dir, { recursive: true, filter: (src) => !shouldExclude(src) })

  // Rewrite package.json: name + replace workspace:* deps
  rewritePackageJson(dir, projectName)

  // Generate petal.config.ts and .env.local from user answers
  writePetalConfig(dir, { primaryColor: main.primaryColor, app })
  writeEnvLocal(dir, { backend: main.backend, site: main.site })

  // Rewrite tsconfig.json to not extend @petal/tsconfig (monorepo-only)
  const tsconfigPath = join(dir, "tsconfig.json")
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"))
  delete tsconfig["extends"]
  tsconfig.compilerOptions = {
    target: "ES2020",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
    baseUrl: ".",
    paths: { "@/*": ["./src/*"] },
  }
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n")

  // Rewrite tailwind.config.ts to use node_modules paths instead of workspace paths
  const tailwindPath = join(dir, "tailwind.config.ts")
  if (existsSync(tailwindPath)) {
    const tw = readFileSync(tailwindPath, "utf-8").replace(
      /'\.\.\/\.\.\/packages\/ui\/src\/\*\*\/\*\.\{js,ts,jsx,tsx\}'/g,
      "'./node_modules/@petal/ui/src/**/*.{js,ts,jsx,tsx}'"
    )
    writeFileSync(tailwindPath, tw)
  }

  console.log(`  ${pc.green("✓")} Created ${pc.cyan(projectName)}/\n`)

  // Detect package manager
  let pm = "npm"
  try { execSync("pnpm --version", { stdio: "ignore" }); pm = "pnpm" } catch {}
  try { execSync("bun --version", { stdio: "ignore" }); pm = "bun" } catch {}

  console.log(`  ${pc.bold("Next steps:")}\n`)
  console.log(`  ${pc.cyan(`cd ${projectName}`)}`)
  console.log(`  ${pc.cyan(`${pm} install`)}`)
  console.log(`  ${pc.cyan(`${pm} run dev`)}    ${pc.dim("# http://localhost:3000")}\n`)

  if (!app) {
    console.log(`  ${pc.dim("To add a custom app later:")}`)
    console.log(`  ${pc.dim("  1. petal create my-app")}`)
    console.log(`  ${pc.dim(`  2. Add it to petal.config.ts in ${projectName}/\n`)}`)
  }

  console.log(`  ${pc.dim("Frappe backend:")} ${pc.cyan(main.backend)}`)
  console.log(`  ${pc.dim("Edit .env.local to change backend settings.")}\n`)
}

main().catch((err: Error) => {
  console.error(pc.red(`\n  Error: ${err.message}\n`))
  process.exit(1)
})
