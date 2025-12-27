"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { X, Check, Zap, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const loadPlans = async () => {
                setLoading(true);
                const { data } = await supabaseBrowser
                    .from("subscription_plans")
                    .select("*")
                    .eq("is_active", true)
                    .order("price", { ascending: true });
                setPlans(data || []);
                setLoading(false);
            };
            loadPlans();
        }
    }, [isOpen]);

    const handleUpgrade = (plan: any) => {
        window.open(`https://wa.me/213555555555?text=I want to upgrade to the ${plan.name} plan`, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 bg-white border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 md:p-12">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Upgrade Your Plan</h2>
                            <p className="text-gray-500 font-medium mt-1">Unlock powerful features to grow your business.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col ${plan.name === 'Pro'
                                            ? 'border-indigo-600 shadow-xl shadow-indigo-100'
                                            : 'border-gray-100 hover:border-gray-200 shadow-sm bg-white'
                                        }`}
                                >
                                    {plan.name === 'Pro' && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                            Recommended
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{plan.currency}/mo</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{plan.max_businesses} Businesses</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.allow_media ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'}`}>
                                                {plan.allow_media ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                                            </div>
                                            <span className={`text-sm font-bold ${plan.allow_media ? 'text-gray-600' : 'text-gray-300 line-through'}`}>Media Uploads</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.allow_stats ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'}`}>
                                                {plan.allow_stats ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                                            </div>
                                            <span className={`text-sm font-bold ${plan.allow_stats ? 'text-gray-600' : 'text-gray-300 line-through'}`}>Analytics Access</span>
                                        </div>

                                        {plan.features?.map((feat: string, i: number) => feat && (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => handleUpgrade(plan)}
                                        className={`w-full rounded-2xl py-6 font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${plan.name === 'Pro'
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                                : 'bg-gray-900 hover:bg-gray-800 text-white'
                                            }`}
                                    >
                                        Select Plan
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

