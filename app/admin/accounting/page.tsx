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
    const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
    const [dateFilter, setDateFilter] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('all');

    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        paidRequests: 0,
        activeSubs: 0
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [planStats, setPlanStats] = useState<any[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
    const [originalRequests, setOriginalRequests] = useState<any[]>([]); // Store original data for filtering

    useEffect(() => {
        fetchAccountingData();
    }, []);

    useEffect(() => {
        processAccountingData(originalRequests);
    }, [periodFilter, dateFilter, originalRequests]);

    async function fetchAccountingData() {
        setLoading(true);
        try {
            // 1. Fetch onboarding requests (paid or active) as "transactions"
            const { data: requests, error } = await supabase
                .from("onboarding_requests")
                .select(`*, subscription_plans(name, price, billing_period)`)
                .in("status", ["paid", "active"])
                .order("created_at", { ascending: true });

            if (error) throw error;
            setOriginalRequests(requests || []);

        } catch (err: any) {
            console.error("Error fetching accounting data:", err);
            toast.error("Échec du chargement des données comptables");
        } finally {
            setLoading(false);
        }
    }

    async function processAccountingData(requests: any[]) {
        // Filter requests based on selected filters
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

        const filteredRequests = requests.filter(req => {
            const date = new Date(req.created_at);
            const plan = req.subscription_plans;

            // Billing Period Filter
            if (periodFilter !== 'all') {
                const billingPeriod = plan?.billing_period || 'monthly';
                if (billingPeriod !== periodFilter) return false;
            }

            // Date Filter
            if (dateFilter === 'this_month') {
                return date >= firstDayOfMonth;
            } else if (dateFilter === 'last_month') {
                return date >= firstDayOfLastMonth && date <= lastDayOfLastMonth;
            } else if (dateFilter === 'this_year') {
                return date >= firstDayOfYear;
            }

            return true;
        });

        // 2. Fetch active owners for context (filtered count if needed, but usually global)
        // Here we just keep total active owners regardless of filters for the "Active Subs" KPI card, 
        // OR we could filter it too if we had more detailed profile data in this context. 
        // For simplicity let's keep it global or fetch it again if strict sync needed.
        // Let's just use the length of filtered 'active' requests as a proxy for this view or keep global stats separate.
        // For now, let's recalculate stats based on filtered transactions.

        // 3. Process Stats from Filtered Data
        let totalRev = 0;
        let monthlyRev = 0; // Revenue currently matching the date filter

        const planMap: Record<string, { count: number, revenue: number }> = {};
        const monthMap: Record<string, number> = {};

        filteredRequests.forEach(req => {
            const price = Number(req.subscription_plans?.price || 0);
            totalRev += price;

            // For "Volume ce mois" KPI, we might want to keep it strictly "Current Month" regardless of filters
            // OR align it with the total filtered revenue. 
            // Let's make "Revenu Total" reflect the filtered view.

            const date = new Date(req.created_at);
            // Calculate strictly current month revenue for the specific KPI if needed, 
            // but usually dashboards update KPIs based on filters.
            if (date >= firstDayOfMonth) {
                monthlyRev += price;
            }

            // Monthly Revenue Data for Chart
            const monthKey = format(date, "MMMM yyyy", { locale: fr });
            monthMap[monthKey] = (monthMap[monthKey] || 0) + price;

            const planName = req.subscription_plans?.name || "Standard";
            if (!planMap[planName]) {
                planMap[planName] = { count: 0, revenue: 0 };
            }
            planMap[planName].count += 1;
            planMap[planName].revenue += price;
        });

        // Get total active owners (global context, not affected by Transaction filters usually, but lets fetch simple count)
        const { count: activeOwners } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true)
            .eq("role", "owner");

        setStats({
            totalRevenue: totalRev,
            monthlyRevenue: monthlyRev, // This remains "Current Month" revenue in the dataset
            paidRequests: filteredRequests.length,
            activeSubs: activeOwners || 0
        });

        setTransactions([...filteredRequests].reverse());
        setPlanStats(Object.entries(planMap).map(([name, data]) => ({ name, ...data })));
        setMonthlyStats(Object.entries(monthMap).map(([month, amount]) => ({ month, amount })).reverse());
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
            <div className="border-b border-slate-100 pb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Comptabilité</h1>
                    <p className="text-slate-500 text-sm mt-1">Analyse financière et gestion des revenus.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Period Filter */}
                    <div className="inline-flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {[
                            { id: 'all', label: 'Tout' },
                            { id: 'monthly', label: 'Mensuel' },
                            { id: 'yearly', label: 'Annuel' }
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPeriodFilter(p.id as any)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                    ${periodFilter === p.id
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 shadow-sm outline-none focus:border-slate-400 h-[42px]"
                    >
                        <option value="all">Toute la période</option>
                        <option value="this_month">Ce mois</option>
                        <option value="last_month">Mois dernier</option>
                        <option value="this_year">Cette année</option>
                    </select>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    label="Revenu Total"
                    value={`${(stats.totalRevenue || 0).toLocaleString()} DZD`}
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
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[11px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                                                            {tx.subscription_plans?.name || "Standard"}
                                                        </span>
                                                        {tx.subscription_plans?.billing_period && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                                                {tx.subscription_plans.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                                                            </span>
                                                        )}
                                                    </div>
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
