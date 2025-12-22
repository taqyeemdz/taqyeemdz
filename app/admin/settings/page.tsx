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
  Globe,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
  ArrowLeft,
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminSettings() {
  const supabase = supabaseBrowser;

  // States for Subscription Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [deletedPlanIds, setDeletedPlanIds] = useState<string[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isUpdatingPlans, setIsUpdatingPlans] = useState(false);

  // States for System Settings
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoadingPlans(true);
      setLoadingSettings(true);

      // Fetch Plans
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (plansError) {
        console.error("Error fetching plans:", plansError);
        toast.error("Failed to load subscription plans");
      } else {
        setPlans(plansData || []);
      }

      // Fetch System Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("*");

      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
        toast.error("Failed to load system settings");
      } else {
        const settingsMap: Record<string, any> = {};
        settingsData?.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }

      setLoadingPlans(false);
      setLoadingSettings(false);
    }

    fetchData();
  }, [supabase]);

  const handleUpdatePricing = async () => {
    setIsUpdatingPlans(true);
    try {
      // Basic validation
      if (plans.some(p => !p.name.trim())) {
        toast.error("All plans must have a name");
        setIsUpdatingPlans(false);
        return;
      }

      const res = await fetch("/api/admin/plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plans,
          deletedPlanIds,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Server communication failed (Invalid JSON)");
      }

      if (!res.ok) throw new Error(data?.error || "An unexpected error occurred on the server");
      // Refresh to get real IDs for new plans
      const { data: freshPlans } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      setPlans(freshPlans || []);
      setDeletedPlanIds([]);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving plans:", err);
      toast.error(err.message || "Failed to update pricing");
    } finally {
      setIsUpdatingPlans(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const keys = ["platform_name", "support_email", "registrations_enabled", "maintenance_mode"];
      const upsertData = keys
        .filter(key => settings[key] !== undefined)
        .map(key => ({ key, value: settings[key] }));

      if (upsertData.length > 0) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(upsertData, { onConflict: "key" });

        if (error) throw error;
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const updatePlan = (id: string, field: string, value: any) => {
    setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updatePlanPrice = (id: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    updatePlan(id, "price", price);
  };

  const addNewPlan = () => {
    const newPlan = {
      id: `new-${crypto.randomUUID()}`,
      name: "New Tier",
      price: 0,
      currency: "DZD",
      features: ["New Feature"],
      max_branches: 1,
      max_qr_codes: 5,
      max_feedback_monthly: 100,
      max_businesses: 1,
      is_active: true
    };
    setPlans([...plans, newPlan]);
  };

  const handleDeletePlan = (id: string) => {
    if (!confirm("Are you sure? This may affect users subscribed to this tier.")) return;
    if (!id.startsWith('new-')) {
      setDeletedPlanIds([...deletedPlanIds, id]);
    }
    setPlans(plans.filter(p => p.id !== id));
  };

  const addFeature = (planId: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return { ...p, features: [...(p.features || []), ""] };
      }
      return p;
    }));
  };

  const updateFeature = (planId: string, featureIndex: number, value: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const currentFeatures = p.features && Array.isArray(p.features) ? p.features : [];
        const newFeatures = [...currentFeatures];
        newFeatures[featureIndex] = value;
        return { ...p, features: newFeatures };
      }
      return p;
    }));
  };

  const removeFeature = (planId: string, featureIndex: number) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const currentFeatures = p.features && Array.isArray(p.features) ? p.features : [];
        const newFeatures = currentFeatures.filter((_: any, i: number) => i !== featureIndex);
        return { ...p, features: newFeatures };
      }
      return p;
    }));
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "system">("general");

  const isLoading = loadingPlans || loadingSettings;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "pricing", label: "Subscription Pricing", icon: CreditCard },
    { id: "system", label: "Security & Features", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage global platform configurations and preferences.</p>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit border border-gray-200 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === tab.id
              ? "bg-white text-indigo-600 shadow-md transform scale-[1.02]"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
          >
            <tab.icon size={18} className={activeTab === tab.id ? "text-indigo-600" : "text-gray-400"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="transition-all duration-500 ease-in-out">
        {activeTab === "general" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={22} className="text-indigo-500" />
              Platform Identity
            </h2>
            <Card className="p-8 bg-white border-gray-100 shadow-xl shadow-gray-100/50 rounded-[2rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500 font-bold uppercase tracking-wider ml-1">Platform Name</Label>
                  <Input
                    value={settings.platform_name || ""}
                    onChange={(e) => updateSetting("platform_name", e.target.value)}
                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg font-medium"
                    placeholder="Enter platform name"
                  />
                  <p className="text-xs text-gray-400 ml-1">Visible in emails and page titles.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500 font-bold uppercase tracking-wider ml-1">Support Email</Label>
                  <Input
                    type="email"
                    value={settings.support_email || ""}
                    onChange={(e) => updateSetting("support_email", e.target.value)}
                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg font-medium"
                    placeholder="support@example.com"
                  />
                  <p className="text-xs text-gray-400 ml-1">Where user inquiries are sent.</p>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-50 flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSavingGeneral}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 px-8 py-6 h-auto text-base font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {isSavingGeneral ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                  Save Identity Settings
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={22} className="text-indigo-500" />
                  Subscription Tiers
                </h2>
                <p className="text-sm text-gray-500 mt-1">Define pricing, limits, and features for each plan.</p>
              </div>
              <Button
                onClick={addNewPlan}
                variant="outline"
                className="rounded-xl border-dashed border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
              >
                <Plus size={18} className="mr-2" /> Add New Tier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`flex flex-col rounded-[2rem] border-2 transition-all duration-300 relative group ${plan.name === 'Pro'
                    ? 'border-indigo-500 shadow-xl shadow-indigo-100/50 scale-[1.02] z-10'
                    : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                    }`}
                >
                  {/* TOP DECOR */}
                  {plan.name === 'Pro' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="p-6 space-y-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Input
                          value={plan.name}
                          onChange={(e) => updatePlan(plan.id, "name", e.target.value)}
                          className="text-xl font-black border-none p-0 h-auto focus:ring-0 bg-transparent text-gray-900 w-full placeholder:text-gray-300"
                          placeholder="Plan Name"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-indigo-400 font-bold text-sm tracking-tight">{plan.currency}</span>
                          <Input
                            type="number"
                            value={plan.price}
                            onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                            className="text-3xl font-black border-none p-0 h-auto focus:ring-0 bg-transparent text-gray-900 w-24"
                          />
                          <span className="text-gray-400 text-xs font-semibold">/ month</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Limits */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</Label>
                        <button
                          onClick={() => updatePlan(plan.id, "is_active", !plan.is_active)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {plan.is_active ? 'Active' : 'Hidden'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Businesses</Label>
                          <Input
                            type="number"
                            value={plan.max_businesses}
                            onChange={(e) => updatePlan(plan.id, "max_businesses", parseInt(e.target.value) || 0)}
                            className="h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Branches / Biz</Label>
                          <Input
                            type="number"
                            value={plan.max_branches}
                            onChange={(e) => updatePlan(plan.id, "max_branches", parseInt(e.target.value) || 0)}
                            className="h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">QR Codes / Br</Label>
                          <Input
                            type="number"
                            value={plan.max_qr_codes}
                            onChange={(e) => updatePlan(plan.id, "max_qr_codes", parseInt(e.target.value) || 0)}
                            className="h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Feedback / Mo</Label>
                          <Input
                            type="number"
                            value={plan.max_feedback_monthly}
                            onChange={(e) => updatePlan(plan.id, "max_feedback_monthly", parseInt(e.target.value) || 0)}
                            className="h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 pt-4 border-t border-gray-50 flex-1">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan Perks</Label>
                        <button onClick={() => addFeature(plan.id)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-md transition-all">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {plan.features?.map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 group/feat">
                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                            <Input
                              value={feature}
                              onChange={(e) => updateFeature(plan.id, idx, e.target.value)}
                              className="border-none p-0 h-auto focus:ring-0 bg-transparent text-sm text-gray-600 flex-1 font-medium"
                            />
                            <button onClick={() => removeFeature(plan.id, idx)} className="opacity-0 group-hover/feat:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button
                onClick={handleUpdatePricing}
                disabled={isUpdatingPlans}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] shadow-xl shadow-indigo-100 px-10 py-7 h-auto text-lg font-black transition-all hover:scale-105 active:scale-95"
              >
                {isUpdatingPlans ? <Loader2 size={24} className="mr-3 animate-spin" /> : <Save size={24} className="mr-3" />}
                Save Subscription Changes
              </Button>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield size={22} className="text-indigo-500" />
              Security & Capabilities
            </h2>
            <Card className="bg-white border-gray-100 shadow-xl shadow-gray-100/50 rounded-[2rem] divide-y divide-gray-50 overflow-hidden">
              {[
                { key: "registrations_enabled", label: "Public Registrations", desc: "Allow new business owners to sign up independently.", icon: Globe },
                { key: "maintenance_mode", label: "Maintenance Mode", desc: "Restrict platform access to administrative personnel only.", icon: Bell },

              ].map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-8 hover:bg-gray-50/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${settings[feature.key] ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <feature.icon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{feature.label}</p>
                      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting(feature.key, !settings[feature.key])}
                    className={`transition-all duration-300 ${settings[feature.key] ? 'text-indigo-600 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    {settings[feature.key] ? <ToggleRight size={54} className="fill-current" /> : <ToggleLeft size={54} />}
                  </button>
                </div>
              ))}
              <div className="p-8 bg-gray-50/50 flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSavingGeneral}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 px-8 py-4 h-auto text-base font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {isSavingGeneral ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                  Save Security Changes
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowSuccess(false)} />
          <Card className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                <CheckCircle2 size={48} className="text-green-500 relative z-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Changes Saved!</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Your system settings have been updated successfully and are now live.
              </p>
              <Button
                onClick={() => setShowSuccess(false)}
                className="mt-10 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-6 font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-200"
              >
                Wonderful
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
