"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  MapPin,
  TrendingUp,
  MessageCircle,
  QrCode,
  ChevronRight,
  ArrowRight,
  Zap,
  Calendar,
  Building2,
  Loader2,
  UserCircle2,
  Star,
  Plus,
  Shuffle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function OwnerDashboardPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalReviews: 0,
    avgRating: 0
  });
  const [latestBusinesses, setLatestBusinesses] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [allowStats, setAllowStats] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      // 1) Session check
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return router.replace("/auth/login");

      // 2) Profile fetch
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const displayName = profileData?.full_name || user.user_metadata?.full_name;
      setProfile({ ...profileData, full_name: displayName });

      // 3) Subscription features
      if (profileData?.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("allow_stats")
          .eq("id", profileData.plan_id)
          .single();
        setAllowStats(!!plan?.allow_stats);
      }

      // 4) Business Links
      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length === 0) {
        setLoading(false);
        return;
      }

      // 5) Fetch stats
      const { count: businessesCount } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .in("id", businessIds);

      const { data: latestBiz } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds)
        .order("created_at", { ascending: false })
        .limit(4);

      const { data: recentFb, count: reviewsCount } = await supabase
        .from("feedback")
        .select("*, businesses(name)", { count: "exact" })
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // Calculate average rating
      const { data: allRatings } = await supabase
        .from("feedback")
        .select("rating")
        .in("business_id", businessIds);

      const totalRating = allRatings?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
      const avgRating = allRatings && allRatings.length > 0 ? (totalRating / allRatings.length).toFixed(1) : 0;

      setStats({
        totalBusinesses: businessesCount || 0,
        totalReviews: reviewsCount || 0,
        avgRating: Number(avgRating)
      });
      setLatestBusinesses(latestBiz || []);
      setRecentFeedback(recentFb || []);
      setLoading(false);
    };

    loadDashboard();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-200" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-b border-slate-100 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <LayoutDashboard size={12} /> Tableau de bord propriétaire
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Bonjour, <span className="text-indigo-600">{profile?.full_name?.split(' ')[0] || "Propriétaire"}</span>
          </h1>
          <p className="text-slate-500 text-sm">Contrôlez l'activité de vos produits en temps réel.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-12 flex flex-col justify-center px-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Date d'aujourd'hui</p>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-tight">
              <Calendar size={12} className="text-slate-400" />
              {format(new Date(), "dd MMMM yyyy", { locale: fr })}
            </div>
          </div>
          <button
            onClick={() => router.push('/owner/business/new')}
            className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernStatCard
          label="Nombre de produits"
          value={stats.totalBusinesses}
          icon={Building2}
          color="slate"
        />
        <ModernStatCard
          label="Avis cumulés"
          value={stats.totalReviews}
          icon={MessageCircle}
          color="emerald"
        />
        <ModernStatCard
          label="Note moyenne"
          value={stats.avgRating}
          suffix="/ 5"
          icon={Star}
          color="amber"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left Column: Businesses & Actions */}
        <div className="lg:col-span-8 space-y-10">

          {/* Businesses List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-3">
                <QrCode size={18} className="text-slate-400" />
                Vos Produits
              </h2>
              <button
                onClick={() => router.push("/owner/business")}
                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Gérer tout
              </button>
            </div>

            {latestBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    onClick={() => router.push(`/owner/business/${biz.id}`)}
                    className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                      <Building2 size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-sm uppercase tracking-tight">{biz.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {format(new Date(biz.created_at), "MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                <p className="text-slate-400 text-sm font-medium italic">Aucun produit créé</p>
              </div>
            )}
          </div>

          {/* Quick Access / Promo Card */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-4 max-w-sm">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-indigo-400">
                <Shuffle size={20} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">Animer votre communauté</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Utilisez la fonction <span className="text-white font-bold">Tamboola</span> pour tirer au sort des gagnants parmi vos clients et multiplier vos avis.
              </p>
              <button
                onClick={() => router.push('/owner/tamboola')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-white transition-colors pt-2"
              >
                Lancer un tirage <ArrowRight size={14} />
              </button>
            </div>
            {/* Decorative background icon */}
            <Shuffle className="absolute -right-8 -bottom-8 text-white/5 w-64 h-64 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>

        {/* Right Column: Feedbacks Feed */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-3">
              <MessageCircle size={18} className="text-slate-400" />
              Avis Récents
            </h2>
            <button
              onClick={() => router.push("/owner/feedback")}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              Détails
            </button>
          </div>

          <div className="space-y-4">
            {recentFeedback.length > 0 ? (
              recentFeedback.map(fb => (
                <div
                  key={fb.id}
                  onClick={() => router.push(`/owner/feedback/${fb.id}`)}
                  className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                        {fb.full_name?.charAt(0) || <UserCircle2 size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">{fb.full_name || "Anonyme"}</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest">{fb.businesses?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-amber-500 font-black text-[10px]">
                      <Star size={8} className="fill-amber-500" /> {fb.rating}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic border-l-2 border-slate-50 pl-2">
                    {fb.message ? `"${fb.message}"` : "Client satisfait."}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      {format(new Date(fb.created_at), "dd MMM HH:mm", { locale: fr })}
                    </span>
                    <ArrowRight size={10} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <MessageCircle size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Aucun avis reçu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernStatCard({ label, value, icon: Icon, color, suffix }: any) {
  const colorVariants: any = {
    slate: "bg-slate-50 text-slate-900",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-6">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${colorVariants[color] || 'bg-slate-50'}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
          {suffix && <span className="text-[10px] font-bold text-slate-400">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function LayoutDashboard({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
