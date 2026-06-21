"use client"

import { useEffect, useState } from "react"
import { usePetalStore } from "@/store/petal-store"
import { useFrappe } from "@/hooks/useFrappe"

export default function DeskPage() {
  const { user } = usePetalStore()
  const frappe = useFrappe()
  const [users, setUsers] = useState<{ name: string; full_name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    frappe
      .getList({ doctype: "User", fields: ["name", "full_name", "email"], limit: 50 })
      // .then((data) => setUsers(data as { name: string; full_name: string; email: string }[]))
      .then((data) =>
        setUsers(
          data as unknown as {
            name: string
            full_name: string
            email: string
          }[]
        )
      )
      .catch(() => setError("Failed to fetch users"))
      .finally(() => setLoading(false))
  }, [frappe])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Desk</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Logged In User</h2>
        {user ? (
          <div className="text-gray-700">
            <p>
              <strong>Name:</strong> {user.full_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Not logged in</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">System Users</h2>

        {loading && <p className="text-gray-500">Loading users...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Full Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.name} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.full_name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
