"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { Users, Star, BarChart3, ArrowRight } from "lucide-react";

export default function RightPanel() {
  const supabase = supabaseBrowser;
  const [stats, setStats] = useState({ avg: 0, total: 0, businesses: 0 });
  const [users, setUsers] = useState<any[]>([]);

  /* ================================
     LOAD RIGHT PANEL DATA
  ================================ */
  useEffect(() => {
    (async () => {
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
        .limit(3);

      setUsers(userList || []);
    })();
  }, []);

  return (
    <div className="p-6 flex flex-col gap-6 sticky top-0">

      {/* =========================== */}
      {/* PROFILE CARD */}
      {/* =========================== */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col items-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center shadow-inner">
          <Users size={40} className="text-primary-700" />
        </div>

        <h4 className="text-xl font-semibold text-primary-900 mt-3">
          Welcome Admin
        </h4>
        <p className="text-sm text-gray-500 text-center">
          Keep track of feedback and performance.
        </p>
      </div>

      {/* =========================== */}
      {/* STATISTICS CARD */}
      {/* =========================== */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary-900">Statistics</h3>
          <BarChart3 className="text-primary-600" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Feedback</span>
            <span className="font-bold text-primary-700">{stats.total}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Average Rating</span>
            <span className="font-bold text-accent-600">
              {stats.avg?.toFixed(1)} ⭐
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Businesses</span>
            <span className="font-bold text-primary-700">
              {stats.businesses}
            </span>
          </div>
        </div>

        {/* Mini Chart Bar */}
        <div className="mt-5 flex gap-2 items-end h-16">
          <div className="w-2.5 rounded-full bg-primary-300 h-6"></div>
          <div className="w-2.5 rounded-full bg-primary-400 h-10"></div>
          <div className="w-2.5 rounded-full bg-primary-600 h-14"></div>
          <div className="w-2.5 rounded-full bg-primary-300 h-4"></div>
          <div className="w-2.5 rounded-full bg-primary-500 h-12"></div>
        </div>
      </div>

      {/* =========================== */}
      {/* ADMINS & USERS CARD */}
      {/* =========================== */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-primary-900 mb-4">
          Admins & Users
        </h3>

        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold">
                    {u.email}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{u.email}</p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
              </div>

              <button className="px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition">
                Manage
              </button>
            </div>
          ))}
        </div>

        <button className="mt-4 flex items-center gap-2 text-sm text-primary-700 hover:underline">
          View all <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}
