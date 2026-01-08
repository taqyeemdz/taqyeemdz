"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/owner/UpgradeModal";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Rocket, ChevronLeft } from "lucide-react";

type FormField = "name" | "description";

const FIELD_LABELS: Record<FormField, string> = {
  name: "Nom du produit",
  description: "Description courte",
};

export default function NewBusiness() {
  const supabase = supabaseBrowser;
  const [form, setForm] = useState<Record<FormField, string>>({
    name: "",
    description: "",
  });

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

      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq("id", user.id)
        .single();

      if (profile) setOwnerPlan(profile.subscription_plans);

      const { count } = await supabase
        .from("user_business")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setBusinessCount(count || 0);
      setInitialLoading(false);

      if (profile?.subscription_plans && (count || 0) >= profile.subscription_plans.max_businesses) {
        setShowUpgradeModal(true);
      }
    }

    fetchData();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (ownerPlan && businessCount >= ownerPlan.max_businesses) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/owner/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: "Standard" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la création");

      toast.success("Produit créé !");
      router.push("/owner/business");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
      </div>
    );
  }

  const isAtLimit = ownerPlan && businessCount >= ownerPlan.max_businesses;

  return (
    <div className="max-w-xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        <button
          onClick={() => router.push("/owner/business")}
          className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-medium uppercase tracking-widest"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Nouveau Produit</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ajoutez un produit pour générer un code QR.</p>
        </div>
      </div>

      {isAtLimit ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto text-indigo-600">
            <Rocket size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Limite atteinte</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Votre plan actuel permet {ownerPlan?.max_businesses} produit(s).
            </p>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full bg-black text-white rounded-lg py-3 text-sm font-medium hover:bg-slate-800 transition-all active:scale-95"
          >
            Passer au plan supérieur
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-8">
          <div className="space-y-6">
            {(Object.keys(form) as FormField[]).map((key) => (
              <div key={key} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  {FIELD_LABELS[key]}
                </label>
                {key === "description" ? (
                  <textarea
                    placeholder="..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-900 focus:border-slate-400 outline-none transition-all min-h-[100px]"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                  />
                ) : (
                  <input
                    placeholder="..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-900 focus:border-slate-400 outline-none transition-all"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium border border-rose-100">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-lg font-medium text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Créer le produit"}
          </button>
        </form>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        maxLimit={ownerPlan?.max_businesses}
      />
    </div>
  );
}
