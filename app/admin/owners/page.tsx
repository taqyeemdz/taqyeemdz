"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Plus, Users, Mail, Calendar } from "lucide-react";

export default function OwnersListPage() {
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Load all owners
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at,email")
        .eq("role", "owner")
        .order("created_at", { ascending: false });

      if (!error) {
        /** fetch auth emails for each user */
        const { data: users } = await supabase.auth.admin.listUsers();

        const merged = data.map((o) => {
          const auth = users?.users?.find((u) => u.id === o.id);
          return {
            ...o,
            email: auth?.email ?? "—",
          };
        });

        setOwners(merged);
      }

      setLoading(false);
    })();
  }, []);

  const filtered = owners.filter((o) =>
    o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Owners Management
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage business owners registered in the system.
          </p>
        </div>

        <Link
          href="/admin/owners/new"
          className="flex items-center gap-2 bg-[var(--chart-2)] text-white px-4 py-2 rounded-xl font-medium shadow hover:bg-[var(--chart-2)]/90 transition"
        >
          <Plus size={18} />
          New Owner
        </Link>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Users
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search owner..."
          className="
            bg-[var(--card)] border border-[var(--border)] 
            rounded-xl w-full pl-10 pr-4 py-2.5 
            focus:ring-2 focus:ring-[var(--chart-2)] focus:border-transparent
          "
        />
      </div>

      {/* OWNERS LIST */}
      {loading ? (
        <div className="text-center py-10 text-[var(--muted-foreground)]">
          Loading owners...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[var(--muted-foreground)]">
          No owners found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((o) => (
            <Link
              key={o.id}
              href={`/admin/owners/${o.id}`}
              className="
                bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5
                hover:shadow-md hover:border-[var(--chart-2)]
                transition flex flex-col gap-3
              "
            >
              <div className="flex items-center gap-3">
                <Users className="text-[var(--chart-2)]" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {o.full_name || "Unnamed Owner"}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {o.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-2">
                <Calendar size={14} />
                Registered on {new Date(o.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
