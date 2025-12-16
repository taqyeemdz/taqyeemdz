"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import Sidebar from "./_components/Sidebar";
import RightPanel from "./_components/RightPanel";
import AdminTopBar from "./_components/AdminTopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();

  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  /* ===============================
      FETCH USER (ADMIN ONLY)
  =============================== */
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/admin/login";
        return;
      }

      const email = session.user.email || "";
      setUserEmail(email);
      setLoading(false);
    }

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-900">

      {/* ===== LEFT SIDEBAR ===== */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="
        md:hidden fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-40 
        flex items-center justify-between px-4 h-14
      ">
        <button onClick={() => setOpen(true)}>
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        <p className="font-semibold text-primary-700 text-lg">TaqyeemDZ</p>

        <div className="w-6" />
      </div>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex flex-1 flex-col md:flex-row mt-14 md:mt-0">

        <div className="flex-1 px-4 md:px-8 py-4 space-y-6">

          {/* 🔵 TOP BAR (Search + Icons + Avatar) */}
          <AdminTopBar user={{ email: userEmail }} />

          {/* 🔥 PAGE CONTENT */}
          <main className="mt-6">
            {children}
          </main>

        </div>

        {/* ===== RIGHT PANEL (DESKTOP ONLY) ===== */}
        <aside className="hidden xl:block w-[320px] border-l bg-white shadow-inner">
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}
