"use client";

import { useEffect, useState, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement sécurisé...</div>}>
      <UpdatePasswordInner />
    </Suspense>
  );
}

function UpdatePasswordInner() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser;

  // IMPORTANT: Analyser l'URL pour des erreurs ou échanger le code contre une session
  useEffect(() => {
    async function initSession() {
      // 1. Vérifier d'abord s'il y a une erreur dans l'URL (ex: lien expiré)
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");

      if (error === "access_denied" || errorCode === "otp_expired") {
        setErr("Le lien a expiré ou a déjà été utilisé sur un autre appareil.");
        setSessionLoading(false);
        return;
      }

      // 2. Tenter l'échange du code (PKCE)
      const code = searchParams.get("code");
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setErr("Échec de la connexion sécurisée. Veuillez redemander un lien.");
            console.error("Exchange error:", exchangeError);
          } else if (data?.session) {
            setHasSession(true);
          }
        } catch (e) {
          setErr("Une erreur technique est survenue.");
        }
      } else {
        // Pas de code dans l'URL ? Vérifions si on a déjà une session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          setErr("Session introuvable. Veuillez utiliser le lien reçu par email.");
        }
      }
      setSessionLoading(false);
    }

    initSession();
  }, [searchParams, supabase]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSession) {
      setErr("Votre session est manquante. Rechargez la page ou demandez un nouveau lien.");
      return;
    }

    setLoading(true);
    setErr("");
    setMsg("");

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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mot de passe</h1>
          <p className="text-slate-400 text-sm font-medium">Réinitialisation sécurisée</p>
        </div>

        {sessionLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse text-center">
              Établissement du tunnel sécurisé...
            </p>
          </div>
        ) : (
          <>
            {err && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                <p className="leading-relaxed">{err}</p>
              </div>
            )}

            {msg && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-100 animate-in slide-in-from-top-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <p>{msg}</p>
              </div>
            )}

            {!msg && !err && hasSession && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Mettre à jour"}
                </button>
              </div>
            )}

            {err && (
              <div className="pt-4 border-t border-slate-50">
                <Link
                  href="/auth/login"
                  className="w-full block py-4 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Redemander un lien
                </Link>
              </div>
            )}

            {msg && (
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Redirection automatique...
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}
