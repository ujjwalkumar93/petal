import prompts from "prompts"
import pc from "picocolors"
import { getAppsFilePath, readApps, requirePetalCoreDir, writeApps } from "../../lib/apps-config"

export async function addApp(): Promise<void> {
  const coreDir = requirePetalCoreDir()
  const filePath = getAppsFilePath(coreDir)
  const apps = readApps(filePath)

  console.log(`\n  ${pc.bold(pc.green("◆"))} ${pc.bold("petal app add")} ${pc.dim("— register a custom app")}\n`)

  const answers = await prompts(
    [
      {
        type: "text",
        name: "name",
        message: "App name:",
        validate: (v: string) => (v.trim() ? true : "Required"),
      },
      {
        type: "text",
        name: "version",
        message: "Version:",
        initial: "0.0.1",
      },
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
    { onCancel: () => process.exit(0) },
  )

  const duplicate = apps.find((a) => a.name === answers.name)
  if (duplicate) {
    console.log(pc.yellow(`\n  ⚠  "${answers.name}" is already registered. Use ${pc.bold("petal app update " + answers.name)} to change it.\n`))
    return
  }

  apps.push({ name: answers.name, version: answers.version, url: answers.url, devUrl: answers.devUrl })
  writeApps(filePath, apps)

  console.log(`\n  ${pc.green("✓")} Registered ${pc.cyan(answers.name)} in ${pc.dim("petal.apps.json")}`)
  console.log(pc.dim(`\n  Refresh the browser — no server restart needed.\n`))
}
