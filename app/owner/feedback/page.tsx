"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Search,
  Filter,
  ChevronRight,
  User,
  Calendar,
  Star,
  Ghost,
  Building2
} from "lucide-react";

export default function FeedbackPage() {
  const supabase = supabaseBrowser; const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filter, setFilter] = useState("all"); // all, positive, negative

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);

      // 1. Session check
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return router.replace("/auth/login");

      // 2. Get business IDs
      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Fetch all feedback
      const { data, error } = await supabase
        .from("feedback")
        .select("*, businesses(name)")
        .in("business_id", businessIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching feedback:", error);
      } else {
        setFeedbacks(data || []);
      }
      setLoading(false);
    };

    fetchFeedback();
  }, [router, supabase]);

  // FILTER LOGIC
  const filteredFeedbacks = feedbacks.filter(fb => {
    if (filter === "positive") return fb.rating >= 4;
    if (filter === "negative") return fb.rating <= 2;
    return true;
  });

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
    <div className=" mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Feedback</h1>
          <p className="text-gray-500 mt-1">Review feedback across all your businesses.</p>
        </div>

        {/* FILTERS */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {[
            { id: "all", label: "All" },
            { id: "positive", label: "Positive (4-5)" },
            { id: "negative", label: "Negative (1-2)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f.id
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((fb) => (
            <FeedbackItem key={fb.id} feedback={fb} onClick={() => router.push(`/owner/feedback/${fb.id}`)} />
          ))
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No feedback found</h3>
            <p className="text-gray-500 text-sm">
              {filter !== "all" ? "Try adjusting your filters." : "Wait for customers to submit reviews."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackItem({ feedback, onClick }: { feedback: any, onClick: () => void }) {
  const isAnonymous = feedback.anonymous;
  const date = new Date(feedback.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric"
  });

  return (
    <div
      onClick={onClick}
      className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row gap-5 items-start"
    >
      {/* Rating Box */}
      <div className={`shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${feedback.rating >= 4 ? 'bg-green-50 border-green-100 text-green-700' :
        feedback.rating >= 3 ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
          'bg-red-50 border-red-100 text-red-700'
        }`}>
        <span className="text-xl font-bold">{feedback.rating}</span>
        <div className="flex gap-0.5">
          <Star size={10} className="fill-current" />
          <Star size={10} className="fill-current" />
          <Star size={10} className="fill-current" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">

        {/* Top Row: Business Badge & Date */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            <Building2 size={12} />
            {feedback.businesses?.name || "Business"}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>

        {/* Message & User */}
        <div>
          <p className="text-gray-900 font-medium line-clamp-2 leading-relaxed">
            {feedback.message || <span className="italic text-gray-400 font-normal">No written comment provided.</span>}
          </p>

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
            {isAnonymous ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Ghost size={14} /> Anonymous
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <User size={14} className="text-indigo-500" /> {feedback.full_name}
              </div>
            )}

            {/* Tags if needed later */}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="hidden md:flex self-center text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
        <ChevronRight size={20} />
      </div>
    </div>
  );
}
