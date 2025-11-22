import { serverDb } from "@/lib/server-db"
import { generateId } from "@/lib/utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 })
    }

    const notifications = serverDb.getNotificationsByUser(userId)
    return Response.json(notifications)
  } catch {
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const notification = {
      ...data,
      id: generateId(),
      read: false,
      createdat: new Date().toISOString(),
    }

    const created = serverDb.createNotification(notification)
    return Response.json(created, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 })
    }

    const updated = serverDb.markNotificationAsRead(id)

    if (!updated) {
      return Response.json({ error: "Notification not found" }, { status: 404 })
    }

    return Response.json(updated)
  } catch {
    return Response.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
