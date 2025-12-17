"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MessageCircle,
  TrendingUp,
  Star,
  Activity,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalFeedback: 0,
    totalOwners: 0,
    avgRating: 0
  });
  const [latestFeedback, setLatestFeedback] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return router.replace("/auth/login");

      // 1. Stats Counts
      const { count: bCount } = await supabase.from("businesses").select("*", { count: "exact", head: true });
      const { count: fCount } = await supabase.from("feedback").select("*", { count: "exact", head: true });
      const { count: oCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq('role', 'owner');

      // Try RPC for avg rating, fallback to 0 if fails
      let avg = 0;
      const { data: rpcAvg } = await supabase.rpc("avg_feedback_rating");
      if (rpcAvg) avg = rpcAvg;

      setStats({
        totalBusinesses: bCount || 0,
        totalFeedback: fCount || 0,
        totalOwners: oCount || 0,
        avgRating: avg
      });

      // 2. Latest Feedback
      const { data: latest } = await supabase
        .from("feedback")
        .select("*, businesses(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setLatestFeedback(latest || []);

      // 3. Top Businesses (RPC or fallback)
      const { data: top } = await supabase.rpc("top_businesses_by_feedback");
      if (top) {
        setTopBusinesses(top);
      } else {
        // Fallback: fetch standard list if RPC missing
        const { data: fallbackList } = await supabase
          .from("businesses")
          .select("id, name")
          .limit(5);
        // Map to match shape if needed or use simple list
        setTopBusinesses(fallbackList?.map(b => ({ business_id: b.id, business_name: b.name, feedback_count: 0 })) || []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">System-wide performance and activity.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Businesses"
          value={stats.totalBusinesses}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Total Owners"
          value={stats.totalOwners}
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Total Feedback"
          value={stats.totalFeedback}
          icon={MessageCircle}
          color="indigo"
        />
        <StatCard
          label="Avg Rating"
          value={stats.avgRating?.toFixed(1) || "0.0"}
          icon={Star}
          color="amber"
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COL: Recent Activity (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-gray-400" />
              Recent Activity
            </h2>
            {/* Could add 'View All' link here */}
          </div>

          <div className="space-y-4">
            {latestFeedback.length > 0 ? (
              latestFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-start"
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${fb.rating >= 4 ? 'bg-green-100 text-green-700' :
                    fb.rating <= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {fb.rating}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      New review for <span className="text-indigo-600">{fb.businesses?.name}</span>
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {fb.message || <span className="italic opacity-50">No message provided</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(fb.created_at).toLocaleDateString()} • {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No recent activity.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: Top Businesses (1/3) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-gray-400" />
              Top Performers
            </h2>
          </div>

          <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            {topBusinesses.length > 0 ? (
              topBusinesses.slice(0, 5).map((b, i) => (
                <div key={b.business_id || i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{b.business_name}</p>
                      <p className="text-xs text-gray-400">{b.feedback_count} reviews</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                    {b.avg_rating ? Number(b.avg_rating).toFixed(1) : "-"}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">
                No details available.
              </div>
            )}
          </div>

          {/* Quick Actions / System Health (Placeholder) */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-green-400" size={20} />
              <h3 className="font-bold">System Status</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              All systems operational. No critical issues reported.
            </p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              View System Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600"
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.blue}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}
