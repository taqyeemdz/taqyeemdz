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
  Shuffle,
  LayoutDashboard,
  Activity,
  ArrowUpRight,
  Users,
  Award,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const scrollbarHideStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

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

      // 3) Business Links
      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length === 0) {
        setLoading(false);
        return;
      }

      // 4) Fetch stats count
      const { count: businessesCount } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .in("id", businessIds);

      // 5) Fetch businesses with reviews for calculating stats per business
      const { data: latestBizData } = await supabase
        .from("businesses")
        .select(`
          *,
          feedback (
            rating
          )
        `)
        .in("id", businessIds)
        .order("created_at", { ascending: false })
        .limit(6);

      const enhancedBiz = latestBizData?.map(biz => {
        const reviews = (biz as any).feedback || [];
        const count = reviews.length;
        const avg = count > 0 ? (reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / count).toFixed(1) : "0.0";
        return {
          ...biz,
          reviews_count: count,
          avg_rating: avg
        };
      });

      const { data: recentFb } = await supabase
        .from("feedback")
        .select("*, businesses(name)")
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // Overall stats calculation
      const { data: allRatings } = await supabase
        .from("feedback")
        .select("rating")
        .in("business_id", businessIds);

      const totalRating = allRatings?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
      const totalReviewsCount = allRatings?.length || 0;
      const avgRating = totalReviewsCount > 0 ? (totalRating / totalReviewsCount).toFixed(1) : 0;

      setStats({
        totalBusinesses: businessesCount || 0,
        totalReviews: totalReviewsCount || 0,
        avgRating: Number(avgRating)
      });
      setLatestBusinesses(enhancedBiz || []);
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
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12 pb-20">
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />

      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
        <div className="space-y-1">

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight md:leading-none">
            Bonjour, <br className="sm:hidden" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-tight">
              {profile?.full_name?.split(' ')[0] || "Propriétaire"}
            </span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base md:text-xl font-medium">Visualisez l'évolution en temps réel.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="h-14 flex items-center gap-4 px-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div className="text-left">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Aujourd'hui</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">{format(new Date(), "dd MMM yyyy", { locale: fr })}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/owner/business/new')}
            className="h-14 sm:h-16 px-6 sm:px-8 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group shrink-0"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Focused Premium Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* Main Section: Portfolio (Col Span 8) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <QrCode size={14} className="sm:w-4 sm:h-4" /> Vos Produits
                </h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full border border-slate-200/50">
                  {stats.totalBusinesses}
                </span>
              </div>
              <button
                onClick={() => router.push("/owner/business")}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Tout gérer
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {latestBusinesses.length > 0 ? (
                latestBusinesses.map((biz, idx) => (
                  <div
                    key={biz.id}
                    onClick={() => router.push(`/owner/business/${biz.id}`)}
                    className="group relative p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 cursor-pointer flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner shrink-0">
                        <QrCode size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-base sm:text-lg uppercase tracking-tight mb-0.5">{biz.name}</h3>
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1">
                            <Star size={10} className="fill-amber-500 text-amber-500 sm:w-3 sm:h-3" />
                            <span className="text-xs sm:text-sm font-black text-slate-700">{biz.avg_rating}</span>
                          </div>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Users size={10} className="sm:w-3 sm:h-3" />
                            <span className="text-xs sm:text-sm font-bold">{biz.reviews_count} avis</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <p className="hidden sm:block text-xs font-bold text-indigo-400/60 uppercase tracking-widest whitespace-nowrap">
                        {format(new Date(biz.created_at), "MMM yyyy", { locale: fr })}
                      </p>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 border-2 border-dashed border-slate-100 rounded-[3rem] text-center bg-slate-50/30">
                  <QrCode size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">Aucun produit actif</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Tools (Col Span 4) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Smaller Tamboola Card */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-6">
              <Zap size={14} /> Croissance
            </h2>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-100/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] -mr-32 -mt-32"></div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center text-white border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Shuffle size={28} />
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30">Live</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Animez vos ventes</h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    Utilisez <span className="text-white font-bold">Tamboola</span> pour organiser des tirages au sort instantanés.
                  </p>
                </div>

                <button
                  onClick={() => router.push('/owner/tamboola')}
                  className="w-full h-12 sm:h-14 bg-white text-slate-900 rounded-xl font-black text-[11px] sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-100 active:scale-[0.98] transition-all shadow-xl"
                >
                  Lancer Tamboola <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100/50 flex gap-4 items-start">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <Sparkles size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-indigo-900 font-black text-xs uppercase tracking-tight">Conseil Pro</p>
                <p className="text-indigo-700/60 text-[10px] font-medium leading-relaxed">Partagez vos QR codes sur Instagram pour capturer 2x plus d'avis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
