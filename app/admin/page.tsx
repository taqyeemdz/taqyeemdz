"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { Business } from "@/lib/types"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalUsers: 0,
    totalFeedback: 0,
    activeBusinesses: 0,
  })
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient()

      // Fetch statistics
      const { data: businesses } = await supabase.from("businesses").select("*")  .order("createdat", { ascending: false })

      const { data: users } = await supabase.from("users").select("*")
      const { data: feedback } = await supabase.from("feedback").select("*")

      const activeBiz = businesses?.filter((b) => b.subscriptionstatus === "active").length || 0

      setStats({
        totalBusinesses: businesses?.length || 0,
        totalUsers: users?.length || 0,
        totalFeedback: feedback?.length || 0,
        activeBusinesses: activeBiz,
      })

      setRecentBusinesses((businesses || []).slice(-5).reverse())
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Platform overview and management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Businesses" value={stats.totalBusinesses} icon="🏢" color="from-blue-500 to-blue-600" />
        <StatCard
          title="Active Businesses"
          value={stats.activeBusinesses}
          icon="✅"
          color="from-green-500 to-green-600"
        />
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="from-purple-500 to-purple-600" />
        <StatCard title="Total Feedback" value={stats.totalFeedback} icon="💬" color="from-orange-500 to-orange-600" />
      </div>

      {/* Recent Businesses */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-xl font-semibold text-slate-50 mb-4">Recent Businesses</h2>
        <div className="space-y-3">
          {recentBusinesses.length === 0 ? (
            <p className="text-slate-400 text-sm">No businesses yet</p>
          ) : (
            recentBusinesses.map((biz) => (
              <div
                key={biz.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-750 transition"
              >
                <div>
                  <p className="font-semibold text-slate-50">{biz.name}</p>
                  <p className="text-xs text-slate-400">{biz.email}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    biz.subscriptionstatus === "active"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {biz.subscriptionstatus}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 cursor-pointer hover:border-slate-600 transition">
          <h3 className="font-semibold text-slate-50 mb-2">Manage Businesses</h3>
          <p className="text-sm text-slate-400 mb-4">View, approve, and manage all business accounts</p>
          <a href="/admin/businesses" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Go to Businesses →
          </a>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 cursor-pointer hover:border-slate-600 transition">
          <h3 className="font-semibold text-slate-50 mb-2">User Management</h3>
          <p className="text-sm text-slate-400 mb-4">Manage user accounts and roles</p>
          <a href="/admin/users" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Go to Users →
          </a>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${color} border-0`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <span className="text-4xl opacity-30">{icon}</span>
      </div>
    </Card>
  )
}
