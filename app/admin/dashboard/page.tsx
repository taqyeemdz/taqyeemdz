"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  Star,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any[]>([]);

  const [categories] = useState([
    { name: "Satisfaction", progress: 80 },
    { name: "Service", progress: 55 },
    { name: "Cleanliness", progress: 62 },
  ]);

  const [stats, setStats] = useState({
    avg: 0,
    total: 0,
    businesses: 0,
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: latest } = await supabase
        .from("feedback")
        .select("id, message, rating, created_at, businesses(name)")
        .order("created_at", { ascending: false })
        .limit(4);

      setFeedback(latest || []);

      const { data: avg } = await supabase.rpc("avg_feedback_rating");

      const { count: total } = await supabase
        .from("feedback")
        .select("*", { head: true, count: "exact" });

      const { count: businessesCount } = await supabase
        .from("businesses")
        .select("*", { head: true, count: "exact" });

      setStats({
        avg: avg || 0,
        total: total || 0,
        businesses: businessesCount || 0,
      });

      const { data: userList } = await supabase
        .from("profiles")
        .select("id, email, role")
        .limit(5);

      setUsers(userList || []);

      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex gap-8 p-6 bg-[var(--background)] min-h-screen">

      {/* ========================= LEFT MAIN ========================= */}
      <div className="flex-1 flex flex-col gap-10">

        {/* HERO */}
        <div className="rounded-3xl p-8 text-white shadow-lg relative overflow-hidden bg-[var(--chart-2)]">
          <div className="absolute right-0 top-0 w-60 h-60 bg-white/10 rounded-full blur-2xl"></div>

          <h2 className="text-3xl font-bold text-white">
            Improve Your Service Quality with Internal Feedback
          </h2>

          <p className="mt-2 text-white/80 max-w-lg">
            Analyze private customer feedback collected from your QR codes.
          </p>

          <button className="mt-6 bg-white text-[var(--chart-2)] font-semibold px-5 py-2 rounded-full shadow hover:bg-gray-50 transition flex items-center gap-2">
            View Insights <ArrowRight size={16} />
          </button>
        </div>

        {/* FEEDBACK CATEGORIES */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Feedback Categories
          </h3>

          <div className="flex gap-4 flex-wrap">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 w-40 shadow-sm hover:shadow-md transition"
              >
                <p className="font-medium text-[var(--foreground)]">{cat.name}</p>

                <div className="mt-2 h-2 bg-[var(--muted)]/40 rounded-full">
                  <div
                    className="h-full bg-[var(--chart-2)] rounded-full"
                    style={{ width: `${cat.progress}%` }}
                  ></div>
                </div>

                <p className="text-xs text-gray-500 mt-1">{cat.progress}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* LATEST FEEDBACK */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Latest Feedback
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] hover:shadow-md transition"
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-[var(--foreground)]">
                    {fb.businesses?.name}
                  </span>

                  <span className="text-[var(--chart-1)] font-bold">
                    ⭐ {fb.rating}
                  </span>
                </div>

                <p className="text-[var(--foreground)]/70 mt-2 line-clamp-2">
                  {fb.message || "No message"}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(fb.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================= RIGHT PANEL ========================= */}
      <div className="w-[320px] hidden lg:flex flex-col gap-6">

        {/* USER CARD */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-soft flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[var(--chart-2)]/20 flex items-center justify-center">
            <Users size={40} className="text-[var(--chart-2)]" />
          </div>

          <h4 className="mt-3 font-semibold text-[var(--foreground)]">
            Admin Panel
          </h4>

          <p className="text-sm text-[var(--muted-foreground)]">
            Manage data & insights
          </p>
        </div>

        {/* STATS CARD */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-soft">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Statistics
          </h3>

          <p className="text-[var(--foreground)]/70 text-sm">
            Total Feedback:{" "}
            <span className="font-bold text-[var(--chart-3)]">{stats.total}</span>
          </p>

          <p className="text-[var(--foreground)]/70 text-sm">
            Average Rating:{" "}
            <span className="font-bold text-[var(--chart-1)]">
              {stats.avg?.toFixed(1)}
            </span>
          </p>

          <p className="text-[var(--foreground)]/70 text-sm">
            Businesses:{" "}
            <span className="font-bold text-[var(--chart-5)]">
              {stats.businesses}
            </span>
          </p>
        </div>

        {/* ADMINS */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-soft">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Admins & Users
          </h3>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border-b pb-2 border-[var(--border)]"
              >
                <span className="font-medium text-[var(--foreground)]">
                  {u.email}
                </span>

                <span className="text-xs bg-[var(--chart-2)]/15 text-[var(--chart-2)] px-2 py-1 rounded-full">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
