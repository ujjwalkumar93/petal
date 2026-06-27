"use client"

export default function DocsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Documentation</h1>
          <p className="text-muted-foreground">Learn how to build with Petal</p>
        </div>
        <a
          href="/docs/print"
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 3v13M5 14l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="19" width="18" height="2" rx="1" />
          </svg>
          Download PDF
        </a>
      </section>

      {/* Getting Started */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">🚀 Getting Started</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. Your Frappe Backend</h3>
            <p className="text-muted-foreground">
              Your Frappe/ERPNext instance is running at{" "}
              <code className="bg-black/10 px-2 py-1 rounded">http://localhost:8000</code>
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. CORS Configuration</h3>
            <p className="text-muted-foreground mb-2">Make sure CORS is enabled in your Frappe config:</p>
            <pre className="bg-black/5 p-3 rounded text-xs overflow-x-auto">
{`{
  "allow_cors": "${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}",
  "cors_allow_credentials": true
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Create a Custom App</h3>
            <p className="text-muted-foreground mb-2">Extend Petal by creating apps in<code className="bg-black/10 px-2 py-1 rounded mx-1">src/apps/</code>:</p>
            <pre className="bg-black/5 p-3 rounded text-xs overflow-x-auto">
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
    console.log("App loaded!")
  },
}

export default hooks`}
            </pre>
          </div>
        </div>
      </div>

      {/* API Usage */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">🔌 Using Frappe APIs</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Get a Document</h3>
            <pre className="bg-black/5 p-3 rounded text-xs overflow-x-auto">
{`const frappe = useFrappe()
const user = await frappe.getDoc("User", "Administrator")`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Get a List</h3>
            <pre className="bg-black/5 p-3 rounded text-xs overflow-x-auto">
{`const users = await frappe.getList({
  doctype: "User",
  fields: ["name", "full_name", "email"],
  limit: 20,
})`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Save a Document</h3>
            <pre className="bg-black/5 p-3 rounded text-xs overflow-x-auto">
{`const newDoc = await frappe.saveDoc({
  doctype: "Item",
  item_code: "WIDGET-001",
  item_name: "Blue Widget",
})`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Call a Server Method</h3>
            <pre className="bg-black/5 p-3 rounded text-xs overflow-x-auto">
{`const result = await frappe.callMethod(
  "frappe.client.get_value",
  { doctype: "User", name: "Administrator" }
)`}
            </pre>
          </div>
        </div>
      </div>

      {/* Hooks */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">🎣 App Hooks</h2>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Apps can define these hooks in their <code className="bg-black/10 px-2 py-1 rounded">hooks.ts</code>:</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <span className="font-semibold">sidebar_items</span> - Define sidebar navigation
            </li>
            <li>
              <span className="font-semibold">navbar_items</span> - Add navbar elements
            </li>
            <li>
              <span className="font-semibold">form_overrides</span> - Custom form components
            </li>
            <li>
              <span className="font-semibold">list_overrides</span> - Custom list components
            </li>
            <li>
              <span className="font-semibold">on_boot</span> - Async function called on app load
            </li>
          </ul>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3 text-primary">📚 Resources</h2>
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            <a href={process.env.NEXT_PUBLIC_FRAPPE_BACKEND_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Frappe Documentation ↗
            </a>
          </li>
          <li>
            <a href="#" className="text-primary hover:underline">
              Petal GitHub ↗
            </a>
          </li>
          <li>
            <a href="#" className="text-primary hover:underline">
              API Reference ↗
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
