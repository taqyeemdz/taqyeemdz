"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { dbOperations } from "@/lib/db"
import type { Feedback } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function FeedbackFormPage() {
  const params = useParams()
  const router = useRouter()
  const qrCode = params.qrCode as string

  const [qrCodeData, setQrCodeData] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    rating: 5,
    category: "general",
    subject: "",
    message: "",
  })

  // Load QR + Business
  useEffect(() => {
    const qr = dbOperations.getQRCodeByCode(qrCode)
    if (!qr) {
      router.push("/")
      return
    }

    setQrCodeData(qr)

    const biz = dbOperations.getBusiness(qr.business_id)
    setBusiness(biz)
    setLoading(false)
  }, [qrCode, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const feedback: Feedback = {
      id: generateId(),
      business_id: qrCodeData.business_id,
      branchId: qrCodeData.branchId,
      qrCodeId: qrCodeData.id, // if your type uses qrCodeId rename correctly
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      rating: formData.rating,
      category: formData.category,
      subject: formData.subject,
      message: formData.message,
      status: "new",
      createdat: new Date().toISOString(), // FIX: must be string
      respondedAt: undefined,
      priority: "high"
    }

    dbOperations.createFeedback(feedback)

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    )
  }

  if (!qrCodeData || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="p-8 text-center">
          <p className="text-destructive font-semibold">Invalid QR Code</p>
          <p className="text-muted-foreground mt-2">
            This QR code is no longer valid or has expired.
          </p>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-primary mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your feedback has been received.
          </p>
          <Button onClick={() => router.push("/")}>Go Back</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-white">
          {/* Header */}
          <div className="mb-8 text-center">
            {business.logo && (
              <img src={business.logo} alt={business.name} className="h-16 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold">{business.name}</h1>
            <p className="text-muted-foreground mt-2">
              We'd love your feedback!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="flex gap-3 justify-center">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`text-4xl transition-all ${star <= formData.rating ? "scale-110" : "opacity-30"}`}
                  style={{ color: star <= formData.rating ? business.primaryColor : "#ccc" }}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                required
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            {/* Email / Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={formData.customerEmail}
                  onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  value={formData.customerPhone}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="general">General</option>
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="staff">Staff</option>
                <option value="pricing">Pricing</option>
                <option value="cleanliness">Cleanliness</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <Label>Subject</Label>
              <Input
                required
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            {/* Message */}
            <div>
              <Label>Your Feedback</Label>
              <textarea
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full border rounded-md p-3 min-h-32"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
              style={{ backgroundColor: business.primaryColor }}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
