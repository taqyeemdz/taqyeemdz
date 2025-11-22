"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    setMsg("Password updated! You can now log in.");
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>

      <form onSubmit={handleReset} className="space-y-4">
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {err && <div className="text-red-500 text-sm">{err}</div>}
        {msg && <div className="text-green-500 text-sm">{msg}</div>}

        <Button className="w-full bg-primary">Update Password</Button>
      </form>
    </Card>
  );
}
