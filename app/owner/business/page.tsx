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
  MapPin,
  Trash2,
  Edit2,
  MoreVertical,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBusinesses = async () => {
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
  };

  useEffect(() => {
    fetchBusinesses();
  }, [router, supabase]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from("businesses").delete().eq("id", deleteId);
    if (error) {
      toast.error("Échec de la suppression");
    } else {
      toast.success("Produit supprimé");
      setBusinesses(prev => prev.filter(b => b.id !== deleteId));
      setDeleteId(null);
    }
    setIsDeleting(false);
  };

  const filtered = businesses.filter((b) => {
    const s = search.toLowerCase();
    return (b.name?.toLowerCase() || "").includes(s);
  });

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      {/* Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vos Produits</h1>
          <p className="text-slate-500 text-base mt-1 font-medium">Gérez vos produits et vos codes QR.</p>
        </div>
        <button
          onClick={() => {
            if (ownerPlan && businesses.length >= (ownerPlan.max_businesses || 0)) {
              setShowUpgradeModal(true);
            } else {
              router.push("/owner/business/new");
            }
          }}
          className="bg-black text-white text-base px-6 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all font-bold active:scale-95 shadow-sm"
        >
          <Plus size={18} />
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
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-base outline-none focus:border-slate-400 transition-colors shadow-sm"
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
          <>
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
                            <span className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{b.name}</span>
                            <span className="text-xs text-slate-400 mt-1 font-medium">
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
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Actif</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/owner/business/${b.id}?tab=config`);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(b.id);
                              setDeleteName(b.name);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-all group-hover:translate-x-1" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        maxLimit={ownerPlan?.max_businesses}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Confirmer la suppression</h3>
                <p className="text-sm text-slate-500">
                  Voulez-vous vraiment supprimer <span className="font-semibold text-slate-900">"{deleteName}"</span> ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Suppression..." : "Oui, supprimer"}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="w-full bg-slate-50 text-slate-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
