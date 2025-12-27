"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  TrendingUp,
  MessageCircle,
  Store,
  ChevronRight,
  ArrowRight,
  Zap
} from "lucide-react";

export default function OwnerDashboardPage() {
  const supabase = supabaseBrowser; const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalReviews: 0
  });
  const [latestBusinesses, setLatestBusinesses] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [allowStats, setAllowStats] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      // 1) Check session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return router.replace("/auth/login");

      // 2) Get all business IDs for this user
      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3) Fetch Stats & Data
      // A. Businesses Count
      const totalBusinesses = businessIds.length;

      // B. Latest 5 Businesses
      const { data: latestBiz } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds)
        .order("created_at", { ascending: false })
        .limit(5);

      setLatestBusinesses(latestBiz || []);

      // C. Recent Feedback
      const { data: recentFb } = await supabase
        .from("feedback")
        .select("*, businesses(name)")
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentFeedback(recentFb || []);

      // D. Total Reviews
      const { count } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .in("business_id", businessIds);

      setStats({
        totalBusinesses,
        totalReviews: count || 0
      });

      // E. Fetch Subscription Features
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

    loadDashboard();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className=" mx-auto p-6 space-y-8">

      {/* SECTION 1: WELCOME & STATS */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1"> Overview of your business performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            label="Total Businesses"
            value={stats.totalBusinesses}
            icon={Store}
            color="blue"
          />
          <StatCard
            label="Total Reviews"
            value={stats.totalReviews}
            icon={MessageCircle}
            color="indigo"
            locked={!allowStats}
          />
        </div>
      </div>

      {/* SECTION 2: CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LATEST BUSINESSES LIST (Left Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Latest Businesses
            </h2>
            <button
              onClick={() => router.push("/owner/business")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              See all <ChevronRight size={14} />
            </button>
          </div>

          {latestBusinesses.length > 0 ? (
            <div className="space-y-3">
              {latestBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => router.push(`/owner/business/${biz.id}`)}
                  className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{biz.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={12} />
                      <span className="truncate">{biz.address || "No address"}</span>
                    </div>
                  </div>
                  <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">No businesses yet.</p>
            </div>
          )}
        </div>

        {/* RECENT FEEDBACK LIST (Right Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle size={20} className="text-indigo-600" />
              Recent Feedback
            </h2>
            <button
              onClick={() => router.push("/owner/feedback")}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              See all <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {recentFeedback.length > 0 ? (
              recentFeedback.map(fb => (
                <div
                  key={fb.id}
                  onClick={() => router.push(`/owner/feedback/${fb.id}`)}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-start"
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${fb.rating >= 4 ? 'bg-green-100 text-green-600' : fb.rating >= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                    <span className="font-bold text-sm">{fb.rating}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {fb.businesses?.name || "Unknown Business"}
                      </h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {fb.message ? `"${fb.message}"` : <span className="italic text-gray-400">No comment provided</span>}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <MessageCircle size={24} />
                </div>
                <p className="text-gray-500">No feedback received yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, locked }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${locked ? 'opacity-75 grayscale' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color] || 'bg-gray-50 text-gray-600'}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {locked ? <Zap size={10} className="fill-indigo-500 text-indigo-500 inline mr-1" /> : ''}
          {label.split(' ')[1] || 'Stat'}
        </span>
      </div>
      <p className="text-3xl font-black text-gray-900 leading-none">
        {locked ? '---' : value}
      </p>
      <p className="text-xs font-bold text-gray-500 mt-2">{label}</p>

      {locked && (
        <div className="absolute inset-x-0 bottom-0 bg-indigo-600/10 backdrop-blur-[1px] py-1 text-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Pro Feature</span>
        </div>
      )}
    </div>
  );
}
