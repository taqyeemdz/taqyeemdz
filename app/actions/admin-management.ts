"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkIsSuperAdmin() {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // Check if user is superadmin or admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    return profile?.role === 'superadmin' || profile?.role === 'admin';
}

export async function fetchAdmins() {
    if (!await checkIsSuperAdmin()) {
        throw new Error("Non autorisé");
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("role", ["admin", "superadmin"])
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function addAdminAction(email: string, fullName: string, password?: string) {
    if (!await checkIsSuperAdmin()) {
        throw new Error("Non autorisé");
    }

    // Use provided password or generate a temporary one
    const finalPassword = password || Math.random().toString(36).slice(-10);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        },
        app_metadata: {
            role: 'admin'
        }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: 'admin',
            is_active: true
        });

    if (profileError) {
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw profileError;
    }

    return {
        success: true,
        message: "Admin ajouté avec succès.",
        tempPassword: password ? null : finalPassword
    };
}

export async function deleteAdminAction(adminId: string) {
    if (!await checkIsSuperAdmin()) {
        throw new Error("Non autorisé");
    }

    // Don't allow deleting self?
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === adminId) {
        throw new Error("Vous ne pouvez pas supprimer votre propre compte admin.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(adminId);
    if (error) throw error;

    // Profile deletion should happen via cascade or manually if not set
    await supabaseAdmin.from("profiles").delete().eq("id", adminId);

    return { success: true };
}
