"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, User, Phone, Send } from "lucide-react";

function WidgetForm() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get('business_id');
    const apiKey = searchParams.get('api_key');

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [rating, setRating] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [step, setStep] = useState(1);

    const handleSubmit = async () => {
        if (!rating) return;
        setLoading(true);

        try {
            const res = await fetch('/api/v1/feedbacks/external', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: businessId,
                    api_key: apiKey,
                    rating,
                    message,
                    client_name: clientName,
                    client_phone: clientPhone,
                    is_anonymous: isAnonymous,
                    source: 'widget'
                })
            });

            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
            } else {
                alert(data.error || "Erreur lors de l'envoi");
            }
        } catch (error) {
            alert("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Merci pour votre avis !</h1>
                <p className="text-slate-500">Votre retour a été transmis précieusement à l'établissement.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6 pb-20">
            <div className="max-w-md mx-auto space-y-8">
                {/* Step 1: Rating */}
                {step === 1 && (
                    <div className="space-y-8 py-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">Comment s'est passée votre expérience ?</h2>
                            <p className="text-slate-500 text-sm font-medium">L'avis est envoyé directement au gérant en privé.</p>
                        </div>

                        <div className="flex justify-between gap-4 py-4">
                            {[
                                { id: 'bad', label: 'Mauvaise', icon: '👎', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                                { id: 'medium', label: 'Moyenne', icon: '😐', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                                { id: 'good', label: 'Excellente', icon: '👍', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
                            ].map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => {
                                        setRating(r.id);
                                        setStep(2);
                                    }}
                                    className={`
                                        flex flex-col items-center justify-center flex-1 aspect-square rounded-3xl border-2 transition-all p-4
                                        ${rating === r.id ? 'border-emerald-500 bg-emerald-50 scale-95 shadow-lg' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}
                                    `}
                                >
                                    <span className="text-4xl mb-2">{r.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Comment & Info */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            </button>
                            <h2 className="text-lg font-black text-slate-900">Dites-nous en plus</h2>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Vos commentaires ou suggestions..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-5 py-4 text-sm outline-none focus:border-emerald-500 min-h-[120px] transition-all"
                                rows={4}
                            />

                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600">Rester anonyme</span>
                                    <button
                                        onClick={() => setIsAnonymous(!isAnonymous)}
                                        className={`w-10 h-5 rounded-full transition-all relative ${isAnonymous ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAnonymous ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                {!isAnonymous && (
                                    <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                value={clientName}
                                                onChange={(e) => setClientName(e.target.value)}
                                                placeholder="Votre nom"
                                                className="w-full bg-white border border-slate-100 rounded-2xl px-10 py-3 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                value={clientPhone}
                                                onChange={(e) => setClientPhone(e.target.value)}
                                                placeholder="Téléphone (facultatif)"
                                                className="w-full bg-white border border-slate-100 rounded-2xl px-10 py-3 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !rating}
                            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <div className="flex items-center gap-2">Envoyer l'avis <Send size={16} /></div>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WidgetFormPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
        }>
            <WidgetForm />
        </Suspense>
    );
}
