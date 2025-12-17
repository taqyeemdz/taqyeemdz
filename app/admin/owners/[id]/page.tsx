"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
    User,
    Mail,
    Calendar,
    Building2,
    MapPin,
    Star,
    MessageCircle,
    ArrowLeft,
    Phone,
    Clock
} from "lucide-react";

export default function OwnerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);

    useEffect(() => {
        async function loadOwnerData() {
            if (!id) return;
            setLoading(true);

            // 1. Fetch Owner Profile
            const { data: ownerProfile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .single();

            if (profileError) {
                console.error("Error fetching profile:", profileError);
                // Handle not found
                setLoading(false);
                return;
            }

            // Fetch Auth Email (admin only capability usually)
            const { data: { user } } = await supabase.auth.admin.getUserById(id as string);
            const email = user?.email || ownerProfile.email; // Fallback

            setProfile({ ...ownerProfile, email });

            // 2. Fetch Businesses
            const { data: businessList, error: bizError } = await supabase
                .from("businesses")
                .select("*") // Get all fields
                .eq("owner_id", id)
                .order("created_at", { ascending: false });

            if (bizError) console.error(bizError);

            const bList = businessList || [];
            setBusinesses(bList);

            // 3. Fetch Feedback for ALL these businesses
            if (bList.length > 0) {
                const businessIds = bList.map((b) => b.id);

                const { data: feedbackList, error: fbError } = await supabase
                    .from("feedback")
                    .select("*, businesses(name)")
                    .in("business_id", businessIds)
                    .order("created_at", { ascending: false });

                if (fbError) console.error(fbError);
                setFeedback(feedbackList || []);
            }

            setLoading(false);
        }

        loadOwnerData();
    }, [id, supabase]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Owner Not Found</h2>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-indigo-600 hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">

            {/* HEADER / BACK */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft size={18} />
                    Back to Owners
                </button>

                {/* PROFILE CARD */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ring-1 ring-gray-100">
                        <User size={40} />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{profile.full_name || "Unnamed Owner"}</h1>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider mt-2 border border-green-100">
                                Active Owner
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-gray-500 pt-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                {profile.email || "No email"}
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                Joined {new Date(profile.created_at).toLocaleDateString()}
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                Last Active: Recently
                            </div>
                        </div>
                    </div>

                    {/* QUICK STATS */}
                    <div className="flex gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{businesses.length}</p>
                            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Businesses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
                            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Reviews</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* LEFT: BUSINESSES LIST */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-gray-400" /> Owned Businesses
                    </h2>

                    {businesses.length === 0 ? (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500">
                            No businesses created yet.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {businesses.map(b => (
                                <div
                                    key={b.id}
                                    onClick={() => router.push(`/admin/businesses/${b.id}`)}
                                    className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Building2 size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg">{b.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={14} /> {b.address || "No address"}
                                            </span>
                                            {b.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} /> {b.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mini Stats inside Business Card */}
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold mb-1">
                                            <Star size={12} className="fill-current" /> 4.8
                                        </div>
                                        <p className="text-xs text-gray-400">View Details →</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: RECENT FEEDBACK FEED */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="text-gray-400" /> Latest Activities
                    </h2>

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 overflow-hidden">
                        {feedback.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No feedback received yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {feedback.map(fb => (
                                    <div key={fb.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                {fb.businesses?.name}
                                            </span>
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {new Date(fb.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        size={12}
                                                        className={`${star <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700 line-clamp-3">
                                            "{fb.message || "No comments"}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
