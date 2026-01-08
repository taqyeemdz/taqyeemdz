"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function registerOwnerAction(formData: {
    email: string;
    password: string;
    owner_name: string;
    business_name: string;
    phone: string;
    wilaya: string;
    activity_type: string;
    plan_id: string | null;
}) {
    try {
        // 1. Create user in Auth (Auto-confirmed)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true, // Bypass email confirmation
            user_metadata: {
                full_name: formData.owner_name,
                business_name: formData.business_name
            },
            app_metadata: { role: "owner" },
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Sync profile data (using upsert to be safe)
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: userId,
                full_name: formData.owner_name,
                role: "owner",
                is_active: false,
                plan_id: formData.plan_id,
                phone: formData.phone
            });

        if (profileError) {
            console.error("Profile update error:", profileError);
            // Even if profile update fails, user is created
        }

        // 3. Store onboarding request
        const { error: requestError } = await supabaseAdmin.from("onboarding_requests").insert([
            {
                business_name: formData.business_name,
                owner_name: formData.owner_name,
                phone: formData.phone,
                wilaya: formData.wilaya,
                activity_type: formData.activity_type,
                email: formData.email,
                plan_id: formData.plan_id || null,
                status: 'pending',
                user_id: userId
            }
        ]);

        if (requestError) throw requestError;

        return { success: true, userId };
    } catch (error: any) {
        console.error("Registration error:", error);
        return { success: false, error: error.message };
    }
}
