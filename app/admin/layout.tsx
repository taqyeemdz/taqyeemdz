"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login")
        return
      }

      const { data: userProfile } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (!userProfile || userProfile.role !== "admin") {
        router.push("/")
        return
      }

      setUser(userProfile)
      setLoading(false)
    }

    checkAdmin()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) return null

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <div
        className="bg-slate-900 text-slate-50 transition-all duration-300 flex flex-col border-r border-slate-800"
        style={{ width: sidebarOpen ? "280px" : "80px" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              TaqyeemDZ
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400"
          >
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <AdminNavLink href="/admin" icon="📊" label="Dashboard" sidebarOpen={sidebarOpen} />
          <AdminNavLink href="/admin/businesses" icon="🏢" label="Businesses" sidebarOpen={sidebarOpen} />
          <AdminNavLink href="/admin/users" icon="👥" label="Users" sidebarOpen={sidebarOpen} />
          <AdminNavLink href="/admin/analytics" icon="📈" label="Analytics" sidebarOpen={sidebarOpen} />
          <AdminNavLink href="/admin/reports" icon="📋" label="Reports" sidebarOpen={sidebarOpen} />
          <AdminNavLink href="/admin/settings" icon="⚙️" label="Settings" sidebarOpen={sidebarOpen} />
        </nav>

        <div className="border-t border-slate-800 p-3 space-y-2">
          {sidebarOpen && (
            <div className="p-2 bg-slate-800 rounded text-xs">
              <p className="font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          <Button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-50 text-xs">
            {sidebarOpen ? "Logout" : "🚪"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-950">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  )
}

function AdminNavLink({
  href,
  icon,
  label,
  sidebarOpen,
}: { href: string; icon: string; label: string; sidebarOpen: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-50 transition text-sm"
      title={label}
    >
      <span className="text-lg">{icon}</span>
      {sidebarOpen && <span>{label}</span>}
    </Link>
  )
}
