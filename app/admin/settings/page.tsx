"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Settings,
  Shield,
  CreditCard,
  Bell,
  ToggleLeft,
  ToggleRight,
  Save,
  Globe
} from "lucide-react"

export default function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Manage global platform configurations and preferences.</p>
      </div>

      {/* 1. GENERAL SETTINGS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Settings size={20} className="text-gray-400" />
          Platform Identity
        </h2>
        <Card className="p-6 bg-white border-gray-100 shadow-sm rounded-2xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-600 mb-2 block font-medium">Platform Name</Label>
              <Input defaultValue="TaqyeemDZ" className="border-gray-200 focus:ring-indigo-500 bg-gray-50/50" />
              <p className="text-xs text-gray-400 mt-1.5">Visible in emails and page titles.</p>
            </div>
            <div>
              <Label className="text-gray-600 mb-2 block font-medium">Support Email</Label>
              <Input
                type="email"
                defaultValue="support@taqyeemdz.com"
                className="border-gray-200 focus:ring-indigo-500 bg-gray-50/50"
              />
              <p className="text-xs text-gray-400 mt-1.5">Where user inquiries are sent.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm px-6">
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          </div>
        </Card>
      </div>

      {/* 2. PRICING & LIMITS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={20} className="text-gray-400" />
          Subscription Defaults
        </h2>
        <Card className="p-6 bg-white border-gray-100 shadow-sm rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Label className="text-gray-600 mb-1 block text-sm font-semibold uppercase tracking-wider">Starter</Label>
              <div className="flex items-center gap-1 my-2">
                <span className="text-gray-400 text-lg">DZD</span>
                <Input type="number" defaultValue="29" className="border-none bg-transparent text-2xl font-bold p-0 h-auto focus:ring-0 w-20" />
              </div>
              <p className="text-xs text-gray-400">Monthly price</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <Label className="text-indigo-600 mb-1 block text-sm font-semibold uppercase tracking-wider">Pro</Label>
              <div className="flex items-center gap-1 my-2">
                <span className="text-indigo-400 text-lg">DZD</span>
                <Input type="number" defaultValue="79" className="border-none bg-transparent text-indigo-900 text-2xl font-bold p-0 h-auto focus:ring-0 w-20" />
              </div>
              <p className="text-xs text-indigo-400">Most popular</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Label className="text-gray-600 mb-1 block text-sm font-semibold uppercase tracking-wider">Enterprise</Label>
              <div className="flex items-center gap-1 my-2">
                <span className="text-gray-400 text-lg">DZD</span>
                <Input type="number" defaultValue="199" className="border-none bg-transparent text-2xl font-bold p-0 h-auto focus:ring-0 w-20" />
              </div>
              <p className="text-xs text-gray-400">High volume</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" className="text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl">
              Update Pricing
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. FEATURE TOGGLES */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Shield size={20} className="text-gray-400" />
          System Capabilities
        </h2>
        <Card className="bg-white border-gray-100 shadow-sm rounded-2xl divide-y divide-gray-50 overflow-hidden">
          {[
            { label: "New User Registrations", desc: "Allow new owners to sign up.", active: true },
            { label: "Maintenance Mode", desc: "Disable access for non-admins.", active: false },

          ].map((feature, idx) => (
            <div key={idx} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">{feature.label}</p>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
              <button className={`text-2xl transition-colors DZD{feature.active ? 'text-green-500' : 'text-gray-300'}`}>
                {feature.active ? <ToggleRight size={36} className="fill-current" /> : <ToggleLeft size={36} />}
              </button>
            </div>
          ))}
        </Card>
      </div>

    </div>
  )
}
