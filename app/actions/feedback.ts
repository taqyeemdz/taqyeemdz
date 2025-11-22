"use server"

import { serverDb } from "@/lib/server-db"
import type { Feedback } from "@/lib/types"
import { generateId } from "@/lib/utils"

// CREATE FEEDBACK
export async function createFeedback(
  feedbackData: Omit<Feedback, "id" | "createdat">
) {
  try {
    const feedback: Feedback = {
      ...feedbackData,
      id: generateId(),
      createdat: new Date().toISOString(),
    }

    return serverDb.createFeedback(feedback)
  } catch (error) {
    throw new Error("Failed to create feedback")
  }
}

// UPDATE FEEDBACK
export async function updateFeedback(
  id: string,
  updates: Partial<Feedback>
) {
  try {
    return serverDb.updateFeedback(id, {
      ...updates,
      respondedAt:
        updates.respondedAt ||
        (updates.status === "responded"
          ? new Date().toISOString()
          : undefined),
    })
  } catch (error) {
    throw new Error("Failed to update feedback")
  }
}

// GET FEEDBACK BY BUSINESS
export async function getFeedbackByBusiness(business_id: string) {
  try {
    return serverDb.getFeedbackByBusiness(business_id)
  } catch (error) {
    throw new Error("Failed to get feedback")
  }
}

// RESPOND TO FEEDBACK
export async function respondToFeedback(
  feedbackId: string,
  response: string
) {
  try {
    const feedback = serverDb.getFeedback(feedbackId)
    if (!feedback) throw new Error("Feedback not found")

    return serverDb.updateFeedback(feedbackId, {
      ...feedback,
      status: "responded",
      response,
      respondedAt: new Date().toISOString(),
    })
  } catch {
    throw new Error("Failed to respond to feedback")
  }
}

// EXPORT CSV
export async function exportFeedbackAsCSV(business_id: string) {
  try {
    const feedbacks = serverDb.getFeedbackByBusiness(business_id)

    const headers = [
      "Name", "Email", "Phone", "Rating",
      "Category", "Subject", "Message",
      "Status", "Date"
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

    return {
      csv,
      filename: `feedback-${new Date().toISOString().split("T")[0]}.csv`,
    }
  } catch (error) {
    throw new Error("Failed to export feedback")
  }
}

// EXPORT JSON
export async function exportFeedbackAsJSON(business_id: string) {
  try {
    const feedbacks = serverDb.getFeedbackByBusiness(business_id)

    return {
      json: JSON.stringify(feedbacks, null, 2),
      filename: `feedback-${new Date().toISOString().split("T")[0]}.json`,
    }
  } catch (error) {
    throw new Error("Failed to export feedback")
  }
}
