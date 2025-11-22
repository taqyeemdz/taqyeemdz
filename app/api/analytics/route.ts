import { serverDb } from "@/lib/server-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get("business_id")
    const branchId = searchParams.get("branchId")

    if (!business_id) {
      return Response.json({ error: "business_id required" }, { status: 400 })
    }

    // FETCH FROM SERVER DB (NOT localStorage)
    let feedbacks = serverDb.getFeedbackByBusiness(business_id)

    if (branchId) {
      feedbacks = feedbacks.filter(f => f.branchId === branchId)
    }

    const qrcodes = serverDb.getQRCodesByBusiness(business_id)
    const totalScans = qrcodes.reduce((sum, qr) => sum + qr.scansCount, 0)

    const avgRating =
      feedbacks.length > 0
        ? Math.round((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length) * 10) / 10
        : 0

    const responded = feedbacks.filter(f => f.status === "responded").length
    const responseRate =
      feedbacks.length > 0 ? Math.round((responded / feedbacks.length) * 100) : 0

    // Category distribution
    const categoryDistribution: Record<string, number> = {}
    feedbacks.forEach(f => {
      if (!f.category) return
      categoryDistribution[f.category] =
        (categoryDistribution[f.category] || 0) + 1
    })

    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    feedbacks.forEach(f => {
      ratingDistribution[f.rating as 1 | 2 | 3 | 4 | 5]++
    })

    // Daily trend (last 30 days)
    const daily: Record<string, any[]> = {}
    feedbacks.forEach(f => {
      const date = new Date(f.createdat).toLocaleDateString()
      if (!daily[date]) daily[date] = []
      daily[date].push(f)
    })

    const feedbackTrend = Object.entries(daily)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-30)
      .map(([date, list]) => ({
        date,
        count: list.length,
        avgRating:
          Math.round(
            (list.reduce((sum, f) => sum + f.rating, 0) / list.length) * 10
          ) / 10,
      }))

    return Response.json({
      totalFeedback: feedbacks.length,
      averageRating: avgRating,
      totalScans,
      responseRate,
      categoryDistribution,
      ratingDistribution,
      feedbackTrend,
    })
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
