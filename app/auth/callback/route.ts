import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // "next" is where we want to redirect after the exchange
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createSupabaseServer();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions if something goes wrong
    return NextResponse.redirect(`${origin}/auth/login?error=auth-callback-failed`);
}
