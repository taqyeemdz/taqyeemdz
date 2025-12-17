"use server";

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

type BusinessBody = {
  name: string;
  category: string;
  phone?: string;
  address?: string;
};

export async function POST(request: Request) {
  try {
    // ------------------------------
    // 1️⃣ Server-side Supabase client (anon key)
    // ------------------------------
    const supabaseUser = await createSupabaseServer();

    // ------------------------------
    // 2️⃣ Get current logged-in user
    // ------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // ------------------------------
    // 3️⃣ Check role: owner only
    // ------------------------------
    if (user.app_metadata?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------
    // 4️⃣ Parse & validate body
    // ------------------------------
    const body: BusinessBody = await request.json();

    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: name and category" },
        { status: 400 }
      );
    }

    // ------------------------------
    // 5️⃣ Admin client (service role) to bypass RLS
    // ------------------------------
    const supabaseAdmin = await createSupabaseServer(true);

    // ------------------------------
    // 6️⃣ Insert new business
    // ------------------------------
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert([
        {
          name: body.name,
          category: body.category,
          phone: body.phone || null,
          address: body.address || null,
          owner_id: user.id, // ✅ essential for RLS
        },
      ])
      .select()
      .single();

    if (businessError) throw businessError;

    // ------------------------------
    // 7️⃣ Optionally link owner ↔ business in user_business
    // ------------------------------
    const { error: linkError } = await supabaseAdmin
      .from("user_business")
      .insert([{ user_id: user.id, business_id: business.id }]);

    if (linkError) throw linkError;

    // ------------------------------
    // 8️⃣ Return success
    // ------------------------------
    return NextResponse.json({
      business_id: business.id,
      message: "Business created successfully",
    });
  } catch (err: any) {
    console.error("Create business error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
