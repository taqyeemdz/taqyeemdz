"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MessageCircle,
  Star,
  ArrowRight,
  Clock,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Wallet
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOwners: 0,
    monthlyRevenue: 0,
    pendingRequests: 0,
    today: ""
  });
  const [latestOwners, setLatestOwners] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return router.replace("/auth/login");

      // Set today's date formatted
      const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());

      // Fetch Stats
      const [oRes, rRes, pRes] = await Promise.all([
        supabase.from("profiles").select("id, plan_id").eq('role', 'owner'),
        supabase.from("onboarding_requests").select("*", { count: "exact", head: true }).eq('status', 'pending'),
        supabase.from("subscription_plans").select("id, price")
      ]);

      // Calculate Revenue (Sum of active owner plan prices)
      const plansMap = (pRes.data || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.price;
        return acc;
      }, {});

      const revenue = (oRes.data || []).reduce((acc: number, owner: any) => {
        return acc + (plansMap[owner.plan_id] || 0);
      }, 0);

      setStats({
        totalOwners: oRes.data?.length || 0,
        monthlyRevenue: revenue,
        pendingRequests: rRes.count || 0,
        today: todayFormatted
      });

      // 2. Latest Owners
      const { data: latestOw } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "owner")
        .order("created_at", { ascending: false })
        .limit(5);
      setLatestOwners(latestOw || []);

      // 3. Pending Requests
      const { data: pendingReq } = await supabase
        .from("onboarding_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      setPendingRequests(pendingReq || []);

      setLoading(false);
    }

    loadDashboard();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Chargement du Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in duration-500">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Console Administration</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">C'est un plaisir de vous revoir 👋</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez la croissance et les revenus de Feedback by jobber.</p>
        </div>

      </div>

      {/* STATS TILES (3 Columns as requested) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatTile
          label="Revenu ce mois"
          value={`${new Intl.NumberFormat('fr-DZ').format(stats.monthlyRevenue)}`}
          suffix="DZD"
          icon={Wallet}
          color="indigo"
          trend="Revenu récurrent estimé"
        />
        <StatTile
          label="Total Propriétaires"
          value={stats.totalOwners}
          icon={Users}
          color="purple"
          trend="Membres actifs"
        />
        <StatTile
          label="Date d'aujourd'hui"
          value={stats.today.split(' ')[0]}
          suffix={stats.today.split(' ').slice(1).join(' ')}
          icon={Calendar}
          color="amber"
          trend="Temps réel"
        />
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* PENDING REQUESTS CARD */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Demandes en attente</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stats.pendingRequests} nouveaux candidats</p>
              </div>
            </div>
            <Link href="/admin/onboarding" className="p-3 bg-white border border-slate-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group">
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="p-4 flex-1">
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} onClick={() => router.push('/admin/onboarding')} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-black group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{req.business_name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{req.owner_name} • {req.wilaya}</p>
                      </div>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-black uppercase mb-1">En attente</span>
                      <span className="text-[10px] font-bold text-slate-300">Nouveau</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-900">Tout est réglé !</p>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">Aucune demande d'activation en attente pour le moment.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECENT OWNERS CARD */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Dernières Inscriptions</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activité récente des utilisateurs</p>
              </div>
            </div>
            <Link href="/admin/owners" className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm">
              <Users size={20} />
            </Link>
          </div>

          <div className="p-4 flex-1">
            <div className="space-y-3">
              {latestOwners.map((owner) => (
                <div key={owner.id} onClick={() => router.push(`/admin/owners/${owner.id}`)} className="flex items-center justify-between p-4 bg-white hover:bg-indigo-50/30 rounded-2xl border border-transparent hover:border-indigo-100/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black uppercase shadow-lg shadow-indigo-600/20">
                        {owner.full_name?.substring(0, 2) || "O"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{owner.full_name || "Propriétaire"}</p>
                      <p className="text-xs font-bold text-slate-400 truncate max-w-[150px]">{owner.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{new Date(owner.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inscrit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function StatTile({ label, value, icon: Icon, color, trend, suffix }: any) {
  const iconBgMap: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${iconBgMap[color]}`}>
          <Icon size={28} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
          <TrendingUp size={12} className="text-emerald-500" />
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {suffix && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{suffix}</span>}
        </div>
      </div>
      {/* Subtle Background Pattern */}
      <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Icon size={120} />
      </div>
    </div>
  );
}
