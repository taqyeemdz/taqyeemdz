"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Plus,
  Star,
  MessageSquare,
} from "lucide-react";

export default function BusinessesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  /* ========================== DELETE ========================== */
  async function handleDelete(e: any, businessId: string) {
    e.stopPropagation();

    if (!confirm("Delete this business? All feedback & QR codes will be deleted.")) return;

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", businessId);

    if (error) {
      alert("Deletion failed: " + error.message);
      return;
    }

    setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
  }

  /* ========================== LOAD BUSINESSES ========================== */
  useEffect(() => {
    (async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, phone, address, created_at, owner_id,owner_name")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) console.log(error);

      setBusinesses(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = businesses.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-8">

      {/* ========================= HEADER ========================= */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Businesses Management
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage registered restaurants, cafés, salons, shops and more.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/businesses/new")}
          className="
            flex items-center gap-2 bg-[var(--chart-2)] text-white 
            px-4 py-2 rounded-xl font-medium shadow hover:bg-[var(--chart-2)]/90 
            transition
          "
        >
          <Plus size={18} />
          Add Business
        </button>
      </div>

      {/* ========================= SEARCH ========================= */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search business..."
          className="
            bg-[var(--card)] border border-[var(--border)] 
            rounded-xl w-full pl-10 pr-4 py-2.5 
            focus:ring-2 focus:ring-[var(--chart-2)] focus:border-transparent
          "
        />
      </div>

      {/* ========================= BUSINESS LIST ========================= */}
      {loading ? (
        <div className="text-center py-10 text-[var(--muted-foreground)]">
          Loading businesses...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[var(--muted-foreground)]">
          No businesses found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="
                bg-[var(--card)] border border-[var(--border)] rounded-2xl 
                p-5 shadow-sm hover:shadow-md hover:border-[var(--chart-2)] 
                transition flex justify-between group relative cursor-pointer
              "
              onClick={() => router.push(`/admin/businesses/${b.id}`)}
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="text-[var(--chart-2)]" size={22} />
                  <h3 className="font-semibold text-[var(--foreground)]">{b.name}</h3>
                </div>

                <p className="text-sm text-[var(--muted-foreground)] truncate">
                  {b.address || "No address specified"}
                </p>

                <span className="text-xs text-gray-500">Owner: {b.owner_name}</span>

                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-[var(--chart-3)]">
                    <Star size={16} />
                    4.6
                  </div>
                  <div className="flex items-center gap-1 text-[var(--chart-1)]">
                    <MessageSquare size={16} />
                    34 feedback
                  </div>
                </div>

                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Added {new Date(b.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* DELETE BUTTON */}
              <button
                onClick={(e) => handleDelete(e, b.id)}
                className="
                  text-red-500 opacity-0 group-hover:opacity-100
                  transition absolute top-3 right-3
                  bg-red-100 hover:bg-red-200 rounded-full p-2
                "
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
