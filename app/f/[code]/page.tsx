"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"

import { Label } from "@radix-ui/react-label";
import React from "react";

export default function FeedbackFormPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = React.use(params);
  const supabase = createClient();

  const [qr, setQr] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [isAnon, setIsAnon] = useState(true);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // attachments
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("*, businesses(name)")
        .eq("code", code)
        .single();

      setQr(qrData);
      setBusiness(qrData?.businesses || null);
      setLoading(false);
    }

    load();
  }, [code]);

  async function uploadFile(file: File, folder: string) {
    const path = `${folder}/${crypto.randomUUID()}`;
    const { error } = await supabase.storage.from("attachments").upload(path, file);
    if (error) return null;

    const { data } = supabase.storage.from("attachments").getPublicUrl(path);
    return data.publicUrl;
  }

  async function submitFeedback() {
    if (!qr) return;

    let attachments: any[] = [];

    if (photo) {
      const url = await uploadFile(photo, "photos");
      if (url) attachments.push({ type: "photo", url });
    }

    if (video) {
      const url = await uploadFile(video, "videos");
      if (url) attachments.push({ type: "video", url });
    }

    const { error } = await supabase.from("feedback").insert([
      {
        qrcodeid: qr.id,
        businessid: qr.business_id,
        rating,
        message,
        isanonymous: isAnon,
        customer_name: isAnon ? null : name,
        customer_phone: isAnon ? null : phone,
        attachments,
      },
    ]);

    if (!error) {
      alert("Thank you for your feedback!");
      window.location.href = "/thank-you";
    } else {
      alert(error.message);
    }
  }

  if (loading) return <div className="text-center text-slate-300">Loading…</div>;
  if (!qr) return <div className="text-red-400">QR code invalid or inactive.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <Card className="p-6 bg-white">
        <h1 className="text-2xl font-bold text-primary text-center">Feedback for {business?.name}</h1>

        {/* Rating */}
        <div className="mt-6 text-center">
          <p className="text-gray-700 text-sm mb-1">Rating</p>
          <select
            className="border p-2 rounded"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>
                {s} Star{ s > 1 ? "s" : "" }
              </option>
            ))}
          </select>
        </div>

        {/* Anonymous toggle */}
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAnon}
              onChange={(e) => setIsAnon(e.target.checked)}
            />
            Submit anonymously
          </label>
        </div>

        {!isAnon && (
          <div className="space-y-3 mt-3">
            <Input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}

        {/* Message */}
        <Textarea
          className="mt-4"
          placeholder="Write your feedback..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Attachments */}
        <div className="space-y-3 mt-4">
          <Label>Photo (optional)</Label>
          <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />

          <Label>Video (optional)</Label>
          <Input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
        </div>

        <Button className="mt-6 w-full bg-primary" onClick={submitFeedback}>
          Submit Feedback
        </Button>
      </Card>
    </div>
  );
}
