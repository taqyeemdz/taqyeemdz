import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        // 🔐 Auth check (admin)
        const supabaseUser = await createSupabaseServer();
        const {
            data: { user },
            error: authError
        } = await supabaseUser.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Check role in profiles table
        const { data: profile, error: profileError } = await supabaseUser
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile || !["admin", "superadmin"].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden (admin only)" }, { status: 403 });
        }

        const { plans, deletedPlanIds } = await req.json();

        // 🛡 Admin client (service role)
        const supabaseAdmin = await createSupabaseServer(true);

        /* ---------------- DELETE ---------------- */
        if (deletedPlanIds?.length > 0) {
            const { error } = await supabaseAdmin
                .from("subscription_plans")
                .delete()
                .in("id", deletedPlanIds);

            if (error) throw error;
        }

        /* ---------------- UPSERT ---------------- */
        const cleanPlans = plans.map((p: any) => ({
            ...(p.id && !p.id.startsWith("new-") ? { id: p.id } : {}),
            name: p.name.trim(),
            price: Number(p.price),
            currency: p.currency || "DZD",
            features: Array.isArray(p.features)
                ? p.features.filter((f: string) => f.trim() !== "")
                : [],
            max_branches: p.max_branches ?? 1,
            max_qr_codes: p.max_qr_codes ?? 3,
            max_feedback_monthly: p.max_feedback_monthly ?? 100,
            max_businesses: p.max_businesses ?? 1,
            is_active: p.is_active !== false,
        }));

        const { error: upsertError } = await supabaseAdmin
            .from("subscription_plans")
            .upsert(cleanPlans);

        if (upsertError) throw upsertError;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Save plans error:", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}
