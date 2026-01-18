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

    // Check if email already exists as an owner
    const { data: existingOwner } = await supabaseAdmin
        .from("profiles")
        .select("id, role, email")
        .eq("email", email.toLowerCase())
        .single();

    if (existingOwner) {
        if (existingOwner.role === 'owner') {
            throw new Error("Cet email existe déjà en tant que propriétaire");
        }
        if (existingOwner.role === 'admin' || existingOwner.role === 'superadmin') {
            throw new Error("Cet email existe déjà en tant qu'administrateur");
        }
        throw new Error("Cet email existe déjà dans le système");
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

    if (authError) {
        // Handle duplicate email error from auth
        if (authError.message?.includes('already been registered') ||
            authError.message?.includes('already exists')) {
            throw new Error("Cet email est déjà utilisé");
        }
        throw authError;
    }

    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
            id: authData.user.id,
            email: email.toLowerCase(),
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

    // Don't allow deleting self
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === adminId) {
        throw new Error("Vous ne pouvez pas supprimer votre propre compte admin.");
    }

    // Verify that the target user is actually an admin
    const { data: targetProfile, error: profileFetchError } = await supabaseAdmin
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", adminId)
        .single();

    if (profileFetchError || !targetProfile) {
        throw new Error("Utilisateur introuvable");
    }

    if (targetProfile.role !== 'admin' && targetProfile.role !== 'superadmin') {
        throw new Error("Cet utilisateur n'est pas un administrateur");
    }

    // Delete from auth first
    const { error } = await supabaseAdmin.auth.admin.deleteUser(adminId);
    if (error) {
        console.error("Error deleting auth user:", error);
        throw new Error("Erreur lors de la suppression du compte");
    }

    // Then delete profile (in case cascade is not set)
    const { error: profileDeleteError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", adminId);

    if (profileDeleteError) {
        console.error("Error deleting profile:", profileDeleteError);
        // Don't throw here since auth user is already deleted
    }

    return { success: true };
}
