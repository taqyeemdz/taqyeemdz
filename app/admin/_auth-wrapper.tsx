// app/admin/_auth-wrapper.tsx
import { ReactNode } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminAuthWrapper({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServer();

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/auth/login");

  return <>{children}</>;
}
