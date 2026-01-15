"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Star,
    User,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Ghost,
    Plus,
    MessageSquare,
    AudioLines,
    Image as ImageIcon,
    Trash2,
    Loader2,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const isMediaVideo = (url: string) => {
    if (!url) return false;
    return /\.(mp4|mov|avi|wmv|flv|mkv)($|\?)/i.test(url);
};

const isMediaAudio = (url: string) => {
    if (!url) return false;
    // webm can be audio or video, but in our recorder it's audio
    return /\.(mp3|wav|aac|m4a|opus|webm|ogg)($|\?)/i.test(url);
};

const translateSex = (sex: string) => {
    if (!sex) return sex;
    const s = sex.toLowerCase();
    if (s === 'male') return 'Homme';
    if (s === 'female') return 'Femme';
    return sex;
};

export default function FeedbackDetailPage() {
    const supabase = supabaseBrowser;
    const router = useRouter();
    const params = useParams();
    const feedbackId = params.id;

    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session?.user) return router.replace("/auth/login");

            const { data, error } = await supabase
                .from("feedback")
                .select("*, businesses(*)")
                .eq("id", feedbackId)
                .single();

            if (error || !data) {
                setFeedback(null);
            } else {
                setFeedback(data);
            }
            setLoading(false);
        };

        fetchFeedback();
    }, [feedbackId, router, supabase]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from("feedback")
                .delete()
                .eq("id", feedbackId);

            if (error) throw error;
            router.push("/owner/feedback");
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-slate-200" size={32} />
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="max-w-6xl mx-auto p-8 text-center space-y-4">
                <p className="text-slate-500">Avis non trouvé.</p>
                <button onClick={() => router.back()} className="text-slate-900 font-bold hover:underline">Retour</button>
            </div>
        );
    }

    const isAnonymous = feedback.anonymous;
    const dateStr = format(new Date(feedback.created_at), "eeee d MMMM yyyy 'à' HH:mm", { locale: fr });

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10">

            {/* Lightbox */}
            {isZoomed && selectedMedia && !isMediaVideo(selectedMedia) && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 backdrop-blur-md" onClick={() => setIsZoomed(false)}>
                    <div className="relative max-w-[80vw] max-h-[80vh]">
                        <img src={selectedMedia} alt="Zoom" className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-medium uppercase tracking-widest"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour
                </button>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-lg transition-all font-bold text-xs uppercase tracking-widest"
                >
                    <Trash2 size={14} />
                    Supprimer
                </button>
            </div>

            {/* Delete Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-8">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-slate-900">Supprimer cet avis ?</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Cette action est irréversible.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors text-sm">Annuler</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-100 transition-all flex items-center justify-center text-sm">
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Confirmer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 space-y-10">
                        {/* User Profile Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-10 border-b border-slate-50">
                            <div className="flex items-center gap-5">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner ${isAnonymous ? 'bg-slate-50' : 'bg-slate-900 text-white'}`}>
                                    {isAnonymous ? <Ghost size={32} /> : <User size={32} />}
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-xl font-semibold text-slate-900">{isAnonymous ? "Client anonyme" : feedback.full_name || "Client"}</h1>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{dateStr}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={20} className={`${star <= feedback.rating ? "fill-amber-400 text-amber-400" : "fill-slate-50 text-slate-100"}`} />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Note de {feedback.rating}.0</span>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquare size={12} />
                                Commentaire
                            </h3>
                            <div className="bg-slate-50/50 p-8 rounded-2xl text-slate-700 leading-relaxed text-lg italic border border-slate-100/50">
                                {feedback.message ? `"${feedback.message}"` : <span className="text-slate-400 font-normal">Aucun commentaire fourni.</span>}
                            </div>
                        </div>

                        {/* Custom Responses */}
                        {feedback.custom_responses && Object.keys(feedback.custom_responses).length > 0 && feedback.businesses?.form_config && (
                            <div className="space-y-6 pt-10 border-t border-slate-50">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Détails du questionnaire</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {feedback.businesses.form_config.map((field: any) => {
                                        const response = feedback.custom_responses[field.id];
                                        if (response === undefined || response === "" || response === null) return null;
                                        return (
                                            <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{field.label}</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {field.type === 'boolean' ? (response ? "Oui" : "Non") : field.type === 'rating' ? `${response} / 5 ★` : response}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Contact Info */}
                        {!isAnonymous && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-10 border-t border-slate-50">
                                {feedback.phone && <ContactItem icon={Phone} label="Téléphone" value={feedback.phone} />}
                                {feedback.email && <ContactItem icon={Mail} label="Email" value={feedback.email} />}
                                {feedback.sex && <ContactItem icon={User} label="Genre" value={translateSex(feedback.sex)} />}
                            </div>
                        )}
                    </div>

                    {/* Media */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 space-y-6">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ImageIcon size={12} />
                            Média joint
                        </h3>
                        {(() => {
                            const params = feedback.custom_responses || {};
                            const medias = params._media_urls && Array.isArray(params._media_urls) && params._media_urls.length > 0
                                ? params._media_urls
                                : feedback.media_urls && feedback.media_urls.length > 0 ? feedback.media_urls
                                    : feedback.media_url ? [feedback.media_url] : [];

                            if (medias.length === 0) {
                                return <p className="text-sm text-slate-400 italic">Aucun document multimédia joint.</p>;
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {medias.map((url: string, idx: number) => (
                                        <div key={idx} className="flex flex-col items-start gap-4">
                                            {isMediaAudio(url) && !isMediaVideo(url) ? (
                                                <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                                                            <AudioLines size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Message Vocal</p>
                                                            <p className="text-[10px] text-slate-400">Enregistré par le client</p>
                                                        </div>
                                                    </div>
                                                    <audio controls className="w-full h-10">
                                                        <source src={url} />
                                                        Votre navigateur ne supporte pas l'élément audio.
                                                    </audio>
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 w-full shadow-sm">
                                                    {isMediaVideo(url) ? (
                                                        <video controls className="w-full aspect-video object-contain bg-black" src={url} />
                                                    ) : (
                                                        <div className="group relative cursor-pointer" onClick={() => { setSelectedMedia(url); setIsZoomed(true); }}>
                                                            <img src={url} alt={`Media ${idx + 1}`} className="w-full object-contain max-h-[400px] transition-transform duration-500 group-hover:scale-[1.02]" />
                                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-4 py-2 rounded-full shadow-lg">Cliquer pour agrandir</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-2xl text-white space-y-8 sticky top-8 shadow-xl shadow-slate-200">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Établissement</p>
                            <h4 className="text-xl font-semibold tracking-tight">{feedback.businesses?.name}</h4>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-white/10">
                            {feedback.businesses?.address && (
                                <div className="flex gap-3 items-start">
                                    <MapPin size={16} className="text-white/20 shrink-0 mt-0.5" />
                                    <span className="text-xs text-white/60 leading-relaxed font-medium">{feedback.businesses.address}</span>
                                </div>
                            )}
                            <button
                                onClick={() => router.push(`/owner/business/${feedback.businesses?.id}`)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl text-xs font-bold transition-all"
                            >
                                Gérer cet établissement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContactItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                <Icon size={14} />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{value}</span>
            </div>
        </div>
    );
}
