import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { email, full_name } = await req.json();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
    app_metadata: { role: "owner" },
  });

  if (error) {
    console.error("❌ createUser:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // ❌ DO NOT insert into profiles
  // The trigger already did it

  return NextResponse.json({
    success: true,
    user_id: data.user.id,
  });
}
