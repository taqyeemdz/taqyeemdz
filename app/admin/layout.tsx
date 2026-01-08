"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  Activity,
  Zap,
  BarChart3
} from "lucide-react";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = supabaseBrowser;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* AUTH CHECK */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data?.session?.user;

      if (!authUser) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        router.replace("/auth/login"); // Or specific unauthorized page
        return;
      }

      setUser(profile);
      setLoading(false);
    })();
  }, [supabase, router]);

  if (loading) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const links = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/onboarding", label: "Demandes", icon: Zap },
    { href: "/admin/owners", label: "Propriétaires", icon: Users },
    { href: "/admin/accounting", label: "Comptabilité", icon: BarChart3 },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900 font-sans">

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out sticky top-0 h-screen ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">A</div>
              <span>Admin</span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold mx-auto">
              A
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${!sidebarOpen && 'hidden'}`}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Collapsed Toggle */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mx-auto mt-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                            ${isActive
                    ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                            ${!sidebarOpen && "justify-center"}
                        `}
                title={!sidebarOpen ? label : ""}
              >
                <Icon size={20} className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-white"} shrink-0`} />

                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className={`p-4 border-t border-slate-800 ${!sidebarOpen && 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || "Admin"}</p>
                <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1">
                  <LogOut size={10} /> Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>


      {/* ================= MOBILE HEADER ================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 text-white">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">A</div>
          <span>Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          <div className="relative bg-slate-900 w-64 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 border-r border-slate-800">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <span className="font-bold text-lg text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
              {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
                      ${isActive
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.full_name || "Admin"}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className={`flex-1 min-w-0 transition-all duration-300 md:mt-0 mt-16`}>
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200/50">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/admin" className="hover:text-gray-900 transition-colors">Admin</Link>
            {pathname !== "/admin" && (
              <>
                <ChevronRight size={14} className="mx-2" />
                <span className="font-medium text-gray-900 capitalize">
                  {pathname?.split('/').pop()?.replace('-', ' ')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>

    </div>
  );
}

