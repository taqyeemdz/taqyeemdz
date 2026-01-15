"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import {
    LayoutDashboard,
    ChevronRight,
    ChevronLeft,
    Star,
    Download,
    User,
    Ghost,
    Calendar,
    MessageCircle,
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
    MessageSquare,
    Mic,
    Image as ImageIcon,
    AudioLines,
    Play,
    Files
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const isAudio = (url: string | null) => {
    if (!url) return false;
    return /\.(mp3|wav|ogg|m4a|webm|aac)($|\?)/i.test(url);
};

const isVideo = (url: string | null) => {
    if (!url) return false;
    return /\.(mp4|mov|avi|wmv|flv|mkv)($|\?)/i.test(url);
};

export default function OwnerBusinessDetailsPage() {
    const supabase = supabaseBrowser;
    const router = useRouter();
    const params = useParams();
    const businessId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

    const [loading, setLoading] = useState(true);
    const [business, setBusiness] = useState<any>(null);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [ownerName, setOwnerName] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "feedbacks" | "config" | "preview">("overview");
    const [currentPage, setCurrentPage] = useState(1);
    const [formConfig, setFormConfig] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
    const [planPermissions, setPlanPermissions] = useState({ allow_photo: false, allow_video: false, allow_audio: false });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) return router.replace("/auth/login");

            // Fetch profile to get full_name
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            if (profile?.full_name) {
                setOwnerName(profile.full_name);
            } else if (user.email) {
                // Fallback to parts of email if no name, or just identifier
                setOwnerName(user.email.split('@')[0]);
            }

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

            // Fetch user plan permissions
            const { data: profilePlan } = await supabase.from('profiles').select('plan_id').eq('id', user.id).single();
            if (profilePlan?.plan_id) {
                const { data: plan } = await supabase
                    .from("subscription_plans")
                    .select("allow_photo, allow_video, allow_audio")
                    .eq("id", profilePlan.plan_id)
                    .single();
                if (plan) setPlanPermissions(plan);
            }

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
            .update({
                form_config: formConfig,
                allow_photo: business.allow_photo,
                allow_video: business.allow_video,
                allow_audio: business.allow_audio
            })
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

    // Use encoded business name
    const feedbackLink = `${window.location.origin}/client/feedback/${encodeURIComponent(business.name)}`;

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
        { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
        { id: "feedbacks", label: "Feedbacks", icon: MessageCircle },
        { id: "config", label: "Configuration", icon: Settings2 },
        { id: "preview", label: "Aperçu Formulaire", icon: Eye },
    ];

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10">
            {/* Minimalist Header */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push("/owner/business")}
                        className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-medium uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Retour
                    </button>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-3">
                        {activeTab === 'config' && (
                            <button
                                onClick={handleSaveForm}
                                disabled={isSaving}
                                className="bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {isSaving ? "..." : "Enregistrer"}
                            </button>
                        )}
                        <button
                            onClick={() => setShowDelete(true)}
                            className="p-2 bg-rose-50 border border-slate-100 rounded-lg text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-8 shadow-xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold text-white tracking-tight">{business.name}</h1>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                Actif
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 text-sm font-medium">
                            <div className="flex items-center gap-1.5">
                                <MessageCircle size={14} className="text-slate-500" />
                                <span>{feedback.length} avis reçus</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-700" />
                            <div className="flex items-center gap-1.5 max-w-[400px]">
                                <span className="italic truncate text-slate-500" title={business.description}>"{business.description}"</span>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-700" />
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-500" />
                                <span>Lancé le {format(new Date(business.created_at), "d MMM yyyy", { locale: fr })}</span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Vertical Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-4 sticky top-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Menu</p>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? "text-white" : "text-slate-400"} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <ChevronLeft size={14} className="ml-auto rotate-180 opacity-50" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats Mini-Card */}
                    <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 hidden lg:block">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Star size={14} className="fill-indigo-600" />
                            </div>
                            <p className="text-xs font-bold text-indigo-900 uppercase">Astuce Pro</p>
                        </div>
                        <p className="text-xs text-indigo-700 leading-relaxed">
                            Répondez aux avis pour améliorer votre visibilité et fidéliser vos clients.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
                        {activeTab === "overview" ? (
                            <div className="space-y-6">
                                {/* Dashboard Header */}
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Vue d'ensemble</h2>
                                    <p className="text-sm text-slate-500">Performances et outils de partage.</p>
                                </div>

                                {/* Stats Row - Compact */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:border-slate-200 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                            <Star size={18} className="fill-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Note Moyenne</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-slate-900">
                                                    {feedback.length > 0
                                                        ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(1)
                                                        : "—"}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400">/ 5.0</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:border-slate-200 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                            <MessageCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avis Reçus</p>
                                            <span className="text-xl font-bold text-slate-900">
                                                {feedback.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:border-slate-200 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Satisfaction</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-slate-900">
                                                    {feedback.length > 0
                                                        ? Math.round((feedback.filter(f => f.rating >= 4).length / feedback.length) * 100)
                                                        : 0}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Link & QR Section - Minimalist Split */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Link & Actions */}
                                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-6">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-slate-900">Lien de collecte</h3>
                                            <p className="text-xs text-slate-500">Partagez ce lien pour obtenir plus d'avis.</p>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                                            <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-400">
                                                <ExternalLink size={14} />
                                            </div>
                                            <p className="flex-1 text-xs font-mono text-slate-600 truncate px-2 select-all">
                                                {feedbackLink}
                                            </p>
                                            <button
                                                onClick={handleCopyLink}
                                                className="p-2 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-lg transition-all text-slate-400"
                                                title="Copier"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => window.open(feedbackLink, "_blank")}
                                                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                            >
                                                Ouvrir le formulaire
                                            </button>
                                        </div>
                                    </div>

                                    {/* QR Code - Minimalist */}
                                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-6">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0">
                                            <QRCodeSVG id="qr-code-svg" value={feedbackLink} size={80} level="M" />
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">QR Code</h3>
                                                <p className="text-xs text-slate-500 text-balance">
                                                    Imprimez ce code sur vos tickets ou menus.
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDownloadQR}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Download size={12} />
                                                    PNG
                                                </button>
                                                <button
                                                    onClick={() => window.print()}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Printer size={12} />
                                                    Print
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === "feedbacks" ? (
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Tous les feedbacks</h3>
                                        <p className="text-sm text-slate-500 font-medium">Consultez et analysez les retours de vos clients.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 shadow-sm">
                                        Page {currentPage} sur {Math.max(1, Math.ceil(feedback.length / 5))}
                                    </div>
                                </div>

                                <div className="p-2">
                                    {feedback.length > 0 ? (
                                        <>
                                            <div className="divide-y divide-slate-50">
                                                {feedback.slice((currentPage - 1) * 5, currentPage * 5).map(fb => (
                                                    <FeedbackRow key={fb.id} feedback={fb} onClick={() => setSelectedFeedback(fb)} />
                                                ))}
                                            </div>

                                            {/* Pagination Controls */}
                                            {feedback.length > 5 && (
                                                <div className="flex items-center justify-between p-4 border-t border-slate-50 px-6">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-600"
                                                    >
                                                        <ChevronLeft size={16} />
                                                        Précédent
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(feedback.length / 5), p + 1))}
                                                        disabled={currentPage >= Math.ceil(feedback.length / 5)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-600"
                                                    >
                                                        Suivant
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-20 text-center space-y-6">
                                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                                                <MessageSquare size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 font-bold">Aucun avis pour le moment</h3>
                                                <p className="text-slate-400 font-medium mt-1">Partagez votre QR code pour récolter vos premiers avis !</p>
                                            </div>
                                        </div>
                                    )}
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
                                                        title="Supprimer la question"
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

                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-slate-900">Options médias</h3>
                                        <p className="text-xs text-slate-500">Choisissez les types de fichiers que vos clients peuvent envoyer.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Photo Toggle */}
                                        <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${!planPermissions.allow_photo ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Photos</p>
                                                <p className="text-[10px] text-slate-500">Autoriser l'envoi d'images.</p>
                                            </div>
                                            <button
                                                disabled={!planPermissions.allow_photo}
                                                onClick={() => setBusiness({ ...business, allow_photo: !business.allow_photo })}
                                                className={`w-10 h-5 rounded-full transition-all flex items-center p-1 ${business.allow_photo && planPermissions.allow_photo ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                                            >
                                                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                            </button>
                                        </div>

                                        {/* Video Toggle */}
                                        <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${!planPermissions.allow_video ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Vidéos</p>
                                                <p className="text-[10px] text-slate-500">Autoriser l'envoi de vidéos.</p>
                                            </div>
                                            <button
                                                disabled={!planPermissions.allow_video}
                                                onClick={() => setBusiness({ ...business, allow_video: !business.allow_video })}
                                                className={`w-10 h-5 rounded-full transition-all flex items-center p-1 ${business.allow_video && planPermissions.allow_video ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                                            >
                                                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                            </button>
                                        </div>

                                        {/* Audio Toggle */}
                                        <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${!planPermissions.allow_audio ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Messages Vocaux</p>
                                                <p className="text-[10px] text-slate-500">Activer l'enregistrement audio.</p>
                                            </div>
                                            <button
                                                disabled={!planPermissions.allow_audio}
                                                onClick={() => setBusiness({ ...business, allow_audio: !business.allow_audio })}
                                                className={`w-10 h-5 rounded-full transition-all flex items-center p-1 ${business.allow_audio && planPermissions.allow_audio ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                                            >
                                                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                            </button>
                                        </div>
                                    </div>
                                    {!planPermissions.allow_photo && !planPermissions.allow_video && !planPermissions.allow_audio && (
                                        <p className="text-[10px] text-amber-600 font-medium bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
                                            Votre plan actuel ne supporte pas les fichiers médias. Passez au plan supérieur pour les activer.
                                        </p>
                                    )}
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
                                        <div className="space-y-4">
                                            {/* Media / Audio Preview */}
                                            {(planPermissions.allow_photo && business.allow_photo) ||
                                                (planPermissions.allow_video && business.allow_video) ||
                                                (planPermissions.allow_audio && business.allow_audio) ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(planPermissions.allow_photo && business.allow_photo) || (planPermissions.allow_video && business.allow_video) ? (
                                                        <div className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 opacity-40">
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                <ImageIcon size={14} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                {business.allow_photo && business.allow_video ? "Photo/Vidéo" : business.allow_photo ? "Photo" : "Vidéo"}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                    {planPermissions.allow_audio && business.allow_audio && (
                                                        <div className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 opacity-40">
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                <Mic size={14} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vocal</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                        </div>
                                        <button className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed">
                                            Envoyer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showDelete && (
                <DeleteBusinessModal
                    businessId={businessId as string}
                    businessName={business.name}
                    onClose={() => setShowDelete(false)}
                />
            )}

            {selectedFeedback && (
                <FeedbackDetailsModal
                    feedback={selectedFeedback}
                    formConfig={formConfig}
                    onClose={() => setSelectedFeedback(null)}
                />
            )}
        </div>
    );
}

function FeedbackRow({ feedback, onClick }: { feedback: any, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-3 p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all cursor-pointer bg-white"
        >
            {/* Rating Badge */}
            <div className="shrink-0">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-bold border border-amber-100/50 min-w-[42px] justify-center">
                    <Star size={10} className="fill-amber-500 text-amber-500" />
                    {feedback.rating}
                </div>
            </div>

            {/* Name */}
            <div className="w-24 sm:w-32 shrink-0">
                <p className="text-xs font-bold text-slate-700 truncate">
                    {feedback.anonymous ? "Anonyme" : feedback.full_name || "Client"}
                </p>
            </div>

            {/* Message Preview */}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 truncate group-hover:text-slate-700 transition-colors font-medium">
                    {feedback.message ? (
                        <span className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-300 block shrink-0" />
                            {feedback.message}
                        </span>
                    ) : (
                        <span className="text-slate-300 italic text-[10px]">Aucun message écrit</span>
                    )}
                </p>
            </div>

            {/* Date */}
            <div className="shrink-0 text-[10px] text-slate-400 font-medium whitespace-nowrap hidden sm:block">
                {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: fr })}
            </div>

            <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </div>
    );
}

function FeedbackDetailsModal({ feedback, formConfig, onClose }: { feedback: any, formConfig: any[], onClose: () => void }) {
    const isAnonymous = feedback.anonymous;
    const customResponses = feedback.custom_responses || {};

    // Helper to find label
    const getLabel = (key: string) => {
        if (key === 'age_range') return "Tranche d'âge";
        const field = formConfig?.find(f => f.id === key);
        return field ? field.label : "Question personnalisée";
    };

    // Filter relevant responses to show
    const responseKeys = Object.keys(customResponses).filter(k =>
        customResponses[k] !== null &&
        customResponses[k] !== "" &&
        customResponses[k] !== undefined &&
        k !== "_media_urls"
    );

    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-0 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between shrink-0">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            {isAnonymous ? "Anonyme" : feedback.full_name || "Client"}
                            {isAnonymous && <Ghost size={14} className="text-slate-400" />}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium space-y-1">
                            <p className="uppercase tracking-wide">{format(new Date(feedback.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                            {!isAnonymous && feedback.phone && <p className="flex items-center gap-1"><span className="text-slate-400">Tel:</span> {feedback.phone}</p>}
                            {!isAnonymous && feedback.email && <p className="flex items-center gap-1"><span className="text-slate-400">Email:</span> {feedback.email}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-amber-100 shadow-sm">
                            <Star size={14} className="fill-amber-500 text-amber-500" />
                            {feedback.rating}/5
                        </div>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-6 overflow-y-auto">
                    {/* Standard Message */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Message du client</p>
                        {feedback.message ? (
                            <div className="text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed text-sm relative">
                                <span className="absolute top-4 left-4 text-4xl leading-none text-slate-200 font-serif opacity-30">"</span>
                                <p className="relative z-10">{feedback.message}</p>
                            </div>
                        ) : (
                            <div className="text-slate-400 bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm italic text-center">
                                Aucun message laissé par le client.
                            </div>
                        )}
                    </div>

                    {/* Custom Responses */}
                    {responseKeys.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Réponses au formulaire</p>
                            <div className="grid gap-3">
                                {responseKeys.map(key => {
                                    const label = getLabel(key);
                                    const value = customResponses[key];
                                    let displayValue = value;

                                    if (typeof value === 'boolean') {
                                        displayValue = value ? "Oui" : "Non";
                                    }

                                    return (
                                        <div key={key} className="bg-white border border-slate-100 p-4 rounded-xl flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-600">{label}</span>
                                            <span className="text-sm font-bold text-slate-900">{displayValue}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Media Gallery */}
                    {(() => {
                        const params = feedback.custom_responses || {};
                        const medias = params._media_urls && Array.isArray(params._media_urls) && params._media_urls.length > 0
                            ? params._media_urls
                            : feedback.media_urls && feedback.media_urls.length > 0
                                ? feedback.media_urls
                                : feedback.media_url ? [feedback.media_url] : [];

                        if (medias.length > 0) {
                            return (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Média Joint ({medias.length})</p>
                                    <div className="flex flex-wrap gap-4">
                                        {medias.map((url: string, idx: number) => (
                                            <div key={idx} className="flex flex-col items-start gap-4">
                                                {isAudio(url) ? (
                                                    <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                                            <AudioLines size={18} />
                                                        </div>
                                                        <audio controls src={url} className="w-32 h-8" />
                                                    </div>
                                                ) : isVideo(url) ? (
                                                    <video controls src={url} className="w-48 rounded-xl bg-black aspect-video object-contain" />
                                                ) : (
                                                    <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm group relative w-20 h-20 shrink-0 cursor-pointer" onClick={() => { setSelectedMedia(url); setIsZoomed(true); }}>
                                                        <img src={url} alt="Media" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white">
                                                                <ImageIcon size={16} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                </div>

                {/* Internal Lightbox */}
                {isZoomed && selectedMedia && !isVideo(selectedMedia) && !isAudio(selectedMedia) && (
                    <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-8 backdrop-blur-md" onClick={() => setIsZoomed(false)}>
                        <div className="relative max-w-[80vw] max-h-[80vh]">
                            <img src={selectedMedia} alt="Zoom" className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" />
                        </div>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
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
