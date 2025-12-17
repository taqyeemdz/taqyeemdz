"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";
import {
  Building2,
  Star,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  LogOut,
} from "lucide-react";

export default function OwnerDashboardPage() {
  const supabase = supabaseBrowser; const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avg: 0,
    count: 0,
  });

  /* ========================= LOAD OWNER BUSINESS ========================= */
  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1️⃣ Get session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // 2️⃣ Get owner's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "owner") {
        router.replace("/auth/login");
        return;
      }

      // 3️⃣ Load business
      const { data: b } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.business_id)
        .maybeSingle();

      setBusiness(b);

      // 4️⃣ Load feedback
      const { data: fb } = await supabase
        .from("feedback")
        .select("id, rating, message, created_at")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });

      setFeedback(fb || []);

      // 5️⃣ Stats: average + count
      const { data: avg } = await supabase.rpc("avg_feedback_for_business", {
        bid: profile.business_id,
      });

      const { count } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("business_id", profile.business_id);

      setStats({
        avg: avg || 0,
        count: count || 0,
      });

      setLoading(false);
    })();
  }, []);

  /* ========================= LOGOUT ========================= */
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  /* ========================= LOADING ========================= */
  if (loading) {
    return (
      <div className="p-6 text-[var(--muted-foreground)]">
        Loading your dashboard…
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 text-[var(--muted-foreground)]">
        Could not find your business.
      </div>
    );
  }

  /* ========================= UI ========================= */
  return (
    <div className="p-6 flex flex-col gap-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--chart-2)] text-white rounded-xl flex items-center justify-center">
            <Building2 size={30} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              Your internal feedback dashboard
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* BUSINESS INFO */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl shadow-sm">
        <h2 className="font-semibold text-xl mb-4">Business Info</h2>

        <div className="space-y-3">
          <InfoRow icon={<MapPin />} label="Address" value={business.address} />
          <InfoRow icon={<Phone />} label="Phone" value={business.phone} />
          <InfoRow icon={<Mail />} label="Email" value={business.email} />
        </div>
      </div>

      {/* STATS */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl shadow-sm">
        <h2 className="font-semibold text-xl mb-4">Feedback Summary</h2>

        <div className="flex gap-10">
          <div>
            <p className="text-4xl font-bold text-[var(--chart-1)]">
              {stats.avg.toFixed(1)}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">Average Rating</p>
          </div>

          <div>
            <p className="text-4xl font-bold text-[var(--chart-3)]">
              {stats.count}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">Total Feedback</p>
          </div>
        </div>
      </div>

      {/* FEEDBACK LIST */}
      <div>
        <h2 className="font-semibold text-xl mb-4">Recent Feedback</h2>

        {feedback.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No feedback yet.</p>
        ) : (
          <div className="space-y-4">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl hover:border-[var(--chart-2)] transition"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-[var(--foreground)]">
                    ⭐ {fb.rating}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(fb.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-[var(--muted-foreground)] mt-2">
                  {fb.message || "No message"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* SMALL COMPONENT */
function InfoRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[var(--chart-2)]">{icon}</div>
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}
