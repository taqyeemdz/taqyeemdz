"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle } from "lucide-react";

export default function NewBusinessPage() {
  const supabase = supabaseBrowser; const router = useRouter();

  const [form, setForm] = useState({
    business_name: "",
    owner_email: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // 1️⃣ Check admin session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setErrorMsg("Not logged in.");
      setLoading(false);
      return;
    }

    // 2️⃣ Call admin API
    const res = await fetch("/api/admin/create-business-and-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_email: form.owner_email,
        business_name: form.business_name,
        category: form.category,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setErrorMsg(result.error || "Failed to create business and owner.");
      setLoading(false);
      return;
    }

    alert(
      `Business created successfully 🎉\n\nOwner login:\nEmail: ${form.owner_email}\nTemporary password: ${result.temp_password}`
    );

    router.push("/admin/businesses");
  }

  return (
    <div className="max-w-3xl mx-auto pt-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-[var(--muted)] hover:bg-[var(--muted-foreground)]/10 transition"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
        </button>

        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Create Business
        </h1>
      </div>

      {/* FORM */}
      <div className="bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-3xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Business Name"
              placeholder="Example: Café Milano"
              value={form.business_name}
              onChange={(v: string) =>
                setForm({ ...form, business_name: v })
              }
            />

            <InputField
              label="Owner Email"
              placeholder="owner@email.com"
              value={form.owner_email}
              onChange={(v: string) =>
                setForm({ ...form, owner_email: v })
              }
            />
          </div>

          <InputField
            label="Category"
            placeholder="Restaurant, Café, Salon..."
            value={form.category}
            onChange={(v: string) =>
              setForm({ ...form, category: v })
            }
          />

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {errorMsg}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2
              bg-[var(--chart-2)] hover:bg-[var(--chart-2)]/90
              text-white font-medium py-3 rounded-xl transition shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            {loading ? "Creating..." : "Create Business"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===================== INPUT ===================== */
function InputField({ label, value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--muted-foreground)]">
        {label}
      </label>
      <input
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]
          px-4 py-2.5 text-sm text-[var(--foreground)]
          focus:ring-2 focus:ring-[var(--chart-2)] focus:border-transparent"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
