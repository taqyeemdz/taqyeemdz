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
  Filter
} from "lucide-react";

export default function OwnersListPage() {
  const router = useRouter();
  const supabase = supabaseBrowser;
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
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
    })();
  }, [supabase]);

  const filtered = owners.filter((o) => {
    const s = search.toLowerCase();
    return (
      (o.full_name?.toLowerCase() || "").includes(s) ||
      (o.email?.toLowerCase() || "").includes(s) ||
      (o.phone || "").includes(search)
    );
  });

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

      {/* minimal search & utility bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
          <Filter size={16} />
        </button>
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
                  <th className="px-6 py-4 text-right"></th>
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
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {o.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[11px] font-medium ${o.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {o.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
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
