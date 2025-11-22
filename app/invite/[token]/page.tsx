"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invite, setInvite] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvite = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("invites").select("*").eq("token", token).single();

      if (!data || data.used) {
        setError("This invite link is invalid or already used.");
        setLoading(false);
        return;
      }

      setInvite(data);
      setLoading(false);
    };

    loadInvite();
  }, [token]);

  async function handleAccept() {
    if (!invite) return;

    const supabase = createClient();

    // 1️⃣ Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    // 2️⃣ Insert into users table
    await supabase.from("users").insert([
      {
        id: authUser.user!.id,
        email: invite.email,
        role: invite.role,
        business_id: invite.business_id,
        createdat: new Date().toISOString(),
        name: invite.email.split("@")[0],
      },
    ]);

    // 3️⃣ Mark invite as used
    await supabase.from("invites").update({
      used: true,
      used_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

    router.push("/dashboard/owner");
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <Card className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">You're Invited!</h1>
      <p className="text-muted-foreground mb-6">
        Set a password to activate your account and join the business.
      </p>

      <Input
        type="password"
        placeholder="Create a password..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />

      <Button onClick={handleAccept} className="w-full bg-primary text-primary-foreground">
        Activate Account
      </Button>
    </Card>
  );
}
