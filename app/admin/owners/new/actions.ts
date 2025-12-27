"use server";

import { createClient } from "@supabase/supabase-js";

export async function createOwner(formData: FormData) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const full_name = formData.get("full_name") as string;
    const plan_id = formData.get("plan_id") as string;

    console.log("🛠️ createOwner Action called");
    console.log("   Email:", email);
    console.log("   Full Name:", full_name);
    console.log("   Plan ID:", plan_id);

    // 1️⃣ Create user in Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
        app_metadata: { role: "owner" },
    });

    if (error) {
        console.error("❌ createUser fatal error:", JSON.stringify(error, null, 2));
        throw new Error(error.message);
    }

    const userId = data.user.id;

    // 2️⃣ Update role and plan_id (profile already exists via trigger)
    const { error: roleError } = await supabaseAdmin
        .from("profiles")
        .update({
            full_name: full_name,
            role: "owner",
            plan_id: plan_id
        })
        .eq("id", userId);

    if (roleError) {
        throw new Error(roleError.message);
    }
}