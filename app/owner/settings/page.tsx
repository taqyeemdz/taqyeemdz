"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Loader2,
  Save,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SettingsPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  }, [router, supabase]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone
      })
      .eq("id", ownerProfile.id);

    if (error) {
      toast.error("Échec de la mise à jour du profil.");
    } else {
      toast.success("Profil mis à jour avec succès !");
      setOwnerProfile({ ...ownerProfile, ...formData });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-200" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      {/* Header */}
      <div className="border-b border-slate-100 pb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gérez votre identité et contrôlez votre consommation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Left Side: Profile Form */}
        <div className="lg:col-span-7 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-900">
              <User size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Informations Personnelles</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nom Complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-slate-400 transition-all shadow-sm"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-slate-400 transition-all shadow-sm"
                      placeholder="+213..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email (Lecture seule)</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    value={formData.email}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Usage & Plan */}
        <div className="lg:col-span-5 space-y-12">
          {/* Usage Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-slate-900">
              <Zap size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Utilisation du Plan</h2>
            </div>

            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-8">
              <UsageBar label="Nombre de produits" current={businesses.length} total={ownerPlan?.max_businesses} />

              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Abonnement Actuel</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">{ownerPlan?.name || "Standard"}</h3>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-100">Actif</span>
                </div>

                <div className="mt-6 space-y-3">
                  <FeatureItem label="Statistiques" value={ownerPlan?.allow_stats ? "Illimitées" : "Non inclus"} />
                  <FeatureItem label="Médias" value={ownerPlan?.allow_media ? "Inclus" : "Non inclus"} />
                  <FeatureItem label="Tamboola" value={ownerPlan?.allow_tamboola ? "Inclus" : "Non inclus"} />
                  {ownerProfile?.subscription_start && (
                    <FeatureItem
                      label="Début"
                      value={format(new Date(ownerProfile.subscription_start), "dd MMMM yyyy", { locale: fr })}
                    />
                  )}
                  {ownerProfile?.subscription_end && (
                    <FeatureItem
                      label="Fin"
                      value={format(new Date(ownerProfile.subscription_end), "dd MMMM yyyy", { locale: fr })}
                    />
                  )}
                </div>

                <div className="pt-6">
                  <button className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-[0.98]">
                    Changer de plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, total }: { label: string, current: number, total: number }) {
  const percentage = total >= 999999 ? 0 : Math.min((current / (total || 1)) * 100, 100);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{label}</p>
        </div>
        <p className="text-xs font-bold text-slate-900">
          {current} <span className="text-slate-300 font-medium">/</span> {total >= 999999 ? '∞' : total}
        </p>
      </div>
      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
        <div
          className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${total >= 999999 ? 5 : percentage}%` }}
        />
      </div>
    </div>
  );
}

function FeatureItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 border-dotted">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className="text-[11px] font-bold text-slate-900">{value}</span>
    </div>
  );
}
