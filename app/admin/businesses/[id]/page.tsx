"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Eye, EyeOff } from "lucide-react"; // ⬅️ add this at top

export default function BusinessDetailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [showDelete, setShowDelete] = useState(false);
const [showPassword, setShowPassword] = useState(false);

  const [stats, setStats] = useState({
    avg: 0,
    count: 0,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);

      // ⭐ Fetch business including temp_password
      const { data: b } = await supabase
        .from("businesses")
        .select(
          "id, name, owner_name, email, phone, address, category, created_at, temp_password"
        )
        .eq("id", id)
        .maybeSingle();

      setBusiness(b);

      // ⭐ Fetch feedback
      const { data: fb } = await supabase
        .from("feedback")
        .select("id, rating, message, created_at")
        .eq("business_id", id)
        .order("created_at", { ascending: false });

      setFeedback(fb || []);

      // ⭐ Stats
      const { data: avg } = await supabase.rpc("avg_feedback_for_business", {
        bid: id,
      });

      const { count } = await supabase
        .from("feedback")
        .select("*", { head: true, count: "exact" })
        .eq("business_id", id);

      setStats({
        avg: avg || 0,
        count: count || 0,
      });

      setLoading(false);
    })();
  }, [id]);

  // ========================= LOADING / NOT FOUND =========================

  if (loading) {
    return (
      <div className="p-6 text-[var(--muted-foreground)]">
        Loading business details...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 text-[var(--muted-foreground)]">
        Business not found or you don't have permission.
      </div>
    );
  }

  // ========================= PAGE =========================

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--chart-2)] transition w-fit"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[var(--chart-2)] rounded-xl flex items-center justify-center">
            <Building2 className="text-white" size={32} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {business.name}
            </h1>

            <p className="text-[var(--muted-foreground)]">
              Added on {new Date(business.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl shadow hover:bg-red-700 transition"
        >
          <Trash2 size={18} />
          Delete
        </button>
      </div>

     

      {/* INFO */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Business Information
        </h2>

        <div className="space-y-3">
          <InfoRow label="Address" value={business.address} icon={<MapPin />} />
          <InfoRow label="Phone" value={business.phone} icon={<Phone />} />
          <InfoRow label="Email" value={business.email} icon={<Mail />} />
          <InfoRow label="Password" value={showPassword ? business.temp_password : "••••••••"} icon={<Mail />} />

          <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-yellow-700 hover:text-yellow-900 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
          </div>

        </div>
        
      </div>

 

      {/* STATS */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Feedback Summary
        </h2>

        <div className="flex gap-10">
          <div>
            <span className="text-4xl font-bold text-[var(--chart-1)]">
              {stats.avg.toFixed(1)}
            </span>
            <p className="text-[var(--muted-foreground)]">Average Rating</p>
          </div>

          <div>
            <span className="text-4xl font-bold text-[var(--chart-3)]">
              {stats.count}
            </span>
            <p className="text-[var(--muted-foreground)]">Total Feedback</p>
          </div>
        </div>
      </div>

      {/* FEEDBACK */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Recent Feedback
        </h2>

        {feedback.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">
            No feedback received yet.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--chart-2)] hover:shadow transition"
              >
                <div className="flex justify-between">
                  <span className="text-[var(--foreground)] font-medium">
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

      

      {/* DELETE MODAL */}
      {showDelete && (
        <DeleteBusinessModal id={id} onClose={() => setShowDelete(false)} />
      )}
    </div>
  );
}

/* ========================= INFO ROW ========================= */

function InfoRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 text-[var(--foreground)]">
      <div className="text-[var(--chart-2)]">{icon}</div>

      <div>
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

/* ========================= DELETE MODAL ========================= */

function DeleteBusinessModal({ id, onClose }: any) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this business?")) return;

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting business: " + error.message);
      return;
    }

    router.push("/admin/businesses");
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Delete Business</h2>
        </div>

        <p className="text-gray-600 text-sm">
          Are you sure you want to delete this business? This cannot be undone.
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
