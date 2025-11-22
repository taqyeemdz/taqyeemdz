"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    totalFeedback: 0,
    averageRating: 0,
    feedbackByCategory: {} as Record<string, number>,
    topBusinesses: [] as Array<{ name: string; feedbackCount: number }>,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      const supabase = createClient()

      const { data: feedback } = await supabase.from("feedback").select("*")
      const { data: businesses } = await supabase.from("businesses").select("*")

      if (feedback) {
        const totalFeedback = feedback.length
        const avgRating = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

        // Group by category
        const byCategory = feedback.reduce(
          (acc, f) => {
            acc[f.category] = (acc[f.category] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        // Top businesses
        const topBiz = (businesses || [])
          .map((b) => ({
            name: b.name,
            feedbackCount: feedback.filter((f) => f.business_id === b.id).length,
          }))
          .sort((a, b) => b.feedbackCount - a.feedbackCount)
          .slice(0, 5)

        setAnalyticsData({
          totalFeedback,
          averageRating: avgRating,
          feedbackByCategory: byCategory,
          topBusinesses: topBiz,
        })
      }

      setLoading(false)
    }

    loadAnalytics()
  }, [])

  if (loading) return <div className="text-slate-400">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Platform Analytics</h1>
        <p className="text-slate-400">System-wide feedback and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 border-0">
          <p className="text-blue-100 text-sm mb-1">Total Feedback</p>
          <p className="text-4xl font-bold text-white">{analyticsData.totalFeedback}</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-yellow-600 to-yellow-700 border-0">
          <p className="text-yellow-100 text-sm mb-1">Average Rating</p>
          <p className="text-4xl font-bold text-white">{analyticsData.averageRating.toFixed(2)}/5</p>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Feedback by Category</h2>
        <div className="space-y-3">
          {Object.entries(analyticsData.feedbackByCategory).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <p className="text-slate-300 text-sm capitalize">{category}</p>
              <div className="flex items-center gap-3">
                <div className="h-2 bg-slate-700 rounded-full flex-1" style={{ width: "200px" }}>
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(count / Object.values(analyticsData.feedbackByCategory).reduce((a, b) => a + b, 0)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-slate-400 font-semibold w-12">{count}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Businesses */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Top Businesses by Feedback</h2>
        <div className="space-y-2">
          {analyticsData.topBusinesses.map((biz, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm font-semibold">{i + 1}.</span>
                <p className="text-slate-50 font-medium">{biz.name}</p>
              </div>
              <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-1 rounded">
                {biz.feedbackCount} feedback
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
