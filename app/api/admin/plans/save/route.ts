import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
    try {
        // 🔐 Auth check (admin)
        // 🔐 Auth check (admin)
        const supabaseUser = await createSupabaseServer()
        const {
            data: { user },
            error: authError,
        } = await supabaseUser.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            )
        }

        // Check role in profiles table
        const { data: profile, error: profileError } = await supabaseUser
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profileError || !profile || !["admin", "superadmin"].includes(profile.role)) {
            return NextResponse.json(
                { error: "Forbidden (admin only)" },
                { status: 403 }
            )
        }

        /* -------------------------------------------------
           2️⃣ PARSE BODY
        ------------------------------------------------- */
        const body = await req.json()
        const plans = Array.isArray(body?.plans) ? body.plans : []
        const deletedPlanIds = Array.isArray(body?.deletedPlanIds)
            ? body.deletedPlanIds
            : []

        if (plans.length === 0 && deletedPlanIds.length === 0) {
            return NextResponse.json(
                { error: "Nothing to save" },
                { status: 400 }
            )
        }

        /* -------------------------------------------------
           3️⃣ CLEAN & NORMALIZE PLANS
        ------------------------------------------------- */
        const cleanedPlans = plans.map((p: any) => ({
            // Only include ID if it's a valid existing one (not "new-...")
            ...(p.id && typeof p.id === 'string' && !p.id.startsWith("new-") ? { id: p.id } : {}),
            name: String(p.name || "").trim(),
            price: Number(p.price) || 0,
            currency: String(p.currency || "DZD").trim(),
            features: Array.isArray(p.features)
                ? p.features.map((f: any) => String(f || "").trim()).filter((f: string) => f !== "")
                : [],
            max_businesses: Math.max(1, Number(p.max_businesses) || 1),
            max_branches: Math.max(1, Number(p.max_branches) || 1),
            max_qr_codes: Math.max(1, Number(p.max_qr_codes) || 1),
            max_feedback_monthly: Math.max(0, Number(p.max_feedback_monthly) || 0),
            allow_media: !!p.allow_media,
            allow_stats: !!p.allow_stats,
            allow_tamboola: !!p.allow_tamboola,
            is_active: p.is_active !== false,
        }))

        /* -------------------------------------------------
           4️⃣ VALIDATIONS
        ------------------------------------------------- */
        if (cleanedPlans.some((p: any) => !p.name)) {
            return NextResponse.json(
                { error: "All plans must have a non-empty name" },
                { status: 400 }
            )
        }

        const names = cleanedPlans.map((p: any) => p.name.toLowerCase())
        if (new Set(names).size !== names.length) {
            return NextResponse.json(
                { error: "Plan names must be unique (case-insensitive)" },
                { status: 400 }
            )
        }

        /* -------------------------------------------------
           5️⃣ ADMIN CLIENT (SERVICE ROLE)
        ------------------------------------------------- */
        const supabaseAdmin = await createSupabaseServer(true)

        /* -------------------------------------------------
           6️⃣ DELETE REMOVED PLANS
        ------------------------------------------------- */
        const actualDeleteIds = deletedPlanIds.filter((id: string) => id && typeof id === 'string' && !id.startsWith('new-'))

        if (actualDeleteIds.length > 0) {
            const { error: deleteError } = await supabaseAdmin
                .from("subscription_plans")
                .delete()
                .in("id", actualDeleteIds)

            if (deleteError) throw deleteError
        }

        /* -------------------------------------------------
           7️⃣ UPSERT PLANS
        ------------------------------------------------- */
        if (cleanedPlans.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from("subscription_plans")
                .upsert(cleanedPlans, { onConflict: "id" })

            if (upsertError) throw upsertError
        }

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error("ADMIN PLANS SAVE ERROR:", err)

        let errorMessage = err?.message || "Unexpected server error while saving plans";
        if (err?.details) errorMessage += ` (${err.details})`;
        if (err?.hint) errorMessage += ` - Hint: ${err.hint}`;

        return NextResponse.json(
            { error: errorMessage, details: err?.details, hint: err?.hint },
            { status: 500 }
        )
    }
}
