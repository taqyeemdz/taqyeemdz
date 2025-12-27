"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  CreditCard,
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "plan">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [ownerPlan, setOwnerPlan] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return router.replace("/auth/login");

      // 1. Fetch Owner Profile + Plan
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq("id", user.id)
        .single();

      if (profile) {
        setOwnerProfile(profile);
        setOwnerPlan(profile.subscription_plans);
        setFormData({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          email: user.email || ""
        });
      }

      // 2. Fetch Businesses for usage stats
      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length > 0) {
        const { data: businessList } = await supabase
          .from("businesses")
          .select("*")
          .in("id", businessIds);

        setBusinesses(businessList || []);
      }

      setLoading(false);
    })();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone
      })
      .eq("id", ownerProfile.id);

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile." });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setOwnerProfile({ ...ownerProfile, ...formData });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }



  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6 md:p-8">
      {/* HEADER */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 font-medium">Manage your personal information and subscription plan.</p>

        {/* TAB SWITCHER */}
        <div className={`flex p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm mt-6 transition-all duration-500 ${activeTab === "profile" ? " mx-auto" : "w-full"}`}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "plan"
                ? "bg-white text-gray-900 shadow-md ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <User size={18} />
              Coordonnées
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "plan"
                ? "bg-white text-gray-900 shadow-md ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <CreditCard size={18} />
              Active Plan
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "profile" ? (
          <div className="w-full">
            {/* PROFILE INFO */}
            <Card className="p-8 md:p-10 rounded-[2.5rem] border-gray-200 shadow-sm space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Personal Details</h2>
                <p className="text-gray-500 text-sm font-medium">Update your account information.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="pl-12 py-6 bg-gray-50 border-gray-100 rounded-2xl font-bold focus:ring-black"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-12 py-6 bg-gray-50 border-gray-100 rounded-2xl font-bold focus:ring-black"
                        placeholder="+213..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="email"
                      value={formData.email}
                      readOnly
                      className="pl-12 py-6 bg-gray-100 border-gray-200 rounded-2xl font-bold cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 ml-1">* Email cannot be changed here.</p>
                </div>

                {message && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                    {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold">{message.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="group flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* USAGE DETAILS */}
              <div className="lg:col-span-2">
                <Card className="p-8 rounded-[2.5rem] border-gray-200 shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Building2 size={24} className="text-gray-400" />
                    Limits & Usage
                  </h3>
                  <div className="space-y-6">
                    <UsageBar label="Businesses" current={businesses.length} total={ownerPlan?.max_businesses} />
                  </div>

                  <div className="pt-6 border-t border-gray-50 text-center">
                    <h3 className="text-sm font-black text-gray-900 tracking-tight mb-2">Need a customized plan?</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-md mx-auto">
                      If your business requires more branches, higher limits, or enterprise-grade features, contact our support team.
                    </p>
                    <button className="mt-4 px-6 py-2.5 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl font-black text-[10px] hover:bg-gray-100 transition-all active:scale-95 uppercase tracking-widest">
                      Contact Support
                    </button>
                  </div>
                </Card>
              </div>

              {/* ACCOUNT STATUS (Moved here) */}
              <div className="space-y-6">
                <Card className="p-6 rounded-[2.5rem] border-gray-200 shadow-sm bg-gray-50/50">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Account Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">Current Plan</span>
                      <span className="px-3 py-1 bg-white border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase shadow-sm">
                        {ownerPlan?.name || "No Plan"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">User Role</span>
                      <span className="text-sm font-black text-gray-900">Owner</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">Status</span>
                      <span className="flex items-center gap-1.5 text-green-600 text-xs font-black uppercase">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, current, total }: { label: string, current: number, total: number }) {
  const percentage = total >= 999999 ? 0 : Math.min((current / total) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-900">{current} / {total >= 999999 ? '∞' : total}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${total >= 999999 ? 5 : percentage}%` }}
        />
      </div>
    </div>
  );
}

function ChevronDown({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
