"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function LoginForm() {
  const supabase = supabaseBrowser;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirectTo");

  // AUTO REDIRECT if already logged in
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (redirectTo) {
        return router.replace(redirectTo);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role === "admin") router.replace("/admin");
      if (profile?.role === "owner") router.replace("/owner");
    }

    checkSession();
  }, [router, supabase, redirectTo]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (redirectTo) {
      return router.replace(redirectTo);
    }

    let role = user.user_metadata?.role;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      role = profile?.role;
    }

    if (role === "admin") return router.replace("/admin");
    if (role === "owner") return router.replace("/owner");

    setErr("Rôle utilisateur invalide.");
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 px-5 py-2.5 text-slate-500 hover:text-white bg-white hover:bg-slate-900 rounded-full transition-all duration-300 shadow-lg shadow-slate-200/50 hover:shadow-slate-900/20 z-50 font-black text-[10px] uppercase tracking-widest group"
      >
        <Home size={14} className="group-hover:scale-110 transition-transform duration-300" />
        <span>Accueil</span>
      </Link>

      <form
        onSubmit={handleLogin}
        className="bg-white border border-slate-100 shadow-2xl p-8 rounded-[2.5rem] w-full animate-in fade-in zoom-in duration-500 space-y-8"
      >

        <div className="space-y-2 text-center pt-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Connexion</h1>
          <p className="text-slate-400 text-sm font-medium">Bon retour sur Feedback by Jobber.</p>
        </div>

        {err && <p className="text-rose-500 bg-rose-50 p-3 rounded-xl text-xs font-bold text-center border border-rose-100">{err}</p>}

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mot de passe</label>
              <Link
                href="/auth/forgot-password"
                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Oublié ?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="text-center pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Pas encore de compte ?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/request")}
              className="text-indigo-600 hover:underline"
            >
              S'inscrire
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
