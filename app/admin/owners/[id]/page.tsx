"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
    User,
    Mail,
    Building2,
    Star,
    ChevronLeft,
    Phone,
    Loader2,
    CreditCard,
    Calendar
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function OwnerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = supabaseBrowser;

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "subscription">("overview");

    useEffect(() => {
        async function loadOwnerData() {
            if (!id) return;
            setLoading(true);

            // 1. Fetch Owner Profile
            const { data: ownerProfile, error: profileError } = await supabase
                .from("profiles")
                .select(`*, subscription_plans!left(name, billing_period)`)
                .eq("id", id)
                .single();

            if (profileError) {
                toast.error("Profil non trouvé");
                setLoading(false);
                return;
            }

            setProfile(ownerProfile);

            // 2. Fetch Businesses
            const { data: userBusinesses } = await supabase
                .from("user_business")
                .select(`business_id, businesses:businesses (*)`)
                .eq("user_id", id);

            const bList = userBusinesses?.map((ub: any) => ub.businesses) || [];
            setBusinesses(bList);

            // 3. Fetch Feedback
            if (bList.length > 0) {
                const businessIds = bList.map((b) => b.id);
                const { data: feedbackList } = await supabase
                    .from("feedback")
                    .select("*, businesses(name)")
                    .in("business_id", businessIds)
                    .order("created_at", { ascending: false });

                setFeedback(feedbackList || []);
            }

            // 4. Fetch Plans
            const { data: allPlans } = await supabase
                .from("subscription_plans")
                .select("*")
                .order("price", { ascending: true });

            setPlans(allPlans || []);
            setLoading(false);
        }

        loadOwnerData();
    }, [id, supabase]);

    const handleUpdatePlan = async (planId: string) => {
        if (!planId) return;
        setIsUpdatingPlan(true);

        const { error } = await supabase
            .from("profiles")
            .update({ plan_id: planId })
            .eq("id", id);

        if (error) {
            toast.error("Échec de la mise à jour");
        } else {
            toast.success("Plan mis à jour");
            const newPlan = plans.find(p => p.id === planId);
            setProfile((prev: any) => ({ ...prev, plan_id: planId, subscription_plans: newPlan }));
        }
        setIsUpdatingPlan(false);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-slate-200" size={32} />
            </div>
        );
    }

    if (!profile) return null;

    const tabs = [
        { id: "overview", label: "Aperçu", icon: User },
        { id: "subscription", label: "Abonnement", icon: CreditCard },
    ];

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10">

            <div className="space-y-6">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-medium uppercase tracking-widest"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour
                </button>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{profile.full_name}</h1>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${profile.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>
                                {profile.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">Inscrit le {format(new Date(profile.created_at), "PPP", { locale: fr })}</p>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-8 space-y-10">
                        <section>
                            <h3 className="text-sm font-semibold text-slate-900 mb-6">Informations du compte</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <DetailItem icon={Mail} label="Adresse email" value={profile.email} />
                                <DetailItem icon={Phone} label="Téléphone" value={profile.phone} />
                                <DetailItem
                                    icon={Calendar}
                                    label="Début activation"
                                    value={profile.subscription_start ? format(new Date(profile.subscription_start), "dd MMMM yyyy", { locale: fr }) : "Non défini"}
                                />
                                <DetailItem
                                    icon={Calendar}
                                    label="Fin activation"
                                    value={profile.subscription_end ? format(new Date(profile.subscription_end), "dd MMMM yyyy", { locale: fr }) : "Non défini"}
                                />
                            </div>
                        </section>

                        <section className="pt-10 border-t border-slate-50">
                            <h3 className="text-sm font-semibold text-slate-900 mb-6">Dernière activité</h3>
                            {feedback.length > 0 ? (
                                <div className="space-y-1">
                                    {feedback.slice(0, 3).map(fb => (
                                        <div key={fb.id} className="p-4 hover:bg-slate-50 transition-colors rounded-xl flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} className={i < fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-1 max-w-md">"{fb.message || "Sans commentaire"}"</p>
                                            </div>
                                            <span className="text-[10px] text-slate-300 group-hover:text-slate-400 transition-colors">
                                                {format(new Date(fb.created_at), "dd/MM")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Aucune activité enregistrée.</p>
                            )}
                        </section>
                    </div>

                    <div className="md:col-span-4 space-y-6">
                        <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Plan d'abonnement</p>
                                <h4 className="text-2xl font-semibold tracking-tight uppercase">{profile.subscription_plans?.name || "Standard"}</h4>
                                {profile.subscription_plans?.billing_period && (
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                        {profile.subscription_plans.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                                    </span>
                                )}
                            </div>
                            <div className="pt-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-400 uppercase tracking-wider font-medium">Nombre de QR Codes</span>
                                    <span className="font-semibold">{profile.subscription_plans?.max_qr_codes || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-colors">
                <Icon size={16} />
            </div>
            <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-medium text-slate-900">{value || "—"}</p>
            </div>
        </div>
    );
}

function StatSpec({ label, value }: any) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
    );
}
