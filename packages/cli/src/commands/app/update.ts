import prompts from "prompts"
import pc from "picocolors"
import { getAppsFilePath, readApps, requirePetalCoreDir, writeApps } from "../../lib/apps-config"

export async function updateApp(name: string): Promise<void> {
  const coreDir = requirePetalCoreDir()
  const filePath = getAppsFilePath(coreDir)
  const apps = readApps(filePath)
  const idx = apps.findIndex((a) => a.name === name)

  if (idx === -1) {
    console.error(pc.red(`\n  ✗ App "${name}" is not registered. Use ${pc.bold("petal app add")} first.\n`))
    process.exit(1)
  }

  const current = apps[idx]!

  console.log(`\n  ${pc.bold(pc.green("◆"))} ${pc.bold("petal app update")} ${pc.dim("— " + name)}`)
  console.log(pc.dim(`\n  Press Enter to keep the current value.\n`))

  const answers = await prompts(
    [
      {
        type: "text",
        name: "version",
        message: "Version:",
        initial: current.version,
      },
      {
        type: "text",
        name: "devUrl",
        message: "Dev server URL:",
        initial: current.devUrl ?? "",
      },
      {
        type: "text",
        name: "url",
        message: "Production bundle URL:",
        initial: current.url,
      },
    ],
    { onCancel: () => process.exit(0) },
  )

  apps[idx] = {
    name,
    version: answers.version || current.version,
    url: answers.url || current.url,
    ...(answers.devUrl ? { devUrl: answers.devUrl } : {}),
  }
  writeApps(filePath, apps)

  console.log(`\n  ${pc.green("✓")} Updated ${pc.cyan(name)} in ${pc.dim("petal.apps.json")}`)
  console.log(pc.dim(`\n  Refresh the browser — no server restart needed.\n`))
}
