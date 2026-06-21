import type { Command } from "commander"
import { listApps } from "./list"
import { addApp } from "./add"
import { removeApp } from "./remove"
import { updateApp } from "./update"

export function registerAppCommands(program: Command): void {
  const app = program
    .command("app")
    .description("Manage registered Petal custom apps")

  app
    .command("list")
    .description("List all registered apps and their URLs")
    .action(listApps)

  app
    .command("add")
    .description("Register a new custom app in petal.apps.json")
    .action(addApp)

  app
    .command("remove <name>")
    .description("Unregister a custom app from petal.apps.json")
    .action(removeApp)

  app
    .command("update <name>")
    .description("Update a registered app's version or bundle URL")
    .action(updateApp)
}
