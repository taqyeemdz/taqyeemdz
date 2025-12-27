"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
    Trophy,
    User,
    Phone,
    Star,
    Shuffle,
    Gift,
    Users,
    Sparkles,
    X,
    Building2,
    ChevronDown,
    Loader2,
    Lock,
    ArrowRight
} from "lucide-react";
import { UpgradeModal } from "@/components/owner/UpgradeModal";

export default function TamboolaPage() {
    const supabase = supabaseBrowser;
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

    const [eligibleFeedbacks, setEligibleFeedbacks] = useState<any[]>([]);
    const [numberOfWinners, setNumberOfWinners] = useState(1);
    const [winners, setWinners] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [allowTamboola, setAllowTamboola] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // 1. Fetch businesses on mount
    useEffect(() => {
        const fetchBusinesses = async () => {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;

            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch businesses owned by user
            const { data: links } = await supabase
                .from("user_business")
                .select("business_id")
                .eq("user_id", user.id);

            const businessIds = links?.map(l => l.business_id) || [];

            if (businessIds.length > 0) {
                const { data: busDocs } = await supabase
                    .from("businesses")
                    .select("id, name")
                    .in("id", businessIds);

                if (busDocs && busDocs.length > 0) {
                    setBusinesses(busDocs);
                    setSelectedBusinessId(busDocs[0].id); // Default to first business
                }
            }

            // Fetch subscription features
            const { data: profile } = await supabase
                .from("profiles")
                .select("plan_id")
                .eq("id", user.id)
                .single();

            if (profile?.plan_id) {
                const { data: plan } = await supabase
                    .from("subscription_plans")
                    .select("allow_tamboola")
                    .eq("id", profile.plan_id)
                    .single();

                setAllowTamboola(!!plan?.allow_tamboola);
            }

            setLoading(false);
        };

        fetchBusinesses();
    }, []);

    // 2. Fetch eligible feedbacks when business changes
    useEffect(() => {
        if (!selectedBusinessId) {
            setEligibleFeedbacks([]);
            return;
        }

        const fetchFeedbacks = async () => {
            // We want feedbacks with BOTH name and phone number
            const { data, error } = await supabase
                .from("feedback")
                .select("*, businesses(name)")
                .eq("business_id", selectedBusinessId)
                .not("full_name", "is", null)
                .not("phone", "is", null)
                .order("created_at", { ascending: false });

            if (data) {
                // Double check for empty strings if necessary, though "is not null" captures most
                const valid = data.filter(f => f.full_name?.trim() && f.phone?.trim());
                setEligibleFeedbacks(valid);
            }
        };

        fetchFeedbacks();
        // Reset winners when changing business
        setWinners([]);
    }, [selectedBusinessId]);

    const drawWinners = () => {
        if (eligibleFeedbacks.length === 0) return;

        const maxWinners = Math.min(numberOfWinners, eligibleFeedbacks.length);

        setIsDrawing(true);
        setWinners([]);

        // Animation effect
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count > 15) { // Slightly longer animation
                clearInterval(interval);

                // Actual random selection
                const shuffled = [...eligibleFeedbacks].sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, maxWinners);

                setWinners(selected);
                setIsDrawing(false);
            } else {
                // Show random candidates during animation (optional visual flair)
            }
        }, 100);
    };

    const resetDraw = () => {
        setWinners([]);
        setNumberOfWinners(1);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <p className="text-gray-500 font-medium">Loading Tamboola...</p>
                </div>
            </div>
        );
    }

    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
            {!allowTamboola && !loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/50 backdrop-blur-[2px]">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={40} className="text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Tamboola Restricted</h2>
                        <p className="text-gray-500 font-medium mb-8">
                            Upgrade to a Pro or Enterprise plan to unlock the Tamboola Draw feature and gamify your feedback system.
                        </p>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-100"
                        >
                            Unlock Tamboola <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />

            <div className={`max-w-7xl mx-auto space-y-8 ${!allowTamboola && 'opacity-30 pointer-events-none select-none'}`}>

                {/* HEADER */}
                <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Tamboola Draw</h1>
                            </div>
                        </div>

                        {/* BUSINESS SELECTOR */}
                        {businesses.length > 0 && (
                            <div className="relative min-w-[240px]">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
                                    Select Business
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedBusinessId}
                                        onChange={(e) => setSelectedBusinessId(e.target.value)}
                                        className="w-full appearance-none bg-white border border-gray-200 text-gray-900 py-3 pl-4 pr-10 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
                                    >
                                        {businesses.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTENT */}
                {!selectedBusinessId ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">No businesses found. Please create a business first.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT COLUMN: UNIFIED DRAW CARD */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
                                {/* DRAW CONTROLS */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="shrink-0 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <Gift className="w-12 h-12 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                                                Draw Winners for Marmita
                                            </h2>
                                            <p className="text-gray-500 text-xs font-medium mt-1">
                                                {selectedBusiness?.name}
                                            </p>
                                        </div>
                                    </div>

                                    {eligibleFeedbacks.length > 0 ? (
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            {winners.length === 0 ? (
                                                <>
                                                    <button
                                                        onClick={drawWinners}
                                                        disabled={isDrawing}
                                                        className="flex-1 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isDrawing ? (
                                                            <Loader2 className="animate-spin" size={18} />
                                                        ) : (
                                                            <Shuffle size={18} />
                                                        )}
                                                        {isDrawing ? "DRAWING..." : "START DRAW"}
                                                    </button>

                                                    <div className="relative w-full sm:w-24 shrink-0">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={eligibleFeedbacks.length}
                                                            value={numberOfWinners}
                                                            onChange={(e) => setNumberOfWinners(Math.max(1, Math.min(parseInt(e.target.value) || 1, eligibleFeedbacks.length)))}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-center text-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-300"
                                                        />
                                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white border border-gray-100 px-2 text-[8px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">WINNERS</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={resetDraw}
                                                    className="w-full bg-white hover:bg-gray-50 text-gray-900 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-gray-200 hover:scale-[1.01] active:scale-95"
                                                >
                                                    <X size={18} />
                                                    RESET & DRAW AGAIN
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                                            <p className="font-bold text-gray-500 text-sm">Zero entries found. Wait for more feedback!</p>
                                        </div>
                                    )}
                                </div>

                                {/* DIVIDER */}
                                <div className="border-t border-gray-100"></div>

                                {/* DRAW SUMMARY */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Draw Summary</h3>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-center">
                                            <div className="w-8 h-8 bg-white text-gray-400 rounded-lg flex items-center justify-center border border-gray-100 mx-auto mb-2">
                                                <Users size={16} />
                                            </div>
                                            <p className="text-lg font-black text-gray-900 leading-none">{eligibleFeedbacks.length}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">Entries</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-center">
                                            <div className="w-8 h-8 bg-white text-gray-400 rounded-lg flex items-center justify-center border border-gray-100 mx-auto mb-2">
                                                <Trophy size={16} />
                                            </div>
                                            <p className="text-lg font-black text-gray-900 leading-none">{winners.length}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">Winners</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-center">
                                            <div className="w-8 h-8 bg-white text-gray-400 rounded-lg flex items-center justify-center border border-gray-100 mx-auto mb-2">
                                                <Sparkles size={16} />
                                            </div>
                                            <p className="text-lg font-black text-gray-900 leading-none">
                                                {winners.length > 0 ? "Done" : "Ready"}
                                            </p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">Status</p>
                                        </div>
                                    </div>
                                </div>

                                {/* WINNERS DISPLAY */}
                                {winners.length > 0 && (
                                    <>
                                        <div className="border-t border-gray-100"></div>
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Trophy className="text-indigo-600" size={16} />
                                                    Selected Winners
                                                </h3>
                                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gray-200">
                                                    Official
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {winners.map((winner, index) => (
                                                    <div
                                                        key={winner.id}
                                                        className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 group hover:bg-white hover:border-indigo-200 transition-all duration-300"
                                                        style={{
                                                            animation: 'fadeIn 0.5s ease-out',
                                                            animationDelay: `${index * 100}ms`,
                                                            animationFillMode: 'both'
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                                                                {index + 1}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-black text-gray-900 text-base tracking-tight leading-none group-hover:text-indigo-600 transition-colors truncate">
                                                                    {winner.full_name}
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 text-gray-500 mt-1.5">
                                                                    <Phone size={12} />
                                                                    <span className="text-xs font-bold tracking-tight">{winner.phone}</span>
                                                                </div>

                                                                <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                                                                    <div className="flex gap-0.5">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <Star
                                                                                key={star}
                                                                                size={10}
                                                                                className={`${star <= winner.rating ? "fill-gray-900 text-gray-900" : "fill-gray-100 text-gray-100"}`}
                                                                                strokeWidth={1}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Rating</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* EMPTY STATE */}
                                {eligibleFeedbacks.length === 0 && (
                                    <>
                                        <div className="border-t border-gray-100"></div>
                                        <div className="py-12 text-center space-y-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                                                <Users size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Pool is empty</h3>
                                                <p className="text-gray-400 text-xs max-w-xs mx-auto font-medium">
                                                    No customers have left contact info for <strong>{selectedBusiness?.name}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ENTRY POOL */}
                        <div className="lg:col-span-5">

                            {/* ELIGIBLE ENTRIES LIST (SUMMARY) */}
                            {eligibleFeedbacks.length > 0 && (
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Entry Pool</h3>
                                        <span className="text-[10px] font-black text-gray-300">{eligibleFeedbacks.length} TOTAL</span>
                                    </div>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {eligibleFeedbacks.map((fb) => (
                                            <div key={fb.id} className="p-4 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center gap-4 group hover:bg-white hover:border-indigo-200 transition-all duration-300">
                                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100 transition-colors">
                                                    {fb.full_name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate">{fb.full_name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{fb.phone}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}
            </style>
        </div>
    );
}