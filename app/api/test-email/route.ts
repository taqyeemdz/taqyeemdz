import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await resend.emails.send({
    from: "TaqyeemDZ <taqyeemdz@gmail.com>",
    to: "tradibelle@gmail.com",
    subject: "Test Email",
    html: "<h1>Hello from Resend</h1>",
  });

  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ success: true, data });
}
