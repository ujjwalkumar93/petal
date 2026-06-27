"use client"

export default function DeveloperPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary mb-2">Developer Center</h1>
        <p className="text-muted-foreground">Build and extend Petal applications</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentation */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📖</span> Documentation
          </h2>
          <div className="space-y-3">
            <a href="#" className="block p-3 bg-primary/5 rounded hover:bg-primary/10 transition-colors">
              <h3 className="font-medium text-primary">Getting Started</h3>
              <p className="text-sm text-muted-foreground">Learn how to build Petal apps</p>
            </a>
            <a href="#" className="block p-3 bg-primary/5 rounded hover:bg-primary/10 transition-colors">
              <h3 className="font-medium text-primary">API Reference</h3>
              <p className="text-sm text-muted-foreground">Explore Frappe and Petal APIs</p>
            </a>
            <a href="#" className="block p-3 bg-primary/5 rounded hover:bg-primary/10 transition-colors">
              <h3 className="font-medium text-primary">Examples</h3>
              <p className="text-sm text-muted-foreground">View example apps and patterns</p>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🔗</span> Quick Links
          </h2>
          <div className="space-y-3">
            <a
              href="/settings"
              className="block p-3 bg-accent/5 rounded hover:bg-accent/10 transition-colors"
            >
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm text-muted-foreground">Configure your applications</p>
            </a>
            <a
              href={process.env.NEXT_PUBLIC_FRAPPE_BACKEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-accent/5 rounded hover:bg-accent/10 transition-colors"
            >
              <h3 className="font-medium">Frappe Backend</h3>
              <p className="text-sm text-muted-foreground">Access your Frappe instance</p>
            </a>
            <div className="block p-3 bg-accent/5 rounded text-gray-500">
              <h3 className="font-medium">API Playground</h3>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📝 Create Your First App</h2>
        <pre className="bg-black/5 p-4 rounded overflow-x-auto text-sm">
{`// src/apps/my-app/hooks.ts
import type { PetalHooks } from "@petal/sdk"

export const hooks: PetalHooks = {
  sidebar_items: [
    {
      label: "My App",
      path: "/my-app",
      icon: "🚀",
    },
  ],
  on_boot: async () => {
    console.log("My app loaded!")
  },
}

export default hooks`}
        </pre>
      </div>
    </div>
  )
}
