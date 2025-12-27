"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import QRCode from "qrcode";
import { UpgradeModal } from "@/components/owner/UpgradeModal";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormField = "name" | "category" | "phone" | "address";

export default function NewBusiness() {
  const supabase = supabaseBrowser;
  const [form, setForm] = useState<Record<FormField, string>>({
    name: "",
    category: "",
    phone: "",
    address: "",
  });

  const [qrLink, setQrLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [ownerPlan, setOwnerPlan] = useState<any>(null);
  const [businessCount, setBusinessCount] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        return router.replace("/auth/login?redirectTo=/owner/business/new");
      }

      // 1. Fetch Profile and Plan
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq("id", user.id)
        .single();

      if (profile) {
        setOwnerPlan(profile.subscription_plans);
      }

      // 2. Fetch Current Businesses Count
      const { count } = await supabase
        .from("user_business")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setBusinessCount(count || 0);
      setInitialLoading(false);

      // 3. Auto-show upgrade modal if already over limit
      if (profile?.subscription_plans && (count || 0) >= profile.subscription_plans.max_businesses) {
        setShowUpgradeModal(true);
      }
    }

    fetchData();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (ownerPlan && businessCount >= ownerPlan.max_businesses) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/owner/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          setShowUpgradeModal(true);
          throw new Error("Subscription limit reached. Please upgrade to create more businesses.");
        }
        throw new Error(data.error || "Failed to create business");
      }

      // 4) Generate QR code pointing to owner's business dashboard
      const link = `${window.location.origin}/owner/business/${data.business_id}`;
      const qrDataUrl = await QRCode.toDataURL(link);
      setQrLink(qrDataUrl);
      setBusinessCount(prev => prev + 1);

      alert("Business created!");
    } catch (err: any) {
      setError(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isAtLimit = ownerPlan && businessCount >= ownerPlan.max_businesses;

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Create Your Business
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          {isAtLimit
            ? "You've reached your plan's business limit."
            : "Launch a new entity and start collecting feedback."}
        </p>
      </div>

      {isAtLimit ? (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-center mx-auto">
            <Rocket size={32} className="text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900">Upgrade Required</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs mx-auto">
              Your current plan ({ownerPlan?.name}) allows for {ownerPlan?.max_businesses} business(es). Upgrade to unlock more!
            </p>
          </div>
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-black text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            VIEW UPGRADE OPTIONS
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
            {(Object.keys(form) as FormField[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                  {key}
                </label>
                <input
                  placeholder={`Enter ${key}...`}
                  className="
                        w-full border-none bg-gray-50
                        text-gray-900 font-bold rounded-2xl px-5 py-4
                        focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all
                        placeholder:font-medium placeholder:text-gray-300
                        "
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value })
                  }
                  required
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-bold text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="
                w-full bg-black text-white py-5 rounded-2xl
                font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all
                disabled:opacity-50 flex items-center justify-center gap-2
            "
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "SAVE BUSINESS"}
          </button>
        </form>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        maxLimit={ownerPlan?.max_businesses}
      />

      {qrLink && (
        <div className="mt-6 bg-[var(--muted)] border border-[var(--border)] p-4 rounded-lg flex flex-col items-center gap-2">
          <p className="font-medium text-[var(--foreground)]">Your Business QR Code:</p>
          <img src={qrLink} alt="Business QR Code" className="w-40 h-40" />
        </div>
      )}
    </div>
  );
}
