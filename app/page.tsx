"use client";

import Link from "next/link";
import {
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Star,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const supabase = supabaseBrowser;

  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (data) setPlans(data);
      setLoadingPlans(false);
    }
    fetchPlans();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--chart-2)] selection:text-white">

      {/* ==================== NAVBAR ==================== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--chart-2)] flex items-center justify-center text-white">
                <MessageSquare size={20} className="fill-white/20" />
              </div>
              <span className="font-bold text-xl tracking-tight">TaqyeemDZ</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium hover:text-[var(--chart-2)] transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#about" className="text-sm font-medium hover:text-[var(--chart-2)] transition-colors">
                À propos
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-[var(--chart-2)] transition-colors">
                Tarifs
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium hover:text-[var(--chart-2)] transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/auth/request"
                className="px-4 py-2 rounded-full bg-[var(--chart-2)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[var(--chart-2)]/25"
              >
                Commencer
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-[var(--muted-foreground)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
            <div className="px-4 py-4 space-y-4">
              <Link href="#features" className="block text-sm font-medium text-[var(--foreground)]" onClick={() => setIsMobileMenuOpen(false)}>
                Fonctionnalités
              </Link>
              <Link href="#about" className="block text-sm font-medium text-[var(--foreground)]" onClick={() => setIsMobileMenuOpen(false)}>
                À propos
              </Link>
              <Link href="#pricing" className="block text-sm font-medium text-[var(--foreground)]" onClick={() => setIsMobileMenuOpen(false)}>
                Tarifs
              </Link>
              <hr className="border-[var(--border)]" />
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/auth/login"
                  className="block text-center w-full py-2 text-sm font-medium border border-[var(--border)] rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Se connecter
                </Link>
                <Link
                  href="/auth/request"
                  className="block text-center w-full py-2 text-sm font-medium bg-[var(--chart-2)] text-white rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Commencer
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">

        {/* ==================== HERO SECTION ==================== */}
        <section className="relative overflow-hidden pt-20 pb-32">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[var(--chart-2)]/10 blur-[100px] rounded-full -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Désormais disponible pour toutes les entreprises en Algérie
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--foreground)] mb-6 max-w-4xl mx-auto leading-[1.1]">
              Transformez les retours clients en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--chart-2)] to-[var(--chart-1)]">Croissance exploitable</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
              TaqyeemDZ offre un canal privé et fluide permettant à vos clients de partager leurs expériences, vous aidant ainsi à améliorer vos services et à fidéliser votre clientèle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/request"
                className="px-8 py-3.5 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium text-base hover:opacity-90 transition-all flex items-center gap-2"
              >
                Commencer gratuitement <ArrowRight size={18} />
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-3.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-medium text-base hover:bg-[var(--muted)] transition-all"
              >
                En savoir plus
              </Link>
            </div>

            {/* Social Proof / Trusted By (Optional Placeholder) */}
            <div className="mt-16 pt-8 border-t border-[var(--border)] max-w-3xl mx-auto">
              <p className="text-sm text-[var(--muted-foreground)] mb-6">Approuvé par des entreprises visionnaires</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Placeholders for logos */}
                <span className="font-bold text-xl">RestoTaq</span>
                <span className="font-bold text-xl">CaféDZ</span>
                <span className="font-bold text-xl">ShopifyAl</span>
                <span className="font-bold text-xl">TechStart</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== WHAT IS TAQYEEM (ABOUT) ==================== */}
        <section id="about" className="py-24 bg-[var(--muted)]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Qu'est-ce que Taqyeem ?</h2>
                <div className="space-y-6 text-[var(--muted-foreground)]">
                  <p>
                    Taqyeem est une plateforme numérique conçue pour combler le fossé entre les propriétaires d'entreprises et leurs clients. Nous remplaçons les boîtes à suggestions en papier obsolètes par une solution numérique intelligente et instantanée.
                  </p>
                  <p>
                    En scannant un code QR, vos clients peuvent instantanément évaluer leur expérience et laisser des commentaires détaillés. Ces retours vous sont envoyés en privé, vous permettant de répondre immédiatement aux préoccupations — avant qu'elles ne deviennent des avis négatifs publics.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <FeatureItem text="Accès instantané par code QR pour les clients" />
                  <FeatureItem text="Notifications en temps réel pour les propriétaires" />
                  <FeatureItem text="Boucle de rétroaction privée" />
                  <FeatureItem text="Tableau de bord d'analyses détaillé" />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--chart-2)] to-purple-500 rounded-2xl blur-2xl opacity-20 transform rotate-3" />
                <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
                  {/* Mock UI */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star size={20} className="text-yellow-600 fill-yellow-600" />
                      </div>
                      <div>
                        <div className="h-2 w-24 bg-gray-200 rounded mb-1" />
                        <div className="h-2 w-16 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">À l'instant</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-3/4 bg-gray-100 rounded" />
                  </div>
                  <div className="mt-6 flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100" />
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-sm text-gray-500 italic">
                      "Excellent service aujourd'hui ! Le personnel était très attentif..."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== PRICING SECTION ==================== */}
        <section id="pricing" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tarification simple et transparente</h2>
              <p className="text-[var(--muted-foreground)]">Choisissez le forfait qui correspond aux besoins de votre entreprise.</p>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {plans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    title={plan.name}
                    price={plan.price === 0 ? "Gratuit" : `${new Intl.NumberFormat('fr-DZ').format(plan.price)} ${plan.currency}`}
                    period={plan.price === 0 ? "" : "/mois"}
                    description={
                      plan.name === "Starter" ? "L'essentiel pour commencer." :
                        plan.name === "Pro" ? "Pour les entreprises en croissance." :
                          "Contrôle total pour les réseaux."
                    }
                    features={
                      plan.features && Array.isArray(plan.features) && plan.features.length > 0
                        ? plan.features
                        : [
                          `${plan.max_businesses} Produit${plan.max_businesses > 1 ? 's' : ''}`,
                          plan.allow_stats ? "Statistiques incluses" : "Stats de base",
                          plan.allow_tamboola ? "Fonction Tamboola" : "",
                          plan.allow_media ? "Upload de médias" : "",
                        ].filter(Boolean)
                    }
                    maxQrCodes={plan.max_qr_codes}
                    highlighted={plan.name === "Pro"}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==================== CTA SECTION ==================== */}
        <section className="py-24 bg-[var(--chart-2)] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à améliorer votre expérience client ?</h2>
            <p className="text-blue-100 text-lg mb-10">
              Rejoignez des centaines d'entreprises utilisant TaqyeemDZ pour écouter, apprendre et grandir.
            </p>
            <Link
              href="/auth/request"
              className="px-8 py-4 bg-white text-[var(--chart-2)] rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
            >
              Demander mon compte
            </Link>
          </div>
        </section>

      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[var(--card)] border-t border-[var(--border)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-[var(--chart-2)] flex items-center justify-center text-white">
                  <MessageSquare size={14} className="fill-white/20" />
                </div>
                <span className="font-bold text-lg">TaqyeemDZ</span>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm max-w-xs">
                Donner aux entreprises les moyens d'offrir de meilleures expériences grâce à des commentaires honnêtes et privés.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <li><Link href="#features" className="hover:text-[var(--foreground)]">Fonctionnalités</Link></li>
                <li><Link href="#pricing" className="hover:text-[var(--foreground)]">Tarifs</Link></li>
                <li><Link href="#" className="hover:text-[var(--foreground)]">Études de cas</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <li><Link href="#about" className="hover:text-[var(--foreground)]">À propos de nous</Link></li>
                <li><Link href="#" className="hover:text-[var(--foreground)]">Contact</Link></li>
                <li><Link href="#" className="hover:text-[var(--foreground)]">Politique de confidentialité</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} TaqyeemDZ. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 size={20} className="text-[var(--chart-2)] flex-shrink-0" />
      <span className="text-[var(--foreground)] font-medium">{text}</span>
    </div>
  );
}

function PricingCard({ title, price, period, features, description, maxQrCodes, highlighted = false }: any) {
  return (
    <div className={`
      relative p-8 rounded-2xl border transition-all duration-300
      ${highlighted
        ? 'border-[var(--chart-2)] bg-[var(--card)] shadow-2xl scale-105 z-10'
        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--chart-2)]/50'
      }
    `}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--chart-2)] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
          Plus populaire
        </div>
      )}

      <h3 className="text-2xl font-black mb-2 tracking-tight text-slate-900">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 h-10 leading-relaxed">{description}</p>

      <div className="mb-2">
        <span className="text-4xl font-black text-slate-900 tracking-tight">{price}</span>
        {period && <span className="text-slate-400 font-bold ml-1">{period}</span>}
      </div>

      <div className="mb-8 flex items-center gap-2">
        <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
          {maxQrCodes >= 99999 ? "QR Codes illimités" : `${maxQrCodes} QR Code${maxQrCodes > 1 ? 's' : ''} inclus`}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-start gap-3 text-sm">
            <CheckCircle2 size={16} className={`mt-0.5 ${highlighted ? 'text-[var(--chart-2)]' : 'text-[var(--muted-foreground)]'}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/request"
        className={`
          block w-full py-3 rounded-xl text-center font-semibold transition-all
          ${highlighted
            ? 'bg-[var(--chart-2)] text-white hover:opacity-90 shadow-lg shadow-blue-500/25'
            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]'
          }
        `}
      >
        Choisir {title}
      </Link>
    </div>
  );
}

