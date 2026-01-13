"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = supabaseBrowser;
  // ⭐ LOGOUT HANDLER
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const links = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Building2, label: "Businesses", href: "/admin/businesses" },
    { icon: MessageSquare, label: "Feedback", href: "/admin/feedback" },
    { icon: Users, label: "Owners", href: "/admin/owners" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/40 md:hidden z-40" />
      )}

      <aside
        className={`
        fixed md:static z-50 bg-white border-r shadow-lg
        w-72 md:w-64 lg:w-60 h-screen flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl text-white flex items-center justify-center font-bold">
              TDZ
            </div>
            <span className="text-lg font-semibold text-gray-900">Feedback by jobber</span>
          </div>

          <button className="md:hidden" onClick={onClose}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-3 rounded-xl
                hover:bg-primary-50 hover:text-primary-700
                text-gray-700 font-medium transition"
            >
              <Icon className="h-5 w-5 text-primary-600" />
              {label}
            </Link>
          ))}
        </nav>

        {/* ⭐ Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-error-600 hover:bg-error-50 p-3 rounded-xl w-full transition"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
