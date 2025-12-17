"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const supabase = supabaseBrowser;
  async function handleUpdate(e: any) {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) return setMsg(error.message);

    setMsg("Password successfully updated.");
    router.push("/auth/owner/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Set New Password</h1>

        {msg && <p className="mb-3">{msg}</p>}

        <input
          type="password"
          placeholder="New password"
          className="input mb-4 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn-primary w-full">Update Password</button>
      </form>
    </div>
  );
}
