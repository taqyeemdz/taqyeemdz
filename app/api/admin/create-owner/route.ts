import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, business_id, name } = await req.json();

    const supabase = createAdminClient();

    // 1. Create auth user (service role required)
    const tempPassword = Math.random().toString(36).slice(-10);

    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert into public.users
    const { error: userError } = await supabase.from("users").insert({
      id: authUser.user.id,
      email,
      name,
      role: "owner",
      business_id: business_id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Owner created successfully",
      tempPassword,
      userId: authUser.user.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
