"use client"

import { useEffect, useState } from "react"
import { dbOperations } from "@/lib/db"
import type { Feedback, Business } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FeedbackPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [response, setResponse] = useState("")
  const [filter, setFilter] = useState<"all" | "new" | "viewed" | "responded">("all")

  useEffect(() => {
    const user = dbOperations.getCurrentUser()
    if (user?.business_id) {
      const biz = dbOperations.getBusiness(user.business_id)
      setBusiness(biz || null)

      const all = dbOperations.getFeedbackByBusiness(user.business_id)
      setFeedbacks(all.sort((a: { createdAt: string | number | Date }, b: { createdat: string | number | Date }) => new Date(b.createdat).getTime() - new Date(a.createdAt).getTime()))
    }
  }, [])

  const filteredFeedbacks = feedbacks.filter((f) => filter === "all" || f.status === filter)

  function handleMarkAsViewed(feedback: Feedback) {
    dbOperations.updateFeedback(feedback.id, { ...feedback, status: "viewed" })
    setFeedbacks(feedbacks.map((f) => (f.id === feedback.id ? { ...f, status: "viewed" } : f)))
  }

  function handleRespond(feedback: Feedback) {
    if (!response.trim()) return

    const updated = {
      ...feedback,
      status: "responded" as const,
      response,
      respondedAt: new Date(),
    }

    dbOperations.updateFeedback(feedback.id, updated)
    setFeedbacks(feedbacks.map((f) => (f.id === feedback.id ? updated : f)))
    setSelectedFeedback(null)
    setResponse("")
  }

  if (!business) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Customer Feedback</h1>
        <p className="text-muted-foreground">Manage and respond to customer feedback</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "new", "viewed", "responded"] as const).map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
            variant={filter === f ? "default" : "outline"}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feedback List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <Card
              key={feedback.id}
              className={`p-6 cursor-pointer transition hover:shadow-lg ${
                selectedFeedback?.id === feedback.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => {
                setSelectedFeedback(feedback)
                if (feedback.status === "new") handleMarkAsViewed(feedback)
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{feedback.customerName}</h3>
                  <p className="text-sm text-muted-foreground">{feedback.subject}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl">⭐ {feedback.rating}</span>
                  <p
                    className={`text-xs font-semibold mt-1 ${
                      feedback.status === "new"
                        ? "text-destructive"
                        : feedback.status === "viewed"
                          ? "text-accent"
                          : "text-primary"
                    }`}
                  >
                    {feedback.status.toUpperCase()}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground line-clamp-2">{feedback.message}</p>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-xs bg-muted px-2 py-1 rounded">{feedback.category}</span>
                <span className="text-xs text-muted-foreground">{new Date(feedback.createdat).toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedFeedback ? (
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">Feedback Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{selectedFeedback.customerName}</p>
                  {selectedFeedback.customerEmail && (
                    <p className="text-sm text-muted-foreground">{selectedFeedback.customerEmail}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-3xl font-bold">⭐ {selectedFeedback.rating}/5</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold text-foreground capitalize">{selectedFeedback.category}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Message</p>
                  <p className="text-foreground">{selectedFeedback.message}</p>
                </div>

                {selectedFeedback.response && (
                  <div className="bg-primary/5 p-3 rounded">
                    <p className="text-sm text-muted-foreground">Your Response</p>
                    <p className="text-foreground">{selectedFeedback.response}</p>
                  </div>
                )}
              </div>

              {selectedFeedback.status !== "responded" && (
                <div className="space-y-3">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Write your response..."
                    className="w-full px-3 py-2 border border-border rounded-md min-h-24 font-sans text-sm"
                  />
                  <Button
                    onClick={() => handleRespond(selectedFeedback)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!response.trim()}
                  >
                    Send Response
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              <p>Select a feedback to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
