"use client";

import { useEffect, useState, MouseEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import {
    Building2,
    MapPin,
    Phone,
    ChevronLeft,
    Star,
    Share2,
    Download,
    User,
    Ghost,
    Calendar,
    MessageSquare,
    Mail,
    QrCode as QrIcon,
    X,
    ExternalLink,
    Copy,
    Printer
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function OwnerBusinessDetailsPage() {
    const supabase = supabaseBrowser; const router = useRouter();
    const params = useParams();
    const businessId = params.id;

    const [loading, setLoading] = useState(true);
    const [business, setBusiness] = useState<any>(null);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [showQr, setShowQr] = useState(false);

    const [activeTab, setActiveTab] = useState<"feed" | "form">("feed");
    const [formConfig, setFormConfig] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1️⃣ Session check
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) return router.replace("/auth/login");

            // 2️⃣ Load business
            const { data: b, error: busError } = await supabase
                .from("businesses")
                .select("*")
                .eq("id", businessId)
                .single();

            if (busError || !b) {
                setBusiness(null);
                setLoading(false);
                return;
            }

            setBusiness(b);
            // Initialize form config if it exists
            if (b.form_config) {
                setFormConfig(b.form_config);
            }

            // 3️⃣ Load feedback
            const { data: fb, error: fbError } = await supabase
                .from("feedback")
                .select("*")
                .eq("business_id", businessId)
                .order("created_at", { ascending: false });

            if (fbError) {
                console.error("Error fetching feedback:", fbError);
            }

            setFeedback(fb || []);
            setLoading(false);
        };

        fetchData();
    }, [businessId, router, supabase]);

    const handleSaveForm = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from("businesses")
            .update({ form_config: formConfig })
            .eq("id", businessId);

        if (error) {
            console.error("Error saving form config:", error);
            alert("Failed to save form configuration");
        } else {
            alert("Form configuration saved successfully!");
        }
        setIsSaving(false);
    };

    const addField = () => {
        setFormConfig([...formConfig, { id: crypto.randomUUID(), label: "", type: "text", required: false }]);
    };

    const updateField = (id: string, key: string, value: any) => {
        setFormConfig(formConfig.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const removeField = (id: string) => {
        setFormConfig(formConfig.filter(f => f.id !== id));
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!business) return <p className="p-8 text-center text-gray-500">Business not found.</p>;

    const feedbackLink = `${window.location.origin}/client/feedback/${businessId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(feedbackLink);
        alert("Link copied to clipboard!");
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `${business.name}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handlePrintQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const svgHtml = svg.outerHTML;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${business.name}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                        h1 { margin-bottom: 20px; }
                        svg { width: 300px; height: 300px; }
                    </style>
                </head>
                <body>
                    <h1>${business.name}</h1>
                    ${svgHtml}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className=" mx-auto p-6 space-y-8">

            {/* 🔙 NAV & HEADER */}
            <div className="flex flex-col gap-4 md:gap-6">
                <button
                    onClick={() => router.push("/owner/business")}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit px-1 mb-2"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-medium">Back to Businesses</span>
                </button>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex flex-row gap-4 md:gap-6 justify-between items-start md:items-center">
                        <div className="flex items-center gap-3 md:gap-5 min-w-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                                <Building2 size={24} className="md:w-8 md:h-8" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{business.name}</h1>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-500">
                                    {business.address && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-400" />
                                            <span>{business.address}</span>
                                        </div>
                                    )}
                                    {business.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{business.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                                            Active
                                        </span>
                                        <span>• {feedback.length} Reviews</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowQr(!showQr)}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm shadow-indigo-200 shrink-0"
                        >
                            <QrIcon size={20} />
                        </button>
                    </div>

                    {/* EXPANDED QR SECTION */}
                    {showQr && (
                        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm">
                                <QRCodeSVG id="qr-code-svg" value={feedbackLink} size={180} />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Scan to Review</h3>
                                    <p className="text-gray-500 text-sm">
                                        Show this QR code to your customers to collect feedback.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <button
                                        onClick={handleCopyLink}
                                        className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
                                    >
                                        <Copy size={16} />
                                        Copy Link
                                    </button>

                                    <button
                                        onClick={handleDownloadQR}
                                        className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>

                                    <button
                                        onClick={handlePrintQR}
                                        className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
                                    >
                                        <Printer size={16} />
                                        Print
                                    </button>

                                    <a
                                        href={feedbackLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
                                    >
                                        <ExternalLink size={16} />
                                        Open Link
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("feed")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "feed" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    Recent Feedback
                </button>
                <button
                    onClick={() => setActiveTab("form")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "form" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    Form Editor
                </button>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="w-full max-w-4xl mx-auto">

                {/* CONTENT AREA */}
                <div className="space-y-6">

                    {activeTab === "feed" ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Recent Feedback</h2>
                            </div>

                            {feedback.length === 0 ? (
                                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
                                        <MessageSquare size={20} />
                                    </div>
                                    <h3 className="text-gray-900 font-medium mb-1">No feedback yet</h3>
                                    <p className="text-gray-500 text-sm">Share your QR code to get your first review!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {feedback.map((fb) => (
                                        <FeedbackCard key={fb.id} feedback={fb} />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Customize Feedback Form</h2>
                                <button onClick={handleSaveForm} disabled={isSaving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                                {formConfig.map((field, index) => (
                                    <div key={field.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-semibold text-gray-700">Field #{index + 1}</h4>
                                            <button onClick={() => removeField(field.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Label / Question</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(field.id, "label", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    placeholder="e.g. What did you order?"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(field.id, "type", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="textarea">Long Text</option>
                                                    <option value="rating">Star Rating (1-5)</option>
                                                    <option value="boolean">Yes / No</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`req-${field.id}`}
                                                checked={field.required}
                                                onChange={(e) => updateField(field.id, "required", e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`req-${field.id}`} className="text-sm text-gray-600">Required Field</label>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={addField} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                                    <span className="text-xl">+</span> Add Custom Field
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}

function FeedbackCard({ feedback }: { feedback: any }) {
    const router = useRouter();
    const isAnonymous = feedback.anonymous;
    const date = new Date(feedback.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    });

    return (
        <div
            onClick={() => router.push(`/owner/feedback/${feedback.id}`)}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                        {isAnonymous ? <Ghost size={20} /> : <User size={20} />}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {isAnonymous ? "Anonymous User" : feedback.full_name || "Customer"}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {date}
                        </p>
                    </div>
                </div>
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={14}
                            className={`${star <= feedback.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Info Badges (if not anonymous) */}
            {!isAnonymous && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {feedback.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-xs border border-gray-100">
                            <Phone size={10} /> {feedback.phone}
                        </span>
                    )}
                    {feedback.email && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-xs border border-gray-100">
                            <Mail size={10} /> {feedback.email}
                        </span>
                    )}
                </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 text-gray-700 text-sm leading-relaxed">
                {feedback.message ? feedback.message : <span className="text-gray-400 italic">No written review provided.</span>}
            </div>
        </div>
    );
}
