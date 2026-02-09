"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  TrendingUp,
  MessageCircle,
  Star,
  ChevronDown,
  ThumbsUp,
  ListChecks,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Ghost,
  Users,
  Trophy,
  Target,
  Calendar
} from "lucide-react";
import { UpgradeModal } from "@/components/owner/UpgradeModal";
import { useRouter } from "next/navigation";
import { subDays, isSameDay, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export default function AnalyticsPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("week");
  const [customDate, setCustomDate] = useState<string>("");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [customFieldsAnalytics, setCustomFieldsAnalytics] = useState<any[]>([]);
  const [businessPerformance, setBusinessPerformance] = useState<any[]>([]);
  const [ratingChartData, setRatingChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentTrend: 0,
    responseRate: 0,
    sparklineData: [] as number[],
    genderDistribution: { male: 0, female: 0, unknown: 0 },
    wilayaDistribution: {} as Record<string, number>,
    ageDistribution: {} as Record<string, number>
  });
  const [allowStats, setAllowStats] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedQuestionLabel, setSelectedQuestionLabel] = useState<string>("all");

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

        if (busDocs) {
          setBusinesses(busDocs);
          if (busDocs.length > 0) {
            setSelectedBusinessId(busDocs[0].id);
          }
        }
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

      const now = new Date();
      let startDate = new Date();

      if (selectedTimeRange === "custom" && customDate) {
        startDate = new Date(customDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString());
      } else if (selectedTimeRange === "today") {
        startDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startDate.toISOString());
      } else if (selectedTimeRange === "week") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        query = query.gte("created_at", startDate.toISOString());
      } else if (selectedTimeRange === "month") {
        startDate = startOfMonth(now);
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data } = await query;

      if (data) {
        setFeedbacks(data);
        calculateStats(data);
        generateRatingChart(data);

        if (selectedBusinessId !== "all") {
          const business = businesses.find(b => b.id === selectedBusinessId);
          if (business?.form_config) {
            analyzeCustomFields(business.form_config, data);
            setSelectedQuestionLabel("all");
          }
        } else {
          setCustomFieldsAnalytics([]);
          setSelectedQuestionLabel("all");
        }
      }
    };

    fetchFeedback();
  }, [selectedBusinessId, selectedTimeRange, customDate, businesses, supabase]);

  const generateRatingChart = (feedbackData: any[]) => {
    const now = new Date();
    let days: Date[] = [];

    if (selectedTimeRange === "custom" && customDate) {
      const selectedDay = new Date(customDate);
      days = [selectedDay];
    } else if (selectedTimeRange === "today") {
      days = [now];
    } else if (selectedTimeRange === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      days = eachDayOfInterval({ start, end });
    } else if (selectedTimeRange === "month") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      days = eachDayOfInterval({ start, end });
    } else {
      // all time - last 30 days
      days = Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i));
    }

    const chartData = days.map(day => {
      const dayFeedbacks = feedbackData.filter(f => isSameDay(new Date(f.created_at), day));
      const ratings = dayFeedbacks.map(f => f.rating).filter(r => r);
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        date: day,
        label: format(day, selectedTimeRange === "month" ? "d" : "EEE d", { locale: fr }),
        average: avg,
        count: dayFeedbacks.length
      };
    });

    setRatingChartData(chartData);
  };

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

    const daysToShow = 7;
    const sparklineData = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const count = feedbackData.filter(f => isSameDay(new Date(f.created_at), d)).length;
      sparklineData.push(count);
    }

    const genderDist = { male: 0, female: 0, unknown: 0 };
    const wilayaDist: Record<string, number> = {};
    const ageDist: Record<string, number> = {};

    feedbackData.forEach(f => {
      if (f.sex === 'male') genderDist.male++;
      else if (f.sex === 'female') genderDist.female++;
      else genderDist.unknown++;

      if (f.wilaya) {
        wilayaDist[f.wilaya] = (wilayaDist[f.wilaya] || 0) + 1;
      }

      if (f.age_range) {
        ageDist[f.age_range] = (ageDist[f.age_range] || 0) + 1;
      }
    });

    setStats({
      totalFeedback: total,
      averageRating: avgRating,
      ratingDistribution: distribution,
      recentTrend: trend,
      responseRate,
      sparklineData,
      genderDistribution: genderDist,
      wilayaDistribution: wilayaDist,
      ageDistribution: ageDist
    });

    if (selectedBusinessId === "all") {
      const perf = businesses.map(bus => {
        const busFeedback = feedbackData.filter(f => f.business_id === bus.id);
        const bRatings = busFeedback.map(f => f.rating).filter(r => r);
        const bAvg = bRatings.length > 0 ? bRatings.reduce((a, b) => a + b, 0) / bRatings.length : 0;
        return {
          id: bus.id,
          name: bus.name,
          avg: bAvg,
          count: busFeedback.length
        };
      }).filter(p => p.count > 0);
      setBusinessPerformance(perf);
    }
  };

  const analyzeCustomFields = (fields: any[], feedbackData: any[]) => {
    const analytics = fields.map(field => {
      const relevantFeedbacks = feedbackData.filter(f =>
        f.custom_responses?.[field.id] !== undefined &&
        f.custom_responses?.[field.id] !== null &&
        f.custom_responses?.[field.id] !== ""
      );

      const resCount = relevantFeedbacks.length;
      const completion = feedbackData.length > 0 ? (resCount / feedbackData.length) * 100 : 0;

      const genderDist = { male: 0, female: 0, unknown: 0 };
      const wilayaDist: Record<string, number> = {};
      const ageDist: Record<string, number> = {};

      relevantFeedbacks.forEach(f => {
        if (f.sex === 'male') genderDist.male++;
        else if (f.sex === 'female') genderDist.female++;
        else genderDist.unknown++;

        if (f.wilaya) {
          wilayaDist[f.wilaya] = (wilayaDist[f.wilaya] || 0) + 1;
        }

        if (f.age_range) {
          ageDist[f.age_range] = (ageDist[f.age_range] || 0) + 1;
        }
      });

      let res: any = {
        label: field.label,
        type: field.type,
        count: resCount,
        completion,
        genderDistribution: genderDist,
        wilayaDistribution: wilayaDist,
        ageDistribution: ageDist
      };

      if (field.type === 'choice') {
        const options = field.options || [];
        const distribution: any = {};
        options.forEach((opt: string) => distribution[opt] = 0);

        relevantFeedbacks.forEach(f => {
          const val = f.custom_responses[field.id];
          if (val && distribution[val] !== undefined) {
            distribution[val]++;
          }
        });

        res.distribution = distribution;
        res.options = options;
      } else if (field.type === 'boolean') {
        const trueFeedbacks = relevantFeedbacks.filter(f => f.custom_responses[field.id] === true);
        const falseFeedbacks = relevantFeedbacks.filter(f => f.custom_responses[field.id] === false);

        res.truePerc = resCount > 0 ? (trueFeedbacks.length / resCount) * 100 : 0;
        res.falsePerc = resCount > 0 ? (falseFeedbacks.length / resCount) * 100 : 0;

      } else if (field.type === 'rating') {
        const nums = relevantFeedbacks.map(f => f.custom_responses[field.id]).filter(r => typeof r === 'number');
        res.avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

        const maleRatings = relevantFeedbacks.filter(f => f.sex === 'male').map(f => f.custom_responses[field.id]).filter(r => typeof r === 'number');
        const femaleRatings = relevantFeedbacks.filter(f => f.sex === 'female').map(f => f.custom_responses[field.id]).filter(r => typeof r === 'number');

        res.maleAvg = maleRatings.length > 0 ? maleRatings.reduce((a, b) => a + b, 0) / maleRatings.length : 0;
        res.femaleAvg = femaleRatings.length > 0 ? femaleRatings.reduce((a, b) => a + b, 0) / femaleRatings.length : 0;
        res.maleFeedbackCount = maleRatings.length;
        res.femaleFeedbackCount = femaleRatings.length;

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
  const topPerformer = [...businessPerformance].sort((a, b) => b.avg - a.avg)[0];
  const mostActive = [...businessPerformance].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 relative">

      {!allowStats && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-50/20 backdrop-blur-sm rounded-3xl">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Lock size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Analyses Restreintes</h2>
              <p className="text-slate-500 text-sm">
                Passez au plan <span className="text-slate-900 font-bold">Pro</span> pour débloquer les statistiques détaillées.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-black text-white rounded-lg py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
            >
              Voir les plans <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <div className={`space-y-6 transition-all duration-700 ${!allowStats ? 'blur-md opacity-20 pointer-events-none select-none' : ''}`}>

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analyses & Performance</h1>
            <p className="text-slate-500 text-sm font-medium">Evolution en temps réel de votre satisfaction client</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[140px]">
              <select
                value={selectedTimeRange}
                onChange={(e) => {
                  setSelectedTimeRange(e.target.value);
                  if (e.target.value !== "custom") setCustomDate("");
                }}
                className="w-full bg-white border border-slate-200 text-slate-900 py-2.5 pl-3 pr-8 rounded-xl text-[10px] font-black uppercase tracking-wider focus:border-indigo-300 outline-none transition-all cursor-pointer shadow-sm appearance-none hover:bg-slate-50"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="custom">Jour personnalisé</option>
                <option value="all">Tout temps</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {selectedTimeRange === "custom" && (
              <div className="relative">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-900 py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider focus:border-indigo-300 outline-none transition-all shadow-sm"
                />
              </div>
            )}

            <div className="relative group min-w-[180px]">
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 py-2.5 pl-3 pr-8 rounded-xl text-[10px] font-black uppercase tracking-wider focus:border-indigo-300 outline-none transition-all cursor-pointer shadow-sm appearance-none hover:bg-slate-50"
              >
                <option value="all">Tous les produits</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Main Insights Grid: Stats (Left) + Evolution (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stats Cards - Left Column (3/12) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                  <MessageCircle size={16} className="text-slate-600" />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Avis</p>
                <p className="text-lg font-black text-slate-900">{stats.totalFeedback}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                  <Star size={16} className="text-amber-600" />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Note</p>
                <p className="text-lg font-black text-slate-900">
                  {stats.averageRating.toFixed(1)}<span className="text-amber-500 text-xs">★</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
                  <ThumbsUp size={16} className="text-emerald-600" />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Engag.</p>
                <p className="text-lg font-black text-emerald-600">{stats.responseRate.toFixed(0)}%</p>
              </div>

              <div className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center border-b-4 ${stats.recentTrend >= 0 ? 'border-b-emerald-500' : 'border-b-rose-500'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stats.recentTrend >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <TrendingUp size={16} className={stats.recentTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Tendance</p>
                <p className={`text-lg font-black ${stats.recentTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.recentTrend >= 0 ? '+' : ''}{stats.recentTrend.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Rating Evolution Chart - Right Column (9/12) */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Historique des Notes</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{selectedBusinessName}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-[160px] flex flex-col justify-center">
                <RatingMiniChart data={ratingChartData} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Top Performer Banner - Only show when "All Businesses" is selected or if we want it as a highlight */}
      {selectedBusinessId === "all" && businessPerformance.length > 0 && topPerformer && (
        <button
          onClick={() => setSelectedBusinessId(topPerformer.id)}
          className="w-full bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-slate-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all">
              <Trophy size={32} />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-1">Performance Élite</p>
              <p className="text-4xl font-black tracking-tight group-hover:scale-105 transition-transform">{topPerformer.name}</p>
              <p className="text-[10px] opacity-60 font-bold mt-1 uppercase tracking-wide">Cliquez pour voir les détails stratégiques</p>
            </div>
          </div>
          <div className="text-right bg-white/10 px-8 py-4 rounded-xl backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-all w-full sm:w-auto">
            <div className="flex items-baseline gap-1 justify-end">
              <p className="text-5xl font-black">{topPerformer.avg.toFixed(1)}</p>
              <span className="text-2xl opacity-80">★</span>
            </div>
            <p className="text-[11px] font-bold opacity-70 uppercase tracking-wide mt-1">{topPerformer.count} avis clients</p>
          </div>
        </button>
      )}

      {/* Product Ranking */}
      {selectedBusinessId === "all" && businessPerformance.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Trophy size={14} className="text-amber-500" /> Classement
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {businessPerformance.sort((a, b) => b.avg - a.avg).map((bus, idx) => (
              <div key={bus.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:shadow-lg hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-400'}`}>
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">{bus.name}</p>
                    <p className="text-[8px] text-slate-400 font-medium">{bus.count} avis</p>
                  </div>
                </div>
                <p className="text-sm font-black text-slate-900 shrink-0 ml-2">{bus.avg.toFixed(1)}<span className="text-[9px] text-amber-500">★</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Fields - Only show when a specific product is selected */}
      {selectedBusinessId !== "all" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ListChecks size={14} className="text-indigo-500" /> Réponses Détaillées
            </h2>

            {/* Question Filter Dropdown */}
            {customFieldsAnalytics.length > 0 && (
              <div className="relative group min-w-[240px]">
                <select
                  value={selectedQuestionLabel}
                  onChange={(e) => setSelectedQuestionLabel(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 py-2 pl-3 pr-8 rounded-xl text-[10px] font-black uppercase tracking-wider focus:border-indigo-400 outline-none transition-all cursor-pointer shadow-sm appearance-none hover:bg-slate-50"
                >
                  <option value="all">Toutes les questions</option>
                  {customFieldsAnalytics.map(field => (
                    <option key={field.label} value={field.label}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" size={14} />
              </div>
            )}
          </div>

          {customFieldsAnalytics.filter(f => (f.type === 'boolean' || f.type === 'rating' || f.type === 'choice') && (selectedQuestionLabel === "all" || selectedQuestionLabel === f.label)).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customFieldsAnalytics
                .filter(f => (f.type === 'boolean' || f.type === 'rating' || f.type === 'choice') && (selectedQuestionLabel === "all" || selectedQuestionLabel === f.label))
                .map((field) => (
                  <div key={field.label} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight truncate">{field.label}</p>
                        <div className="flex items-center gap-2 text-[9px] font-medium text-slate-400 uppercase tracking-wide mt-1">
                          <span className="px-2 py-0.5 bg-slate-50 rounded-md">{field.count} rép.</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span>{field.completion.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                        {field.type === 'boolean' ? <CheckCircle2 size={20} /> : (field.type === 'rating' ? <Star size={20} /> : <MessageCircle size={20} />)}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      {field.type === 'boolean' && (
                        <CustomFieldBooleanBlock field={field} />
                      )}

                      {field.type === 'rating' && (
                        <CustomFieldRatingBlock field={field} />
                      )}

                      {field.type === 'choice' && (
                        <CustomFieldChoiceBlock field={field} />
                      )}

                      {(field.type === 'text' || field.type === 'textarea' || field.type === 'message') && (
                        <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center text-center space-y-3">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-300">
                            <MessageCircle size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide">Feedback Libre</p>
                            <p className="text-[9px] font-medium text-slate-400 mt-1">Consultez la liste détaillée</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-20 bg-white rounded-2xl border border-dashed border-slate-100 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
                <Ghost size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Aucune donnée</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Configurez votre formulaire</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldDemographics({ field }: { field: any }) {
  if (field.count === 0) return null;

  return (
    <div className="pt-3 mt-3 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 h-[120px]">
      {/* Gender Breakdown Column */}
      <div className="flex flex-col h-full bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Users size={12} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400">Genre</span>
        </div>
        <div className="space-y-3 px-1 pb-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold">
              <span className="text-blue-600">Hommes</span>
              <span className="text-blue-700">{((field.genderDistribution.male / field.count) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-blue-400" style={{ width: `${(field.genderDistribution.male / field.count) * 100}%` }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold">
              <span className="text-pink-600">Femmes</span>
              <span className="text-pink-700">{((field.genderDistribution.female / field.count) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-pink-400" style={{ width: `${(field.genderDistribution.female / field.count) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Wilaya Distribution Column */}
      <div className="flex flex-col h-full bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 mb-2 px-1 text-sticky top-0 bg-slate-50/50 backdrop-blur-sm z-10">
          <Target size={12} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400">Wilaya</span>
        </div>
        <div className="flex flex-col gap-1 px-1">
          {Object.entries(field.wilayaDistribution)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([wilaya, count]: [string, any]) => (
              <div key={wilaya} className="flex justify-between items-center text-[9px] font-bold text-slate-600 bg-white/50 px-2 py-1 rounded-md border border-slate-100">
                <span className="truncate pr-1">{wilaya.split('-').pop()?.trim() || wilaya}</span>
                <span className="text-slate-400 shrink-0">({count})</span>
              </div>
            ))}
          {Object.keys(field.wilayaDistribution).length === 0 && (
            <p className="text-[9px] text-slate-300 italic p-1">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Age Distribution Column */}
      <div className="flex flex-col h-full bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 mb-2 px-1 text-sticky top-0 bg-slate-50/50 backdrop-blur-sm z-10">
          <Calendar size={12} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400">Âge</span>
        </div>
        <div className="flex flex-col gap-1 px-1">
          {Object.entries(field.ageDistribution || {})
            .sort(([a], [b]) => {
              const order = ["-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([range, count]: [string, any]) => (
              <div key={range} className="flex justify-between items-center text-[9px] font-bold text-indigo-600 bg-indigo-50/30 px-2 py-1 rounded-md border border-indigo-100/30">
                <span>{range}</span>
                <span className="text-indigo-400 opacity-60 shrink-0">({count})</span>
              </div>
            ))}
          {Object.keys(field.ageDistribution || {}).length === 0 && (
            <p className="text-[9px] text-slate-300 italic p-1">Aucune donnée</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomFieldBooleanBlock({ field }: { field: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-emerald-600">OUI</span>
            <span className="text-sm font-black text-emerald-700">{field.truePerc.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${field.truePerc}%` }} />
          </div>
        </div>
        <div className="w-px h-10 bg-slate-200"></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-rose-500">NON</span>
            <span className="text-sm font-black text-rose-600">{field.falsePerc.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-rose-400 transition-all duration-1000" style={{ width: `${field.falsePerc}%` }} />
          </div>
        </div>
      </div>

      <FieldDemographics field={field} />
    </div>
  );
}

function CustomFieldChoiceBlock({ field }: { field: any }) {
  const [selectedOption, setSelectedOption] = useState<string | 'global'>('global');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {field.options.map((opt: string) => {
          const count = field.distribution[opt] || 0;
          const perc = field.count > 0 ? (count / field.count) * 100 : 0;
          return (
            <div
              key={opt}
              onClick={() => setSelectedOption(opt)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOption === opt ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <p className={`text-[9px] font-black uppercase tracking-wide truncate pr-2 ${selectedOption === opt ? 'text-indigo-600' : 'text-slate-500'}`}>{opt}</p>
                <p className="text-[10px] font-black text-slate-400">{count}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className={`text-xl font-black ${selectedOption === opt ? 'text-indigo-700' : 'text-slate-900'}`}>{perc.toFixed(0)}%</p>
              </div>
              <div className="mt-2 h-1 bg-white/50 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${selectedOption === opt ? 'bg-indigo-500' : 'bg-slate-300'}`} style={{ width: `${perc}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-2">
        <button
          onClick={() => setSelectedOption('global')}
          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${selectedOption === 'global' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          Vue Globale
        </button>
      </div>

      <FieldDemographics field={field} />
    </div>
  );
}

function RatingMiniChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-300 text-xs font-medium">
        Aucune donnée
      </div>
    );
  }

  const maxRating = 5;
  const hasData = data.some(d => d.average > 0);

  if (!hasData) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-300 text-xs font-medium">
        Aucune note disponible
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-24">
        {data.map((point, idx) => {
          const height = (point.average / maxRating) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t transition-all duration-500 ${point.average >= 4 ? 'bg-emerald-500' :
                    point.average >= 3 ? 'bg-amber-500' :
                      point.average > 0 ? 'bg-rose-500' : 'bg-slate-100'
                    } ${point.count > 0 ? 'group-hover:opacity-80' : ''}`}
                  style={{ height: `${height}%`, minHeight: point.average > 0 ? '4px' : '2px' }}
                >
                  {point.count > 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black text-white text-center pt-1">
                      {point.average.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        {data.map((point, idx) => (
          <div key={idx} className="flex-1 text-center">
            <p className="text-[7px] font-bold text-slate-400 uppercase truncate">{point.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomFieldRatingBlock({ field }: { field: any }) {
  const [selectedStar, setSelectedStar] = useState<number | 'global'>('global');

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-wide mb-2">Note Moyenne</p>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{field.avg.toFixed(1)}</span>
              <span className="text-xl text-amber-400 font-black">★</span>
            </div>
            {/* Optional gender split */}
            {(field.maleFeedbackCount > 0 || field.femaleFeedbackCount > 0) && (
              <div className="flex gap-3 text-right">
                {field.maleFeedbackCount > 0 && (
                  <div>
                    <p className="text-[8px] font-bold text-blue-300 uppercase tracking-wide">Hommes</p>
                    <p className="text-base font-black">{field.maleAvg.toFixed(1)}<span className="text-[10px] opacity-50">★</span></p>
                  </div>
                )}
                {field.femaleFeedbackCount > 0 && (
                  <div>
                    <p className="text-[8px] font-bold text-pink-300 uppercase tracking-wide">Femmes</p>
                    <p className="text-base font-black">{field.femaleAvg.toFixed(1)}<span className="text-[10px] opacity-50">★</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between gap-1 overflow-x-auto">
        <button
          onClick={() => setSelectedStar('global')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedStar === 'global' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Global
        </button>
        {[5, 4, 3, 2, 1].map(star => {
          const count = field.dist?.[star] || 0;
          return (
            <button
              key={star}
              onClick={() => setSelectedStar(star)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedStar === star ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span>{star}</span><Star size={10} className="fill-current" />
              <span className="ml-1 opacity-50 text-[10px]">({count})</span>
            </button>
          )
        })}
      </div>

      <FieldDemographics field={field} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, precision = "", variant = "default", data = [], trend = 0 }: any) {
  const colors: any = {
    default: "text-slate-900 bg-slate-50",
    success: "text-emerald-600 bg-emerald-50",
    danger: "text-rose-600 bg-rose-50",
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${colors[variant === 'default' ? 'default' : variant]} mb-3`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide leading-none mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-black ${variant === 'success' ? 'text-emerald-600' : variant === 'danger' ? 'text-rose-600' : 'text-slate-900'}`}>
            {value}
          </span>
          <span className="text-xs font-bold text-slate-400">{precision}</span>
        </div>
      </div>
      {data.length > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-6 opacity-30 px-2">
          <Sparkline data={data} color={trend >= 0 ? "stroke-emerald-400" : "stroke-rose-400"} />
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, color = "stroke-indigo-500" }: { data: number[], color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 20;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={`M ${points}`} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color} />
    </svg>
  );
}
