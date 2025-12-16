"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useParams } from "next/navigation";
import {
    Building2,
    MapPin,
    Phone,
    ChevronLeft,
    Star,
    Share2,
    Download,
    User,
    Ghost,
    Calendar,
    MessageSquare,
    Mail
} from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";

export default function OwnerBusinessDetailsPage() {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const params = useParams();
    const businessId = params.id;

    const [loading, setLoading] = useState(true);
    const [business, setBusiness] = useState<any>(null);
    const [feedback, setFeedback] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1️⃣ Session check
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) return router.replace("/auth/login");

            // 2️⃣ Load business
            const { data: b, error: busError } = await supabase
                .from("businesses")
                .select("*")
                .eq("id", businessId)
                .single();

            if (busError || !b) {
                setBusiness(null);
                setLoading(false);
                return;
            }

            setBusiness(b);

            // 3️⃣ Load feedback
            const { data: fb, error: fbError } = await supabase
                .from("feedback")
                .select("*")
                .eq("business_id", businessId)
                .order("created_at", { ascending: false });

            if (fbError) {
                console.error("Error fetching feedback:", fbError);
            }

            setFeedback(fb || []);
            setLoading(false);
        };

        fetchData();
    }, [businessId, router, supabase]);

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

    if (!business) return <p className="p-8 text-center text-gray-500">Business not found.</p>;

    const feedbackLink = `${window.location.origin}/client/feedback/${businessId}`;

    return (
        <div className=" mx-auto p-6 space-y-8">

            {/* 🔙 NAV & HEADER */}
            <div className="flex flex-col gap-4 md:gap-6">
                <button
                    onClick={() => router.push("/owner/business")}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit px-1"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-medium">Back to Businesses</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                            <Building2 size={24} className="md:hidden" />
                            <Building2 size={32} className="hidden md:block" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{business.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-sm text-gray-500">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                                    Active
                                </span>
                                <span className="hidden md:inline">•</span>
                                <span>{feedback.length} Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="flex flex-col md:grid md:grid-cols-3 gap-8">

                {/* LEFT COL: FEEDBACK FEED (2/3 width) - Order 2 on mobile, 1 on desktop */}
                <div className="order-2 md:order-1 md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Recent Feedback</h2>
                        {/* Could add a filter dropdown here */}
                    </div>

                    {feedback.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No feedback yet</h3>
                            <p className="text-gray-500 text-sm">Share your QR code to get your first review!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {feedback.map((fb) => (
                                <FeedbackCard key={fb.id} feedback={fb} />
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COL: INFO & QR (1/3 width) - Order 1 on mobile, 2 on desktop */}
                <div className="order-1 md:order-2 space-y-6">

                    {/* INFO CARD */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">
                            Business Details
                        </h3>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><MapPin size={18} /></div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                                    <p className="text-gray-700 text-sm">{business.address || "No address provided"}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><Phone size={18} /></div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                                    <p className="text-gray-700 text-sm">{business.phone || "No phone provided"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR CODE CARD (Sticky) */}
                    <div className="md:sticky md:top-6 bg-indigo-50 rounded-2xl border border-indigo-100 p-6 flex flex-col items-center text-center">
                        <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                            <QRCode value={feedbackLink} size={150} />
                        </div>
                        <h3 className="font-bold text-indigo-900 mb-1">Feedback QR Code</h3>
                        <p className="text-indigo-600/80 text-xs mb-4 max-w-[200px]">
                            Download or show this code to your customers to collect feedback.
                        </p>

                        <a
                            href={feedbackLink}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition w-full flex items-center justify-center gap-2"
                        >
                            <Share2 size={14} /> Open Link
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}

function FeedbackCard({ feedback }: { feedback: any }) {
    const router = useRouter();
    const isAnonymous = feedback.anonymous;
    const date = new Date(feedback.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    });

    return (
        <div
            onClick={() => router.push(`/owner/feedback/${feedback.id}`)}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                        {isAnonymous ? <Ghost size={20} /> : <User size={20} />}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {isAnonymous ? "Anonymous User" : feedback.full_name || "Customer"}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {date}
                        </p>
                    </div>
                </div>
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={14}
                            className={`${star <= feedback.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Info Badges (if not anonymous) */}
            {!isAnonymous && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {feedback.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-xs border border-gray-100">
                            <Phone size={10} /> {feedback.phone}
                        </span>
                    )}
                    {feedback.email && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-xs border border-gray-100">
                            <Mail size={10} /> {feedback.email}
                        </span>
                    )}
                </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 text-gray-700 text-sm leading-relaxed">
                {feedback.message ? feedback.message : <span className="text-gray-400 italic">No written review provided.</span>}
            </div>
        </div>
    );
}
