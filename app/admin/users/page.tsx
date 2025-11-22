"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("users").select("*").order("createdat", { ascending: false })
      setUsers(data || [])
      setFilteredUsers(data || [])
      setLoading(false)
    }

    loadUsers()
  }, [])

  const handleSearch = (value: string) => {
  setSearchTerm(value)

  const filtered = users.filter(
  (u) =>
    (u.name ?? "").toLowerCase().includes(value.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(value.toLowerCase())
)


  setFilteredUsers(filtered)
}


  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-300"
      case "business_owner":
        return "bg-blue-500/20 text-blue-300"
      default:
        return "bg-gray-500/20 text-gray-300"
    }
  }

  if (loading) return <div className="text-slate-400">Loading users...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">User Management</h1>
        <p className="text-slate-400">Manage all users and their roles</p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-slate-800 border-slate-700 text-slate-50 placeholder-slate-500"
        />
      </div>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Role</th>
                <th className="px-6 py-3 text-left font-semibold">Joined</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-50">{user.name ?? "—"}</td>
<td className="px-6 py-4 text-slate-400">{user.email ?? "—"}</td>

                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${getRoleColor(user.role)}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(user.createdat).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-slate-800 hover:bg-slate-700 border-slate-600"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-800 border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Total Users</p>
          <p className="text-2xl font-bold text-slate-50">{users.length}</p>
        </Card>
        <Card className="p-4 bg-slate-800 border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Business Owners</p>
          <p className="text-2xl font-bold text-blue-400">{users.filter((u) => u.role === "owner").length}</p>
        </Card>
        <Card className="p-4 bg-slate-800 border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Admins</p>
          <p className="text-2xl font-bold text-red-400">{users.filter((u) => u.role === "admin").length}</p>
        </Card>
      </div>
    </div>
  )
}
