"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Globe, Copy, Check, Settings2, Code, Terminal, Loader2, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
    const supabase = supabaseBrowser;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const [settings, setSettings] = useState<any>({
        is_enabled: true,
        button_color: '#10b981',
        button_text: 'Donnez votre avis',
        position: 'bottom-right'
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const load = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) return;

            // Fetch business link
            const { data: link } = await supabase
                .from("user_business")
                .select("business_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (link) {
                const { data: b } = await supabase
                    .from("businesses")
                    .select("*")
                    .eq("id", link.business_id)
                    .single();

                setBusiness(b);

                // Fetch or init widget settings
                const { data: ws, error } = await supabase
                    .from("widget_settings")
                    .select("*")
                    .eq("business_id", link.business_id)
                    .maybeSingle();

                if (ws) {
                    setSettings(ws);
                } else {
                    // Create defaults if not exists
                    const { data: newWs, error: insertError } = await supabase
                        .from("widget_settings")
                        .insert({ business_id: link.business_id })
                        .select("*")
                        .single();

                    if (newWs) setSettings(newWs);
                    else if (insertError) console.error("Error creating widget settings:", insertError);
                }
            }
            setLoading(false);
        };
        load();
    }, [supabase]);

    const handleSave = async () => {
        if (!business) return;
        setSaving(true);
        const { error } = await supabase
            .from("widget_settings")
            .upsert({
                business_id: business.id,
                is_enabled: settings.is_enabled,
                button_color: settings.button_color,
                button_text: settings.button_text,
                position: settings.position,
                api_key: settings.api_key,
                updated_at: new Date()
            });

        if (error) {
            console.error("Save error:", error);
            toast.error("Erreur lors de l'enregistrement");
        } else {
            toast.success("Réglages mis à jour");
        }
        setSaving(false);
    };

    const baseUrl = typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'http://localhost:3000' : window.location.origin) : '';
    const scriptCode = `<script 
    src="${baseUrl}/v1/widget.js" 
    data-business-id="${business?.id}" 
    async>
</script>`;

    const copyToClipboard = () => {
        if (!business) return;
        navigator.clipboard.writeText(scriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Code copié !");
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
    );

    if (!business) return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Globe className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Aucun établissement configuré pour votre compte.</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 md:p-8 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Widget Web</h1>
                <p className="text-slate-500 text-sm">Collectez des avis directement sur votre propre site internet.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-6 sm:p-8 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Settings2 size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Personnalisation</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">État</label>
                                    <p className="text-[10px] text-slate-500 font-bold">{settings.is_enabled ? 'Activé' : 'Désactivé'}</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${settings.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.is_enabled ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Couleur du bouton</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative group w-12 h-12">
                                        <input
                                            type="color"
                                            value={settings.button_color}
                                            onChange={(e) => setSettings({ ...settings, button_color: e.target.value })}
                                            className="absolute inset-0 w-full h-full rounded-2xl border-none cursor-pointer p-0 opacity-0 z-10"
                                        />
                                        <div className="w-full h-full rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100" style={{ backgroundColor: settings.button_color }} />
                                    </div>
                                    <input
                                        type="text"
                                        value={settings.button_color}
                                        onChange={(e) => setSettings({ ...settings, button_color: e.target.value })}
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Texte du bouton</label>
                                <input
                                    value={settings.button_text}
                                    onChange={(e) => setSettings({ ...settings, button_text: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Ex: Donnez votre avis"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Position sur l'écran</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'bottom-right', label: 'Bas Droite' },
                                        { id: 'bottom-left', label: 'Bas Gauche' }
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSettings({ ...settings, position: p.id })}
                                            className={`p-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${settings.position === p.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="text-indigo-400" />}
                            Sauvegarder
                        </button>
                    </div>
                </div>

                {/* Integration Code */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="relative space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-inner">
                                        <Code size={28} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Code d'intégration</h3>
                                        <p className="text-slate-400 text-xs mt-1">Insérez ce code dans la balise <code>&lt;head&gt;</code> de votre site.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copié !' : 'Copier le code'}
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-indigo-500/30 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-black/40 border border-white/10 rounded-[2rem] p-8 font-mono text-sm leading-relaxed overflow-x-auto text-emerald-300/90 whitespace-pre scrollbar-hide">
                                    {scriptCode}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-3">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        <Terminal size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Performance</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Le chargement est asynchrone pour garantir que votre site reste ultra-rapide.</p>
                                </div>
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/10 rounded-[2rem] space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Globe size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Temps Réel</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Toutes vos modifications de style s'appliquent instantanément sans changer le code.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer API Section */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-6 sm:p-10 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                                    <Terminal size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 tracking-tight">API Développeur</h3>
                                    <p className="text-slate-500 text-xs">Utilisez votre propre interface avec notre backend.</p>
                                </div>
                            </div>
                            <span className="px-4 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full border border-amber-100 tracking-widest">Pro</span>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group p-1 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <div className="flex-1 px-5 py-3 font-mono text-xs text-slate-900 overflow-hidden text-ellipsis selection:bg-amber-100">
                                    {settings.api_key}
                                </div>
                                <button
                                    onClick={() => {
                                        const newKey = crypto.randomUUID();
                                        setSettings({ ...settings, api_key: newKey });
                                        toast("Appuyez sur 'Sauvegarder' pour activer la nouvelle clé");
                                    }}
                                    className="p-3 mr-1 bg-white border border-slate-200 hover:border-amber-400 rounded-xl transition-all text-slate-400 hover:text-amber-500 shadow-sm group-active:scale-95"
                                    title="Générer une nouvelle clé"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Envoyez une requête POST vers <code>{baseUrl}/api/v1/feedbacks/external</code> avec votre <code>business_id</code> et <code>api_key</code>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
