"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Admin Settings</h1>
        <p className="text-slate-400">Platform configuration and preferences</p>
      </div>

      {/* General Settings */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 mb-1 block">Platform Name</Label>
            <Input defaultValue="TaqyeemDZ" className="bg-slate-800 border-slate-700 text-slate-50" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1 block">Support Email</Label>
            <Input
              type="email"
              placeholder="support@taqyeemdz.com"
              className="bg-slate-800 border-slate-700 text-slate-50"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
        </div>
      </Card>

      {/* Pricing Settings */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Pricing Plans</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300 mb-1 block">Starter Price ($/mo)</Label>
              <Input type="number" defaultValue="29" className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
            <div>
              <Label className="text-slate-300 mb-1 block">Pro Price ($/mo)</Label>
              <Input type="number" defaultValue="79" className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
            <div>
              <Label className="text-slate-300 mb-1 block">Enterprise Price ($/mo)</Label>
              <Input type="number" defaultValue="199" className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Update Pricing</Button>
        </div>
      </Card>

      {/* Feature Toggles */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-50 mb-4">Feature Toggles</h2>
        <div className="space-y-3">
          {["Maintenance Mode", "New Registrations", "API Access", "Email Notifications"].map((feature) => (
            <div key={feature} className="flex items-center justify-between p-3 bg-slate-800 rounded">
              <p className="text-slate-300">{feature}</p>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
