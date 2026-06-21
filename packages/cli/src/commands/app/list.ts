import { existsSync } from "fs"
import pc from "picocolors"
import { getAppsFilePath, readApps, requirePetalCoreDir } from "../../lib/apps-config"

export function listApps(): void {
  const coreDir = requirePetalCoreDir()
  const filePath = getAppsFilePath(coreDir)

  console.log(`\n  ${pc.bold("Registered apps")} ${pc.dim("(" + filePath + ")")}\n`)

  if (!existsSync(filePath)) {
    console.log(pc.dim("  No petal.apps.json found. Run `petal app add` to register your first app.\n"))
    return
  }

  const apps = readApps(filePath)
  if (apps.length === 0) {
    console.log(pc.dim("  No apps registered. Run `petal app add`.\n"))
    return
  }

  for (const app of apps) {
    console.log(`  ${pc.green("●")} ${pc.bold(app.name)} ${pc.dim("v" + app.version)}`)
    if (app.devUrl) console.log(`      ${pc.dim("dev: ")} ${app.devUrl}`)
    console.log(`      ${pc.dim("prod:")} ${app.url}`)
  }
  console.log()
}
