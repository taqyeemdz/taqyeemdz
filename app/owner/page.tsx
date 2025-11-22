"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { MessageCircle, Star, TrendingUp, QrCode } from "lucide-react"

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalFeedback: 0,
    avgRating: 0,
    newFeedback: 0,
    totalQRCodes: 0,
  })
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState("")

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      const { data: userData } = await supabase.from("users").select("business_id, name").eq("id", authUser.id).single()

      if (!userData?.business_id) {
        setLoading(false)
        return
      }

      // Get business data
      const { data: businessData } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", userData.business_id)
        .single()

      setBusinessName(businessData?.name || "")

      // Get feedback data
      const { data: feedbackData } = await supabase.from("feedback").select("*").eq("business_id", userData.business_id)

      // Get QR codes
      const { data: qrCodesData } = await supabase.from("qr_codes").select("*").eq("business_id", userData.business_id)

      if (feedbackData) {
        const newCount = feedbackData.filter((f) => f.status === "new").length
        const avgRating =
          feedbackData.length > 0
            ? Math.round((feedbackData.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbackData.length) * 10) /
              10
            : 0

        setStats({
          totalFeedback: feedbackData.length,
          avgRating,
          newFeedback: newCount,
          totalQRCodes: qrCodesData?.length || 0,
        })

        setRecentFeedback(
          feedbackData
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5),
        )
      }

      setLoading(false)
    }

    loadDashboardData()
  }, [])

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Business Dashboard</h1>
        <p className="text-slate-400">{businessName || "Your business"} • Overview and management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Feedback"
          value={stats.totalFeedback}
          icon={MessageCircle}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Average Rating"
          value={stats.avgRating}
          icon={Star}
          color="from-green-500 to-green-600"
          suffix="/5"
        />
        <StatCard
          title="New Feedback"
          value={stats.newFeedback}
          icon={TrendingUp}
          color="from-orange-500 to-orange-600"
        />
        <StatCard
          title="Active QR Codes"
          value={stats.totalQRCodes}
          icon={QrCode}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Recent Feedback */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-xl font-semibold text-slate-50 mb-4">Recent Feedback</h2>
        <div className="space-y-3">
          {recentFeedback.length === 0 ? (
            <p className="text-slate-400 text-sm">No feedback yet</p>
          ) : (
            recentFeedback.map((fb) => (
              <div
                key={fb.id}
                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-50">{fb.customer_name}</p>
                  <p className="text-xs text-slate-400 truncate">{fb.message}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-slate-50">{fb.rating}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      fb.status === "new"
                        ? "bg-red-500/20 text-red-300"
                        : fb.status === "viewed"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {fb.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 cursor-pointer hover:border-slate-600 transition">
          <h3 className="font-semibold text-slate-50 mb-2">Generate QR Code</h3>
          <p className="text-sm text-slate-400 mb-4">Create new feedback QR codes for your branches</p>
          <Link
            href="/owner/qr-codes/new"
            className="text-green-400 hover:text-green-300 text-sm font-medium"
          >
            Create →
          </Link>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 cursor-pointer hover:border-slate-600 transition">
          <h3 className="font-semibold text-slate-50 mb-2">View All Feedback</h3>
          <p className="text-sm text-slate-400 mb-4">Manage and respond to customer feedback</p>
          <Link href="/owner/feedback" className="text-green-400 hover:text-green-300 text-sm font-medium">
            View →
          </Link>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix = "",
}: {
  title: string
  value: number | string
  icon: any
  color: string
  suffix?: string
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${color} border-0`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">
            {value}
            {suffix}
          </p>
        </div>
        <Icon size={40} className="text-white/20" />
      </div>
    </Card>
  )
}
