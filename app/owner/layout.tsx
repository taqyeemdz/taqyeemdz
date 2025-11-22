"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Menu, X, LayoutDashboard, MessageCircle, QrCode, BarChart3, Store, Settings, LogOut } from "lucide-react"

export default function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login")
        return
      }

      const { data: userProfile } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (!userProfile || userProfile.role !== "owner") {
        router.push("/")
        return
      }

      setUser(userProfile)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) return null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
    { href: "/owner/feedback", label: "Feedback", icon: MessageCircle },
    { href: "/owner/qr-codes", label: "QR Codes", icon: QrCode },
    { href: "/owner/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/owner/branches", label: "Branches", icon: Store },
    { href: "/owner/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Owner Sidebar */}
      <div
        className="bg-slate-900 text-slate-50 transition-all duration-300 flex flex-col border-r border-slate-800"
        style={{ width: sidebarOpen ? "280px" : "80px" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              TaqyeemDZ
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-50 transition text-sm"
                title={item.label}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-3 space-y-2">
          {sidebarOpen && user && (
            <div className="p-2 bg-slate-800 rounded text-xs">
              <p className="font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-slate-400 truncate">{user.email}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-50 text-xs flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            {sidebarOpen && "Logout"}
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
