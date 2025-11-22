"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QrCode, ChevronRight } from "lucide-react";

export default function QRCodesListPage() {
  const supabase = createClient();
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [plan, setPlan] = useState<string>("starter");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return setError("Not authenticated");

        const { data: userRow } = await supabase
          .from("users")
          .select("business_id")
          .eq("id", auth.user.id)
          .single();

        if (!userRow?.business_id)
          return setError("You're not linked to any business");

        // Get plan
        const { data: biz } = await supabase
          .from("businesses")
          .select("subscriptionplan")
          .eq("id", userRow.business_id)
          .single();

        setPlan(biz?.subscriptionplan ?? "starter");

        // Get QR codes
        const { data: qr } = await supabase
  .from("qr_codes")
.select("id, code, is_active, created_at, scans_count, name")
  .eq("business_id", userRow.business_id)
  .order("created_at", { ascending: false });


        setQrCodes(qr || []);
      } catch (e) {
        console.error(e);
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (error)
    return <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>;

  const canCreate = plan !== "starter" || qrCodes.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-50">QR Codes</h1>

        {canCreate ? (
          <Link href="/owner/qr-codes/new">
            <Button className="bg-primary">Create New</Button>
          </Link>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            Basic plan: 1 QR only
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {qrCodes.map((qr) => (
          <Link key={qr.id} href={`/owner/qr-codes/${qr.id}`}>
            <Card className="p-4 bg-slate-900 border-slate-700 hover:border-slate-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-50 font-semibold">{qr.code}</p>
                  <p className="text-xs text-slate-400">
                    {qr.branches?.name ?? "No branch"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(qr.created_at).toLocaleDateString()}
                  </p>
                </div>
                <QrCode className="text-slate-500" />
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    qr.is_active
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {qr.is_active ? "Active" : "Inactive"}
                </span>

                <ChevronRight className="text-slate-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
