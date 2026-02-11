"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  Menu,
  X,
  LayoutDashboard,
  MessageCircle,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Trophy,
  Lock,
  RefreshCcw,
  Send
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = supabaseBrowser;
  const [user, setUser] = useState<any>(null);
  const [allowStats, setAllowStats] = useState(false);
  const [allowTamboola, setAllowTamboola] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [hasRenewalRequest, setHasRenewalRequest] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
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

      if (!profile || profile.role !== "owner") {
        router.replace("/auth/login");
        return;
      }

      const is_active = profile.is_active;
      const full_name = profile.full_name || authUser.user_metadata?.full_name;

      const { data: request } = await supabase
        .from("onboarding_requests")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      setUser({
        ...profile,
        full_name,
        is_active,
        email: authUser.email,
        requestId: request?.id?.split('-')[0].toUpperCase()
      });

      // Check for renewal request
      const { data: renewal } = await supabase
        .from("renewal_requests")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("status", "pending")
        .maybeSingle();

      setHasRenewalRequest(!!renewal);

      if (profile.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("allow_stats, allow_tamboola")
          .eq("id", profile.plan_id)
          .single();

        setAllowStats(!!plan?.allow_stats);
        setAllowTamboola(!!plan?.allow_tamboola);
      }

      // Fetch all active plans for switching
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      setAvailablePlans(plans || []);
      setSelectedPlanId(profile.plan_id);

      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  if (loading) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  async function handleRequestRenewal() {
    if (!user?.id || hasRenewalRequest) return;

    setRenewalLoading(true);
    try {
      const { error } = await supabase
        .from("renewal_requests")
        .insert({
          user_id: user.id,
          plan_id: selectedPlanId || user.plan_id,
          status: 'pending'
        });

      if (error) throw error;

      setHasRenewalRequest(true);
      toast.success("Demande de renouvellement envoyée avec succès !");
    } catch (err) {
      console.error("Renewal request error:", err);
      toast.error("Échec de l'envoi de la demande.");
    } finally {
      setRenewalLoading(false);
    }
  }

  const isInactive = user?.is_active === false;
  const isExpired = user?.subscription_end && new Date(user.subscription_end) < new Date();
  const isBlocked = isInactive || isExpired;

  const links = [
    { href: "/owner", label: "Tableau de Bord", icon: LayoutDashboard },
    { href: "/owner/business", label: "Produits", icon: QrCode, locked: isBlocked },
    { href: "/owner/analytics", label: "Statistiques", icon: BarChart3, locked: isBlocked || !allowStats },
    { href: "/owner/feedback", label: "Avis Clients", icon: MessageCircle, locked: isBlocked },
    { href: "/owner/tamboola", label: "Tamboola", icon: Trophy, locked: isBlocked || !allowTamboola },
    { href: "/owner/settings", label: "Paramètres", icon: Settings, locked: isBlocked },
  ];

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/60 transition-all duration-300 ease-in-out sticky top-0 h-screen z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}
      >
        {/* Header */}
        <div className={`h-20 flex items-center justify-between px-4 border-b border-slate-100/60 ${!sidebarOpen && 'px-2'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight px-2">
              <div className="relative w-64 h-16">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/logo.png`}
                  alt="Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center mx-auto">
              <div className="relative w-10 h-10">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/logo2.png`}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 px-3 space-y-1.5 overflow-y-auto no-scrollbar ${!sidebarOpen ? 'flex flex-col items-center' : ''}`}>
          {links.map(({ href, label, icon: Icon, locked }) => {
            const isActive = href === "/owner" ? pathname === "/owner" : pathname?.startsWith(href);
            const isLocked = locked;

            return (
              <Link
                key={href}
                href={isLocked ? "#" : href}
                onClick={(e) => isLocked && e.preventDefault()}
                className={`
                  flex transition-all duration-200 group relative w-full
                  ${sidebarOpen
                    ? "items-center gap-3 px-3 py-2.5 rounded-xl"
                    : "items-center justify-center p-3 rounded-xl"
                  }
                  ${isActive
                    ? "bg-slate-900 text-white font-medium shadow-xl shadow-slate-200"
                    : isLocked
                      ? "opacity-30 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon size={20} className={`${isActive ? "text-indigo-400" : (isLocked ? "text-slate-300" : "text-slate-400 group-hover:text-slate-900")} shrink-0 transition-colors`} />

                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-2xl flex items-center gap-2">
                    {label}
                    {isLocked && <Lock size={10} className="text-slate-400" />}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
                  </div>
                )}

                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-base font-semibold tracking-tight">{label}</span>
                    {isLocked && <Lock size={12} className="text-slate-300" />}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className={`p-4 border-t border-slate-100/60 ${!sidebarOpen && 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-100/50">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{user?.full_name?.split(' ')[0] || "Propriétaire"}</p>
                <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest">
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>


      {/* ================= MOBILE NAV ================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-b border-slate-200/60 h-28 flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="relative w-80 h-24">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/logo.png`}
              alt="Logo"
              fill
              className="object-contain object-left"
            />
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-sm"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {
        mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />

            <div className="relative bg-white w-[85%] max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500">
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
                <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Menu Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 py-10 px-6 space-y-2">
                {links.map(({ href, label, icon: Icon, locked }) => {
                  const isActive = href === "/owner" ? pathname === "/owner" : pathname?.startsWith(href);
                  const isLocked = locked;

                  return (
                    <Link
                      key={href}
                      href={isLocked ? "#" : href}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                        else setMobileMenuOpen(false);
                      }}
                      className={`
                                    flex items-center gap-4 px-4 py-4 rounded-2xl transition-all
                                    ${isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : isLocked
                            ? "opacity-40 cursor-not-allowed"
                            : "text-slate-600 hover:bg-slate-50"
                        }
                                `}
                    >
                      <Icon size={20} className={isLocked ? "text-slate-300" : ""} />
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-sm font-semibold">{label}</span>
                        {isLocked && <Lock size={12} className="text-slate-300" />}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate opacity-70 tracking-tight">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white border border-red-100 text-red-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} /> Déconnexion
                </button>
              </div>
            </div>
          </div>
        )
      }


      {/* ================= MAIN CONTENT ================= */}
      <main className={`flex-1 min-w-0 transition-all duration-300 md:mt-0 mt-28`}>

        {/* TOP SPACE (Minimal) */}
        <header className="hidden md:block h-6" />

        {/* CONTAINER */}
        <div className="relative animate-in fade-in slide-in-from-bottom-3 duration-1000 min-h-[calc(100vh-5rem)]">

          {/* BLOQUAGE SI INACTIF OU EXPIRE */}
          {isBlocked && (
            <div className="absolute inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-8 bg-white/40 backdrop-blur-md">
              <div className="absolute inset-0 z-0 cursor-not-allowed" />

              <div className={`relative z-10 w-full ${isExpired ? 'max-w-3xl' : 'max-w-lg'} bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl shadow-indigo-200/50 border border-slate-100 p-6 sm:p-10 animate-in zoom-in duration-700 mt-4 sm:mt-0`}>
                <div className={`grid grid-cols-1 ${isExpired ? 'lg:grid-cols-2' : ''} gap-8 sm:gap-12`}>

                  {/* LEFT COLUMN: MESSAGE */}
                  <div className="text-center lg:text-left space-y-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-2 border-4 border-white shadow-inner">
                      <Lock size={20} className="text-indigo-600 animate-pulse sm:w-7 sm:h-7" />
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                      {isExpired ? "Abonnement" : "Activation"} <br />
                      <span className="text-indigo-600 border-b-4 border-indigo-100">{isExpired ? "Expiré" : "en cours"}</span>
                    </h2>

                    <p className="text-slate-500 font-medium leading-relaxed text-xs sm:text-sm italic">
                      {isExpired
                        ? "Votre abonnement a expiré. Veuillez contacter un conseiller pour la réactivation de vos services."
                        : `Votre compte est en cours de création, un conseiller vous contactera au ${user.phone}.`
                      }
                    </p>

                    {user.requestId && !isExpired && (
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                        N° de demande : <span className="text-slate-900">#{user.requestId}</span>
                      </p>
                    )}

                    {!isExpired && (
                      <div className="pt-4 border-t border-slate-50 flex flex-col items-center lg:items-start gap-4">
                        <button
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[9px] sm:text-[10px] hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
                        >
                          <LogOut size={12} className="sm:w-3.5 sm:h-3.5" /> Déconnexion sécurisée
                        </button>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: ACTIONS (ONLY IF EXPIRED) */}
                  {isExpired && (
                    <div className="flex flex-col justify-center space-y-6 bg-slate-50/50 p-5 sm:p-8 rounded-[2rem] border border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center lg:text-left">
                          Plan de renouvellement
                        </label>
                        <div className="relative group">
                          <select
                            disabled={hasRenewalRequest}
                            value={selectedPlanId || ""}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className={`w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer pr-10 ${!hasRenewalRequest ? "hover:border-indigo-200 focus:border-indigo-600 shadow-sm" : "opacity-60 cursor-not-allowed bg-emerald-50/30 border-emerald-100 text-emerald-700"
                              }`}
                          >
                            {availablePlans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} — {plan.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'} ({new Intl.NumberFormat('fr-DZ').format(plan.price)} {plan.currency})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight className="rotate-90" size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleRequestRenewal}
                          disabled={hasRenewalRequest || renewalLoading}
                          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] ${hasRenewalRequest
                            ? "bg-emerald-500 text-white cursor-default shadow-none"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                            }`}
                        >
                          {renewalLoading ? (
                            <RefreshCcw size={16} className="animate-spin" />
                          ) : hasRenewalRequest ? (
                            <>Demande envoyée</>
                          ) : (
                            <>
                              <Send size={16} /> Renouveler
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 text-slate-400 font-bold text-[9px] hover:text-red-500 transition-colors uppercase tracking-[0.2em] pt-2"
                        >
                          <LogOut size={12} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SOCIAL PROOF (BOTTOM - Reduced) */}
                <div className="hidden sm:flex mt-8 pt-6 border-t border-slate-50 items-center justify-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm">
                        <User size={12} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rejoignez +50 commerçants satisfaits</span>
                </div>
              </div>
            </div>
          )}

          {/* PAGE CONTENT */}
          <div className={`p-4 sm:p-0 ${isBlocked ? 'blur-xl pointer-events-none select-none opacity-20' : ''}`}>
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
