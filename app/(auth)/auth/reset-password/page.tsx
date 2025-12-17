"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function ResetPasswordPage() {
  const supabase = supabaseBrowser; const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/update-password`
    });

    if (error) return setMsg(error.message);
    setMsg("Password reset email sent.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form className="bg-white p-6 rounded-xl shadow w-full max-w-sm" onSubmit={handleSubmit}>
        <h1 className="text-xl font-bold mb-4">Reset Password</h1>

        {msg && <p className="mb-3">{msg}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          className="input mb-4 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="btn-primary w-full">Send reset email</button>
      </form>
    </div>
  );
}
