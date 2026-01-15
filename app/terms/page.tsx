"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield } from "lucide-react";

export default function TermsPage() {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = supabaseBrowser;

    useEffect(() => {
        async function fetchTerms() {
            try {
                const response = await fetch('/api/public/terms');
                if (response.ok) {
                    const data = await response.json();
                    setContent(data.content || null);
                }
            } catch (error) {
                console.error('Error fetching terms:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTerms();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100">
            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Retour à l'accueil
                    </Link>
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Shield size={20} />
                        <span className="font-bold tracking-tight text-slate-900">Feedback by jobber</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <header className="mb-12">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                            Conditions Générales d'Utilisation
                        </h1>
                        <p className="text-slate-500">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
                    </header>

                    <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-sm shadow-slate-200/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest animate-pulse">Chargement...</p>
                            </div>
                        ) : content ? (
                            <div className="prose prose-slate max-w-none prose-sm md:prose-base prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed whitespace-pre-wrap">
                                {content}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-400 italic">Aucune condition générale n'a été rédigée pour le moment.</p>
                            </div>
                        )}
                    </div>

                    <footer className="mt-12 pt-8 border-t border-slate-200">
                        <p className="text-center text-slate-400 text-sm">
                            © {new Date().getFullYear()} Feedback by jobber. Tous droits réservés.
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
