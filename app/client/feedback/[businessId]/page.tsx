"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Star, Send, CheckCircle2, User, Phone, Mail, MessageSquare, Camera, Mic, X, Square } from "lucide-react";
import imageCompression from 'browser-image-compression';

export default function ClientFeedbackPage() {
    const supabase = supabaseBrowser;
    const params = useParams();
    // The parameter in the URL is now expected to be the owner's email
    // We handle it safely as a string
    const identifier = (Array.isArray(params?.businessId) ? params.businessId[0] : params?.businessId) as string;

    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [allowPhoto, setAllowPhoto] = useState(false);
    const [allowVideo, setAllowVideo] = useState(false);
    const [allowAudio, setAllowAudio] = useState(false);
    const [ownerEmail, setOwnerEmail] = useState("");

    // Feedback form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState("");
    const [anonymous, setAnonymous] = useState(true);
    const [consent, setConsent] = useState(false);

    // Media Upload State
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Personal Info
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [sex, setSex] = useState("male");
    const [ageRange, setAgeRange] = useState("");

    // Custom Fields State
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [customResponses, setCustomResponses] = useState<Record<string, any>>({});

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (!identifier) return;

        const loadBusiness = async () => {
            setLoading(true);
            try {
                const decodedId = decodeURIComponent(identifier);
                let localBusiness = null;
                let userId: string | null = null;

                // Strategy 1: Check if it's a UUID (Business ID)
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

                if (isUuid) {
                    const { data: bData, error: bError } = await supabase
                        .from("businesses")
                        .select("*")
                        .eq("id", decodedId)
                        .single();

                    if (!bError && bData) {
                        localBusiness = bData;
                        const { data: ub } = await supabase.from('user_business').select('user_id').eq('business_id', decodedId).single();
                        if (ub) userId = ub.user_id;
                    }
                }

                if (!localBusiness && !userId) {
                    // Strategy 2: Lookup Business DIRECTLY by Name
                    const { data: businesses, error: bsError } = await supabase
                        .from("businesses")
                        .select("*")
                        .ilike("name", decodedId);

                    if (!bsError && businesses && businesses.length > 0) {
                        localBusiness = businesses[0];
                        const { data: ub } = await supabase.from('user_business').select('user_id').eq('business_id', localBusiness.id).single();
                        if (ub) userId = ub.user_id;
                    }
                }

                if (!localBusiness && !userId) {
                    // Strategy 3: Lookup Profile by Email or Full Name
                    let query = supabase.from("profiles").select("id, plan_id, email, full_name");

                    if (decodedId.includes('@')) {
                        query = query.eq("email", decodedId);
                    } else {
                        query = query.ilike("full_name", decodedId);
                    }

                    const { data: profiles, error: pError } = await query;

                    if (!pError && profiles && profiles.length > 0) {
                        const profile = profiles[0];
                        userId = profile.id;
                        if (profile.email) setOwnerEmail(profile.email);
                    }
                }

                if (!localBusiness && !userId) {
                    throw new Error("Impossible de trouver le propriétaire ou le business.");
                }

                if (!localBusiness) {
                    const { data: ub } = await supabase.from('user_business').select('business_id').eq('user_id', userId).single();
                    if (!ub) throw new Error("Aucun business associé.");

                    const { data: b } = await supabase.from('businesses').select('*').eq('id', ub.business_id).single();
                    if (!b) throw new Error("Business introuvable.");
                    localBusiness = b;
                }

                let planPerms = { allow_photo: false, allow_video: false, allow_audio: false };
                const planToUse = localBusiness.plan_id;

                if (planToUse) {
                    const { data: plan } = await supabase
                        .from("subscription_plans")
                        .select("allow_photo, allow_video, allow_audio")
                        .eq("id", planToUse)
                        .single();
                    if (plan) planPerms = plan;
                } else if (userId) {
                    const { data: profile } = await supabase.from('profiles').select('plan_id').eq('id', userId).single();
                    if (profile?.plan_id) {
                        const { data: plan } = await supabase
                            .from("subscription_plans")
                            .select("allow_photo, allow_video, allow_audio")
                            .eq("id", profile.plan_id)
                            .single();
                        if (plan) planPerms = plan;
                    }
                }

                setBusiness(localBusiness);
                setAllowPhoto(!!(planPerms.allow_photo && localBusiness.allow_photo === true));
                setAllowVideo(!!(planPerms.allow_video && localBusiness.allow_video === true));
                setAllowAudio(!!(planPerms.allow_audio && localBusiness.allow_audio === true));

                setLoading(false);

            } catch (err: any) {
                console.error("Load Error:", err);
                setError(err.message || "Erreur de chargement.");
                setLoading(false);
            }
        };

        loadBusiness();
    }, [identifier]);

    // Separate effect to init custom fields when business is set
    useEffect(() => {
        if (business && business.form_config && Array.isArray(business.form_config)) {
            setCustomFields(business.form_config);
            const initials: Record<string, any> = {};
            business.form_config.forEach((f: any) => {
                if (f.type === 'boolean') initials[f.id] = false;
                else initials[f.id] = "";
            });
            setCustomResponses(initials);
        }
    }, [business]);

    const handleCustomResponseChange = (id: string, value: any) => {
        setCustomResponses(prev => ({ ...prev, [id]: value }));
    };

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            setError("File size too large (max 20MB)");
            return;
        }

        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setError(""); // Clear error if any
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const options: MediaRecorderOptions = {
                audioBitsPerSecond: 32000,
                mimeType: 'audio/webm;codecs=opus'
            };

            if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
                // simple fallback
                delete options.mimeType;
            }

            mediaRecorderRef.current = new MediaRecorder(stream, options);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                // Determine extension based on mimeType
                const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

                const blob = new Blob(chunksRef.current, { type: mimeType });
                const file = new File([blob], `recording.${ext}`, { type: mimeType });

                setMediaFile(file);
                setMediaPreview(URL.createObjectURL(file));

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please allow permission.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        if (mediaPreview) URL.revokeObjectURL(mediaPreview);
        setMediaPreview(null);

        // If we are currently recording, stop it
        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
        setRecordingTime(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }

        if (!consent) {
            setError("Veuillez accepter le traitement de vos données.");
            return;
        }

        // Validate required custom fields
        for (const field of customFields) {
            if (field.required && !customResponses[field.id]) {
                if (field.type === 'boolean' && field.required && customResponses[field.id] !== true) {
                    setError(`Please check ${field.label}`);
                    return;
                }
                if (field.type !== 'boolean' && (customResponses[field.id] === "" || customResponses[field.id] === undefined)) {
                    setError(`Please answer: ${field.label}`);
                    return;
                }
            }
        }

        if (!business) return;
        setUploading(true);

        try {
            let mediaUrl = null;

            // Upload Media if exists
            if (mediaFile) {
                let fileToUpload = mediaFile;

                // Compress if image
                if (fileToUpload.type.startsWith('image')) {
                    try {
                        const options = {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true
                        };
                        fileToUpload = await imageCompression(fileToUpload, options);
                    } catch (error) {
                        console.error("Compression ended with error:", error);
                    }
                }

                const ext = fileToUpload.name.split('.').pop() || 'media';
                const fileName = `${business.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('feedback-media')
                    .upload(fileName, fileToUpload);

                if (uploadError) {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                const { data: urlData } = supabase.storage
                    .from('feedback-media')
                    .getPublicUrl(fileName);

                mediaUrl = urlData.publicUrl;
            }

            const payload = {
                business_id: business.id,
                rating,
                message,
                anonymous,
                full_name: anonymous ? null : fullName || null,
                phone: anonymous ? null : phone || null,
                email: anonymous ? null : email || null,
                sex: anonymous ? null : sex,
                custom_responses: { ...customResponses, age_range: anonymous ? null : ageRange },
                media_url: mediaUrl
            };

            const { error: insertError } = await supabase.from("feedback").insert(payload);

            if (insertError) {
                throw insertError;
            } else {
                // ALSO SAVE TO CLIENTS (Code backup for trigger)
                if (!anonymous && phone) {
                    await supabase.from("clients").upsert({
                        full_name: fullName,
                        phone: phone,
                        email: email,
                        sex: sex,
                        last_seen_at: new Date().toISOString()
                    }, { onConflict: 'phone' });
                }

                setSuccess(true);
                // Reset form
                setMessage("");
                setRating(0);
                setCustomResponses({});
                removeMedia();
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setUploading(false);
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
                    {ownerEmail && (
                        <div className="flex justify-center mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                <User size={10} className="text-slate-400" />
                                {ownerEmail}
                            </span>
                        </div>
                    )}
                    <p className="mt-2 text-gray-500">
                        We value your opinion. Please rate your experience.
                    </p>
                </div>

                {/* FORM CARD */}
                <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* 1. IDENTITY SECTION - FIRST */}
                        <div className="space-y-4">
                            {/* ANONYMOUS TOGGLE */}
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">Rester Anonyme</span>
                                    <span className="text-xs text-gray-500">Votre identité sera masquée</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAnonymous(!anonymous)}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${anonymous ? 'bg-slate-700' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${anonymous ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* ALWAYS VISIBLE DEMOGRAPHICS */}
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1">Genre</label>
                                    <select
                                        value={sex}
                                        onChange={(e) => setSex(e.target.value)}
                                        className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                                    >
                                        <option value="male">Homme</option>
                                        <option value="female">Femme</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1">Tranche d'âge</label>
                                    <select
                                        value={ageRange}
                                        onChange={(e) => setAgeRange(e.target.value)}
                                        className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                                    >
                                        <option value="">Sél.</option>
                                        <option value="-18">-18</option>
                                        <option value="18-24">18-24</option>
                                        <option value="25-34">25-34</option>
                                        <option value="35-44">35-44</option>
                                        <option value="45-54">45-54</option>
                                        <option value="55-64">55-64</option>
                                        <option value="65+">65+</option>
                                    </select>
                                </div>
                            </div>

                            {/* USER CONTACT DETAILS - HIDDEN WHEN ANONYMOUS */}
                            <div className={`space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${!anonymous ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1">Nom complet</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <User size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="Votre nom"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1">Téléphone</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <Phone size={16} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                    placeholder="05..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1">Email</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <Mail size={16} />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                    placeholder="Email"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* 3. MESSAGE & EXTRAS */}
                        <div className="space-y-4 pt-2">
                            {/* CUSTOM FORM FIELDS */}
                            {customFields.length > 0 && (
                                <div className="space-y-3">
                                    {customFields.map((field) => (
                                        <div key={field.id} className="space-y-0.5">
                                            <label className="block text-xs font-semibold text-gray-600">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </label>

                                            {field.type === 'text' && (
                                                <input
                                                    type="text"
                                                    value={customResponses[field.id] || ""}
                                                    onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                                                    className="block w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                                />
                                            )}

                                            {field.type === 'textarea' && (
                                                <textarea
                                                    value={customResponses[field.id] || ""}
                                                    onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                                                    rows={2}
                                                    className="block w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                                />
                                            )}

                                            {field.type === 'boolean' && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCustomResponseChange(field.id, !customResponses[field.id])}
                                                        className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${customResponses[field.id] ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'}`}
                                                    >
                                                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                                    </button>
                                                    <span className="text-xs text-gray-500">{customResponses[field.id] ? "Oui" : "Non"}</span>
                                                </div>
                                            )}

                                            {field.type === 'rating' && (
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleCustomResponseChange(field.id, val)}
                                                            className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${customResponses[field.id] === val ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                        >
                                                            {val}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>


                        {/* MEDIA UPLOAD SECTION */}
                        {(allowPhoto || allowVideo || allowAudio) && (
                            <div className="space-y-1">

                                <div className="grid grid-cols-2 gap-3">
                                    {/* PHOTO / VIDEO UPLOAD */}
                                    {(allowPhoto || allowVideo) && (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept={`${allowPhoto ? 'image/*' : ''}${allowPhoto && allowVideo ? ',' : ''}${allowVideo ? 'video/*' : ''}`}
                                                onChange={handleMediaChange}
                                                className="hidden"
                                                id="media-upload"
                                            />
                                            {!mediaPreview && !mediaFile ? (
                                                <label
                                                    htmlFor="media-upload"
                                                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all group h-full"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                                                        <Camera size={20} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500">
                                                        {allowPhoto && allowVideo ? "Photo/Vidéo" : allowPhoto ? "Photo" : "Vidéo"}
                                                    </span>
                                                </label>
                                            ) : (
                                                <div className="relative rounded-xl overflow-hidden border border-gray-200 h-28 bg-black/5 group">
                                                    {mediaFile?.type.startsWith('video') ? (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                            <span className="text-xs">Vidéo sélectionnée</span>
                                                        </div>
                                                    ) : (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={mediaPreview || ""} alt="Preview" className="w-full h-full object-cover" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={removeMedia}
                                                        className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 shadow-sm hover:bg-red-50"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* AUDIO RECORDING */}
                                    {allowAudio && (
                                        <div className="relative">
                                            {!isRecording && !mediaFile?.type.startsWith('audio') ? (
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="w-full h-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 hover:border-rose-300 transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                                                        <Mic size={20} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500">Enregistrer Vocal</span>
                                                </button>
                                            ) : isRecording ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-4 border-2 border-rose-500 bg-rose-50 rounded-xl animate-pulse cursor-pointer" onClick={stopRecording}>
                                                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center mb-2 shadow-lg shadow-rose-200">
                                                        <Square size={16} fill="currentColor" />
                                                    </div>
                                                    <span className="text-xs font-bold text-rose-600 font-mono">
                                                        00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                                                    </span>
                                                    <span className="text-[10px] text-rose-400 mt-1">Appuyer pour stop</span>
                                                </div>
                                            ) : (
                                                // Audio Preview (Recorded)
                                                <div className="relative w-full h-full flex flex-col items-center justify-center p-4 border border-rose-200 bg-rose-50 rounded-xl">
                                                    <div className="text-rose-600 font-bold text-xs mb-1">Audio Enregistré</div>
                                                    <button
                                                        type="button"
                                                        onClick={removeMedia}
                                                        className="absolute top-1 right-1 bg-white/50 p-1 rounded-full text-red-500 hover:bg-white"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* RATING (AFTER MESSAGE) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider ml-1">Note Générale</label>
                            <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Notez votre expérience</span>
                                <div className="flex items-center gap-1">
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
                                                size={24}
                                                className={`${(hoverRating || rating) >= star
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-gray-200 fill-gray-50"
                                                    } transition-colors duration-200`}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CONSENT CHECKBOX */}
                        <div className="flex items-start gap-3 p-2">
                            <div className="flex h-6 items-center">
                                <button
                                    type="button"
                                    onClick={() => setConsent(!consent)}
                                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${consent ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}
                                >
                                    {consent && <CheckCircle2 size={12} className="text-white" />}
                                </button>
                            </div>
                            <div className="text-sm">
                                <label onClick={() => setConsent(!consent)} className="font-medium text-gray-700 cursor-pointer select-none">
                                    J'accepte que mes données soient traitées
                                </label>
                                <p className="text-gray-500 text-xs">Ces informations sont transmises uniquement au propriétaire du commerce.</p>
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
                            disabled={uploading}
                            className={`w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 px-4 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-md ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <span>{uploading ? 'Envoi...' : 'Envoyer'}</span>
                            <Send size={18} />
                        </button>
                    </form>
                </div>


                <p className="text-center text-xs text-gray-400">
                    Powered Feedback by Jobber
                </p>
            </div>
        </div>
    );
}


