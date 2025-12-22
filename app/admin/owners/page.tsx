"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client"; import {
  Plus,
  Users,
  Mail,
  Calendar,
  Search,
  ChevronRight,
  ShieldCheck,
  User as UserIcon
} from "lucide-react";

export default function OwnersListPage() {
  const supabase = supabaseBrowser;
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Load all owners with their plans
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, role, created_at, email, plan_id,
          subscription_plans (name)
        `)
        .eq("role", "owner")
        .order("created_at", { ascending: false });

      if (!error) {
        /** fetch auth emails for each user */
        const { data: users } = await supabase.auth.admin.listUsers();

        const merged = data.map((o: any) => {
          const auth = users?.users?.find((u) => u.id === o.id);
          return {
            ...o,
            email: auth?.email || o.email || "—",
            plan_name: o.subscription_plans?.name || "No Plan"
          };
        });

        setOwners(merged);
      } else {
        console.error(error);
      }

      setLoading(false);
    })();
  }, []);

  const filtered = owners.filter((o) =>
    o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* ========================= HEADER ========================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Owners Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage all registered system users and owners.
          </p>
        </div>

        <Link
          href="/admin/owners/new"
          className="
            flex items-center gap-2 bg-gray-900 text-white 
            px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-black 
            transition-all active:scale-95
          "
        >
          <Plus size={18} />
          New Owner
        </Link>
      </div>

      {/* ========================= SEARCH ========================= */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="
            w-full bg-white border border-gray-200 
            rounded-xl pl-12 pr-4 py-3 text-base outline-none
            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
          "
        />
      </div>

      {/* ========================= OWNERS LIST ========================= */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
            <Users size={24} />
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No owners found</h3>
          <p className="text-gray-500 text-sm">
            Create a new owner to get started.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((o) => (
            <Link
              key={o.id}
              href={`/admin/owners/${o.id}`}
              className="
                group bg-white border border-gray-100 rounded-2xl p-5
                shadow-sm hover:shadow-md hover:border-indigo-100
                transition-all cursor-pointer flex items-center gap-4
              "
            >
              {/* Avatar Icon */}
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 border border-indigo-100 group-hover:scale-105 transition-transform">
                <UserIcon size={24} />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {o.full_name || "Unnamed Owner"}
                  </h3>
                  <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-100">
                    Owner
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-100">
                    {o.plan_name}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{o.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={12} className="shrink-0" />
                    <span>Joined {new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                <ChevronRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
