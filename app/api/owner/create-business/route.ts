import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // 1) Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2) Parse body
    const body = await request.json();
    const { name, category, phone, address } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3) Insert business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert([{ name, category, phone, address }])
      .select()
      .single();

    if (businessError) throw businessError;

    // 4) Link business to owner
    const { error: linkError } = await supabase
      .from("user_business")
      .insert([{ user_id: userId, business_id: business.id }]);

    if (linkError) throw linkError;

    // 5) Respond
    return NextResponse.json({ business_id: business.id });

  } catch (err: any) {
    console.error("Create business error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
