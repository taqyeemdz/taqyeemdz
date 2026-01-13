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
    ArrowRight,
    MessageCircle,
    UserCircle2
} from "lucide-react";
import { UpgradeModal } from "@/components/owner/UpgradeModal";
import { useRouter } from "next/navigation";
import { Confetti } from '@neoconfetti/react';


export default function TamboolaPage() {
    const supabase = supabaseBrowser;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

    const [eligibleFeedbacks, setEligibleFeedbacks] = useState<any[]>([]);
    const [numberOfWinners, setNumberOfWinners] = useState(1);
    const [winners, setWinners] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [allowTamboola, setAllowTamboola] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiKey, setConfettiKey] = useState(0);

    useEffect(() => {
        const fetchBusinesses = async () => {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;

            if (!user) {
                setLoading(false);
                return;
            }

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
                    setSelectedBusinessId(busDocs[0].id);
                }
            }

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
    }, [supabase]);

    useEffect(() => {
        if (!selectedBusinessId) {
            setEligibleFeedbacks([]);
            return;
        }

        const fetchFeedbacks = async () => {
            const { data } = await supabase
                .from("feedback")
                .select("*, businesses(name)")
                .eq("business_id", selectedBusinessId)
                .not("full_name", "is", null)
                .not("phone", "is", null)
                .order("created_at", { ascending: false });

            if (data) {
                const valid = data.filter(f => f.full_name?.trim() && f.phone?.trim());
                setEligibleFeedbacks(valid);
            }
        };

        fetchFeedbacks();
        setWinners([]);
    }, [selectedBusinessId, supabase]);

    useEffect(() => {
        if (showWinnerModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showWinnerModal]);

    const drawWinners = () => {
        if (eligibleFeedbacks.length === 0) return;
        const maxWinners = Math.min(numberOfWinners, eligibleFeedbacks.length);
        setIsDrawing(true);
        setWinners([]);

        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count > 15) {
                clearInterval(interval);
                const shuffled = [...eligibleFeedbacks].sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, maxWinners);
                setWinners(selected);
                setIsDrawing(false);
                setShowWinnerModal(true);
                setConfettiKey(prev => prev + 1);
                setShowConfetti(true);

                // Stop confetti after 12 seconds
                setTimeout(() => setShowConfetti(false), 12000);
            }
        }, 100);
    };

    const retriggerConfetti = () => {
        setConfettiKey(prev => prev + 1);
        setShowConfetti(true);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-slate-200" size={32} />
            </div>
        );
    }

    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10 relative">

            {!allowTamboola && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-50/20 backdrop-blur-sm rounded-[2.5rem]">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500 space-y-8">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                            <Lock size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Tamboola Restreint</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Passez au plan <span className="text-slate-900 font-bold">Pro</span> pour débloquer les tirages au sort et récompenser vos clients.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full bg-black text-white rounded-xl py-4 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            Voir les plans <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

            <div className={`space-y-10 transition-all duration-700 ${!allowTamboola ? 'blur-md opacity-20 pointer-events-none select-none' : ''}`}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Tirage Tamboola</h1>
                        <p className="text-slate-500 text-sm">Récompensez vos clients et gamifiez vos avis.</p>
                    </div>

                    <div className="relative group min-w-[220px]">
                        <select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:border-slate-400 outline-none transition-all cursor-pointer shadow-sm appearance-none"
                        >
                            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto w-full">
                    {/* Draw Controller */}
                    <div className="space-y-6">
                        <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm space-y-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Lancer le tirage</h2>
                                    <p className="text-slate-500 text-sm">
                                        Sélection aléatoire parmi les <span className="font-bold text-slate-900">{eligibleFeedbacks.length}</span> participants éligibles.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Quantité</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={eligibleFeedbacks.length}
                                            value={numberOfWinners}
                                            onChange={(e) => setNumberOfWinners(Math.max(1, Math.min(parseInt(e.target.value) || 1, eligibleFeedbacks.length)))}
                                            className="w-14 bg-white border border-slate-200 rounded-md py-1 text-center text-sm font-bold text-slate-900 outline-none focus:border-slate-400 transition-all"
                                        />
                                    </div>
                                    {winners.length > 0 ? (
                                        <button
                                            onClick={() => setWinners([])}
                                            className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors rounded-lg bg-slate-50 border border-slate-100"
                                        >
                                            <X size={20} />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {eligibleFeedbacks.length > 0 ? (
                                <button
                                    onClick={drawWinners}
                                    disabled={isDrawing || winners.length > 0}
                                    className={`w-full py-5 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${winners.length > 0
                                        ? "bg-slate-50 text-slate-300 shadow-none border border-slate-100"
                                        : "bg-slate-900 text-white hover:bg-black active:scale-[0.98] shadow-slate-200"
                                        }`}
                                >
                                    {isDrawing ? <Loader2 className="animate-spin" size={20} /> : <Shuffle size={20} />}
                                    {isDrawing ? "Tirage en cours..." : winners.length > 0 ? "Tirage effectué" : "Lancer le tambour"}
                                </button>
                            ) : (
                                <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
                                    <MessageCircle className="mx-auto text-slate-200 mb-4" size={40} />
                                    <p className="text-slate-400 font-medium italic">En attente d'avis clients avec coordonnées...</p>
                                </div>
                            )}

                            {/* Winners List */}
                            {winners.length > 0 && (
                                <div className="space-y-6 pt-1 border-t border-slate-50 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Trophy size={14} className="text-amber-500" />
                                            Gagnants de {selectedBusiness?.name}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {winners.map((winner, idx) => (
                                            <div key={winner.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-slate-900 uppercase tracking-tight">{winner.full_name}</p>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <div className="flex items-center gap-1"><Phone size={10} /> {winner.phone}</div>
                                                            <div className="flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400" /> {winner.rating} / 5</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-slate-100 group-hover:text-slate-300 transition-colors">
                                                    <Sparkles size={24} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Winner Celebration Modal */}
            {showWinnerModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
                        onClick={() => setShowWinnerModal(false)}
                    />

                    {/* Dual Confetti Booms - Top Corners */}
                    {showConfetti && (
                        <>
                            <div className="fixed top-10 left-10 z-[140] pointer-events-none">
                                <Confetti
                                    key={`confetti-left-${confettiKey}`}
                                    particleCount={300}
                                    duration={8000}
                                    colors={['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981']}
                                />
                            </div>
                            <div className="fixed top-10 right-10 z-[140] pointer-events-none">
                                <Confetti
                                    key={`confetti-right-${confettiKey}`}
                                    particleCount={300}
                                    duration={8000}
                                    colors={['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981']}
                                />
                            </div>
                        </>
                    )}

                    {/* Content Container */}
                    <div className="relative z-[130] w-full max-w-xl p-6 flex flex-col items-center">
                        <button
                            onClick={() => setShowWinnerModal(false)}
                            className="mb-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        {/* Winner Card */}
                        <div
                            key={`winner-card-${confettiKey}`}
                            onClick={retriggerConfetti}
                            className="relative bg-gradient-to-b from-white to-amber-50/50 backdrop-blur-sm rounded-[2.5rem] p-8 sm:p-12 w-full shadow-2xl shadow-black/20 text-center space-y-8 z-10 my-auto cursor-pointer active:scale-[0.98] transition-transform border border-white/40 ring-4 ring-white/10 overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-pulse" />

                            {/* Radial Burst Effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(16)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 w-1 sm:w-1.5 h-16 sm:h-24 bg-gradient-to-t from-amber-400/30 to-transparent origin-bottom animate-burst"
                                        style={{
                                            transform: `rotate(${i * 22.5}deg) translateY(-50%)`,
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="relative z-10">

                                {/* Floating Sparkles */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 sm:-translate-y-3 text-amber-400">
                                    <Sparkles size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div className="absolute top-6 sm:top-8 right-1/4 text-amber-300">
                                    <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                                <div className="absolute top-6 sm:top-8 left-1/4 text-amber-200">
                                    <Sparkles size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>

                            <div className="space-y-1 sm:space-y-2 relative z-10">
                                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight animate-in slide-in-from-bottom-5">🎉 Félicitations ! 🎉</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Le tirage au sort a désigné vos gagnants</p>
                            </div>

                            <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[350px] overflow-y-auto no-scrollbar py-2 relative z-10">
                                {winners.map((w, i) => (
                                    <div
                                        key={w.id}
                                        className="flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-amber-50 to-amber-100/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-amber-200 animate-in slide-in-from-right-5 shadow-sm"
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    >
                                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-lg">
                                            {i + 1}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{w.full_name}</p>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 mt-0.5">{w.phone}</p>
                                        </div>
                                        <Star size={18} className="text-amber-500 fill-amber-500 animate-pulse sm:w-[22px] sm:h-[22px] shrink-0" />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowWinnerModal(false)}
                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 font-black text-sm tracking-widest uppercase hover:from-amber-600 hover:to-amber-700 transition-all active:scale-95 shadow-xl shadow-amber-500/20 relative z-10"
                            >
                                C'est super ! 🎊
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110">
                    <Icon size={18} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    );
}