"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { dbOperations } from "@/lib/db"
import type { Business } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    website: "",
    description: "",
    primaryColor: "#157F59",
    accentColor: "#D7B05B",
  })

  useEffect(() => {
    const currentUser = dbOperations.getCurrentUser()
    setUser(currentUser)

    if (currentUser?.business_id) {
      const biz = dbOperations.getBusiness(currentUser.business_id)
      if (biz) {
        setBusiness(biz)
        setFormData({
          businessName: biz.name,
          businessEmail: biz.email,
          businessPhone: biz.phone,
          website: biz.website || "",
          description: biz.description,
          primaryColor: biz.primaryColor,
          accentColor: biz.accentColor,
        })
      }
    }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (business) {
      const updated = dbOperations.updateBusiness(business.id, {
        ...business,
        name: formData.businessName,
        email: formData.businessEmail,
        phone: formData.businessPhone,
        website: formData.website,
        description: formData.description,
        primaryColor: formData.primaryColor,
        accentColor: formData.accentColor,
        updatedAt: new Date(),
      })

      if (updated) {
        setBusiness(updated)
      }
    }

    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    alert("Password change functionality would be implemented with real auth")
  }

  async function handleLogout() {
    dbOperations.logout()
    router.push("/login")
  }

  if (!business || !user) return <div>Loading...</div>

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your business and account settings</p>
      </div>

      {/* Business Settings */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Business Information</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md min-h-24 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-12 border border-border rounded-md cursor-pointer"
                />
                <Input value={formData.primaryColor} readOnly className="font-mono flex-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-12 h-12 border border-border rounded-md cursor-pointer"
                />
                <Input value={formData.accentColor} readOnly className="font-mono flex-1" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      {/* Account Settings */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Account Information</h2>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-semibold text-foreground text-lg">{user.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-semibold text-foreground text-lg">{user.email}</p>
          </div>

          <form onSubmit={handleChangePassword} className="pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">Change Password</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Password change would be implemented with real authentication
            </p>
          </form>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-8 border-destructive/30">
        <h2 className="text-2xl font-bold text-destructive mb-6">Danger Zone</h2>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-foreground mb-2">Logout</p>
            <p className="text-muted-foreground text-sm mb-4">End your current session</p>
            <Button
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
