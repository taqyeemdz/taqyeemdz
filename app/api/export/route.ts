import { serverDb } from "@/lib/server-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get("business_id")
    const format = searchParams.get("format") || "csv"

    if (!business_id) {
      return Response.json({ error: "business_id required" }, { status: 400 })
    }

    // Fetch from server-side JSON DB
    const feedbacks = serverDb.getFeedbackByBusiness(business_id)

    // === JSON Export ===
    if (format === "json") {
      return new Response(JSON.stringify(feedbacks, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="feedback-${new Date()
            .toISOString()
            .split("T")[0]}.json"`,
        },
      })
    }

    // === CSV Export ===
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Rating",
      "Category",
      "Subject",
      "Message",
      "Status",
      "Date",
    ]

    const rows = feedbacks.map(f => [
      f.customerName,
      f.customerEmail || "",
      f.customerPhone || "",
      f.rating,
      f.category,
      f.subject,
      f.message.replace(/"/g, '""'),
      f.status,
      f.createdat,
    ])

    const csv =
      [
        headers.map(h => `"${h}"`).join(","),
        ...rows.map(r => r.map(c => `"${c}"`).join(",")),
      ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback-${new Date()
          .toISOString()
          .split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    return Response.json({ error: "Failed to export data" }, { status: 500 })
  }
}
