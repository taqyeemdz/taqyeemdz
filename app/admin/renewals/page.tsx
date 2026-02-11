"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
    Search,
    Phone,
    Mail,
    CheckCircle2,
    Loader2,
    CreditCard,
    User,
    ChevronRight,
    Clock,
    AlertCircle,
    XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string, color: string, dot: string }> = {
    pending: { label: "En attente", color: "text-amber-500", dot: "bg-amber-400" },
    approved: { label: "Approuvé", color: "text-emerald-500", dot: "bg-emerald-400" },
    rejected: { label: "Refusé", color: "text-red-500", dot: "bg-red-400" },
};

export default function RenewalRequestsPage() {
    const supabase = supabaseBrowser;
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        setLoading(true);
        const { data, error } = await supabase
            .from("renewal_requests")
            .select(`
                *,
                profiles (
                    full_name,
                    phone,
                    email,
                    subscription_end
                ),
                subscription_plans (
                    name,
                    price,
                    currency,
                    billing_period
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching renewal requests:", error);
            toast.error("Échec du chargement des demandes");
        } else {
            setRequests(data || []);
            if (data && data.length > 0 && !selectedRequest) {
                setSelectedRequest(data[0]);
            }
        }
        setLoading(false);
    }

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setApproving(true);
        try {
            const res = await fetch("/api/admin/renewals/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: selectedRequest.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Le renouvellement a échoué");

            toast.success("Abonnement renouvelé avec succès !");
            await fetchRequests();
            setSelectedRequest(null);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setApproving(false);
        }
    };

    const filtered = requests.filter(r => {
        const ownerName = r.profiles?.full_name || "";
        const phone = r.profiles?.phone || "";
        const matchesSearch =
            ownerName.toLowerCase().includes(search.toLowerCase()) ||
            phone.includes(search);
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        if (filtered.length > 0) {
            setSelectedRequest(filtered[0]);
        } else {
            setSelectedRequest(null);
        }
    }, [statusFilter, search]);

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10">
            {/* Header */}
            <div className="border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Renouvellements</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Gérez les demandes de prolongation d'abonnement.</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* List Side */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                        {["all", "pending", "approved"].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border
                                    ${statusFilter === s
                                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200"
                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                                    }`}
                            >
                                {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                            placeholder="Rechercher par nom ou téléphone..."
                            className="w-full bg-transparent border-b border-slate-100 pl-8 pr-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-slate-200" size={20} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-24 text-center">
                            <p className="text-sm text-slate-400">Aucune demande trouvée.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filtered.map((r) => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedRequest(r)}
                                    className={`p-3 rounded-lg transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden
                                        ${selectedRequest?.id === r.id
                                            ? 'bg-indigo-50/50 ring-1 ring-inset ring-indigo-100'
                                            : 'hover:bg-slate-50/50'}
                                    `}
                                >
                                    {selectedRequest?.id === r.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                    )}

                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_CONFIG[r.status].dot}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{r.profiles?.full_name || "Utilisateur"}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {r.subscription_plans?.name} • {format(new Date(r.created_at), "dd/MM HH:mm")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[r.status].color}`}>
                                            {STATUS_CONFIG[r.status].label}
                                        </span>
                                        <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Side */}
                <div className="lg:col-span-5">
                    {selectedRequest ? (
                        <div className="sticky top-8 space-y-8 animate-in fade-in duration-300">
                            <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedRequest.status].dot}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${STATUS_CONFIG[selectedRequest.status].color}`}>
                                            {STATUS_CONFIG[selectedRequest.status].label}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 leading-tight">{selectedRequest.profiles?.full_name}</h3>
                                </div>

                                <div className="space-y-4">
                                    <DetailItem icon={Phone} label="Contact" value={selectedRequest.profiles?.phone} />
                                    <DetailItem icon={Mail} label="Email" value={selectedRequest.profiles?.email} />
                                    <DetailItem
                                        icon={CreditCard}
                                        label="Plan à renouveler"
                                        value={selectedRequest.subscription_plans?.name}
                                    />
                                    <DetailItem
                                        icon={Clock}
                                        label="Période"
                                        value={selectedRequest.subscription_plans?.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                                    />
                                    {selectedRequest.profiles?.subscription_end && (
                                        <DetailItem
                                            icon={AlertCircle}
                                            label="A expiré le"
                                            value={format(new Date(selectedRequest.profiles.subscription_end), "dd MMMM yyyy", { locale: fr })}
                                        />
                                    )}
                                </div>

                                {selectedRequest.status === 'pending' && (
                                    <div className="pt-6 border-t border-slate-50">
                                        <button
                                            onClick={handleApprove}
                                            disabled={approving}
                                            className="w-full bg-slate-900 text-white rounded-xl py-4 text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                                        >
                                            {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Confirmer le paiement et Renouveler
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center mt-3 font-medium uppercase tracking-tight">
                                            L'accès sera réactivé immédiatement après confirmation.
                                        </p>
                                    </div>
                                )}

                                {selectedRequest.status === 'approved' && (
                                    <div className="pt-6 border-t border-slate-50">
                                        <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3 text-emerald-700 text-sm font-medium border border-emerald-100">
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                            Demande approuvée et plan prolongé.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 border border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300">
                            <p className="text-xs font-medium uppercase tracking-widest">Détails</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-5 h-5 text-slate-300 shrink-0">
                <Icon size={16} />
            </div>
            <div className="flex justify-between flex-1 items-center gap-4">
                <span className="text-[11px] font-medium text-slate-400 shrink-0">{label}</span>
                <span className="text-xs font-semibold text-slate-900 text-right">{value || "—"}</span>
            </div>
        </div>
    );
}
