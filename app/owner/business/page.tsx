"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronRight,
  QrCode,
  MessageSquare,
  Filter,
  Loader2,
  Calendar,
  MapPin
} from "lucide-react";
import { UpgradeModal } from "@/components/owner/UpgradeModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function OwnerBusinessPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [ownerPlan, setOwnerPlan] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return router.replace("/auth/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select(`*, subscription_plans(*)`)
        .eq("id", user.id)
        .single();

      if (profile) setOwnerPlan(profile.subscription_plans);

      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch businesses AND feedback count
      const { data: businessList, error } = await supabase
        .from("businesses")
        .select(`
                    *,
                    feedback:feedback(count)
                `)
        .in("id", businessIds)
        .order("created_at", { ascending: false });

      if (businessList) {
        const formatted = businessList.map(b => ({
          ...b,
          feedback_count: b.feedback?.[0]?.count || 0
        }));
        setBusinesses(formatted);
      }
      setLoading(false);
    })();
  }, [router, supabase]);

  const filtered = businesses.filter((b) => {
    const s = search.toLowerCase();
    return (b.name?.toLowerCase() || "").includes(s);
  });

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      {/* Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Vos Produits</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez vos produits et vos codes QR.</p>
        </div>
        <button
          onClick={() => {
            if (ownerPlan && businesses.length >= (ownerPlan.max_businesses || 0)) {
              setShowUpgradeModal(true);
            } else {
              router.push("/owner/business/new");
            }
          }}
          className="bg-black text-white text-sm px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-medium active:scale-95"
        >
          <Plus size={16} />
          Nouveau Produit
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
          <Filter size={16} />
        </button>
      </div>

      {/* Minimalist Table/List */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-slate-300" size={24} />
            <span className="text-xs text-slate-400 font-medium tracking-wide">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <QrCode size={24} />
            </div>
            <p className="text-sm text-slate-400 font-medium">Aucun produit trouvé.</p>
            {businesses.length === 0 && (
              <button
                onClick={() => router.push("/owner/business/new")}
                className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Créer votre premier produit
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4 text-center">Avis reçus</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => router.push(`/owner/business/${b.id}`)}
                    className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-black group-hover:text-white transition-all">
                          <QrCode size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 leading-tight">{b.name}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            Créé le {format(new Date(b.created_at), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-slate-900">{b.feedback_count}</span>
                        <span className="text-[10px] text-slate-400 font-medium lowercase">feedbacks</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-medium text-emerald-500">Actif</span>
                      </div>
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        maxLimit={ownerPlan?.max_businesses}
      />
    </div>
  );
}
