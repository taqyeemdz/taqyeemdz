"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
    BarChart3,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Loader2,
    Calendar,
    Users,
    Wallet,
    ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";


export default function AccountingPage() {
    const supabase = supabaseBrowser;
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        paidRequests: 0,
        activeSubs: 0
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [planStats, setPlanStats] = useState<any[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

    useEffect(() => {
        fetchAccountingData();
    }, []);

    async function fetchAccountingData() {
        setLoading(true);
        try {
            // 1. Fetch onboarding requests (paid or active) as "transactions"
            const { data: requests, error } = await supabase
                .from("onboarding_requests")
                .select(`*, subscription_plans(name, price)`)
                .in("status", ["paid", "active"])
                .order("created_at", { ascending: true });

            if (error) throw error;

            // 2. Fetch active owners for context
            const { count: activeOwners } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("is_active", true)
                .eq("role", "owner");

            // 3. Process Stats
            let totalRev = 0;
            let monthlyRev = 0;
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const planMap: Record<string, { count: number, revenue: number }> = {};
            const dayMap: Record<string, number> = {};
            const monthMap: Record<string, number> = {};

            requests?.forEach(req => {
                const price = Number(req.subscription_plans?.price || 0);
                totalRev += price;

                const date = new Date(req.created_at);
                if (date >= firstDayOfMonth) {
                    monthlyRev += price;
                }

                // Daily Chart Data (Last period)
                const dayKey = format(date, "dd MMM");
                dayMap[dayKey] = (dayMap[dayKey] || 0) + price;

                // Monthly Revenue Data
                const monthKey = format(date, "MMMM yyyy", { locale: fr });
                monthMap[monthKey] = (monthMap[monthKey] || 0) + price;

                const planName = req.subscription_plans?.name || "Standard";
                if (!planMap[planName]) {
                    planMap[planName] = { count: 0, revenue: 0 };
                }
                planMap[planName].count += 1;
                planMap[planName].revenue += price;
            });

            setStats({
                totalRevenue: totalRev,
                monthlyRevenue: monthlyRev,
                paidRequests: requests?.length || 0,
                activeSubs: activeOwners || 0
            });

            setTransactions([...(requests || [])].reverse());
            setPlanStats(Object.entries(planMap).map(([name, data]) => ({ name, ...data })));
            setMonthlyStats(Object.entries(monthMap).map(([month, amount]) => ({ month, amount })).reverse());

        } catch (err: any) {
            console.error("Error fetching accounting data:", err);
            toast.error("Échec du chargement des données comptables");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-slate-200" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-10">
            {/* Header */}
            <div className="border-b border-slate-100 pb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Comptabilité</h1>
                    <p className="text-slate-500 text-sm mt-1">Analyse financière et gestion des revenus.</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-600 shadow-sm">
                    <Calendar size={14} className="text-slate-400" />
                    {format(new Date(), "MMMM yyyy", { locale: fr })}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    label="Revenu Total"
                    value={`${stats.totalRevenue.toLocaleString()} DZD`}
                    icon={Wallet}
                />
                <KpiCard
                    label="Volume ce mois"
                    value={`${stats.monthlyRevenue.toLocaleString()} DZD`}
                    icon={BarChart3}
                    trend="+12.5%"
                    trendType="up"
                />
                <KpiCard
                    label="Abonnements"
                    value={stats.activeSubs.toString()}
                    icon={Users}
                />
                <KpiCard
                    label="Ventes Validées"
                    value={stats.paidRequests.toString()}
                    icon={CreditCard}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Transaction List */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Dernières Transactions</h3>
                            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Voir tout</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Client / Business</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Plan</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{tx.business_name}</p>
                                                        <p className="text-[11px] text-slate-400">{tx.owner_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[11px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                                                        {tx.subscription_plans?.name || "Standard"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {format(new Date(tx.created_at), "dd MMM yyyy", { locale: fr })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {Number(tx.subscription_plans?.price || 0).toLocaleString()} DZD
                                                    </p>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                                Aucune transaction enregistrée.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Breakdown Panel */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Revenue by Plan */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Répartition par Plan</h3>
                        <div className="space-y-6">
                            {planStats.sort((a, b) => b.revenue - a.revenue).map((plan) => (
                                <div key={plan.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm font-semibold truncate">{plan.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{plan.count} abonnements</p>
                                        </div>
                                        <p className="text-sm font-bold">{plan.revenue.toLocaleString()} DZD</p>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(plan.revenue / stats.totalRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {planStats.length === 0 && <p className="text-xs text-slate-500 italic">Aucune donnée.</p>}
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} className="text-slate-400" />
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Récapitulatif Mensuel</h3>
                        </div>
                        <div className="space-y-4">
                            {monthlyStats.map((item) => (
                                <div key={item.month} className="flex justify-between items-center group">
                                    <span className="text-sm font-medium text-slate-600 capitalize group-hover:text-slate-900 transition-colors">
                                        {item.month}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900">
                                        {item.amount.toLocaleString()} DZD
                                    </span>
                                </div>
                            ))}
                            {monthlyStats.length === 0 && <p className="text-xs text-slate-400 italic">Aucun historique.</p>}
                        </div>
                    </div>

                    {/* Pending Settlements - Mock for now */}
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                            <BarChart3 size={18} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Croissance</h4>
                        </div>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                            Votre chiffre d'affaires a augmenté de <span className="text-indigo-600 font-bold">12%</span> par rapport au mois dernier. Continuez ainsi !
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, icon: Icon, trend, trendType }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-colors">
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendType === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                        {trendType === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}
