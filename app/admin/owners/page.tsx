"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  ChevronRight,
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
  MoreVertical,
  Trash2,
  Eye,
  Filter
} from "lucide-react";
import { toast } from "sonner";

export default function OwnersListPage() {
  const router = useRouter();
  const supabase = supabaseBrowser;
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, subscription_plans:plan_id(name, billing_period)")
        .eq("role", "owner")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch auth emails
      let emailMap: Record<string, string> = {};
      try {
        const res = await fetch("/api/admin/owners/list-emails");
        const emailData = await res.json();
        if (emailData.emails) emailMap = emailData.emails;
      } catch (e) { }

      const merged = (data || []).map((o: any) => ({
        ...o,
        email: o.email || emailMap[o.id] || "—",
        plan_name: o.subscription_plans?.name || "Standard",
        billing_period: o.subscription_plans?.billing_period || "monthly"
      }));

      setOwners(merged);
    } catch (err) {
      console.error("Error loading owners:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("subscription_plans")
      .select("name")
      .eq("is_active", true);

    if (data) {
      const uniqueNames = Array.from(new Set(data.map(p => p.name)));
      setPlans(uniqueNames);
    }
  };

  useEffect(() => {
    fetchOwners();
    fetchPlans();
    // Close menu on click outside
    const handleOutsideClick = () => setOpenMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [supabase]);

  const handleDeleteOwner = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce propriétaire ? Cette action est irréversible et supprimera tout l'accès et les données associées.")) return;

    setIsDeleting(id);
    try {
      const res = await fetch("/api/admin/owners/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id })
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Propriétaire supprimé avec succès");
      fetchOwners();
    } catch (err) {
      toast.error("Échec de la suppression");
    } finally {
      setIsDeleting(null);
      setOpenMenu(null);
    }
  };

  const filtered = owners.filter((o) => {
    const s = search.toLowerCase();
    const matchesGlobal = !search ||
      (o.full_name?.toLowerCase() || "").includes(s) ||
      (o.email?.toLowerCase() || "").includes(s) ||
      (o.phone || "").includes(search);

    const matchesName = !filterName || (o.full_name?.toLowerCase() || "").includes(filterName.toLowerCase());
    const matchesEmail = !filterEmail || (o.email?.toLowerCase() || "").includes(filterEmail.toLowerCase());
    const matchesPhone = !filterPhone || (o.phone || "").includes(filterPhone);
    const matchesPlan = selectedPlan === "all" || o.plan_name === selectedPlan;

    return matchesGlobal && matchesName && matchesEmail && matchesPhone && matchesPlan;
  });

  const resetFilters = () => {
    setFilterName("");
    setFilterEmail("");
    setFilterPhone("");
    setSelectedPlan("all");
    setSearch("");
  };

  const hasActiveFilters = filterName || filterEmail || filterPhone || selectedPlan !== "all";

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">

      {/* minimalist header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Propriétaires</h1>
          <p className="text-slate-500 text-sm mt-0.5">Base de données des clients et abonnements.</p>
        </div>
        <button
          onClick={() => router.push("/admin/owners/new")}
          className="bg-black text-white text-sm px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-medium active:scale-95"
        >
          <Plus size={16} />
          Nouveau Propriétaire
        </button>
      </div>

      <div className="space-y-4">
        {/* Search bar & Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Recherche rapide..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-400 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium ${showFilters || hasActiveFilters
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Filter size={16} />
            <span>Filtres</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">!</span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nom</label>
              <input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Filtrer par nom..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <input
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                placeholder="Filtrer par email..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Téléphone</label>
              <input
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                placeholder="Filtrer par téléphone..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Plan</label>
              <div className="relative">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400 appearance-none cursor-pointer pr-10"
                >
                  <option value="all">Tous les plans</option>
                  {plans.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <MoreVertical size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end pt-2">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                <Trash2 size={12} />
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* minimal table */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-slate-300" size={24} />
            <span className="text-xs text-slate-400 font-medium tracking-wide">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-slate-400">Aucun propriétaire trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Propriétaire</th>
                  <th className="px-6 py-4 hidden md:table-cell">Contact</th>
                  <th className="px-6 py-4 hidden md:table-cell text-center">Téléphone</th>
                  <th className="px-6 py-4 text-center">Plan</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-right">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/admin/owners/${o.id}`)}
                    className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                          {o.full_name?.charAt(0).toUpperCase() || <UserIcon size={14} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 leading-tight">{o.full_name || "Sans nom"}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5 font-mono">#{o.id?.split('-')[0]}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={12} className="text-slate-300" />
                        <span>{o.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-center">
                      {o.phone ? (
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone size={12} className="text-slate-300" />
                          <span>{o.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-center">
                          {o.plan_name}
                        </span>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {o.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                          </span>
                          {o.subscription_end && (
                            <span className="text-[9px] font-bold text-slate-400/70 uppercase tracking-tighter">
                              Fin: {new Date(o.subscription_end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const isInactive = !o.is_active;
                        const isExpired = o.subscription_end && new Date(o.subscription_end) < new Date();

                        if (isInactive) return (
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider border border-slate-200">
                            Inactif
                          </span>
                        );
                        if (isExpired) return (
                          <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-full uppercase tracking-wider border border-amber-100">
                            Expiré
                          </span>
                        );
                        return (
                          <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-wider border border-emerald-100">
                            Actif
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenMenu(openMenu === o.id ? null : o.id);
                          }}
                          className="p-2 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenu === o.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                              onClick={() => router.push(`/admin/owners/${o.id}`)}
                              className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye size={14} className="text-slate-400" />
                              Voir détails
                            </button>
                            <button
                              disabled={isDeleting === o.id}
                              onClick={(e) => handleDeleteOwner(e, o.id)}
                              className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
                            >
                              {isDeleting === o.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
