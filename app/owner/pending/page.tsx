"use client";

import { Phone, Mail, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AccountPendingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {/* Top Banner */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                        <AlertCircle size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Compte en attente d'activation
                    </h1>
                </div>

                {/* Content */}
                <div className="p-8 sm:p-12 space-y-8">
                    <div className="text-center space-y-3">
                        <p className="text-gray-600 font-medium text-lg leading-relaxed">
                            Merci d'avoir créé votre compte Feedback !
                        </p>
                        <p className="text-gray-500 font-medium">
                            Votre compte est actuellement <span className="text-amber-600 font-bold">en attente d'activation</span>.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                            Prochaines étapes
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 font-black text-sm">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Contact téléphonique</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Notre équipe vous appellera pour discuter de votre activité et confirmer vos besoins.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 font-black text-sm">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Paiement de l'abonnement</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Vous recevrez les informations de paiement pour activer votre forfait choisi.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Activation complète</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Une fois le paiement confirmé, votre compte sera activé et vous aurez accès à toutes les fonctionnalités.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Phone size={14} /> Besoin d'aide ?
                        </h3>
                        <p className="text-sm text-indigo-700 leading-relaxed">
                            Si vous avez des questions ou souhaitez accélérer le processus, n'hésitez pas à nous contacter directement.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            VÉRIFIER L'ACTIVATION
                        </button>
                        <Link
                            href="/auth/login"
                            className="flex-1 bg-white text-gray-700 border-2 border-gray-200 rounded-2xl py-4 font-black text-sm hover:border-gray-300 transition-all text-center"
                        >
                            SE DÉCONNECTER
                        </Link>
                    </div>

                    <p className="text-center text-xs text-gray-400 font-medium">
                        Temps d'activation moyen : <span className="text-gray-600 font-bold">24-48 heures</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
