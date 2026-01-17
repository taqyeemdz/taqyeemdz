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
    let userId: string | undefined;

    try {
        // 0. Proactive check for existing email in profiles to avoid trigger conflicts
        const { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", formData.email)
            .maybeSingle();

        if (existingProfile) {
            throw new Error("Cet email est déjà lié à un compte. Veuillez vous connecter ou utiliser un autre email.");
        }

        // Normalize planId to avoid UUID syntax errors
        const planId = formData.plan_id && formData.plan_id.trim() !== "" ? formData.plan_id : null;

        // 1. Create user in Auth (Auto-confirmed)
        try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true,
                user_metadata: {
                    full_name: formData.owner_name,
                    business_name: formData.business_name
                },
                app_metadata: { role: "owner" },
            });

            if (authError) {
                // Return the specific error if it's not the generic database one
                if (!authError.message.includes("Database error")) {
                    throw new Error(`Auth Error: ${authError.message}`);
                }

                // If it is the generic database error, it's almost certainly a trigger conflict
                throw new Error(`Erreur système (DB): ${authError.message}. Cela est souvent dû à un conflit de déclencheurs (triggers) dans Supabase. Veuillez vérifier si le trigger 'on_profile_role_update' a bien été supprimé.`);
            }
            if (!authData.user) throw new Error("Auth Error: No user data returned");

            userId = authData.user.id;
        } catch (e: any) {
            console.error("Step 1 (Auth) Failed:", e);
            // Re-throw with more detail if possible
            throw new Error(e.message || "Erreur de création d'utilisateur");
        }

        // 2. Sync profile data
        try {
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .upsert({
                    id: userId,
                    full_name: formData.owner_name,
                    role: "owner",
                    is_active: false,
                    plan_id: planId,
                    phone: formData.phone
                });

            if (profileError) {
                console.error("Profile update error (non-fatal):", profileError);
            }
        } catch (e: any) {
            console.error("Step 2 (Profile) Failed:", e);
            // Continue as profile might already exist via trigger
        }

        // 3. Store onboarding request
        try {
            const { error: requestError } = await supabaseAdmin.from("onboarding_requests").insert([
                {
                    business_name: formData.business_name,
                    owner_name: formData.owner_name,
                    phone: formData.phone,
                    wilaya: formData.wilaya,
                    activity_type: formData.activity_type,
                    email: formData.email,
                    plan_id: planId,
                    status: 'pending',
                    user_id: userId
                }
            ]);

            if (requestError) throw new Error(`Request Error: ${requestError.message}`);

            return { success: true, userId };
        } catch (e: any) {
            console.error("Step 3 (Request) Failed:", e);
            // If request fails, we might want to clean up the user? 
            // For now, just report error.
            throw new Error(e.message);
        }

    } catch (error: any) {
        console.error("Registration error:", error);

        // ROLLBACK: Delete the user if they were just created but the process failed later
        if (userId!) { // Using non-null assertion or checking if valid
            try {
                console.log(`Rolling back creation of user ${userId}...`);
                await supabaseAdmin.auth.admin.deleteUser(userId);
                console.log("Rollback successful.");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        return { success: false, error: error.message };
    }
}
