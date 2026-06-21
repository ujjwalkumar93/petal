import prompts from "prompts"
import pc from "picocolors"
import { getAppsFilePath, readApps, requirePetalCoreDir, writeApps } from "../../lib/apps-config"

export async function removeApp(name: string): Promise<void> {
  const coreDir = requirePetalCoreDir()
  const filePath = getAppsFilePath(coreDir)
  const apps = readApps(filePath)
  const idx = apps.findIndex((a) => a.name === name)

  if (idx === -1) {
    console.error(pc.red(`\n  ✗ App "${name}" is not registered.\n`))
    listRegistered(apps)
    process.exit(1)
  }

  const { confirm } = await prompts(
    {
      type: "confirm",
      name: "confirm",
      message: `Remove "${name}" from Petal?`,
      initial: false,
    },
    { onCancel: () => process.exit(0) },
  )

  if (!confirm) {
    console.log(pc.dim("  Aborted.\n"))
    return
  }

  apps.splice(idx, 1)
  writeApps(filePath, apps)

  console.log(`\n  ${pc.green("✓")} Removed ${pc.cyan(name)} from ${pc.dim("petal.apps.json")}`)
  console.log(pc.dim(`\n  Refresh the browser — no server restart needed.\n`))
}

function listRegistered(apps: { name: string }[]): void {
  if (apps.length === 0) return
  console.log(pc.dim("  Registered: " + apps.map((a) => a.name).join(", ")))
}
