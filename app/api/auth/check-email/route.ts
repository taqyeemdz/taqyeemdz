
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Initialize admin client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if user exists in profiles table
        const { data, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error("Check email error:", error);
            return NextResponse.json({ error: "Database check failed" }, { status: 500 });
        }

        return NextResponse.json({ exists: !!data });
    } catch (err) {
        console.error("API error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
