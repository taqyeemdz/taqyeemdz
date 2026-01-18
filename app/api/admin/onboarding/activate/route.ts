import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { requestId } = await req.json();

        if (!requestId) {
            return NextResponse.json({ error: "L'ID de la demande est requis" }, { status: 400 });
        }

        const supabase = await createSupabaseServer();

        // 1. Vérifier si l'utilisateur est un admin
        const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !adminUser || (adminUser.app_metadata.role !== 'admin' && adminUser.app_metadata.role !== 'superadmin')) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const supabaseAdmin = await createSupabaseServer(true);

        // 2. Récupérer la demande d'onboarding
        const { data: request, error: reqError } = await supabaseAdmin
            .from('onboarding_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (reqError || !request) {
            return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
        }

        if (request.status === 'active') {
            return NextResponse.json({ error: "Compte déjà activé" }, { status: 400 });
        }

        const userId = request.user_id;
        if (!userId) {
            return NextResponse.json({ error: "Cet utilisateur n'a pas de compte Auth associé. Impossible d'activer." }, { status: 400 });
        }

        // 3. Récupérer le plan pour connaître la période de facturation
        const { data: plan, error: planError } = await supabaseAdmin
            .from('subscription_plans')
            .select('billing_period')
            .eq('id', request.plan_id)
            .single();

        if (planError) {
            console.error("Erreur lors de la récupération du plan:", planError);
        }

        // 4. Calculer la date de fin selon la période (mensuel = 1 mois, annuel = 1 an)
        const now = new Date();
        const subscriptionEnd = new Date(now);

        if (plan?.billing_period === 'yearly') {
            subscriptionEnd.setFullYear(now.getFullYear() + 1); // +1 an
        } else {
            subscriptionEnd.setMonth(now.getMonth() + 1); // +1 mois (par défaut)
        }

        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: request.owner_name,
                plan_id: request.plan_id,
                is_active: true,
                role: 'owner',
                phone: request.phone, // Sync phone from request
                subscription_start: now.toISOString(),
                subscription_end: subscriptionEnd.toISOString()
            })
            .eq('id', userId);

        if (profileUpdateError) throw profileUpdateError;

        // 4. S'assurer que les métadonnées Auth sont correctes pour le rôle
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { role: 'owner' }
        });

        // 5. Créer le commerce (business)
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .insert({
                name: request.business_name,
                category: request.activity_type,
                owner_id: userId,
                description: `Wilaya: ${request.wilaya}`,
                address: request.wilaya,
                plan_id: request.plan_id
            })
            .select()
            .single();

        if (businessError) {
            console.error("Erreur lors de la création du business:", businessError);
        } else {
            // 6. Lier l'utilisateur au business
            await supabaseAdmin
                .from('user_business')
                .insert({
                    user_id: userId,
                    business_id: business.id
                });
        }

        // 7. Mettre à jour le statut de la demande en 'active'
        const { error: updateError } = await supabaseAdmin
            .from('onboarding_requests')
            .update({ status: 'active' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        return NextResponse.json({
            message: "Compte activé avec succès",
            success: true,
            subscription_start: now.toISOString(),
            subscription_end: subscriptionEnd.toISOString()
        });

    } catch (err: any) {
        console.error("Erreur d'activation:", err);
        return NextResponse.json({ error: err.message || "Erreur interne du serveur" }, { status: 500 });
    }
}
