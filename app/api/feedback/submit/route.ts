// POST /api/feedback/submit
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const body = await req.json();
  const { qr_code, rating, comment, name, phone } = body;

  // 1️⃣ Fetch QR -> Get business_id
  const { data: qr, error: qrErr } = await supabase
    .from("qr_codes")
    .select("id, business_id")
    .eq("code", qr_code)
    .single();

  if (qrErr || !qr) {
    return NextResponse.json(
      { error: "QR code not found" },
      { status: 400 }
    );
  }

  // 2️⃣ Insert feedback
  const { error: fbErr } = await supabase.from("feedback").insert({
    business_id: qr.business_id,
    qr_id: qr.id,
    rating,
    message: comment,
    client_name: name || null,
    client_phone: phone || null,
  });

  if (fbErr) {
    return NextResponse.json({ error: fbErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
