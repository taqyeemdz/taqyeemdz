"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Star, Send, CheckCircle2, User, Phone, Mail, MessageSquare, Camera, Video, Mic, X, Square, ChevronDown } from "lucide-react";
import imageCompression from 'browser-image-compression';

const ALGERIAN_WILAYAS = [
    "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
    "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
    "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
    "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
    "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
    "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
    "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
    "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
    "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
    "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - Timimoun", "50 - Bordj Badji Mokhtar",
    "51 - Ouled Djellal", "52 - Béni Abbès", "53 - In Salah", "54 - In Guezzam", "55 - Touggourt",
    "56 - Djanet", "57 - El M'Ghair", "58 - El Meniaa"
];

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
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
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
    const [sex, setSex] = useState("");
    const [ageRange, setAgeRange] = useState("");
    const [wilaya, setWilaya] = useState("");

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

    // Auto-stop audio at 30 seconds
    useEffect(() => {
        if (isRecording && recordingTime >= 30) {
            stopRecording();
        }
    }, [recordingTime, isRecording]);

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
                const decodedId = decodeURIComponent(identifier).trim();
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
                const planIdToUse = localBusiness.plan_id;

                if (planIdToUse) {
                    const { data: plan } = await supabase
                        .from("subscription_plans")
                        .select("allow_photo, allow_video, allow_audio")
                        .eq("id", planIdToUse)
                        .single();
                    if (plan) planPerms = plan;
                }

                setBusiness(localBusiness);
                setAllowPhoto(!!(planPerms.allow_photo && localBusiness.allow_photo));
                setAllowVideo(!!(planPerms.allow_video && localBusiness.allow_video));
                setAllowAudio(!!(planPerms.allow_audio && localBusiness.allow_audio));

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
                if (f.type === 'boolean') initials[f.id] = null;
                else initials[f.id] = "";
            });
            setCustomResponses(initials);
        }
    }, [business]);

    const handleCustomResponseChange = (id: string, value: any) => {
        setCustomResponses(prev => ({ ...prev, [id]: value }));
    };

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (mediaFiles.length + files.length > 4) {
            setError("Vous ne pouvez pas ajouter plus de 4 médias (photos, vidéos ou audio).");
            return;
        }

        // Filter valid files and limit total size/count if needed
        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        files.forEach(file => {
            const isVideo = file.type.startsWith('video');
            const limit = 20 * 1024 * 1024; // 20MB

            if (file.size > limit) {
                if (isVideo) {
                    setError("Attention : la vidéo dépasse la limite de 20Mo.");
                } else {
                    setError(`Le fichier "${file.name}" est trop lourd (max 20Mo).`);
                }
                return;
            }
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        setMediaFiles(prev => [...prev, ...validFiles]);
        setMediaPreviews(prev => [...prev, ...newPreviews]);
        setError("");
    };

    const startRecording = async () => {
        if (mediaFiles.length >= 4) {
            setError("Vous avez atteint la limite de 4 médias.");
            return;
        }
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

                setMediaFiles(prev => [...prev, file]);
                setMediaPreviews(prev => [...prev, URL.createObjectURL(file)]);

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

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));

        // Revoke URL to avoid memory leaks
        URL.revokeObjectURL(mediaPreviews[index]);
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));

        // If we are currently recording and removing the generic "last" item, stop it?
        // Actually, recording only happens when adding new.
        if (isRecording) { // If user cancels recording before it finishes
            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTime(0);
        }
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

        // Validate required demographics (sex and age_range are always required)
        if (!sex || sex === "") {
            setError("Veuillez sélectionner votre genre.");
            return;
        }

        if (!ageRange || ageRange === "") {
            setError("Veuillez sélectionner votre tranche d'âge.");
            return;
        }

        if (!wilaya || wilaya === "") {
            setError("Veuillez sélectionner votre wilaya.");
            return;
        }

        // Validate required custom fields
        for (const field of customFields) {
            const response = customResponses[field.id];
            if (field.required) {
                if (field.type === 'boolean') {
                    if (response === null || response === undefined) {
                        setError(`Veuillez répondre à : ${field.label}`);
                        return;
                    }
                } else if (!response || response === "") {
                    setError(`Veuillez répondre à : ${field.label}`);
                    return;
                }
            }
        }

        // Validate required media
        if (business) {
            const hasPhoto = mediaFiles.some(f => f.type.startsWith('image'));
            const hasVideo = mediaFiles.some(f => f.type.startsWith('video'));
            const hasAudio = mediaFiles.some(f => f.type.startsWith('audio'));

            if (allowPhoto && business.require_photo && !hasPhoto) {
                setError("Photo requise.");
                return;
            }
            if (allowVideo && business.require_video && !hasVideo) {
                setError("Vidéo requise.");
                return;
            }
            if (allowAudio && business.require_audio && !hasAudio) {
                setError("Audio requise.");
                return;
            }
        }

        if (!business) return;
        setUploading(true);

        try {
            const uploadedUrls: string[] = [];

            // Upload Media if exists
            if (mediaFiles.length > 0) {
                for (const file of mediaFiles) {
                    let fileToUpload = file;

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

                    const { error: uploadError } = await supabase.storage
                        .from('feedback-media')
                        .upload(fileName, fileToUpload);

                    if (uploadError) {
                        throw new Error(`Upload failed: ${uploadError.message}`);
                    }

                    const { data: urlData } = supabase.storage
                        .from('feedback-media')
                        .getPublicUrl(fileName);

                    uploadedUrls.push(urlData.publicUrl);
                }
            }

            // Fallback for single media_url compatibility
            const primaryMediaUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : null;

            const payload = {
                business_id: business.id,
                rating,
                message,
                anonymous,
                full_name: anonymous ? null : fullName || null,
                phone: anonymous ? null : phone || null,
                email: anonymous ? null : email || null,
                sex: sex || null, // Always save sex, even if anonymous
                age_range: ageRange || null, // Always save age_range, even if anonymous
                wilaya: wilaya || null,
                custom_responses: {
                    ...customResponses,
                    // Keep in custom_responses for backward compatibility
                    age_range: ageRange || null,
                    wilaya: wilaya || null,
                    _media_urls: uploadedUrls // Store multiple medias here to avoid schema dependency
                },
                media_url: primaryMediaUrl // Backward compatibility
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
                setMediaFiles([]);
                setMediaPreviews([]);
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

                {/* BRAND LOGO AT THE TOP */}
                {business.owner_logo_url && (
                    <div className="flex justify-center mb-8">
                        <div className="w-28 h-28 rounded-3xl bg-white shadow-xl border border-slate-50 overflow-hidden flex items-center justify-center">
                            <img
                                src={business.owner_logo_url}
                                alt={business.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* HEADLINE */}
                <div className="text-center space-y-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {business.name}
                        </h1>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                            Votre avis nous aide à nous améliorer. Merci de partager votre expérience.
                        </p>
                    </div>
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

                            {/* RATING SECTION */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1">Note Générale</label>
                                <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Votre évaluation</span>
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

                            {/* ALWAYS VISIBLE DEMOGRAPHICS - UNDER NOTE GENERAL */}
                            <div className="pt-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider ml-1">
                                            Genre <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="sex-select"
                                                value={sex}
                                                onChange={(e) => setSex(e.target.value)}
                                                className="block w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">Genre</option>
                                                <option value="male">H</option>
                                                <option value="female">F</option>
                                            </select>
                                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider ml-1">
                                            Âge <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="age-select"
                                                value={ageRange}
                                                onChange={(e) => setAgeRange(e.target.value)}
                                                className="block w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">Âge</option>
                                                <option value="-18">-18</option>
                                                <option value="18-24">18-24</option>
                                                <option value="25-34">25-34</option>
                                                <option value="35-44">35-44</option>
                                                <option value="45-54">45-54</option>
                                                <option value="55-64">55-64</option>
                                                <option value="65+">+65</option>
                                            </select>
                                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider ml-1">
                                            Wilaya <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="wilaya-select"
                                                value={wilaya}
                                                onChange={(e) => setWilaya(e.target.value)}
                                                className="block w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">Wilaya</option>
                                                {ALGERIAN_WILAYAS.map(w => (
                                                    <option key={w} value={w}>{w.split(' - ')[0]}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* 3. MESSAGE & EXTRAS */}
                        <div className="space-y-4 pt-2">
                            {/* MEDIA UPLOAD SECTION - MOVED UP FOR BETTER VISIBILITY */}
                            {(allowPhoto || allowVideo || allowAudio) && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-1 flex items-center gap-1.5">
                                            <Camera size={12} className="text-indigo-400" />
                                            Medias
                                        </label>
                                    </div>
                                    <div className="space-y-4">
                                        {mediaFiles.length < 4 ? (
                                            <div className="flex flex-wrap items-center justify-start gap-3">
                                                {/* PHOTO UPLOAD */}
                                                {allowPhoto && (
                                                    <div className="flex flex-col items-center">
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleMediaChange}
                                                            className="hidden"
                                                            id="photo-upload"
                                                        />
                                                        <label
                                                            htmlFor="photo-upload"
                                                            className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-white hover:border-indigo-400 transition-all group shadow-sm active:scale-[0.98]"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-white text-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-50 transition-all shadow-sm border border-indigo-50">
                                                                <Camera size={16} />
                                                            </div>
                                                            <span className="text-[8px] font-bold text-slate-500 text-center uppercase tracking-tighter mt-1">
                                                                Photos
                                                                {business.require_photo && <span className="text-red-500 ml-0.5">*</span>}
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* VIDEO UPLOAD */}
                                                {allowVideo && (
                                                    <div className="flex flex-col items-center">
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="video/*"
                                                            onChange={handleMediaChange}
                                                            className="hidden"
                                                            id="video-upload"
                                                        />
                                                        <label
                                                            htmlFor="video-upload"
                                                            className="w-20 h-20 relative flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-white hover:border-amber-400 transition-all group shadow-sm active:scale-[0.98]"
                                                        >
                                                            <div className="absolute top-1 right-1 px-1 bg-amber-100 text-amber-700 text-[7px] font-black rounded-md border border-amber-200">
                                                                45s
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-white text-amber-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-50 transition-all shadow-sm border border-amber-50">
                                                                <Video size={16} />
                                                            </div>
                                                            <span className="text-[8px] font-bold text-slate-500 text-center uppercase tracking-tighter mt-1">
                                                                Vidéos
                                                                {business.require_video && <span className="text-red-500 ml-0.5">*</span>}
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* AUDIO RECORDING */}
                                                {allowAudio && (
                                                    <div className="flex flex-col items-center">
                                                        {!isRecording ? (
                                                            <button
                                                                type="button"
                                                                onClick={startRecording}
                                                                className="w-20 h-20 relative flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-slate-50/50 hover:bg-white hover:border-rose-400 transition-all group shadow-sm active:scale-[0.98]"
                                                            >
                                                                <div className="absolute top-1 right-1 px-1 bg-rose-100 text-rose-700 text-[7px] font-black rounded-md border border-rose-200">
                                                                    30s
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-50 transition-all shadow-sm border border-rose-50">
                                                                    <Mic size={16} />
                                                                </div>
                                                                <span className="text-[8px] font-bold text-slate-500 text-center uppercase tracking-tighter mt-1">
                                                                    Vocal
                                                                    {business.require_audio && <span className="text-red-500 ml-0.5">*</span>}
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <div className="w-20 h-20 flex flex-col items-center justify-center border-2 border-rose-500 bg-rose-50 rounded-xl shadow-lg shadow-rose-100 animate-pulse cursor-pointer" onClick={stopRecording}>
                                                                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center mb-1 shadow-lg shadow-rose-200">
                                                                    <Square size={10} fill="currentColor" />
                                                                </div>
                                                                <span className="text-[8px] font-black text-rose-600 font-mono tracking-tighter">
                                                                    00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                                                                </span>
                                                                <span className="text-[7px] text-rose-400 uppercase font-black">STOP</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                                                <p className="text-xs font-bold text-amber-600">Limite de 4 médias atteinte.</p>
                                            </div>
                                        )}

                                        {/* PREVIEWS LIST */}
                                        {mediaFiles.length > 0 && (
                                            <div className="grid grid-cols-5 gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                                                {mediaFiles.map((file, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white bg-white shadow-sm group">
                                                        {file.type.startsWith('video') ? (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-slate-100">
                                                                <span className="text-[9px] font-black uppercase">Vidéo</span>
                                                            </div>
                                                        ) : file.type.startsWith('audio') ? (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 bg-rose-50">
                                                                <Mic size={14} />
                                                                <span className="text-[8px] mt-0.5 font-black uppercase">Audio</span>
                                                            </div>
                                                        ) : (
                                                            <img src={mediaPreviews[idx]} alt="Preview" className="w-full h-full object-cover" />
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMedia(idx)}
                                                            className="absolute top-1 right-1 bg-white shadow-md p-1.5 rounded-full text-rose-500 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <X size={10} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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

                                            {(field.type === 'textarea' || field.type === 'message') && (
                                                <textarea
                                                    value={customResponses[field.id] || ""}
                                                    onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                                                    rows={2}
                                                    className="block w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                                />
                                            )}

                                            {field.type === 'boolean' && (
                                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 mt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCustomResponseChange(field.id, true)}
                                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${customResponses[field.id] === true
                                                            ? 'bg-white text-emerald-600 shadow-sm border border-gray-100'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        OUI
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCustomResponseChange(field.id, false)}
                                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${customResponses[field.id] === false
                                                            ? 'bg-white text-rose-500 shadow-sm border border-gray-100'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        NON
                                                    </button>
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

                                            {field.type === 'choice' && (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {(field.options || []).map((opt: string, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleCustomResponseChange(field.id, opt)}
                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${customResponses[field.id] === opt
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

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
                </div >


                <p className="text-center text-xs text-gray-400">
                    Powered by Jobber
                </p>
            </div >
        </div >
    );
}


