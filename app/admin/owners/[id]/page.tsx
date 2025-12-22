"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
    User,
    Mail,
    Calendar,
    Building2,
    MapPin,
    Star,
    MessageCircle,
    ArrowLeft,
    ChevronLeft,
    Phone,
    Clock,
    Loader2,
    QrCode,
    Download,
    X,
    Ghost
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function OwnerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = supabaseBrowser;

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "subscription" | "activity">("overview");
    const [selectedQrBusiness, setSelectedQrBusiness] = useState<any>(null);

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
                setLoading(false);
                return;
            }

            // Fetch Auth Email (admin only capability usually)
            // Note: In browser context, this only works if the user has correct permissions or via a proxy API
            // For now, we prefer the email from the profile table if available or fallback
            setProfile({ ...ownerProfile, email: ownerProfile.email });

            // 2. Fetch Businesses
            const { data: userBusinesses, error: bizError } = await supabase
                .from("user_business")
                .select(`
                    business_id,
                    businesses:businesses (*)
                `)
                .eq("user_id", id);

            if (bizError) console.error(bizError);

            const bList = userBusinesses?.map((ub: any) => ub.businesses) || [];
            bList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setBusinesses(bList);

            // 3. Fetch Feedback
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

            // 4. Fetch Plans
            const { data: allPlans } = await supabase
                .from("subscription_plans")
                .select("*")
                .order("price", { ascending: true });

            setPlans(allPlans || []);
            setLoading(false);
        }

        loadOwnerData();
    }, [id, supabase]);

    const handleUpdatePlan = async (planId: string) => {
        if (!planId) return;
        setIsUpdatingPlan(true);

        const { error } = await supabase
            .from("profiles")
            .update({ plan_id: planId })
            .eq("id", id);

        if (error) {
            console.error("Error updating plan:", error);
            alert("Failed to update subscription plan.");
        } else {
            alert("Subscription plan updated successfully.");
            setProfile((prev: any) => ({ ...prev, plan_id: planId }));
        }
        setIsUpdatingPlan(false);
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: User },
        { id: "businesses", label: "Businesses", icon: Building2 },
        { id: "subscription", label: "Subscription", icon: Star },
        { id: "activity", label: "Activity Feed", icon: MessageCircle },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <Loader2 size={48} className="animate-spin text-indigo-600" />
                    <div className="h-4 w-48 bg-gray-100 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20 min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <ArrowLeft size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Owner Not Found</h2>
                <button
                    onClick={() => router.back()}
                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                    Back to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500">

            {/* 🔙 NAV & HEADER */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors w-fit px-1 font-bold text-sm"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-medium">Back to Owners</span>
                </button>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
                    <div className="flex flex-row gap-4 justify-between items-center sm:items-start md:items-center">
                        <div className="flex items-center gap-3 md:gap-5 min-w-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                                <User size={24} className="md:w-8 md:h-8" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
                                    {profile.full_name || "Unnamed Owner"}
                                </h1>

                                <div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-1 md:gap-y-2 mt-1 md:mt-2 text-xs md:text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={14} className="text-indigo-400" />
                                        <span>{profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide">
                                            Active
                                        </span>
                                        <span>• {businesses.length} Businesses</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS (Owner Style) */}
            <div className="flex gap-4 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[500px]">
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Profile Details */}
                            <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shrink-0 border-4 border-white shadow-xl ring-1 ring-gray-100">
                                        <User size={44} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900">{profile.full_name}</h3>
                                        <p className="text-indigo-600 font-bold text-sm flex items-center gap-1.5 mt-1">
                                            <Mail size={14} /> {profile.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">CONTACT PHONE</p>
                                        <p className="font-bold text-gray-900 flex items-center gap-2">
                                            <Phone size={16} className="text-indigo-400" /> {profile.phone || "Not set"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">JOINED DATE</p>
                                        <p className="font-bold text-gray-900 flex items-center gap-2">
                                            <Calendar size={16} className="text-indigo-400" /> {new Date(profile.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Sidebar */}
                            <div className="space-y-4">
                                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-100">
                                    <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">TOTAL IMPACT</p>
                                    <h4 className="text-3xl font-black">{feedback.length} <span className="text-indigo-200 text-lg">Reviews</span></h4>
                                    <div className="mt-4 pt-4 border-t border-indigo-500 flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-indigo-100">Across {businesses.length} nodes</span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">ACTIVE PLAN</p>
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full">LIVE</span>
                                    </div>
                                    <p className="text-xl font-black text-gray-900">
                                        {plans.find(p => p.id === profile.plan_id)?.name || "Basic Tier"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 font-medium italic">Limits are active.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* BUSINESSES TAB */}
                {activeTab === "businesses" && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Owned Entities</h2>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-black">
                                {businesses.length} TOTAL
                            </span>
                        </div>

                        {businesses.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center">
                                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold mb-1">No businesses registered yet.</p>
                                <p className="text-xs text-gray-400">Owner hasn't added any businesses to the platform.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {businesses.map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => router.push(`/admin/businesses/${b.id}`)}
                                        className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-6 group"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-gray-50 shadow-inner">
                                            <Building2 size={28} />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{b.name}</h3>
                                            <div className="flex items-center gap-6 text-sm text-gray-400 mt-2 font-bold tracking-tight">
                                                <span className="flex items-center gap-1.5 hover:text-gray-600">
                                                    <MapPin size={14} className="text-indigo-300" /> {b.address || "Main Site"}
                                                </span>
                                                {b.phone && (
                                                    <span className="flex items-center gap-1.5 hover:text-gray-600">
                                                        <Phone size={14} className="text-indigo-300" /> {b.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedQrBusiness(b);
                                                }}
                                                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                            >
                                                <QrCode size={20} />
                                            </button>
                                            <ArrowLeft size={20} className="rotate-180 text-gray-300 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* SUBSCRIPTION TAB */}
                {activeTab === "subscription" && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div className="space-y-4 max-w-lg">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                                        <Star size={24} className="fill-current" strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                        Subscription Tier
                                    </h2>
                                    <p className="text-gray-500 font-medium leading-relaxed">
                                        Manage the owner's billing plan and quotas. Selecting a new plan will immediately update the available limits for branches, QR codes, and businesses.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200/50 shadow-inner w-full md:w-[400px]">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-4 block">SELECT PLAN TIER</label>
                                    <div className="relative">
                                        <select
                                            value={profile.plan_id || ""}
                                            onChange={(e) => handleUpdatePlan(e.target.value)}
                                            disabled={isUpdatingPlan}
                                            className="w-full bg-white border border-gray-200 text-lg font-black text-slate-800 rounded-2xl p-5 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all disabled:opacity-50 outline-none shadow-sm pr-12"
                                        >
                                            <option value="" disabled>Select a plan...</option>
                                            {plans.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name.toUpperCase()} ( {p.price} {p.currency} )
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            {isUpdatingPlan ? <Loader2 size={24} className="animate-spin text-indigo-600" /> : <Star size={24} />}
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">Changes take effect instantly</p>
                                </div>
                            </div>
                        </div>

                        {/* PLAN PREVIEW CARD */}
                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { label: "MAX BUSINESSES", value: plans.find(p => p.id === profile.plan_id)?.max_businesses || 0 },
                                { label: "MAX BRANCHES", value: plans.find(p => p.id === profile.plan_id)?.max_branches || 0 },
                                { label: "MAX QR CODES", value: plans.find(p => p.id === profile.plan_id)?.max_qr_codes || 0 },
                                { label: "MONTHLY REVIEWS", value: plans.find(p => p.id === profile.plan_id)?.max_feedback_monthly || 0 },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-indigo-600">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === "activity" && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-3xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Interactions</h2>
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                Global Feed
                            </span>
                        </div>

                        {feedback.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center">
                                <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold mb-1">No feedback recorded yet.</p>
                                <p className="text-xs text-gray-400">This owner's businesses have no reviews so far.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {feedback.map(fb => {
                                    const isAnonymous = fb.anonymous;
                                    const date = new Date(fb.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                    });

                                    return (
                                        <div
                                            key={fb.id}
                                            className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isAnonymous ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                        {isAnonymous ? <Ghost size={24} /> : <User size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                                                                {isAnonymous ? "Anonymous User" : fb.full_name || "Customer"}
                                                            </p>
                                                            <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-50 tracking-tighter">
                                                                {fb.businesses?.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                            <Calendar size={12} className="text-indigo-300" /> {date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={16}
                                                            className={`${star <= fb.rating ? "fill-amber-400 text-amber-400" : "fill-gray-50 text-gray-100"}`}
                                                            strokeWidth={star <= fb.rating ? 2 : 1}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Info Badges (if not anonymous) */}
                                            {!isAnonymous && (fb.phone || fb.email) && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {fb.phone && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black border border-slate-100 tracking-tight">
                                                            <Phone size={10} /> {fb.phone}
                                                        </span>
                                                    )}
                                                    {fb.email && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black border border-slate-100 tracking-tight">
                                                            <Mail size={10} /> {fb.email}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="bg-slate-50/50 rounded-2xl p-4 text-slate-700 text-sm font-medium leading-relaxed border border-transparent group-hover:border-slate-100 transition-colors italic">
                                                "{fb.message || "No written review provided."}"
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* QUICK QR MODAL */}
            {selectedQrBusiness && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />

                        <button
                            onClick={() => setSelectedQrBusiness(null)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center space-y-6">
                            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-3xl w-fit mx-auto shadow-inner border border-indigo-100">
                                <QrCode size={40} strokeWidth={2.5} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">
                                    {selectedQrBusiness.name}
                                </h3>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Feedback Gateway</p>
                            </div>

                            <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-50 shadow-xl inline-block mx-auto mb-4 scale-110">
                                <QRCodeCanvas
                                    id="quick-qr"
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/client/feedback/${selectedQrBusiness.id}`}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    const canvas = document.getElementById('quick-qr') as HTMLCanvasElement;
                                    if (canvas) {
                                        const url = canvas.toDataURL("image/png");
                                        const link = document.createElement('a');
                                        link.download = `QR_${selectedQrBusiness.name.replace(/\s+/g, '_')}.png`;
                                        link.href = url;
                                        link.click();
                                    }
                                }}
                                className="w-full bg-gray-900 text-white rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-indigo-100/50"
                            >
                                <Download size={20} />
                                DOWNLOAD PASS
                            </button>

                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Scan to give feedback</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
