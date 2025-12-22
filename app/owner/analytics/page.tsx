"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  Star,
  Users,
  Calendar,
  ChevronDown,
  Building2,
  Sparkles,
  ThumbsUp,
  Clock
} from "lucide-react";

export default function AnalyticsPage() {
  const supabase = supabaseBrowser;
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("all");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentTrend: 0,
    responseRate: 0
  });

  // Fetch businesses on mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch businesses owned by user
      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length > 0) {
        const { data: busDocs } = await supabase
          .from("businesses")
          .select("id, name")
          .in("id", businessIds);

        if (busDocs && busDocs.length > 0) {
          setBusinesses(busDocs);
          setSelectedBusinessId("all");
        }
      }
      setLoading(false);
    };

    fetchBusinesses();
  }, []);

  // Fetch feedback when business selection changes
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
      }
    };

    fetchFeedback();
  }, [selectedBusinessId, businesses]);

  const calculateStats = (feedbackData: any[]) => {
    const total = feedbackData.length;
    const ratings = feedbackData.map(f => f.rating).filter(r => r);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      if (r >= 1 && r <= 5) distribution[r as keyof typeof distribution]++;
    });

    // Calculate recent trend (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = feedbackData.filter(f => {
      const date = new Date(f.created_at);
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;

    const previous7Days = feedbackData.filter(f => {
      const date = new Date(f.created_at);
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7 && diff <= 14;
    }).length;

    const trend = previous7Days > 0
      ? ((last7Days - previous7Days) / previous7Days) * 100
      : 0;

    // Response rate (feedbacks with messages)
    const withMessages = feedbackData.filter(f => f.message && f.message.trim()).length;
    const responseRate = total > 0 ? (withMessages / total) * 100 : 0;

    setStats({
      totalFeedback: total,
      averageRating: avgRating,
      ratingDistribution: distribution,
      recentTrend: trend,
      responseRate
    });
  };

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <BarChart3 size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 text-sm font-medium">Track your feedback performance</p>
              </div>
            </div>

            {/* BUSINESS SELECTOR */}
            {businesses.length > 0 && (
              <div className="relative min-w-[240px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
                  Select Business
                </label>
                <div className="relative">
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-900 py-3 pl-4 pr-10 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
                  >
                    <option value="all">All Businesses</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OVERVIEW STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <MessageCircle size={20} className="text-indigo-600" />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total</span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none">{stats.totalFeedback}</p>
            <p className="text-xs font-bold text-gray-500 mt-2">Feedbacks Received</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star size={20} className="text-amber-500 fill-amber-500" />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Average</span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none">{stats.averageRating.toFixed(1)}</p>
            <p className="text-xs font-bold text-gray-500 mt-2">Star Rating</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${stats.recentTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.recentTrend >= 0 ? '+' : ''}{stats.recentTrend.toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none">
              {feedbacks.filter(f => {
                const diff = (new Date().getTime() - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7;
              }).length}
            </p>
            <p className="text-xs font-bold text-gray-500 mt-2">Last 7 Days</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <ThumbsUp size={20} className="text-purple-600" />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Rate</span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none">{stats.responseRate.toFixed(0)}%</p>
            <p className="text-xs font-bold text-gray-500 mt-2">With Messages</p>
          </div>
        </div>

        {/* RATING DISTRIBUTION & RECENT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* RATING DISTRIBUTION */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Star size={20} className="text-gray-400" />
              Rating Distribution
            </h3>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                const percentage = stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-black text-gray-900">{rating}</span>
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-xl overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-600">
                        {count}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 w-12 text-right">{percentage.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Clock size={20} className="text-gray-400" />
              Recent Activity
            </h3>

            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {feedbacks.slice(0, 10).map((feedback) => (
                <div key={feedback.id} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={10}
                              className={`${star <= feedback.rating ? "fill-amber-500 text-amber-500" : "fill-gray-200 text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-400">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {feedback.message && (
                        <p className="text-xs text-gray-600 line-clamp-2 font-medium">{feedback.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3 mb-6">
            <Sparkles size={20} className="text-gray-400" />
            Key Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <p className="text-sm font-black text-indigo-900 mb-1">Most Common Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-indigo-600">
                  {Object.entries(stats.ratingDistribution).reduce((a, b) => b[1] > a[1] ? b : a)[0]}
                </span>
                <Star size={16} className="text-indigo-600 fill-indigo-600" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
              <p className="text-sm font-black text-green-900 mb-1">Positive Feedback</p>
              <p className="text-2xl font-black text-green-600">
                {((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalFeedback * 100 || 0).toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <p className="text-sm font-black text-amber-900 mb-1">Engagement Score</p>
              <p className="text-2xl font-black text-amber-600">
                {stats.responseRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
