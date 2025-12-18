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
    Loader2
} from "lucide-react";

export default function TamboolaPage() {
    const supabase = supabaseBrowser;
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

    const [eligibleFeedbacks, setEligibleFeedbacks] = useState<any[]>([]);
    const [numberOfWinners, setNumberOfWinners] = useState(1);
    const [winners, setWinners] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
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
                    <>
                        {/* STATS BAR */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Eligible Entries</p>
                                        <p className="text-2xl font-bold text-gray-900">{eligibleFeedbacks.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Winners Selected</p>
                                        <p className="text-2xl font-bold text-gray-900">{winners.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Draw Status</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {winners.length > 0 ? "Complete" : "Ready"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DRAW CONTROLS */}
                        {eligibleFeedbacks.length > 0 ? (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="text-center">
                                        <Gift className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                            Draw Winners for {selectedBusiness?.name}
                                        </h2>
                                        <p className="text-gray-600">Select how many winners you want to draw</p>
                                    </div>

                                    {winners.length === 0 && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Number of Winners
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={eligibleFeedbacks.length}
                                                    value={numberOfWinners}
                                                    onChange={(e) => setNumberOfWinners(Math.max(1, Math.min(parseInt(e.target.value) || 1, eligibleFeedbacks.length)))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Maximum: {eligibleFeedbacks.length} eligible entries
                                                </p>
                                            </div>

                                            <button
                                                onClick={drawWinners}
                                                disabled={isDrawing}
                                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isDrawing ? (
                                                    <>
                                                        <Shuffle className="animate-spin" size={24} />
                                                        Drawing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shuffle size={24} />
                                                        Draw Winners
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {winners.length > 0 && (
                                        <button
                                            onClick={resetDraw}
                                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <X size={18} />
                                            Reset & Draw Again
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No Eligible Entries</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    No feedbacks found with both customer name and phone number for <strong>{selectedBusiness?.name}</strong>. Encourage customers to leave their contact information!
                                </p>
                            </div>
                        )}

                        {/* WINNERS DISPLAY */}
                        {winners.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <Trophy className="text-amber-500" size={28} />
                                        Winners 🎉
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {winners.map((winner, index) => (
                                        <div
                                            key={winner.id}
                                            className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200 shadow-lg"
                                            style={{
                                                animation: 'fadeIn 0.5s ease-out',
                                                animationDelay: `${index * 100}ms`,
                                                animationFillMode: 'both'
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                                    #{index + 1}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <User size={16} className="text-amber-700" />
                                                        <h3 className="font-bold text-gray-900 text-lg">
                                                            {winner.full_name}
                                                        </h3>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                        <Phone size={14} />
                                                        <span className="text-sm font-medium">{winner.phone}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                                                        <Star size={14} className="text-amber-500" />
                                                        <span>Rating: {winner.rating}/5</span>
                                                    </div>

                                                    <div className="bg-white/70 rounded-lg p-3 mt-3">
                                                        <p className="text-xs font-medium text-gray-500 mb-1">Business:</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {winner.businesses?.name || "Unknown"}
                                                        </p>
                                                    </div>

                                                    {winner.message && (
                                                        <div className="bg-white/70 rounded-lg p-3 mt-2">
                                                            <p className="text-xs font-medium text-gray-500 mb-1">Feedback:</p>
                                                            <p className="text-sm text-gray-700 line-clamp-2 italic">
                                                                "{winner.message}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ELIGIBLE ENTRIES LIST */}
                        {eligibleFeedbacks.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Users size={20} className="text-blue-600" />
                                        All Eligible Entries ({eligibleFeedbacks.length})
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {eligibleFeedbacks.map((fb) => (
                                        <div
                                            key={fb.id}
                                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${fb.rating >= 4 ? 'bg-green-100 text-green-600' :
                                                    fb.rating >= 3 ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-red-100 text-red-600'
                                                    }`}>
                                                    <span className="font-bold text-sm">{fb.rating}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 truncate mb-1">
                                                        {fb.full_name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mb-2">{fb.phone}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                        <Building2 size={12} />
                                                        <span>{fb.businesses?.name || "Unknown Business"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
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
      `}</style>
        </div>
    );
}