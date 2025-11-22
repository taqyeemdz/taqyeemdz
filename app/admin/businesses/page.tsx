"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Business } from "@/lib/types"

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [lastInvite, setLastInvite] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    category: "",
    subscriptionPlan: "basic",
    subscriptionstatus: "inactive",
  })

  // Load businesses
  useEffect(() => {
    const loadBusinesses = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .order("createdat", { ascending: false })

      setBusinesses(data || [])
      setFilteredBusinesses(data || [])
      setLoading(false)
    }

    loadBusinesses()
  }, [])

  // Search filter
  const handleSearch = (value: string) => {
    setSearchTerm(value)

    const filtered = businesses.filter((b) =>
      (b.name + b.email + b.city).toLowerCase().includes(value.toLowerCase())
    )

    setFilteredBusinesses(filtered)
  }

  // Create business + invite flow
  async function handleCreateBusiness(e: React.FormEvent) {
  e.preventDefault();
  const supabase = createClient();

  // 1️⃣ Create Business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert([
      {
        name: formData.name,
        email: formData.email,
        city: formData.city,
        category: formData.category,
        subscriptionPlan: formData.subscriptionPlan,
        subscriptionstatus: formData.subscriptionstatus,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      },
    ])
    .select("*")
    .single();

  if (bizError) {
    alert(bizError.message);
    return;
  }

  // 2️⃣ Check if owner already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", formData.email)
    .maybeSingle();

  let inviteLink: string | null = null;

  // 3️⃣ Automatically create Auth user for the owner
const res = await fetch("/api/admin/create-owner", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: formData.email,
    business_id: business.id,
    name: formData.name,
  }),
});

const result = await res.json();

if (result.error) {
  alert(result.error);
  return;
}

alert(`Owner created! Temporary password: ${result.tempPassword}`);

  // 4️⃣ If user exists → update them
  if (existingUser) {
    await supabase
      .from("users")
      .update({
        role: "owner",
        business_id: business.id,
        updatedat: new Date().toISOString(),
      })
      .eq("id", existingUser.id);

    alert("Business created and linked to existing owner!");
  }

  // 5️⃣ Update UI
  setBusinesses((prev) => [business, ...prev]);
  setFilteredBusinesses((prev) => [business, ...prev]);
  setShowForm(false);

  // Reset Form
  setFormData({
    name: "",
    email: "",
    city: "",
    category: "",
    subscriptionPlan: "basic",
    subscriptionstatus: "inactive",
  });
}


  if (loading) return <div className="text-slate-400">Loading businesses...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Business Management</h1>
          <p className="text-slate-400">Manage all businesses</p>
        </div>

        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setShowForm(true)}
        >
          Add Business
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search by name, email, or city..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-slate-800 border-slate-700 text-slate-50 placeholder-slate-500"
        />
      </div>

      {/* Add Business Form */}
      {showForm && (
        <Card className="p-6 bg-slate-800 border-slate-700 space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">New Business</h2>

          <form onSubmit={handleCreateBusiness} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["name", "email", "city", "category"].map((field) => (
              <div key={field} className="col-span-1">
                <Label className="text-slate-300 capitalize">{field}</Label>
                <Input
                  type={field === "email" ? "email" : "text"}
                  value={(formData as any)[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  required={field !== "category"}
                  className="bg-slate-700 border-slate-600 text-slate-50"
                />
              </div>
            ))}

            {/* Plan */}
            <div>
              <Label className="text-slate-300">Plan</Label>
              <select
                value={formData.subscriptionPlan}
                onChange={(e) =>
                  setFormData({ ...formData, subscriptionPlan: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 text-slate-50 rounded p-2"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <Label className="text-slate-300">Status</Label>
              <select
                value={formData.subscriptionstatus}
                onChange={(e) =>
                  setFormData({ ...formData, subscriptionstatus: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 text-slate-50 rounded p-2"
              >
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
              </select>
            </div>

            {/* Submit */}
            <div className="col-span-2 flex gap-2 mt-4">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white flex-1">
                Create Business
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Invite Link */}
      {lastInvite && (
        <Card className="p-4 bg-blue-500/10 border border-blue-500 text-blue-300 mt-4">
          <p className="text-sm">Owner Invite Link:</p>
          <code className="break-all">{lastInvite}</code>
        </Card>
      )}

      {/* Businesses Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Owner Email</th>
                <th className="px-6 py-3">City</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((biz) => (
                <tr key={biz.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-6 py-4">{biz.name}</td>
                  <td className="px-6 py-4">{biz.email}</td>
                  <td className="px-6 py-4">{biz.city}</td>
                  <td className="px-6 py-4">{biz.subscriptionPlan}</td>
                  <td className="px-6 py-4">{biz.subscriptionstatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
