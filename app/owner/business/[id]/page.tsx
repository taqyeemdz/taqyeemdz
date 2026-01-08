"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import {
    Building2,
    MapPin,
    ChevronLeft,
    Star,
    Share2,
    Download,
    User,
    Ghost,
    Calendar,
    MessageSquare,
    QrCode as QrIcon,
    ExternalLink,
    Copy,
    Printer,
    Trash2,
    AlertTriangle,
    Loader2,
    Settings2,
    Eye,
    CheckCircle2,
    Plus,
    MessageCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function OwnerBusinessDetailsPage() {
    const supabase = supabaseBrowser;
    const router = useRouter();
    const params = useParams();
    const businessId = params.id;

    const [loading, setLoading] = useState(true);
    const [business, setBusiness] = useState<any>(null);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "config" | "preview">("overview");
    const [formConfig, setFormConfig] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) return router.replace("/auth/login");

            const { data: b, error: busError } = await supabase
                .from("businesses")
                .select("*")
                .eq("id", businessId)
                .single();

            if (busError || !b) {
                setBusiness(null);
                setLoading(false);
                return;
            }

            setBusiness(b);
            if (b.form_config) setFormConfig(b.form_config);

            const { data: fb } = await supabase
                .from("feedback")
                .select("*")
                .eq("business_id", businessId)
                .order("created_at", { ascending: false });

            setFeedback(fb || []);
            setLoading(false);
        };

        fetchData();
    }, [businessId, router, supabase]);

    const handleSaveForm = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from("businesses")
            .update({ form_config: formConfig })
            .eq("id", businessId);

        if (error) {
            toast.error("Échec de l'enregistrement");
        } else {
            toast.success("Configuration enregistrée");
        }
        setIsSaving(false);
    };

    const addField = () => {
        setFormConfig([...formConfig, { id: crypto.randomUUID(), label: "", type: "text", required: false }]);
    };

    const updateField = (id: string, key: string, value: any) => {
        setFormConfig(formConfig.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const removeField = (id: string) => {
        setFormConfig(formConfig.filter(f => f.id !== id));
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-slate-200" size={32} />
            </div>
        );
    }

    if (!business) return null;

    const feedbackLink = `${window.location.origin}/client/feedback/${businessId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(feedbackLink);
        toast.success("Lien copié !");
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${business.name}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const tabs = [
        { id: "overview", label: "Feedback", icon: MessageCircle },
        { id: "config", label: "Configuration", icon: Settings2 },
        { id: "preview", label: "Aperçu Formulaire", icon: Eye },
    ];

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10">
            {/* Minimalist Header */}
            <div className="space-y-6">
                <button
                    onClick={() => router.push("/owner/business")}
                    className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-medium uppercase tracking-widest"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour
                </button>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{business.name}</h1>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50">
                                Actif
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 text-sm font-medium">
                            <div className="flex items-center gap-1.5">
                                <MessageCircle size={14} className="text-slate-300" />
                                <span>{feedback.length} avis reçus</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-1.5 max-w-[400px]">
                                <span className="italic truncate" title={business.description}>"{business.description}"</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-300" />
                                <span>Lancé le {format(new Date(business.created_at), "d MMM yyyy", { locale: fr })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === 'config' && (
                            <button
                                onClick={handleSaveForm}
                                disabled={isSaving}
                                className="bg-black text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? "Sauvegarde..." : "Enregistrer"}
                            </button>
                        )}
                        <button
                            onClick={() => setShowDelete(true)}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in slide-in-from-bottom-1" />
                        )}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === "overview" ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        <div className="md:col-span-8 space-y-10">
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 mb-6">Derniers feedbacks</h3>
                                {feedback.length > 0 ? (
                                    <div className="space-y-1">
                                        {feedback.slice(0, 5).map(fb => (
                                            <FeedbackRow key={fb.id} feedback={fb} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Aucun avis reçu pour le moment.</p>
                                )}
                            </section>
                        </div>

                        <div className="md:col-span-4 space-y-6">
                            <div className="p-8 bg-slate-900 rounded-2xl text-white space-y-8 flex flex-col items-center">
                                <div className="space-y-2 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Code QR Partageable</p>
                                </div>

                                <div className="bg-white p-3 rounded-xl shadow-2xl">
                                    <QRCodeSVG id="qr-code-svg" value={feedbackLink} size={140} />
                                </div>

                                <div className="w-full pt-6 border-t border-white/10 grid grid-cols-2 gap-3">
                                    <ShareAction icon={Copy} label="Lien" onClick={handleCopyLink} />
                                    <ShareAction icon={Download} label="Image" onClick={handleDownloadQR} />
                                    <ShareAction icon={ExternalLink} label="Ouvrir" onClick={() => window.open(feedbackLink, "_blank")} />
                                    <ShareAction icon={Printer} label="Print" onClick={() => window.print()} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === "config" ? (
                    <div className="max-w-3xl space-y-10">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-900">Champs du formulaire</h3>
                            <p className="text-xs text-slate-500">Personnalisez les questions que vous posez à vos clients.</p>
                        </div>

                        <div className="space-y-4">
                            {formConfig.map((field, index) => (
                                <div key={field.id} className="p-6 border border-slate-100 rounded-xl bg-white hover:border-slate-300 transition-all group relative">
                                    <div className="flex items-center gap-6">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(field.id, "label", e.target.value)}
                                                    className="w-full text-sm font-medium text-slate-900 border-none p-0 focus:ring-0 placeholder:text-slate-200"
                                                    placeholder="Votre question ici..."
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type de réponse</label>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(field.id, "type", e.target.value)}
                                                    className="w-full text-sm font-medium text-slate-900 border-none p-0 focus:ring-0 appearance-none bg-transparent cursor-pointer"
                                                >
                                                    <option value="text">Texte court</option>
                                                    <option value="textarea">Commentaire</option>
                                                    <option value="rating">Étoiles</option>
                                                    <option value="boolean">Oui/Non</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => updateField(field.id, "required", !field.required)}
                                                className={`p-2 rounded-lg transition-colors ${field.required ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-slate-400'}`}
                                                title="Obligatoire"
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => removeField(field.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addField}
                                className="w-full py-4 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-slate-200 hover:text-slate-600 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                            >
                                <Plus size={16} />
                                Ajouter une question
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto py-10">
                        <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-12">
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-semibold text-slate-900">{business.name}</h1>
                                <p className="text-sm text-slate-400">Mode Aperçu - Votre avis est précieux.</p>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={32} className="text-slate-100 fill-slate-100" />
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Évaluer</p>
                            </div>

                            <div className="space-y-8">
                                {formConfig.map((f: any) => (
                                    <div key={f.id} className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                                            {f.label} {f.required && <span className="text-rose-500">*</span>}
                                        </label>
                                        <div className="h-10 border-b border-slate-100" />
                                    </div>
                                ))}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest text-slate-400">Message (optionnel)</label>
                                    <div className="h-24 bg-slate-50/50 rounded-xl p-4 text-slate-200 text-xs italic">Écrivez votre commentaire...</div>
                                </div>
                                <button className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed">
                                    Envoyer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showDelete && (
                <DeleteBusinessModal
                    businessId={businessId as string}
                    businessName={business.name}
                    onClose={() => setShowDelete(false)}
                />
            )}
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-colors">
                <Icon size={16} />
            </div>
            <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-medium text-slate-900 truncate">{value || "—"}</p>
            </div>
        </div>
    );
}

function FeedbackRow({ feedback }: { feedback: any }) {
    const isAnonymous = feedback.anonymous;
    return (
        <div className="p-4 hover:bg-slate-50 transition-colors rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                    {isAnonymous ? <Ghost size={14} /> : <User size={14} />}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{isAnonymous ? "Anonyme" : feedback.full_name || "Client"}</span>
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} className={i < feedback.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"} />
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                        "{feedback.message || "Aucun message"}"
                    </p>
                </div>
            </div>
            <span className="text-[10px] text-slate-300 group-hover:text-slate-400 transition-colors">
                {format(new Date(feedback.created_at), "dd/MM")}
            </span>
        </div>
    );
}

function ShareAction({ icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
        >
            <Icon size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}

function DeleteBusinessModal({ businessId, businessName, onClose }: { businessId: string, businessName: string, onClose: () => void }) {
    const supabase = supabaseBrowser;
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const { error } = await supabase.from("businesses").delete().eq("id", businessId);
        if (error) {
            toast.error("Échec de la suppression");
            setIsDeleting(false);
        } else {
            toast.success("Produit supprimé");
            router.replace("/owner/business");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Confirmer la suppression</h3>
                        <p className="text-sm text-slate-500">
                            Voulez-vous vraiment supprimer <span className="font-semibold text-slate-900">"{businessName}"</span> ?
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {isDeleting ? "Suppression..." : "Oui, supprimer"}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-50 text-slate-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}
