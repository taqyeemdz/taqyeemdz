"use client";

import * as React from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCircle, XCircle } from "lucide-react";

export default function QRCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const supabase = createClient();

  const [qr, setQr] = React.useState<any>(null);
  const [qrSvg, setQrSvg] = React.useState("");
  const [feedback, setFeedback] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      // 1️⃣ Load QR info
      const { data: qrRow } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("id", id)
        .single();

      if (!qrRow) {
        setLoading(false);
        return;
      }

      setQr(qrRow);

      // Generate actual QR SVG
      const svg = await QRCode.toString(
        `${window.location.origin}/feedback/${qrRow.code}`,
        { type: "svg", width: 50 }
      );

      setQrSvg(svg);

      // 2️⃣ Load feedback by QR CODE ID
      const { data: fbRows } = await supabase
        .from("feedback")
        .select("*")
        .eq("qrcodeid", qrRow.id)
        .order("created_at", { ascending: false });

      setFeedback(fbRows || []);

      setLoading(false);
    }

    load();
  }, [id]);

  async function toggleActive() {
    const { data } = await supabase
      .from("qr_codes")
      .update({ is_active: !qr.is_active })
      .eq("id", qr.id)
      .select("*")
      .single();

    if (data) setQr(data);
  }

  if (loading) return <div className="text-slate-400">Loading QR…</div>;
  if (!qr) return <div className="text-red-400">QR not found</div>;

  const publicUrl = `${window.location.origin}/feedback/${qr.code}`;

  return (
    <div className="space-y-8">
      <Link href="/owner/qr-codes">
        <Button variant="outline">← Back</Button>
      </Link>

      <h1 className="text-3xl font-bold text-slate-50">
        QR Code — {qr.name || qr.code}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — QR Preview */}
       {/* LEFT — QR PREVIEW */}
<Card className="p-6 bg-slate-900 border-slate-700 flex flex-col items-center">
  
  {/* QR CODE */}
  {qrSvg && (
    <div className="bg-white p-3 rounded-lg shadow-lg mb-4">
     <div
  className="mx-auto"
  style={{ width: "100px", height: "100px" }}
  dangerouslySetInnerHTML={{
    __html: qrSvg.replace("<svg", `<svg height="100px" width="100px"`),
  }}
/>

    </div>
  )}

  {/* ACTION BUTTONS */}
  <div className="w-full flex gap-3">
    <Button
      className="flex-1 bg-slate-700"
      onClick={() => {
        navigator.clipboard.writeText(publicUrl);
        alert("Copied link!");
      }}
    >
      <Copy size={16} className="mr-2" /> Copy Link
    </Button>

    <Button
      className="flex-1 bg-primary"
      onClick={() => {
        const blob = new Blob([qrSvg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = qr.code + ".svg";
        link.click();
      }}
    >
      <Download size={16} className="mr-2" /> Download
    </Button>
  </div>
</Card>


        {/* MIDDLE — Details */}
        <Card className="p-6 bg-slate-900 border-slate-700 space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Code</p>
            <p className="text-xl text-slate-50 font-semibold">{qr.code}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                qr.is_active
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {qr.is_active ? "Active" : "Inactive"}
            </span>

            <Button onClick={toggleActive} className="mt-3 w-full bg-slate-700">
              {qr.is_active ? (
                <>
                  <XCircle size={16} className="mr-2" /> Deactivate
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" /> Activate
                </>
              )}
            </Button>
          </div>

          <div>
            <p className="text-slate-400 text-sm">Created</p>
            <p className="text-slate-200">
              {qr.created_at
                ? new Date(qr.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-slate-400 text-sm">Scans</p>
            <p className="text-slate-200">{qr.scans_count ?? 0}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm">Public URL</p>
            <p className="text-slate-200 break-all">{publicUrl}</p>
          </div>
        </Card>

        {/* RIGHT — Feedback list */}
        <Card className="p-6 bg-slate-900 border-slate-700 lg:col-span-2">
          <h2 className="text-xl font-semibold text-slate-50 mb-4">
            Recent Feedback
          </h2>

          {feedback.length === 0 ? (
            <p className="text-slate-500">No feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  <div className="flex justify-between">
                    <p className="text-slate-200 font-semibold">
                      {fb.customer_name || "Anonymous"}
                    </p>
                    <p className="text-yellow-300">⭐ {fb.rating}</p>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{fb.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
