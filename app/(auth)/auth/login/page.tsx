
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const supabase = supabaseBrowser; const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = params?.get("redirectTo");

  // ✅ Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) return;

      // Fetch role from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const role = profile?.role;

      if (redirectTo) {
        router.replace(redirectTo);
      } else if (role === "admin") {
        router.replace("/admin");
      } else if (role === "owner") {
        router.replace("/owner");
      } else {
        router.replace("/");
      }
    };
    checkSession();
  }, [router, supabase, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (!data.session) throw new Error("Login failed");

      // Fetch role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Failed to fetch user profile");
      }

      const role = profile?.role;

      if (!role) throw new Error("Your account is not activated yet.");

      // ✅ Redirect based on role or redirectTo param
      if (redirectTo) {
        router.replace(redirectTo);
      } else if (role === "admin") {
        router.replace("/admin");
      } else if (role === "owner") {
        router.replace("/owner");
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-semibold text-center">TaqyeemDZ</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border rounded p-2 text-sm"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border rounded p-2 text-sm"
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white rounded-md py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Connecting…" : "Login"}
        </button>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </form>
    </div>
  );
}
