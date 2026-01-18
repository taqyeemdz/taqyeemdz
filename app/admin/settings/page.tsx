"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Settings,
  Shield,
  CreditCard,
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Zap,
  FileText,
} from "lucide-react";

export default function AdminSettings() {
  const supabase = supabaseBrowser;
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "conditions" | "admins">("general");
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdmin, setNewAdmin] = useState({ email: "", fullName: "", password: "" });
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [deletedPlanIds, setDeletedPlanIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPlanIds, setExpandedPlanIds] = useState<string[]>([]);
  const [planPeriodFilter, setPlanPeriodFilter] = useState<'monthly' | 'yearly'>('monthly');

  // System Settings
  const [settings, setSettings] = useState<Record<string, any>>({});

  const loadAdmins = async () => {
    try {
      const { fetchAdmins } = await import("@/app/actions/admin-management");
      const data = await fetchAdmins();
      setAdmins(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [plansRes, settingsRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").order("price", { ascending: true }),
        supabase.from("system_settings").select("*")
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (settingsRes.data) {
        const map: Record<string, any> = {};
        settingsRes.data.forEach(s => map[s.key] = s.value);
        setSettings(map);
      }

      await loadAdmins();
      setLoading(false);
    })();
  }, [supabase]);

  const togglePlan = (id: string) => {
    setExpandedPlanIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const keys = ["platform_name", "support_email", "registrations_enabled", "maintenance_mode", "terms_and_conditions"];
      const upsertData = keys
        .filter(key => settings[key] !== undefined)
        .map(key => ({ key, value: settings[key] }));

      const { error } = await supabase.from("system_settings").upsert(upsertData, { onConflict: "key" });
      if (error) throw error;
      toast.success("Paramètres enregistrés");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlans = async () => {
    setSaving(true);
    try {
      console.log('Saving plans:', plans); // DEBUG
      const res = await fetch("/api/admin/plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans, deletedPlanIds }),
      });

      const data = await res.json();
      console.log('API Response:', data); // DEBUG

      if (!res.ok) throw new Error(data.error || "Erreur de sauvegarde");
      toast.success("Tarification mise à jour");
      setDeletedPlanIds([]);
    } catch (err: any) {
      console.error('Save error:', err); // DEBUG
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={24} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 md:space-y-12">

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:pb-6 md:pb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Configurez la plateforme, les abonnements et les accès.</p>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex gap-4 sm:gap-6 md:gap-8 border-b border-slate-100 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: "general", label: "Général", icon: Settings },
          { id: "pricing", label: "Abonnements", icon: CreditCard },
          { id: "conditions", label: "Conditions", icon: FileText },
          { id: "admins", label: "Admins", icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 sm:gap-2 pb-3 sm:pb-4 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap shrink-0
              ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <tab.icon size={16} className="shrink-0" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* GENERAL */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-1">
              <h3 className="font-medium text-slate-900">Identité</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Informations de base affichées sur l'interface et les emails.</p>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nom de la plateforme</label>
                  <input
                    value={settings.platform_name || ""}
                    onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email de support</label>
                  <input
                    value={settings.support_email || ""}
                    onChange={e => setSettings({ ...settings, support_email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="bg-slate-900 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRICING */}
        {activeTab === "pricing" && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-slate-900 text-sm sm:text-base">Grille tarifaire</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Configurez les offres et leurs limites techniques.</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Billing Period Filter Tabs */}
                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                  <button
                    onClick={() => setPlanPeriodFilter('monthly')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all
                      ${planPeriodFilter === 'monthly'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setPlanPeriodFilter('yearly')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all
                      ${planPeriodFilter === 'yearly'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Annuel
                  </button>
                </div>

                <button
                  onClick={() => {
                    const id = `new-${crypto.randomUUID()}`;
                    setPlans([...plans, { id, name: "Nouveau Plan", price: 0, currency: "DZD", billing_period: planPeriodFilter, features: [], max_businesses: 1, max_qr_codes: 3, is_active: true }]);
                    setExpandedPlanIds([...expandedPlanIds, id]);
                  }}
                  className="bg-white border border-slate-200 text-slate-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 sm:gap-2"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Ajouter un plan</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {plans.filter(p => (p.billing_period || 'monthly') === planPeriodFilter).map(plan => (
                <div key={plan.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                  <div
                    onClick={() => togglePlan(plan.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {expandedPlanIds.includes(plan.id) ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      <span className="font-medium text-slate-900">{plan.name}</span>
                      {!plan.is_active && <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Masqué</span>}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded font-bold uppercase">{plan.max_qr_codes} QR</span>
                      {plan.billing_period && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold uppercase">
                          {plan.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                        </span>
                      )}
                      <span className="text-sm font-mono font-semibold text-slate-600">{plan.price} {plan.currency}</span>
                    </div>
                  </div>

                  {expandedPlanIds.includes(plan.id) && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/20 space-y-8 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom</label>
                          <input
                            value={plan.name}
                            onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prix (DZD)</label>
                          <input
                            type="number"
                            value={plan.price ?? ''}
                            onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, price: e.target.value === '' ? 0 : Number(e.target.value) } : p))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QR Codes inclus</label>
                          <input
                            type="number"
                            value={plan.max_qr_codes || ''}
                            onChange={e => setPlans(plans.map(p => p.id === plan.id ? { ...p, max_qr_codes: e.target.value === '' ? 1 : parseInt(e.target.value) } : p))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400 font-bold text-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="text-xs font-medium text-slate-600">Upload Photo</span>
                          <button
                            onClick={() => setPlans(plans.map(p => p.id === plan.id ? { ...p, allow_photo: !p.allow_photo } : p))}
                            className={`w-8 h-4 rounded-full transition-all ${plan.allow_photo ? 'bg-slate-900 text-end' : 'bg-slate-200 text-start'} p-0.5 px-1 flex items-center`}
                          >
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="text-xs font-medium text-slate-600">Upload Vidéo</span>
                          <button
                            onClick={() => setPlans(plans.map(p => p.id === plan.id ? { ...p, allow_video: !p.allow_video } : p))}
                            className={`w-8 h-4 rounded-full transition-all ${plan.allow_video ? 'bg-slate-900 text-end' : 'bg-slate-200 text-start'} p-0.5 px-1 flex items-center`}
                          >
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="text-xs font-medium text-slate-600">Upload Audio</span>
                          <button
                            onClick={() => setPlans(plans.map(p => p.id === plan.id ? { ...p, allow_audio: !p.allow_audio } : p))}
                            className={`w-8 h-4 rounded-full transition-all ${plan.allow_audio ? 'bg-slate-900 text-end' : 'bg-slate-200 text-start'} p-0.5 px-1 flex items-center`}
                          >
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="text-xs font-medium text-slate-600">Statistiques</span>
                          <button
                            onClick={() => setPlans(plans.map(p => p.id === plan.id ? { ...p, allow_stats: !p.allow_stats } : p))}
                            className={`w-8 h-4 rounded-full transition-all ${plan.allow_stats ? 'bg-slate-900 text-end' : 'bg-slate-200 text-start'} p-0.5 px-1 flex items-center`}
                          >
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="text-xs font-medium text-slate-600">Visible</span>
                          <button
                            onClick={() => setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p))}
                            className={`w-8 h-4 rounded-full transition-all ${plan.is_active ? 'bg-emerald-500 text-end' : 'bg-slate-200 text-start'} p-0.5 px-1 flex items-center`}
                          >
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avantages du Plan</label>
                          <button
                            onClick={() => setPlans(plans.map(p => p.id === plan.id ? { ...p, features: [...(p.features || []), ""] } : p))}
                            className="text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(plan.features || []).map((feat: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 group">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <input
                                value={feat}
                                onChange={e => {
                                  const newFeats = [...plan.features];
                                  newFeats[idx] = e.target.value;
                                  setPlans(plans.map(p => p.id === plan.id ? { ...p, features: newFeats } : p));
                                }}
                                className="flex-1 bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0"
                                placeholder="Nouvel avantage..."
                              />
                              <button
                                onClick={() => {
                                  const newFeats = plan.features.filter((_: any, i: number) => i !== idx);
                                  setPlans(plans.map(p => p.id === plan.id ? { ...p, features: newFeats } : p));
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <button
                          onClick={() => {
                            if (confirm("Supprimer ce plan ?")) {
                              if (!plan.id.startsWith('new-')) setDeletedPlanIds([...deletedPlanIds, plan.id]);
                              setPlans(plans.filter(p => p.id !== plan.id));
                            }
                          }}
                          className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Supprimer le niveau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-8">
              <button
                onClick={handleSavePlans}
                disabled={saving}
                className="bg-slate-900 text-white text-sm font-semibold px-10 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Mettre à jour la tarification
              </button>
            </div>
          </div>
        )}

        {/* CONDITIONS */}
        {activeTab === "conditions" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-1">
              <h3 className="font-medium text-slate-900">Conditions Générales</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Rédigez les termes et conditions d'utilisation de la plateforme.</p>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contenu (Markdown/Texte)</label>
                <textarea
                  value={settings.terms_and_conditions || ""}
                  onChange={e => setSettings({ ...settings, terms_and_conditions: e.target.value })}
                  placeholder="Entrez les termes et conditions ici..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-400 transition-colors min-h-[400px] font-sans leading-relaxed"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="bg-slate-900 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Enregistrer les conditions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMINS */}
        {activeTab === "admins" && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-slate-900 text-sm sm:text-base">Équipe d'administration</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Gérez les accès administrateur à la plateforme.</p>
              </div>
              {!showAddAdmin && (
                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="bg-slate-900 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Ajouter un admin</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              )}
            </div>

            {showAddAdmin && (
              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom complet</label>
                    <input
                      placeholder="Ex: Admin Taqyeem"
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                      value={newAdmin.fullName}
                      onChange={e => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      className={`w-full bg-white border rounded-lg px-4 py-2 text-sm outline-none transition-all ${addAdminError?.includes('email') || addAdminError?.includes('Email')
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      value={newAdmin.email}
                      onChange={e => {
                        setNewAdmin({ ...newAdmin, email: e.target.value });
                        if (addAdminError) setAddAdminError(null);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                      value={newAdmin.password}
                      onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    />
                  </div>
                </div>
                {/* Error message display */}
                {addAdminError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-red-600 text-lg">!</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-red-800">{addAdminError}</span>
                    </div>
                    <button
                      onClick={() => setAddAdminError(null)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {tempPassword && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col gap-1 items-center animate-in zoom-in duration-300">
                    <CheckCircle2 className="text-emerald-500 mb-1" size={20} />
                    <span className="text-xs font-bold text-emerald-800">Admin créé avec succès !</span>
                    <p className="text-[10px] text-emerald-600">Mot de passe provisoire : <span className="font-mono font-black select-all bg-white px-2 py-0.5 rounded">{tempPassword}</span></p>
                    <p className="text-[9px] text-emerald-500 mt-1 italic">Veuillez copier ce mot de passe, il ne sera plus affiché.</p>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowAddAdmin(false);
                      setTempPassword(null);
                      setAddAdminError(null);
                      setNewAdmin({ email: "", fullName: "", password: "" });
                    }}
                    className="text-slate-500 text-[11px] font-bold uppercase tracking-widest px-4 py-2"
                  >
                    {tempPassword ? "Fermer" : "Annuler"}
                  </button>
                  {!tempPassword && (
                    <button
                      onClick={async () => {
                        setAddAdminError(null);
                        if (!newAdmin.email || !newAdmin.fullName || !newAdmin.password) {
                          setAddAdminError("Veuillez remplir tous les champs");
                          return;
                        }
                        if (newAdmin.password.length < 6) {
                          setAddAdminError("Le mot de passe doit faire au moins 6 caractères");
                          return;
                        }
                        setSaving(true);
                        try {
                          const { addAdminAction } = await import("@/app/actions/admin-management");
                          const res = await addAdminAction(newAdmin.email, newAdmin.fullName, newAdmin.password);
                          setTempPassword(res.tempPassword);
                          await loadAdmins();
                          toast.success("Admin ajouté");
                          if (!res.tempPassword) {
                            setShowAddAdmin(false);
                            setNewAdmin({ email: "", fullName: "", password: "" });
                          }
                        } catch (err: any) {
                          setAddAdminError(err.message || "Erreur lors de la création de l'admin");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      {saving && <Loader2 size={12} className="animate-spin" />}
                      Confirmer la création
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left ">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rôle</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{admin.full_name}</span>
                          <span className="text-xs text-slate-500">{admin.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${admin.role === 'superadmin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`Supprimer l'accès admin pour ${admin.full_name} ?`)) {
                              setDeletingAdminId(admin.id);
                              try {
                                const { deleteAdminAction } = await import("@/app/actions/admin-management");
                                await deleteAdminAction(admin.id);
                                setAdmins(admins.filter(a => a.id !== admin.id));
                                toast.success("Accès supprimé");
                              } catch (err: any) {
                                toast.error(err.message || "Erreur lors de la suppression");
                              } finally {
                                setDeletingAdminId(null);
                              }
                            }
                          }}
                          disabled={deletingAdminId === admin.id}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer l'administrateur"
                        >
                          {deletingAdminId === admin.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
