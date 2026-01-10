"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Star, Send, CheckCircle2, User, Phone, Mail, MessageSquare, Camera, Mic, X, Square } from "lucide-react";
import imageCompression from 'browser-image-compression';

export default function ClientFeedbackPage() {
    const supabase = supabaseBrowser;
    const params = useParams();
    const businessId = params.businessId as string;

    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [allowMedia, setAllowMedia] = useState(false);
    const [allowAudio, setAllowAudio] = useState(false);

    // Feedback form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState("");
    const [anonymous, setAnonymous] = useState(true);

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

                // Fetch owner's plan features
                const { data: ownerLink } = await supabase
                    .from("user_business")
                    .select("user_id")
                    .eq("business_id", businessId)
                    .single();

                if (ownerLink) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("plan_id")
                        .eq("id", ownerLink.user_id)
                        .single();

                    if (profile?.plan_id) {
                        const { data: plan } = await supabase
                            .from("subscription_plans")
                            .select("allow_media, allow_audio")
                            .eq("id", profile.plan_id)
                            .single();

                        setAllowMedia(!!plan?.allow_media);
                        setAllowAudio(!!plan?.allow_audio);
                    }
                }

                // Initialize Custom Fields
                if (data.form_config && Array.isArray(data.form_config)) {
                    setCustomFields(data.form_config);
                    // Init responses
                    const initials: Record<string, any> = {};
                    data.form_config.forEach((f: any) => {
                        if (f.type === 'boolean') initials[f.id] = false;
                        else initials[f.id] = "";
                    });
                    setCustomResponses(initials);
                }
            }
            setLoading(false);
        };

        loadBusiness();
    }, [businessId]);

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
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], "recording.webm", { type: 'audio/webm' });
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

        if (!businessId) return;
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
                const fileName = `${businessId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

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
                business_id: businessId,
                rating,
                message,
                anonymous,
                full_name: anonymous ? null : fullName || null,
                phone: anonymous ? null : phone || null,
                email: anonymous ? null : email || null,
                sex: anonymous ? null : sex,
                custom_responses: customResponses,
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

                        {/* CUSTOM FORM FIELDS */}
                        {customFields.length > 0 && (
                            <div className="space-y-4 border-t border-b border-gray-100 py-4">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Additional Questions</h3>
                                {customFields.map((field) => (
                                    <div key={field.id} className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>

                                        {field.type === 'text' && (
                                            <input
                                                type="text"
                                                value={customResponses[field.id] || ""}
                                                onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                                                className="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                            />
                                        )}

                                        {field.type === 'textarea' && (
                                            <textarea
                                                value={customResponses[field.id] || ""}
                                                onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                                                rows={3}
                                                className="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                                            />
                                        )}

                                        {field.type === 'boolean' && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCustomResponseChange(field.id, !customResponses[field.id])}
                                                    className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${customResponses[field.id] ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'}`}
                                                >
                                                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                                </button>
                                                <span className="text-sm text-gray-600">{customResponses[field.id] ? "Yes" : "No"}</span>
                                            </div>
                                        )}

                                        {field.type === 'rating' && (
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => handleCustomResponseChange(field.id, val)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${customResponses[field.id] === val ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
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

                        {(allowMedia || allowAudio) && (
                            <div className="space-y-4 border-t border-b border-gray-100 py-4">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                    {allowMedia && allowAudio ? "Photo, Video or Audio" : allowMedia ? "Photo or Video" : "Audio"}
                                </h3>

                                {!mediaPreview && !isRecording ? (
                                    <div className={`grid ${allowMedia && allowAudio ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                                        {allowMedia && (
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Camera className="w-8 h-8 text-indigo-400 mb-2" />
                                                    <p className="text-sm font-medium text-gray-600">Upload File</p>
                                                    <p className="text-xs text-gray-400 mt-1">Image, Video{allowAudio ? ", Audio" : ""}</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept={allowAudio ? "image/*,video/*,audio/*" : "image/*,video/*"}
                                                    onChange={handleMediaChange}
                                                />
                                            </label>
                                        )}

                                        {allowAudio && (
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50 hover:border-red-200 transition-colors group"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                        <Mic className="w-6 h-6 text-red-500" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-600 group-hover:text-red-500">Record Audio</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                ) : isRecording ? (
                                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-red-200 border-dashed rounded-xl bg-red-50 animate-pulse">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-red-600 font-bold text-lg">
                                                Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                                        >
                                            <Square size={16} fill="currentColor" />
                                            Stop Recording
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                                        <button
                                            type="button"
                                            onClick={removeMedia}
                                            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                                        >
                                            <X size={16} />
                                        </button>

                                        {mediaFile?.type.startsWith('video') ? (
                                            <video
                                                src={mediaPreview || ""}
                                                controls
                                                className="w-full max-h-64 object-contain"
                                            />
                                        ) : mediaFile?.type.startsWith('audio') ? (
                                            <div className="w-full p-6 bg-gray-100 flex items-center justify-center min-h-[100px]">
                                                <audio
                                                    src={mediaPreview || ""}
                                                    controls
                                                    className="w-full"
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                src={mediaPreview || ""}
                                                alt="Preview"
                                                className="w-full max-h-64 object-contain"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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
                            disabled={uploading}
                            className={`w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 px-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-md ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <span>{uploading ? 'Sending...' : 'Send Feedback'}</span>
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


