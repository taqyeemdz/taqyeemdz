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

        // 2. Récupérer la demande de renouvellement
        const { data: request, error: reqError } = await supabaseAdmin
            .from('renewal_requests')
            .select('*, profiles(*)')
            .eq('id', requestId)
            .single();

        if (reqError || !request) {
            return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
        }

        if (request.status === 'approved') {
            return NextResponse.json({ error: "Demande déjà approuvée" }, { status: 400 });
        }

        const userId = request.user_id;

        // 3. Récupérer le plan pour connaître la période de facturation
        const { data: plan, error: planError } = await supabaseAdmin
            .from('subscription_plans')
            .select('billing_period')
            .eq('id', request.plan_id)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
        }

        // 4. Calculer la nouvelle date de fin
        // Si l'abonnement actuel est déjà expiré, on repart d'aujourd'hui
        // Sinon, on rajoute à la date de fin actuelle (ce cas est moins probable si le compte est bloqué)
        const now = new Date();
        const currentEnd = request.profiles?.subscription_end ? new Date(request.profiles.subscription_end) : null;

        let startDate = now;
        if (currentEnd && currentEnd > now) {
            startDate = currentEnd;
        }

        const newEnd = new Date(startDate);
        if (plan.billing_period === 'yearly') {
            newEnd.setFullYear(startDate.getFullYear() + 1);
        } else {
            newEnd.setMonth(startDate.getMonth() + 1);
        }

        // 5. Mettre à jour le profil
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
                is_active: true, // S'assurer qu'il est réactivé
                subscription_start: now.toISOString(), // On marque le renouvellement à partir de maintenant
                subscription_end: newEnd.toISOString()
            })
            .eq('id', userId);

        if (profileUpdateError) throw profileUpdateError;

        // 6. Mettre à jour le statut de la demande
        const { error: updateError } = await supabaseAdmin
            .from('renewal_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        return NextResponse.json({
            message: "Abonnement renouvelé avec succès",
            success: true,
            subscription_end: newEnd.toISOString()
        });

    } catch (err: any) {
        console.error("Erreur de renouvellement:", err);
        return NextResponse.json({ error: err.message || "Erreur interne du serveur" }, { status: 500 });
    }
}
