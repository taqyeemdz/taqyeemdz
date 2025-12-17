"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";

export default function LoginForm() {
  const supabase = supabaseBrowser; const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  // AUTO REDIRECT if already logged in
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role === "admin") router.replace("/admin");
      if (profile?.role === "owner") router.replace("/owner");
    }

    checkSession();
  }, []);

  async function handleLogin(e: any) {
    e.preventDefault();
    setErr("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);

    const user = data.user;

    // Check role from user_metadata first
    let role = user.user_metadata?.role;

    // Fallback to profiles table
    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      role = profile?.role;
      if (!role) return setErr("No profile found. Contact administrator.");
    }

    // Redirect by role
    if (role === "admin") return router.replace("/admin");
    if (role === "owner") return router.replace("/owner");

    setErr("Invalid account role.");
  }


  return (
    <form
      onSubmit={handleLogin}
      className="bg-white border shadow p-6 rounded-xl w-full max-w-sm"
    >
      <h1 className="text-xl font-bold text-center mb-4">Login</h1>

      {err && <p className="text-red-600 text-center mb-2">{err}</p>}

      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 rounded mb-3"
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full border p-2 rounded mb-4"
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button className="w-full bg-black text-white py-2 rounded">
        Login
      </button>
    </form>
  );
}
