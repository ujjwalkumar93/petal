"use client"
import { Suspense, lazy, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { usePetalStore } from "@/store/petal-store"
import { authService } from "@/lib/auth/auth-service"

function LoginForm() {
  const router = useRouter()
  const { setUser, setAuthStatus } = usePetalStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)

    const result = await authService.login({ email, password })

    if (result.success) {
      setUser(result.user)
      setAuthStatus("authenticated")
      router.replace(result.redirectTo)
    } else {
      setError(result.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/30">
              P
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Petal</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your Frappe Apps</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email or Username
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or username"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Docs link */}
        <div className="flex justify-center">
          <a
            href="/petal-docs"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-3 py-1.5 bg-background/60 hover:bg-background"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Documentation
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Powered by{" "}
          <span className="font-semibold text-foreground">Petal</span>
          {" · "}
          Modern frontend for Frappe
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  // Allow custom apps to replace the entire login UI
  const loginComponent = useMemo(() => authService.getLoginComponent(), [])
  const CustomLogin = useMemo(
    () => (loginComponent ? lazy(loginComponent) : null),
    [loginComponent]
  )

  if (CustomLogin) {
    return (
      <Suspense fallback={<LoginForm />}>
        <CustomLogin />
      </Suspense>
    )
  }

  return <LoginForm />
}
