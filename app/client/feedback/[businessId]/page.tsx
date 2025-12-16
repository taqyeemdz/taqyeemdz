"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Star, Send, CheckCircle2, User, Phone, Mail, MessageSquare } from "lucide-react";

export default function ClientFeedbackPage() {
    const supabase = createClientComponentClient();
    const params = useParams();
    const businessId = params.businessId;

    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Feedback form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState("");
    const [anonymous, setAnonymous] = useState(true);

    // Personal Info
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [sex, setSex] = useState("male");

    useEffect(() => {
        if (!businessId) return;

        const loadBusiness = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("businesses")
                .select("*")
                .eq("id", businessId)
                .single();

            if (error || !data) {
                setError("Business not found.");
            } else {
                setBusiness(data);
            }
            setLoading(false);
        };

        loadBusiness();
    }, [businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }

        if (!businessId) return;

        const payload = {
            business_id: businessId,
            rating,
            message,
            anonymous,
            full_name: anonymous ? null : fullName || null,
            phone: anonymous ? null : phone || null,
            email: anonymous ? null : email || null,
            sex: anonymous ? null : sex,
        };

        const { error: insertError } = await supabase.from("feedback").insert(payload);

        if (insertError) {
            setError(insertError.message);
        } else {
            setSuccess(true);
            // Reset form (optional, since we show success screen)
            setMessage("");
            setRating(0);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl text-center border border-gray-100 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
                    <p className="text-gray-500 mb-8">
                        Your feedback for <span className="font-semibold text-gray-700">{business.name}</span> has been submitted successfully.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
                    >
                        Submit another response
                    </button>
                </div>
            </div>
        );
    }

    if (error && !business) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <p className="text-red-500 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-xl w-full space-y-8">

                {/* HEADLINE */}
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {business.name}
                    </h1>
                    <p className="mt-2 text-gray-500">
                        We value your opinion. Please rate your experience.
                    </p>
                </div>

                {/* FORM CARD */}
                <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* STAR RATING */}
                        <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95 p-1"
                                    >
                                        <Star
                                            size={42}
                                            className={`${(hoverRating || rating) >= star
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-gray-200 fill-gray-50"
                                                } transition-colors duration-200`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-amber-500 min-h-[1.25rem]">
                                {rating > 0 ? (
                                    ["Terrible", "Bad", "Okay", "Good", "Excellent"][rating - 1]
                                ) : (
                                    "Tap a star to rate"
                                )}
                            </p>
                        </div>

                        {/* ANONYMOUS TOGGLE */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">Stay Anonymous</span>
                                <span className="text-xs text-gray-500">Review won't show your name</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAnonymous(!anonymous)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${anonymous ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${anonymous ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* USER DETAILS (Expandable) */}
                        <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${!anonymous ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider ml-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider ml-1">Phone</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="05..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider ml-1">Gender</label>
                                        <select
                                            value={sex}
                                            onChange={(e) => setSex(e.target.value)}
                                            className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider ml-1">Email (Optional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MESSAGE */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider ml-1">Your Message (Optional)</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                    <MessageSquare size={18} />
                                </div>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Tell us about your experience..."
                                />
                            </div>
                        </div>

                        {/* ERROR MESSAGE */}
                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 px-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-md"
                        >
                            <span>Send Feedback</span>
                            <Send size={18} />
                        </button>

                    </form>
                </div>

                <p className="text-center text-xs text-gray-400">
                    Powered by TaqyeemDZ
                </p>
            </div>
        </div>
    );
}
