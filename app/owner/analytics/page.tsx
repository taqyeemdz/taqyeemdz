"use client"

import { useEffect, useState } from "react"
import { dbOperations } from "@/lib/db"
import type { Business, Feedback } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState({
    totalFeedback: 0,
    avgRating: 0,
    responseRate: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    categoryDistribution: {} as Record<string, number>,
    dailyTrend: [] as Array<{ date: string; count: number; avgRating: number }>,
  })

  useEffect(() => {
    const user = dbOperations.getCurrentUser()
    const business_id = user?.business_id   // ✔ FIX

    if (!business_id) return

    const biz = dbOperations.getBusiness(business_id)
    setBusiness(biz || null)

    const all = dbOperations.getFeedbackByBusiness(business_id)
    setFeedbacks(all)

    if (all.length > 0) {
      // Average Rating
      const avgRating =
  Math.round(
    (all.reduce((sum: number, f: Feedback) => sum + f.rating, 0) / all.length) * 10
  ) / 10


      const responded = all.filter((f: { status: string }) => f.status === "responded").length
      const responseRate = Math.round((responded / all.length) * 100)

      const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      const categoryDist: Record<string, number> = {}

      all.forEach((f: Feedback) => {
  ratingDist[f.rating as keyof typeof ratingDist]++
  categoryDist[f.category] = (categoryDist[f.category] || 0) + 1
})


      // ===== DAILY TREND =====
      const daily: Record<string, Feedback[]> = {}

      all.forEach((f: Feedback) => {
        const date = new Date(f.createdat).toLocaleDateString()
        if (!daily[date]) daily[date] = []
        daily[date].push(f)
      })

      const trend = Object.entries(daily)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-30)
        .map(([date, feedbacks]) => ({
          date,
          count: feedbacks.length,
          avgRating:
            Math.round(
              (feedbacks.reduce(
                (sum: number, f: Feedback) => sum + f.rating,
                0
              ) /
                feedbacks.length) *
                10
            ) / 10,
        }))

      setStats({
        totalFeedback: all.length,
        avgRating,
        responseRate,
        ratingDistribution: ratingDist,
        categoryDistribution: categoryDist,
        dailyTrend: trend,
      })
    }
  }, [])

  if (!business) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-2">Total Feedback</p>
          <p className="text-4xl font-bold text-primary">{stats.totalFeedback}</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-2">Average Rating</p>
          <p className="text-4xl font-bold text-accent">{stats.avgRating}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 5</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-2">Response Rate</p>
          <p className="text-4xl font-bold text-secondary">{stats.responseRate}%</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-2">Avg Rating Trend</p>
          <p className="text-2xl font-bold">↑</p>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Rating Distribution</h2>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-4">
              <div className="w-12 text-right">
                <span className="font-semibold">{rating}★</span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-primary h-full transition-all rounded-full"
                  style={{
                    width:
                      stats.totalFeedback > 0
                        ? `${
                            (stats.ratingDistribution[
                              rating as keyof typeof stats.ratingDistribution
                            ] /
                              stats.totalFeedback) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>
              <div className="w-12 text-right">
                <span className="font-semibold">
                  {
                    stats.ratingDistribution[
                      rating as keyof typeof stats.ratingDistribution
                    ]
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Feedback by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(stats.categoryDistribution).map(
            ([category, count]) => (
              <div key={category} className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground capitalize">{category}</p>
                <p className="text-2xl font-bold text-primary">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((count / stats.totalFeedback) * 100)}% of total
                </p>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Daily Trend */}
      {stats.dailyTrend.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Feedback Trend (Last 30 Days)
          </h2>
          <div className="space-y-4">
            {stats.dailyTrend.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <p className="font-semibold text-foreground">{day.date}</p>
                  <p className="text-sm text-muted-foreground">{day.count} feedback received</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">⭐ {day.avgRating}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Export Data</h2>
        <p className="text-muted-foreground mb-4">
          Download your feedback data for further analysis
        </p>

        <Button
          onClick={() => {
            const csv = [
              ["Name", "Email", "Rating", "Category", "Subject", "Message", "Status", "Date"],
              ...feedbacks.map((f) => [
                f.customerName,
                f.customerEmail || "",
                f.rating,
                f.category,
                f.subject,
                f.message,
                f.status,
                new Date(f.createdat).toISOString(),
              ]),
            ]
              .map((row) => row.map((cell) => `"${cell}"`).join(","))
              .join("\n")

            const link = document.createElement("a")
            link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
            link.download = `feedback-${new Date().toISOString().split("T")[0]}.csv`
            link.click()
          }}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          Download as CSV
        </Button>
      </Card>
    </div>
  )
}
