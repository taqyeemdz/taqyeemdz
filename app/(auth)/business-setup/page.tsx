"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function BusinessSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    country: "Algeria",
    primaryColor: "#157F59",
    secondaryColor: "#D7B05B",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      // 1️⃣ Get Authenticated User
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 2️⃣ Create business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
          city: formData.city,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (businessError) throw businessError

      // 3️⃣ Link the user → this business
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ 
          role: "owner",
          business_id: business.id 
        })
        .eq("id", user.id)

      if (userUpdateError) throw userUpdateError

      // 4️⃣ Redirect to owner dashboard
      router.push("/owner")

    } catch (error) {
      console.error("Setup error:", error)
      alert("Could not complete setup — check console.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-white shadow-lg">

          {/* HEADER + STEPS */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Set Up Your Business</h1>
            <p className="text-muted-foreground">Step {step} of 3</p>
            <div className="w-full bg-border rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ---- STEP 1 ---- */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-6">Business Information</h2>

                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded p-2 min-h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* ---- STEP 2 ---- */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-6">Location</h2>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={formData.country} disabled />
                  </div>
                </div>
              </div>
            )}

            {/* ---- STEP 3 ---- */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-6">Branding</h2>

                <div className="grid grid-cols-2 gap-4">
                  {/* PRIMARY */}
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="w-12 h-12 border rounded"
                      />
                      <Input value={formData.primaryColor} readOnly />
                    </div>
                  </div>

                  {/* SECONDARY */}
                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryColor: e.target.value })
                        }
                        className="w-12 h-12 border rounded"
                      />
                      <Input value={formData.secondaryColor} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER BUTTONS */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <Button variant="outline" type="button" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}

              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
