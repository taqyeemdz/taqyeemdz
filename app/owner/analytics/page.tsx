"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  Star,
  ChevronDown,
  Building2,
  Sparkles,
  ThumbsUp,
  Clock,
  ListChecks,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Loader2,
  ChevronLeft,
  User,
  Ghost
} from "lucide-react";
import { UpgradeModal } from "@/components/owner/UpgradeModal";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AnalyticsPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("all");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [customFieldsAnalytics, setCustomFieldsAnalytics] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentTrend: 0,
    responseRate: 0
  });
  const [allowStats, setAllowStats] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length > 0) {
        const { data: busDocs } = await supabase
          .from("businesses")
          .select("id, name, form_config")
          .in("id", businessIds);

        if (busDocs) setBusinesses(busDocs);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("id", user.id)
        .single();

      if (profile?.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("allow_stats")
          .eq("id", profile.plan_id)
          .single();

        setAllowStats(!!plan?.allow_stats);
      }

      setLoading(false);
    };

    fetchBusinesses();
  }, [supabase]);

  useEffect(() => {
    if (businesses.length === 0) return;

    const fetchFeedback = async () => {
      let query = supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedBusinessId !== "all") {
        query = query.eq("business_id", selectedBusinessId);
      } else {
        const businessIds = businesses.map(b => b.id);
        query = query.in("business_id", businessIds);
      }

      const { data } = await query;

      if (data) {
        setFeedbacks(data);
        calculateStats(data);

        if (selectedBusinessId !== "all") {
          const business = businesses.find(b => b.id === selectedBusinessId);
          if (business?.form_config) {
            analyzeCustomFields(business.form_config, data);
          }
        } else {
          setCustomFieldsAnalytics([]);
        }
      }
    };

    fetchFeedback();
  }, [selectedBusinessId, businesses, supabase]);

  const calculateStats = (feedbackData: any[]) => {
    const total = feedbackData.length;
    const ratings = feedbackData.map(f => f.rating).filter(r => r);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { if (r >= 1 && r <= 5) distribution[r as keyof typeof distribution]++; });

    const now = new Date();
    const last7Days = feedbackData.filter(f => (now.getTime() - new Date(f.created_at).getTime()) / (1000 * 3600 * 24) <= 7).length;
    const previous7Days = feedbackData.filter(f => {
      const d = (now.getTime() - new Date(f.created_at).getTime()) / (1000 * 3600 * 24);
      return d > 7 && d <= 14;
    }).length;

    const trend = previous7Days > 0 ? ((last7Days - previous7Days) / previous7Days) * 100 : 0;
    const withMessages = feedbackData.filter(f => f.message && f.message.trim()).length;
    const responseRate = total > 0 ? (withMessages / total) * 100 : 0;

    setStats({ totalFeedback: total, averageRating: avgRating, ratingDistribution: distribution, recentTrend: trend, responseRate });
  };

  const analyzeCustomFields = (fields: any[], feedbackData: any[]) => {
    const analytics = fields.map(field => {
      const responses = feedbackData.map(f => f.custom_responses?.[field.id]).filter(r => r !== undefined && r !== null && r !== "");
      const resCount = responses.length;
      const completion = feedbackData.length > 0 ? (resCount / feedbackData.length) * 100 : 0;

      let res: any = { label: field.label, type: field.type, count: resCount, completion };
      if (field.type === 'boolean') {
        const t = responses.filter(r => r === true).length;
        res.truePerc = resCount > 0 ? (t / resCount) * 100 : 0;
        res.falsePerc = resCount > 0 ? ((resCount - t) / resCount) * 100 : 0;
      } else if (field.type === 'rating') {
        const nums = responses.filter(r => typeof r === 'number');
        res.avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        const dist: any = {};
        nums.forEach(r => dist[r] = (dist[r] || 0) + 1);
        res.dist = dist;
      }
      return res;
    });
    setCustomFieldsAnalytics(analytics);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-200" size={32} />
      </div>
    );
  }

  const selectedBusinessName = businesses.find(b => b.id === selectedBusinessId)?.name || "Tous les produits";

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10 relative">

      {!allowStats && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-50/20 backdrop-blur-sm rounded-[2.5rem]">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500 space-y-8">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Analyses Restreintes</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Passez au plan <span className="text-slate-900 font-bold">Pro</span> pour débloquer les statistiques détaillées et le suivi des performances.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-black text-white rounded-xl py-4 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Voir les plans <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <div className={`space-y-10 transition-all duration-700 ${!allowStats ? 'blur-md opacity-20 pointer-events-none select-none' : ''}`}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Analyses & Performance</h1>
            <p className="text-slate-500 text-sm">Vue d'ensemble de la performance de vos produits.</p>
          </div>

          <div className="relative group min-w-[220px]">
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:border-slate-400 outline-none transition-all cursor-pointer shadow-sm appearance-none"
            >
              <option value="all">Tous les produits</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Avis" value={stats.totalFeedback} icon={MessageCircle} />
          <StatCard label="Note Moyenne" value={stats.averageRating.toFixed(1)} icon={Star} precision="★" />
          <StatCard label="Croissance 7j" value={`${stats.recentTrend >= 0 ? '+' : ''}${stats.recentTrend.toFixed(0)}%`} icon={TrendingUp} variant={stats.recentTrend >= 0 ? 'success' : 'danger'} />
          <StatCard label="Taux de Message" value={`${stats.responseRate.toFixed(0)}%`} icon={ThumbsUp} />
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Rating Distribution */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Star size={16} className="text-slate-300" />
                Répartition des notes
              </h3>

              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                  const perc = stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="w-8 text-xs font-bold text-slate-400">{rating}★</div>
                      <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-xs font-semibold text-slate-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Fields Analytics */}
            {customFieldsAnalytics.length > 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ListChecks size={16} className="text-slate-300" />
                    Champs personnalisés
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedBusinessName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {customFieldsAnalytics.map((field) => (
                    <div key={field.label} className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-100/50">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900 leading-tight">{field.label}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tight">{field.count} réponses • {field.completion.toFixed(0)}%</p>
                      </div>

                      {field.type === 'boolean' && (
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${field.truePerc}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Oui {field.truePerc.toFixed(0)}%</p>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500" style={{ width: `${field.falsePerc}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Non {field.falsePerc.toFixed(0)}%</p>
                          </div>
                        </div>
                      )}

                      {field.type === 'rating' && (
                        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Moyenne</span>
                          <span className="text-sm font-black text-slate-900">{field.avg.toFixed(1)} ★</span>
                        </div>
                      )}

                      {field.type === 'text' && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <MessageCircle size={10} />
                          Contenu Textuel
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-2xl text-white space-y-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aperçu Global</p>
                <h4 className="text-xl font-semibold tracking-tight">Performance</h4>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Satisfaction</p>
                  <p className="text-lg font-bold">{(stats.averageRating * 20).toFixed(0)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Positifs</p>
                  <p className="text-lg font-bold">
                    {stats.totalFeedback > 0 ? (((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalFeedback) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-slate-300" />
                Activités
              </h3>
              <div className="space-y-1">
                {feedbacks.slice(0, 5).map(fb => (
                  <div key={fb.id} className="p-3 hover:bg-slate-50 transition-colors rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                        {fb.anonymous ? <Ghost size={12} /> : <User size={12} />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-900">{fb.rating}★</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{fb.message || "Avis"}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300">
                      {format(new Date(fb.created_at), "dd/MM")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, precision = "", variant = "default" }: any) {
  const colors: any = {
    default: "text-slate-900 bg-slate-50",
    success: "text-emerald-600 bg-emerald-50",
    danger: "text-rose-600 bg-rose-50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${colors[variant === 'default' ? 'default' : variant]}`}>
          <Icon size={18} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black tracking-tight ${variant === 'success' ? 'text-emerald-600' : variant === 'danger' ? 'text-rose-600' : 'text-slate-900'}`}>
          {value}
        </span>
        <span className="text-xs font-bold text-slate-400">{precision}</span>
      </div>
    </div>
  );
}
