import { serverDb } from "@/lib/server-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get("business_id")
    const branchId = searchParams.get("branchId")

    if (!business_id) {
      return Response.json({ error: "business_id required" }, { status: 400 })
    }

    // get feedback from server DB
    let feedbacks = serverDb.getFeedbackByBusiness(business_id)

    // filter by branch
    if (branchId) {
      feedbacks = feedbacks.filter(f => f.branchId === branchId)
    }

    return Response.json(feedbacks)
  } catch (error) {
    return Response.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const feedback = {
      ...data,
      createdat: new Date().toISOString(),   // must be string
    }

    const created = serverDb.createFeedback(feedback)
    return Response.json(created, { status: 201 })
  } catch (error) {
    return Response.json({ error: "Failed to create feedback" }, { status: 500 })
  }
}
