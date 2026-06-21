import Link from "next/link"

const NAV_ITEMS = [
  { icon: "🏠", label: "Home Workspace", desc: "Go to your main workspace", href: "/workspace/Home" },
  { icon: "📊", label: "Petal Dashboard", desc: "System overview & metrics", href: "/" },
  { icon: "💰", label: "Accounting", desc: "Finance & reports", href: "/workspace/Accounting" },
  { icon: "👥", label: "Users", desc: "Manage users & roles", href: "/workspace/Users" },
  { icon: "⚙️", label: "Settings", desc: "Configure your system", href: "/workspace/ERPNext%20Settings" },
  { icon: "🔧", label: "Tools", desc: "Data & automation tools", href: "/workspace/Tools" },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top status bar */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="text-sm font-semibold text-foreground">Petal</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-sm text-muted-foreground">Enterprise</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          All systems operational
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left — hero panel */}
        <div className="lg:w-5/12 bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex flex-col items-center justify-center p-12 text-white relative overflow-hidden">
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 text-center space-y-6">
            <div className="text-[120px] font-black leading-none tracking-tighter text-white/20 select-none">
              404
            </div>
            <div className="-mt-8">
              <h1 className="text-3xl font-bold">Page Not Found</h1>
              <p className="mt-2 text-white/70 text-sm max-w-xs">
                The resource you requested could not be located on this server.
              </p>
            </div>

            <div className="border border-white/20 rounded-lg p-4 text-left space-y-2 bg-white/5 backdrop-blur-sm">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Error Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-white/50">Code</span>
                <span className="font-mono">HTTP 404</span>
                <span className="text-white/50">Type</span>
                <span>Not Found</span>
                <span className="text-white/50">Platform</span>
                <span>Petal / Frappe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — navigation panel */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-14 space-y-8">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Recovery Options
            </p>
            <h2 className="text-2xl font-bold text-foreground">Where would you like to go?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a destination below to continue working.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-white hover:border-primary/40 hover:shadow-md hover:bg-primary/5 transition-all"
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Petal &mdash; Modern frontend for Frappe
            </p>
            <Link
              href="/"
              className="text-xs font-medium text-primary hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
