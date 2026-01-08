"use client";

import { useEffect, useState, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <UpdatePasswordInner />
    </Suspense>
  );
}

function UpdatePasswordInner() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser;

  // IMPORTANT: Échanger le code contre une session dès l'arrivée sur la page
  // IMPORTANT: Analyser l'URL pour des erreurs ou échanger le code contre une session
  useEffect(() => {
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");

    if (error === "access_denied" || errorCode === "otp_expired") {
      setErr("Le lien de réinitialisation a expiré ou a déjà été utilisé. Veuillez demander un nouveau lien.");
      return;
    }

    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setErr("Session invalide ou expirée. Veuillez recommencer la procédure.");
          console.error("Session exchange error:", exchangeError);
        }
      });
    }
  }, [searchParams, supabase]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");

    // updateUser nécessite une session active (établie par exchangeCodeForSession)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setMsg("Votre mot de passe a été mis à jour avec succès.");
    setLoading(false);
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <form
        onSubmit={handleUpdate}
        className="bg-white border border-slate-100 shadow-2xl p-10 rounded-[2.5rem] w-full max-w-md animate-in fade-in zoom-in duration-500 space-y-8"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nouveau mot de passe</h1>
          <p className="text-slate-400 text-sm font-medium">Sécurisez votre compte dès maintenant.</p>
        </div>

        {err && (
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">
            <AlertCircle size={14} />
            {err}
          </div>
        )}

        {msg && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
            <CheckCircle2 size={14} />
            {msg}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          disabled={loading || !!msg}
          className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Mettre à jour"}
        </button>

        {msg && (
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Redirection vers la connexion...
          </p>
        )}
        {err && (
          <div className="pt-4 border-t border-slate-50">
            <Link
              href="/auth/login"
              className="text-center block text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
