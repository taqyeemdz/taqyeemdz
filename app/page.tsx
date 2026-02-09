"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Menu,
  X,
  Star,
  Loader2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});
  const supabase = supabaseBrowser;

  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (data) setPlans(data);

      const { data: settingsData } = await supabase.from("system_settings").select("*");
      if (settingsData) {
        const settingsMap = settingsData.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        setSystemSettings(settingsMap);
      }

      setLoadingPlans(false);
    }
    fetchPlans();
  }, [supabase]);

  // Filter plans by billing period
  const filteredPlans = plans.filter(p => (p.billing_period || 'monthly') === billingPeriod);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--chart-2)] selection:text-white">

      {/* ==================== NAVBAR ==================== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="relative w-64 h-16">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/logo.png`}
                  alt="Feedback by Jobber Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
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
                S'inscrire
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
                  S'inscrire
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
              Feedback by Jobber offre un canal privé et fluide permettant à vos clients de partager leurs expériences, vous aidant ainsi à améliorer vos services et à fidéliser votre clientèle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/request"
                className="px-8 py-3.5 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium text-base hover:opacity-90 transition-all flex items-center gap-2"
              >
                S'inscrire <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ==================== WHAT IS TAQYEEM (ABOUT) ==================== */}
        <section id="about" className="py-24 bg-[var(--muted)]/30 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[var(--chart-2)]/5 blur-[100px] rounded-full -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--chart-2)]/10 text-[var(--chart-2)] text-xs font-bold uppercase tracking-wider mb-6">
                  <Star size={12} className="fill-[var(--chart-2)]" />
                  Notre Mission
                </div>

                <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-[var(--foreground)]">
                  Qu'est-ce que <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--chart-2)] to-purple-600">Feedback by Jobber</span> ?
                </h2>

                <div className="space-y-6 text-lg text-[var(--muted-foreground)] leading-relaxed">
                  <p>
                    Nous comblons le fossé entre les entreprises et leurs clients. Fini les boîtes à suggestions poussiéreuses : place à une <strong className="text-[var(--foreground)]">intelligence client instantanée</strong>.
                  </p>
                  <p>
                    En un scan, vos clients partagent leur expérience. Vous recevez ces retours <strong className="text-[var(--foreground)]">en privé et en temps réel</strong>, vous donnant le pouvoir d'agir avant qu'un avis public ne soit posté.
                  </p>
                </div>

                <div className="mt-10 space-y-4">
                  <FeatureItem text="Accès instantané par QR Code" />
                  <FeatureItem text="Notifications temps réel pour les gérants" />
                  <FeatureItem text="Canal privé et sécurisé" />
                  <FeatureItem text="Analyses et statistiques détaillées" />
                </div>
              </div>

              <div className="relative group perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--chart-2)] to-purple-500 rounded-[2rem] blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 bg-white/5 backdrop-blur-sm transform transition-transform duration-700 hover:scale-[1.02]">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/home3.png`}
                    alt="Feedback by Jobber Dashboard"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== VISION SECTION (DARK) ==================== */}
        <section className="py-24 bg-[#0B0F19] overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <filter id="noiseFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">

              {/* Image Side (Left) */}
              <div className="flex-1 relative group perspective-1000 w-full">
                <div className="relative z-10 transform transition-all duration-700 group-hover:rotate-1 group-hover:scale-105">
                  <div className="relative aspect-square max-w-lg mx-auto bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl ring-1 ring-white/20">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/home4.png`}
                      alt="Vision Partagée Illustration"
                      width={800}
                      height={800}
                      className="object-contain drop-shadow-2xl w-full h-full"
                    />
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-[var(--chart-2)]/30 via-purple-500/20 to-blue-500/30 blur-[100px] rounded-full -z-10" />
              </div>

              {/* Text Side (Right) */}
              <div className="flex-1 space-y-8 text-center md:text-left">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold tracking-wide uppercase border border-white/10 shadow-sm backdrop-blur-md">
                  Notre Philosophie
                </div>
                <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                  Vision partagée, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--chart-2)] to-purple-400">
                    succès assuré.
                  </span>
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed font-medium">
                  Nous croyons que l'écoute est la clé de la croissance. Ensemble, transformons chaque retour client en une opportunité concrète de réussite.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link href="#pricing" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1">
                    Commencer maintenant
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================== PRICING SECTION ==================== */}
        <section id="pricing" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tarification simple et transparente</h2>
              <p className="text-[var(--muted-foreground)] mb-8">Choisissez le forfait qui correspond aux besoins de votre entreprise.</p>

              {/* Billing Period Toggle */}
              <div className="flex justify-center mb-10">
                <div className="inline-flex items-center p-1.5 bg-slate-100 rounded-full border border-slate-200 shadow-inner gap-1">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`relative px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${billingPeriod === 'monthly'
                      ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`relative px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${billingPeriod === 'yearly'
                      ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Annuel
                  </button>
                </div>
              </div>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {filteredPlans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    title={plan.name}
                    price={plan.price === 0 ? "Gratuit" : `${new Intl.NumberFormat('fr-DZ').format(plan.price)} ${plan.currency}`}
                    period={plan.price === 0 ? "" : billingPeriod === 'yearly' ? "/an" : "/mois"}
                    monthlyEquivalent={billingPeriod === 'yearly' && plan.price > 0 ? Math.round(plan.price / 12) : null}
                    currency={plan.currency}
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
              Rejoignez des centaines d'entreprises utilisant Feedback by Jobber pour écouter, apprendre et grandir.
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
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Logo */}
          <div className="relative w-64 h-20 mx-auto mb-8">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/webapp-assets/logo.png`}
              alt="Feedback by Jobber Logo"
              fill
              className="object-contain object-center"
            />
          </div>

          {/* Description */}
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Donner aux entreprises les moyens d'offrir de meilleures expériences grâce à des commentaires honnêtes et privés.
          </p>

          {/* Menu Links */}
          <nav className="flex flex-wrap justify-center gap-8 mb-10 font-medium text-slate-600">
            <Link href="#pricing" className="hover:text-[var(--chart-2)] transition-colors relative group">
              Tarifs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--chart-2)] transition-all group-hover:w-full"></span>
            </Link>
            <Link href="#about" className="hover:text-[var(--chart-2)] transition-colors relative group">
              À propos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--chart-2)] transition-all group-hover:w-full"></span>
            </Link>
            <Link href="/terms" className="hover:text-[var(--chart-2)] transition-colors relative group">
              Conditions Générales
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--chart-2)] transition-all group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Socials & Contact */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="flex justify-center gap-4">
              {systemSettings.social_facebook && (
                <a href={systemSettings.social_facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full hover:bg-[#1877F2] hover:text-white transition-all shadow-sm hover:scale-110">
                  <Facebook size={20} />
                </a>
              )}
              {systemSettings.social_instagram && (
                <a href={systemSettings.social_instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white transition-all shadow-sm hover:scale-110">
                  <Instagram size={20} />
                </a>
              )}
              {systemSettings.social_linkedin && (
                <a href={systemSettings.social_linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm hover:scale-110">
                  <Linkedin size={20} />
                </a>
              )}
              {systemSettings.social_twitter && (
                <a href={systemSettings.social_twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all shadow-sm hover:scale-110">
                  <Twitter size={20} />
                </a>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              {systemSettings.support_email && (
                <a href={`mailto:${systemSettings.support_email}`} className="hover:text-[var(--chart-2)] transition-colors flex items-center gap-2">
                  <Mail size={16} /> {systemSettings.support_email}
                </a>
              )}
              {systemSettings.contact_phone && (
                <a href={`tel:${systemSettings.contact_phone}`} className="hover:text-[var(--chart-2)] transition-colors flex items-center gap-2">
                  <Phone size={16} /> {systemSettings.contact_phone}
                </a>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-slate-100 text-slate-400 text-sm">
            © {new Date().getFullYear()} Feedback by Jobber. Tous droits réservés.
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

function PricingCard({ title, price, period, monthlyEquivalent, currency, features, description, maxQrCodes, highlighted = false }: any) {
  return (
    <div className={`
      relative p-8 rounded-2xl border transition-all duration-300 flex flex-col h-full
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

      {monthlyEquivalent && (
        <div className="mb-4">
          <span className="text-sm text-slate-500">
            Soit {new Intl.NumberFormat('fr-DZ').format(monthlyEquivalent)} {currency}/mois
          </span>
        </div>
      )}

      <div className="mb-8 flex items-center gap-2">
        <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
          {maxQrCodes >= 99999 ? "QR Codes illimités" : `${maxQrCodes} QR Code${maxQrCodes > 1 ? 's' : ''} inclus`}
        </div>
      </div>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
            <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${highlighted ? 'text-[var(--chart-2)]' : 'text-slate-300'}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/request"
        className={`
          block w-full py-4 rounded-xl text-center font-bold text-xs uppercase tracking-widest transition-all mt-auto
          ${highlighted
            ? 'bg-[var(--chart-2)] text-white hover:opacity-90 shadow-lg shadow-blue-500/25'
            : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-100'
          }
        `}
      >
        Choisir {title}
      </Link>
    </div>
  );
}
