"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MessageCircle,
  Star,
  ArrowRight,
  MapPin
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const supabase = supabaseBrowser; const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalFeedback: 0,
    totalOwners: 0,
    avgRating: 0
  });
  const [latestOwners, setLatestOwners] = useState<any[]>([]);
  const [latestBusinesses, setLatestBusinesses] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return router.replace("/auth/login");

      // 1. Stats Counts
      const { count: bCount } = await supabase.from("businesses").select("*", { count: "exact", head: true });
      const { count: fCount } = await supabase.from("feedback").select("*", { count: "exact", head: true });
      const { count: oCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq('role', 'owner');

      // Try RPC for avg rating, fallback to 0 if fails
      let avg = 0;
      const { data: rpcAvg } = await supabase.rpc("avg_feedback_rating");
      if (rpcAvg) avg = rpcAvg;

      setStats({
        totalBusinesses: bCount || 0,
        totalFeedback: fCount || 0,
        totalOwners: oCount || 0,
        avgRating: avg
      });

      // 2. Latest Owners
      const { data: latestOw } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "owner")
        .order("created_at", { ascending: false })
        .limit(5);
      setLatestOwners(latestOw || []);

      // 3. Latest Businesses
      const { data: latestBiz } = await supabase
        .from("businesses")
        .select(`
          *,
          user_business (
            profiles (full_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      // Flatten owner info
      const formattedBiz = latestBiz?.map((b: any) => ({
        ...b,
        owner_name: b.user_business?.[0]?.profiles?.full_name
      })) || [];

      setLatestBusinesses(formattedBiz);

      setLoading(false);
    }

    loadDashboard();
  }, [router, supabase]);

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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble Admin</h1>
        <p className="text-gray-500 mt-1">Performance et activité à l'échelle du système.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Entreprises"
          value={stats.totalBusinesses}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Total Propriétaires"
          value={stats.totalOwners}
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Total Feedbacks"
          value={stats.totalFeedback}
          icon={MessageCircle}
          color="indigo"
        />
        <StatCard
          label="Note Moyenne"
          value={stats.avgRating?.toFixed(1) || "0.0"}
          icon={Star}
          color="amber"
        />
      </div>

      {/* NEW REGISTRATIONS GRID (Equal Height) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

        {/* LATEST OWNERS */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Derniers Propriétaires</h2>
            <Link href="/admin/owners" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group">
              Voir tout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 h-full">
            {latestOwners.length > 0 ? (
              <div className="space-y-1">
                {latestOwners.map((owner) => (
                  <div key={owner.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => router.push(`/admin/owners/${owner.id}`)}>
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Users size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{owner.full_name || "Propriétaire"}</p>
                      <p className="text-xs text-gray-500 truncate">{owner.email || "Pas d'e-mail"}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(owner.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-gray-500 text-sm">Aucun propriétaire trouvé.</div>
            )}
          </div>
        </div>

        {/* LATEST BUSINESSES */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Dernières Entreprises</h2>
            <Link href="/admin/businesses" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group">
              Voir tout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 h-full">
            {latestBusinesses.length > 0 ? (
              <div className="space-y-1">
                {latestBusinesses.map((biz) => (
                  <div key={biz.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => router.push(`/admin/businesses/${biz.id}`)}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{biz.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {biz.owner_name && (
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
                            <Users size={10} /> {biz.owner_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-400 truncate max-w-[100px]">
                          <MapPin size={10} /> {biz.address || "Pas d'adresse"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-gray-500 text-sm">Aucune entreprise trouvée.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}


function StatCard({ label, value, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600"
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.blue}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}

