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
  ChevronDown,
  ChevronUp,
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
  const [expandedPlanIds, setExpandedPlanIds] = useState<string[]>([]);

  const togglePlanExpansion = (id: string) => {
    setExpandedPlanIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-lg">Manage global platform configurations and preferences.</p>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full sm:w-fit border border-gray-200 shadow-inner overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-1 sm:flex-none justify-center ${activeTab === tab.id
              ? "bg-white text-indigo-600 shadow-md transform scale-[1.02] sm:px-6"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
          >
            <tab.icon size={16} className={`shrink-0 ${activeTab === tab.id ? "text-indigo-600" : "text-gray-400"}`} />
            {activeTab === tab.id && (
              <span className="animate-in fade-in zoom-in duration-300">
                {tab.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="transition-all duration-500 ease-in-out">
        {activeTab === "general" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={20} className="text-indigo-500" />
              Platform Identity
            </h2>
            <Card className="p-6 sm:p-8 bg-white border-gray-100 shadow-xl shadow-gray-100/50 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider ml-1">Platform Name</Label>
                  <Input
                    value={settings.platform_name || ""}
                    onChange={(e) => updateSetting("platform_name", e.target.value)}
                    className="h-12 sm:h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base sm:text-lg font-medium"
                    placeholder="Enter platform name"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-400 ml-1">Visible in emails and page titles.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider ml-1">Support Email</Label>
                  <Input
                    type="email"
                    value={settings.support_email || ""}
                    onChange={(e) => updateSetting("support_email", e.target.value)}
                    className="h-12 sm:h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base sm:text-lg font-medium"
                    placeholder="support@example.com"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-400 ml-1">Where user inquiries are sent.</p>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-6 border-t border-gray-50 flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSavingGeneral}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-100 px-6 sm:px-8 py-4 sm:py-6 h-auto text-sm sm:text-base font-bold transition-all hover:scale-105 active:scale-95"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-indigo-500" />
                  Subscription Tiers
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Define pricing, limits, and features for each plan.</p>
              </div>
              <Button
                onClick={addNewPlan}
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-dashed border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-sm"
              >
                <Plus size={16} className="mr-2" /> Add New Tier
              </Button>
            </div>

            <div className="flex flex-col gap-3 animate-in fade-in duration-700">
              {plans.map((plan) => {
                const isExpanded = expandedPlanIds.includes(plan.id);
                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300 relative group overflow-hidden ${plan.name === 'Pro'
                      ? 'border-indigo-500 shadow-xl shadow-indigo-100/50 z-10'
                      : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                      }`}
                  >


                    {/* COLLAPSIBLE HEADER */}
                    <div
                      className={`p-2 sm:p-3 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
                      onClick={() => togglePlanExpansion(plan.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        <div className="flex flex-row items-center justify-between gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-base sm:text-lg font-black text-gray-900 truncate">
                              {plan.name || "Untitled Plan"}
                            </h3>
                            {!plan.is_active && (
                              <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                Hidden
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="bg-gray-900 text-white px-2.5 py-1 rounded-md text-xs font-bold font-mono whitespace-nowrap">
                              {plan.price} <span className="text-gray-400 font-normal">{plan.currency}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDABLE BODY */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        {/* Header Inputs (Editable Name/Price) */}
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete Tier
                            </Button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-6 p-4 bg-gray-50/50 rounded-2xl">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-gray-400 uppercase">Plan Name</Label>
                              <Input
                                value={plan.name}
                                onChange={(e) => updatePlan(plan.id, "name", e.target.value)}
                                className="bg-white border-gray-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-gray-400 uppercase">Price ({plan.currency})</Label>
                              <Input
                                type="number"
                                value={plan.price}
                                onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                                className="bg-white border-gray-200"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Limits */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</Label>
                            <button
                              onClick={() => updatePlan(plan.id, "is_active", !plan.is_active)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              {plan.is_active ? 'Active' : 'Hidden'}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Businesses</Label>
                              <Input
                                type="number"
                                value={plan.max_businesses}
                                onChange={(e) => updatePlan(plan.id, "max_businesses", parseInt(e.target.value) || 0)}
                                className="h-9 sm:h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">QR Codes / Br</Label>
                              <Input
                                type="number"
                                value={plan.max_qr_codes}
                                onChange={(e) => updatePlan(plan.id, "max_qr_codes", parseInt(e.target.value) || 0)}
                                className="h-9 sm:h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Feedback / Mo</Label>
                              <Input
                                type="number"
                                value={plan.max_feedback_monthly}
                                onChange={(e) => updatePlan(plan.id, "max_feedback_monthly", parseInt(e.target.value) || 0)}
                                className="h-9 sm:h-10 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-sm"
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
                                <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                <Input
                                  value={feature}
                                  onChange={(e) => updateFeature(plan.id, idx, e.target.value)}
                                  className="border-none p-0 h-auto focus:ring-0 bg-transparent text-xs sm:text-sm text-gray-600 flex-1 font-medium"
                                />
                                <button onClick={() => removeFeature(plan.id, idx)} className="opacity-0 group-hover/feat:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button
                onClick={handleUpdatePricing}
                disabled={isUpdatingPlans}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-[1.5rem] shadow-xl shadow-indigo-100 px-8 sm:px-10 py-5 sm:py-7 h-auto text-base sm:text-lg font-black transition-all hover:scale-105 active:scale-95"
              >
                {isUpdatingPlans ? <Loader2 size={24} className="mr-3 animate-spin" /> : <Save size={24} className="mr-3" />}
                Save Subscription Changes
              </Button>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield size={20} className="text-indigo-500" />
              Security & Capabilities
            </h2>
            <Card className="bg-white border-gray-100 shadow-xl shadow-gray-100/50 rounded-[1.5rem] sm:rounded-[2rem] divide-y divide-gray-50 overflow-hidden">
              {[
                { key: "registrations_enabled", label: "Public Registrations", desc: "Allow new business owners to sign up independently.", icon: Globe },
                { key: "maintenance_mode", label: "Maintenance Mode", desc: "Restrict platform access to administrative personnel only.", icon: Bell },

              ].map((feature, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 hover:bg-gray-50/20 transition-colors gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${settings[feature.key] ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <feature.icon size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base sm:text-lg">{feature.label}</p>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting(feature.key, !settings[feature.key])}
                    className={`transition-all duration-300 self-end sm:self-auto ${settings[feature.key] ? 'text-indigo-600 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    {settings[feature.key] ? <ToggleRight size={44} className="fill-current sm:w-[54px] sm:h-[54px]" /> : <ToggleLeft size={44} className="sm:w-[54px] sm:h-[54px]" />}
                  </button>
                </div>
              ))}
              <div className="p-6 sm:p-8 bg-gray-50/50 flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSavingGeneral}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-100 px-6 sm:px-8 py-3 sm:py-4 h-auto text-sm sm:text-base font-bold transition-all hover:scale-105 active:scale-95"
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
          <Card className="relative w-full max-w-sm bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
            <div className="p-8 sm:p-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 sm:mb-8 relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                <CheckCircle2 size={40} className="text-green-500 relative z-10 sm:scale-110" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">Changes Saved!</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-sm sm:text-base">
                Your system settings have been updated successfully and are now live.
              </p>
              <Button
                onClick={() => setShowSuccess(false)}
                className="mt-8 sm:mt-10 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl py-5 sm:py-6 font-bold text-base sm:text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-200"
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
