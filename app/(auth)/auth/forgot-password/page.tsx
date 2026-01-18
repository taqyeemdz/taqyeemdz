"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { Home } from "lucide-react";

export default function ForgotPasswordPage() {
    const supabase = supabaseBrowser;
    const [email, setEmail] = useState("");
    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setErr("");
        setMsg("");
        setLoading(true);

        try {
            // 1. Check if email exists
            const res = await fetch("/api/auth/check-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                // If API failed for some reason, we log but maybe proceed or stop?
                // Let's stop to be safe and report generic error
                throw new Error("Erreur de vérification.");
            }

            if (!data.exists) {
                setErr("L'email n'existe pas. Veuillez créer un compte.");
                setLoading(false);
                return;
            }

            // 2. Send Reset Link if exists
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
                    ? window.location.origin
                    : "https://feedbackbyjobber.vercel.app");

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${baseUrl}/auth/callback?next=/auth/update-password`,
            });

            if (error) {
                setErr(error.message);
            } else {
                setMsg("Un lien de réinitialisation a été envoyé à votre email.");
            }
        } catch (error) {
            console.error(error);
            setErr("Une erreur est survenue lors de l'envoi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Link
                    href="/"
                    className="fixed top-6 left-6 flex items-center gap-2 px-5 py-2.5 text-slate-500 hover:text-white bg-white hover:bg-slate-900 rounded-full transition-all duration-300 shadow-lg shadow-slate-200/50 hover:shadow-slate-900/20 z-50 font-black text-[10px] uppercase tracking-widest group"
                >
                    <Home size={14} className="group-hover:scale-110 transition-transform duration-300" />
                    <span>Accueil</span>
                </Link>

                <form
                    onSubmit={handleResetPassword}
                    className="bg-white border border-slate-100 shadow-2xl p-8 rounded-[2rem] w-full animate-in fade-in zoom-in duration-500 space-y-6"
                >

                    <div className="space-y-2 text-center pt-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Réinitialisation</h1>
                        <p className="text-slate-400 text-sm font-medium">Saisissez votre email pour recevoir un lien.</p>
                    </div>

                    {err && <p className="text-rose-500 bg-rose-50 p-3 rounded-xl text-xs font-bold text-center border border-rose-100">{err}</p>}
                    {msg && <p className="text-emerald-600 bg-emerald-50 p-3 rounded-xl text-xs font-bold text-center border border-emerald-100">{msg}</p>}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                placeholder="votre@email.com"
                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? "Envoi..." : "Envoyer le lien"}
                    </button>

                    <Link
                        href="/auth/login"
                        className="block w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        Retour à la connexion
                    </Link>
                </form>
            </div>
        </div>
    );
}
