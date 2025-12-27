"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    limitName?: string;
    maxLimit?: number;
}

export function UpgradeModal({
    isOpen,
    onClose,
    title = "Upgrade Required",
    description = "You've reached the limit of your current plan.",
    limitName = "businesses",
    maxLimit,
}: UpgradeModalProps) {
    const router = useRouter();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-indigo-600 p-8 text-white text-center space-y-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
                        <Rocket size={32} className="text-white" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-white text-center">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-center font-medium">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                <Zap size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 capitalize">
                                    Max {limitName}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                    Your current plan allows up to {maxLimit} {limitName}.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-green-900">
                                    Ready to scale?
                                </p>
                                <p className="text-xs text-green-600 font-medium">
                                    Unlock more capacity and premium features.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-3">
                        <Button
                            onClick={() => {
                                onClose();
                                router.push("/owner/settings");
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-black text-base shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            UPGRADE PLAN
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl py-4 font-bold text-sm"
                        >
                            Maybe Later
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
