"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowLeft, Building2, User, Phone, MapPin, Briefcase, Mail, CreditCard, Lock } from "lucide-react";
import { registerOwnerAction } from "@/app/actions/owner-onboarding";
import Link from "next/link";

const WILAYAS = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
    "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
    "Skikda", "Sidi Bel Abbès", "Anaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
    "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
    "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "El M'Ghair", "El Meniaa",
    "Ouled Djellal", "Bordj Baji Mokhtar", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El Meghaier"
];

const ACTIVITY_TYPES = [
    "Restaurant / Fast Food",
    "Café / Salon de thé",
    "Hôtel / Hébergement",
    "Commerce de détail",
    "Services de santé",
    "Beauté / Bien-être",
    "Éducation / Formation",
    "Autre"
];

export default function RequestAccountPage() {
    const supabase = supabaseBrowser;
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);

    const [form, setForm] = useState({
        business_name: "",
        owner_name: "",
        phone: "",
        wilaya: "",
        activity_type: "",
        email: "",
        password: "",
        confirmPassword: "",
        plan_id: ""
    });

    useEffect(() => {
        async function fetchPlans() {
            const { data } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
            if (data) setPlans(data);
        }
        fetchPlans();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);

        try {
            const result = await registerOwnerAction({
                email: form.email,
                password: form.password,
                owner_name: form.owner_name,
                business_name: form.business_name,
                phone: form.phone,
                wilaya: form.wilaya,
                activity_type: form.activity_type,
                plan_id: form.plan_id || null
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setSuccess(true);
        } catch (err: any) {
            alert("Une erreur est survenue : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6 border border-gray-100 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={42} className="text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Compte créé !</h1>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Votre compte Taqyeem a été créé avec succès.
                        <br /><br />
                        <span className="text-indigo-600 font-bold">Vous pouvez maintenant vous connecter</span> avec votre email et mot de passe.
                        <br /><br />
                        Un conseiller vous appellera au <span className="text-indigo-600 font-bold">{form.phone}</span> pour finaliser l'activation après paiement.
                    </p>
                    <Link
                        href="/auth/login"
                        className="block w-full bg-indigo-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        SE CONNECTER MAINTENANT
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors mb-4">
                        <ArrowLeft size={16} /> Retour
                    </Link>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Rejoignez <span className="text-indigo-600">Feedback by Jobber</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-lg">
                        Demandez l'ouverture de votre compte professionnel et commencez à écouter vos clients.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="p-8 sm:p-12 space-y-8">

                        {/* Owner & Business Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <User size={14} /> Nom du propriétaire
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Mohamed Amine"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                    value={form.owner_name}
                                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <Building2 size={14} /> Nom du commerce
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Pizzeria Bella"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                    value={form.business_name}
                                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <Phone size={14} /> Téléphone
                                </label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="05 / 06 / 07 ..."
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <Mail size={14} /> Email
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="votre@email.com"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <Lock size={14} /> Mot de passe
                                </label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Choisissez votre mot de passe"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <Lock size={14} /> Confirmer mot de passe
                                </label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Confirmez votre mot de passe"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium ml-1">
                            Minimum 6 caractères. Ce sera votre mot de passe de connexion.
                        </p>

                        {/* Location & Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <MapPin size={14} /> Wilaya
                                </label>
                                <select
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                                    value={form.wilaya}
                                    onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                                >
                                    <option value="">Sélectionner votre Wilaya</option>
                                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                    <Briefcase size={14} /> Type d'activité
                                </label>
                                <select
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                                    value={form.activity_type}
                                    onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                                >
                                    <option value="">Sélectionner l'activité</option>
                                    {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Plan Choice */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                                <CreditCard size={14} /> Offre souhaitée
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {plans.sort((a, b) => a.price - b.price).map((p) => (
                                    <label
                                        key={p.id}
                                        className={`
                                            relative flex flex-col p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all h-full
                                            ${form.plan_id === p.id
                                                ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                                                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="plan"
                                            className="absolute opacity-0"
                                            value={p.id}
                                            checked={form.plan_id === p.id}
                                            onChange={() => setForm({ ...form, plan_id: p.id })}
                                        />

                                        {p.name === "Pro" && (
                                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-full uppercase tracking-widest shadow-md">
                                                Populaire
                                            </span>
                                        )}

                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${form.plan_id === p.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {p.name}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-slate-900 leading-tight">
                                                {p.price === 0 ? "Gratuit" : `${new Intl.NumberFormat('fr-DZ').format(p.price)}`}
                                            </span>
                                            {p.price > 0 && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {p.currency} / mois
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${form.plan_id === p.id ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                                {p.max_qr_codes} QR Code{p.max_qr_codes > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-6 rounded-2xl font-black text-base shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                "ENVOYER MA DEMANDE D'OUVERTURE"
                            )}
                        </button>
                        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                            En soumettant ce formulaire, vous acceptez d'être contacté par notre équipe <br /> pour finaliser l'ouverture de votre compte.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
