"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import * as QRCode from "qrcode";

export default function CreateQRCodePage() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [formType, setFormType] = useState<"feedback" | "rating" | "survey">(
    "feedback"
  );

  const [loading, setLoading] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  // -------------------------
  // Generate QR
  // -------------------------
  async function generateQR() {
    const code = crypto.randomUUID().slice(0, 8).toUpperCase();
    setGeneratedCode(code);

    const svg = await QRCode.toString(code, { type: "svg" });
    setQrSvg(svg);
  }

  // -------------------------
  // Create QR in database
  // -------------------------
  async function createQR() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not logged in");
      return;
    }

    // Fetch business ID from users table
    const { data: u } = await supabase
      .from("users")
      .select("business_id")
      .eq("id", user.id)
      .single();

    if (!u?.business_id) {
      alert("Business not linked to user");
      return;
    }

    // Insert according to your schema
    const { error } = await supabase.from("qr_codes").insert([
      {
        id: crypto.randomUUID(),
        business_id: u.business_id,
        branch_id: null,
        name: name,
        code: generatedCode,
        formtype: formType, // REQUIRED in your schema
        isactive: true,
        scanscount: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    router.push("/owner/qr-codes");
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-50">Create QR Code</h1>

      <Card className="p-6 bg-slate-900 space-y-4">
        <Label className="text-slate-200">QR Name</Label>
        <Input
          placeholder="Table 1 Feedback QR"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Select Form Type */}
        <div>
          <Label className="text-slate-200">Form Type</Label>
          <select
            value={formType}
            onChange={(e) =>
              setFormType(e.target.value as "feedback" | "rating" | "survey")
            }
            className="w-full p-2 rounded bg-slate-800 text-slate-100 border border-slate-600"
          >
            <option value="feedback">Feedback (default)</option>
            <option value="rating">Rating Only</option>
            <option value="survey">Survey</option>
          </select>
        </div>

        {!qrSvg && (
          <Button onClick={generateQR} className="w-full mt-4">
            Generate QR Code
          </Button>
        )}

        {/* PREVIEW */}
        {qrSvg && (
          <div className="space-y-4">
            <div
              className="bg-white p-4 rounded"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            <Button
              disabled={loading}
              onClick={createQR}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creating..." : "Save QR Code"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
