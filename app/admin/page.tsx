"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building,
  Star,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Info,
  XCircle
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [businessCount, setBusinessCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);

  /* Check Session + Role */
  useEffect(() => {
    async function fetchRole() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return router.replace("/auth/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin")
        return router.replace("/auth/login");

      setUserRole(profile.role);
    }

    fetchRole();
  }, []);

  /* Load Data */
  useEffect(() => {
    (async () => {
      const { count: bCount } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });
      setBusinessCount(bCount || 0);

      const { count: fCount } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true });
      setFeedbackCount(fCount || 0);

      const { data: avg } = await supabase.rpc("avg_feedback_rating");
      setAvgRating(avg || 0);

      const { data: latest } = await supabase
        .from("feedback")
        .select("id, message, rating, created_at, businesses(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setLatestFeedback(latest || []);

      const { data: top } = await supabase.rpc("top_businesses_by_feedback");
      setTopBusinesses(top || []);
    })();
  }, []);

  return (
    <div className="p-6 flex flex-col gap-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-primary-900">Admin Dashboard</h1>

      {userRole && (
        <div className="text-xs text-gray-600">
          Role: <b className="text-primary-700">{userRole}</b>
        </div>
      )}

      {/* ============ KPI CARDS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <DashboardStatCard
          title="Businesses"
          value={businessCount}
          color="primary"
          icon={<Building className="h-6 w-6" />}
        />

        <DashboardStatCard
          title="Feedback"
          value={feedbackCount}
          color="success"
          icon={<MessageSquare className="h-6 w-6" />}
        />

        <DashboardStatCard
          title="Avg Rating"
          value={avgRating?.toFixed(1) || "–"}
          color="accent"
          icon={<Star className="h-6 w-6" />}
        />

        <DashboardStatCard
          title="Top Rated"
          value={topBusinesses[0]?.business_name || "–"}
          color="info"
          icon={<TrendingUp className="h-6 w-6" />}
        />

        <DashboardStatCard
          title="Warnings"
          value="3"
          color="warning"
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        <DashboardStatCard
          title="Critical Issues"
          value="1"
          color="error"
          icon={<XCircle className="h-6 w-6" />}
        />
      </div>

      {/* ============ RECENT FEEDBACK ============ */}
      <DashboardCard title="Recent Feedback" icon={<MessageSquare />}>
        {latestFeedback.length === 0 ? (
          <p className="text-sm text-gray-500">No feedback yet.</p>
        ) : (
          <ul className="space-y-4">
            {latestFeedback.map((fb) => (
              <li key={fb.id} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-primary-800">
                    {fb.businesses?.name}
                  </span>
                  <span className="font-semibold text-accent-600">
                    ⭐ {fb.rating}
                  </span>
                </div>

                <p className="text-gray-700">{fb.message || "No message"}</p>

                <span className="text-xs text-gray-400">
                  {new Date(fb.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      {/* ============ TOP BUSINESSES ============ */}
      <DashboardCard title="Top Businesses" icon={<TrendingUp />}>
        {topBusinesses.length === 0 ? (
          <p className="text-sm text-gray-500">No data yet.</p>
        ) : (
          <ul className="space-y-3">
            {topBusinesses.map((b) => (
              <li key={b.business_id} className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-primary-700">{b.business_name}</span>
                <span className="text-sm text-gray-600">
                  {b.feedback_count} feedback
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}

/* =====================================
   THEMED COMPONENTS — ALL COLORS
===================================== */

function DashboardStatCard({ title, value, icon, color }: any) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary-50 text-primary-700 border-primary-200",
    success: "bg-success-50 text-success-700 border-success-200",
    accent: "bg-accent-50 text-accent-700 border-accent-200",
    warning: "bg-warning-50 text-warning-700 border-warning-200",
    error: "bg-error-50 text-error-700 border-error-200",
    info: "bg-info-50 text-info-700 border-info-200"
  };

  return (
    <div
      className={`
        rounded-2xl p-4 border shadow-soft hover:shadow-primary transition
        ${colorMap[color] || "bg-gray-50 border-gray-200 text-gray-700"}
      `}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="p-3 bg-white rounded-xl shadow">{icon}</div>
        <p className="text-xs font-semibold">{title}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DashboardCard({ title, icon, children }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-soft p-5 hover:shadow-primary transition">
      <div className="flex items-center gap-2 font-semibold mb-4 text-primary-800">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
