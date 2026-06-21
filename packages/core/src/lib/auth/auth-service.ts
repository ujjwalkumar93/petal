import type { FrappeUser, LoginCredentials } from "@petal/sdk"
import { appRegistry } from "@/lib/registry/app-registry"
import { getFrappeClient } from "@/hooks/useFrappe"

export type LoginResult =
  | { success: true; user: FrappeUser; redirectTo: string }
  | { success: false; reason: "cancelled" | "error"; message: string }

export type LogoutResult =
  | { success: true; redirectTo: string }
  | { success: false; reason: "cancelled" | "error"; message: string }

function getAuthConfigs() {
  return appRegistry.getAll().map((a) => a.hooks.overrides?.auth).filter(Boolean)
}

export const authService = {
  getLoginPage(): string {
    for (const cfg of getAuthConfigs()) {
      if (cfg?.loginPage) return cfg.loginPage
    }
    return "/login"
  },

  getRedirectAfterLogin(): string {
    for (const cfg of getAuthConfigs()) {
      if (cfg?.redirectAfterLogin) return cfg.redirectAfterLogin
    }
    return "/"
  },

  getRedirectAfterLogout(): string {
    for (const cfg of getAuthConfigs()) {
      if (cfg?.redirectAfterLogout) return cfg.redirectAfterLogout
    }
    return "/login"
  },

  getLoginComponent() {
    for (const cfg of getAuthConfigs()) {
      if (cfg?.loginComponent) return cfg.loginComponent
    }
    return null
  },

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    // Run all before_login hooks — any returning false cancels
    for (const cfg of getAuthConfigs()) {
      if (cfg?.before_login) {
        try {
          const result = await cfg.before_login(credentials)
          if (result === false) {
            return { success: false, reason: "cancelled", message: "Login cancelled by app hook." }
          }
        } catch (err) {
          return { success: false, reason: "error", message: String(err) }
        }
      }
    }

    // Perform the actual Frappe login
    const client = getFrappeClient()
    try {
      await client.login(credentials.email, credentials.password)
    } catch {
      return { success: false, reason: "error", message: "Invalid email or password." }
    }



    // Fetch the resolved user
    let user: FrappeUser
    try {
      user = await client.getLoggedInUser()
    } catch {
      return { success: false, reason: "error", message: "Login succeeded but could not fetch user." }
    }

    // Run all after_login hooks
    for (const cfg of getAuthConfigs()) {
      if (cfg?.after_login) {
        try {
          await cfg.after_login(user)
        } catch (err) {
          console.warn("[Petal] after_login hook threw:", err)
        }
      }
    }

    return { success: true, user, redirectTo: this.getRedirectAfterLogin() }
  },

  async logout(): Promise<LogoutResult> {
    // Run all before_logout hooks — any returning false cancels
    for (const cfg of getAuthConfigs()) {
      if (cfg?.before_logout) {
        try {
          const result = await cfg.before_logout()
          if (result === false) {
            return { success: false, reason: "cancelled", message: "Logout cancelled by app hook." }
          }
        } catch (err) {
          return { success: false, reason: "error", message: String(err) }
        }
      }
    }

    // Perform actual Frappe logout
    const client = getFrappeClient()
    try {
      await client.logout()
    } catch {
      return { success: false, reason: "error", message: "Logout request failed." }
    }

    // Run all after_logout hooks
    for (const cfg of getAuthConfigs()) {
      if (cfg?.after_logout) {
        try {
          await cfg.after_logout()
        } catch (err) {
          console.warn("[Petal] after_logout hook threw:", err)
        }
      }
    }

    return { success: true, redirectTo: this.getRedirectAfterLogout() }
  },
}
