"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import QRCode from "qrcode";

type FormField = "name" | "category" | "phone" | "address";

export default function NewBusiness() {
  const supabase = supabaseBrowser;
  const [form, setForm] = useState<Record<FormField, string>>({
    name: "",
    category: "",
    phone: "",
    address: "",
  });

  const [qrLink, setQrLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        window.location.href = "/auth/login?redirectTo=/owner/business/new";
      }
    }

    checkAuth();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/owner/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create business");
      }

      // 4) Generate QR code pointing to owner's business dashboard
      const link = `${window.location.origin}/owner/business/${data.business_id}`;
      const qrDataUrl = await QRCode.toDataURL(link);
      setQrLink(qrDataUrl);

      alert("Business created!");
    } catch (err: any) {
      setError(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
        Create Your Business
      </h1>

      <form onSubmit={submit} className="space-y-4">
        {(Object.keys(form) as FormField[]).map((key) => (
          <input
            key={key}
            placeholder={key}
            className="
              w-full border border-[var(--border)] bg-[var(--card)]
              text-[var(--foreground)] rounded-xl px-4 py-2
              focus:ring-2 focus:ring-[var(--chart-2)] focus:border-transparent
            "
            value={form[key]}
            onChange={(e) =>
              setForm({ ...form, [key]: e.target.value })
            }
            required
          />
        ))}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="
            w-full bg-[var(--chart-2)] text-white py-3 rounded-xl
            font-semibold hover:bg-[var(--chart-2)]/80 transition
            disabled:opacity-50
          "
        >
          {loading ? "Saving..." : "Save Business"}
        </button>
      </form>

      {qrLink && (
        <div className="mt-6 bg-[var(--muted)] border border-[var(--border)] p-4 rounded-lg flex flex-col items-center gap-2">
          <p className="font-medium text-[var(--foreground)]">Your Business QR Code:</p>
          <img src={qrLink} alt="Business QR Code" className="w-40 h-40" />
        </div>
      )}
    </div>
  );
}
