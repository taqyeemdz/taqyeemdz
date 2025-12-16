"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Star,
    User,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Ghost,
    MessageSquare,
    Image as ImageIcon,
    Video
} from "lucide-react";

export default function FeedbackDetailPage() {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const params = useParams();
    const feedbackId = params.id;

    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<any>(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            setLoading(true);

            // 1. Session check
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session?.user) return router.replace("/auth/login");

            // 2. Fetch feedback with business details
            const { data, error } = await supabase
                .from("feedback")
                .select("*, businesses(*)")
                .eq("id", feedbackId)
                .single();

            if (error || !data) {
                console.error("Error fetching feedback:", error);
                setFeedback(null);
            } else {
                setFeedback(data);
            }
            setLoading(false);
        };

        fetchFeedback();
    }, [feedbackId, router, supabase]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Feedback not found.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-indigo-600 hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const isAnonymous = feedback.anonymous;
    const date = new Date(feedback.created_at).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className=" mx-auto p-6 space-y-6">

            {/* BACK BUTTON */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit group"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* LEFT COL: CONTENT (2/3) */}
                <div className="md:col-span-2 space-y-6">

                    {/* FEEDBACK HEADER CARD */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        {/* User & Rating Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl shadow-inner ${isAnonymous ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-600'}`}>
                                    {isAnonymous ? <Ghost size={32} /> : <User size={32} />}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {isAnonymous ? "Anonymous Customer" : feedback.full_name || "Customer"}
                                    </h1>
                                    <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                                        <Calendar size={14} /> {date}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={24}
                                            className={`${star <= feedback.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                                    {feedback.rating}.0 Rating
                                </span>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                <MessageSquare size={16} className="text-indigo-500" />
                                Review
                            </h3>
                            <div className="bg-gray-50 p-6 rounded-xl text-gray-700 leading-relaxed text-lg border border-gray-100/50">
                                {feedback.message ? feedback.message : <span className="italic text-gray-400">No written comment provided.</span>}
                            </div>
                        </div>

                        {/* CUSTOMER DETAILS (If not anonymous) */}
                        {!isAnonymous && (
                            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {feedback.phone && (
                                    <div className="flex items-center gap-3 text-gray-600 bg-white border border-gray-200 p-3 rounded-xl">
                                        <Phone size={18} className="text-gray-400" /> {feedback.phone}
                                    </div>
                                )}
                                {feedback.email && (
                                    <div className="flex items-center gap-3 text-gray-600 bg-white border border-gray-200 p-3 rounded-xl">
                                        <Mail size={18} className="text-gray-400" /> {feedback.email}
                                    </div>
                                )}
                                {feedback.sex && (
                                    <div className="flex items-center gap-3 text-gray-600 bg-white border border-gray-200 p-3 rounded-xl capitalize">
                                        <User size={18} className="text-gray-400" /> {feedback.sex}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* MEDIA GALLERY (PLACEHOLDER) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} className="text-indigo-500" />
                            Media Gallery
                        </h3>

                        {/* Placeholder State */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <ImageIcon size={20} />
                                </div>
                                <span className="text-xs font-medium">No Images</span>
                            </div>
                            <div className="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <Video size={20} />
                                </div>
                                <span className="text-xs font-medium">No Video</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Media attachments will appear here once enabled for clients.
                        </p>
                    </div>

                </div>

                {/* RIGHT COL: BUSINESS CONTEXT (1/3) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
                        <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                            Business Context
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Business</p>
                                <p className="font-bold text-indigo-900 text-lg">{feedback.businesses?.name}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3 text-sm">
                                    <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">{feedback.businesses?.address || "No address returned"}</span>
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <Phone size={18} className="text-gray-400 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">{feedback.businesses?.phone || "No phone returned"}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/owner/business/${feedback.businesses?.id}`)}
                                className="w-full mt-4 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm shadow-sm"
                            >
                                View Business
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
