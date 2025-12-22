"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client"; import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  Trash2,
  AlertTriangle,
  QrCode,
  Download,
  ExternalLink,
  User,
  Ghost,
  Calendar,
  Star,
  X,
  MessageSquare,
  Send
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function BusinessDetailPage() {
  const supabase = supabaseBrowser; const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [showQrInline, setShowQrInline] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'preview'>('feedback');
  const [stats, setStats] = useState({
    avg: 0,
    count: 0,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);

      // ⭐ Fetch business including owner via join
      const { data: b, error } = await supabase
        .from("businesses")
        .select(`
          id, name, phone, address, category, created_at,
          user_business (
            profiles (full_name, email, plan_id)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) console.error("Error fetching business:", error);

      // Flatten owner info
      const rawOwner = b?.user_business?.[0]?.profiles;
      const owner = Array.isArray(rawOwner) ? rawOwner[0] : rawOwner;

      const businessData = b ? {
        ...b,
        owner_name: owner?.full_name,
        email: owner?.email // Use owner email as fallback or primary if business email doesn't exist
      } : null;

      setBusiness(businessData);

      // ⭐ Fetch feedback
      const { data: fb } = await supabase
        .from("feedback")
        .select("id, rating, message, created_at")
        .eq("business_id", id)
        .order("created_at", { ascending: false });

      setFeedback(fb || []);

      // ⭐ Stats
      const { data: avg } = await supabase.rpc("avg_feedback_for_business", {
        bid: id,
      });

      const { count } = await supabase
        .from("feedback")
        .select("*", { head: true, count: "exact" })
        .eq("business_id", id);

      setStats({
        avg: avg || 0,
        count: count || 0,
      });

      setLoading(false);
    })();
  }, [id, supabase]);


  // ========================= LOADING / NOT FOUND =========================

  if (loading) {
    return (
      <div className="p-6 text-[var(--muted-foreground)]">
        Loading business details...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 text-[var(--muted-foreground)]">
        Business not found or you don't have permission.
      </div>
    );
  }

  // ========================= PAGE =========================

  return (
    <div className="mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-5xl">

      {/* 🔙 NAV & DENSE HEADER */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors w-fit px-1 font-bold text-sm"
        >
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Back to Businesses</span>
        </button>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden group transition-all duration-500">
          {/* Subtle Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 md:gap-6 min-w-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
                <Building2 size={32} className="md:w-10 md:h-10" />
              </div>
              <div className="min-w-0 pt-1">
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 truncate leading-tight">
                  {business.name}
                </h1>

                <div className="flex flex-wrap gap-2 mt-3">
                  {business.address && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-black border border-gray-100 tracking-tight">
                      <MapPin size={12} className="text-indigo-400" /> {business.address}
                    </span>
                  )}
                  {business.phone && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-black border border-gray-100 tracking-tight">
                      <Phone size={12} className="text-indigo-400" /> {business.phone}
                    </span>
                  )}
                  {business.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100 tracking-widest uppercase">
                      {business.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => setShowQrInline(!showQrInline)}
                className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-lg ${showQrInline ? 'bg-indigo-50 text-indigo-600 shadow-indigo-50' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
                title="Business QR Code"
              >
                {showQrInline ? <X size={24} /> : <QrCode size={24} />}
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white text-red-500 border border-red-100 rounded-2xl hover:bg-red-50 transition-all shadow-sm"
                title="Delete Business"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          {/* QR EXPANSION SECTION */}
          {showQrInline && (
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 animate-in slide-in-from-top-4 duration-500 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden border border-slate-100">
              <div className="bg-white p-4 rounded-[2rem] border-2 border-indigo-50 shadow-xl inline-block transition-transform hover:scale-105 duration-300">
                <QRCodeCanvas
                  id="business-qr-inline"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/client/feedback/${id}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Feedback Display</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Direct Link</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <button
                    onClick={() => {
                      const canvas = document.getElementById('business-qr-inline') as HTMLCanvasElement;
                      if (canvas) {
                        const url = canvas.toDataURL("image/png");
                        const link = document.createElement('a');
                        link.download = `QR_${business.name.replace(/\s+/g, '_')}.png`;
                        link.href = url;
                        link.click();
                      }
                    }}
                    className="flex-1 max-w-[200px] bg-gray-900 text-white rounded-xl py-3 font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
                  >
                    <Download size={16} />
                    DOWNLOAD PNG
                  </button>
                  <a
                    href={`${typeof window !== 'undefined' ? window.location.origin : ''}/client/feedback/${id}`}
                    target="_blank"
                    className="p-3 bg-white text-gray-400 rounded-xl hover:text-indigo-600 border border-gray-100 transition-all active:scale-95"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic opacity-60">
                  Tip: Place this QR code on tables or at the checkout.
                </p>
              </div>
            </div>
          )}

          {/* PERFORMANCE STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-gray-900">{stats.avg.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={`${star <= stats.avg ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-100"}`}
                      strokeWidth={1}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Reviews</p>
              <p className="text-2xl font-black text-gray-900">{stats.count}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Owner</p>
              <p className="text-sm font-black text-indigo-600 truncate">{business.owner_name || "Enterprise"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-lg uppercase tracking-wide border border-green-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-8 border-b border-gray-100 px-2">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-4 text-sm font-black transition-all relative ${activeTab === 'feedback' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          Recent Feedback
          {activeTab === 'feedback' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-4 text-sm font-black transition-all relative ${activeTab === 'preview' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          Form Preview
          {activeTab === 'preview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {
        activeTab === 'feedback' ? (
          <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Public Reviews</h2>
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {feedback.length} TOTAL
              </span>
            </div>

            {feedback.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center">
                <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold mb-1">No reviews yet.</p>
                <p className="text-xs text-gray-400">Share your QR code to start collecting feedback.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {feedback.map((fb) => {
                  const isAnonymous = fb.anonymous;
                  const date = new Date(fb.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <div
                      key={fb.id}
                      className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isAnonymous ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                            {isAnonymous ? <Ghost size={24} /> : <User size={24} />}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                              {isAnonymous ? "Anonymous User" : fb.full_name || "Customer"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                              <Calendar size={12} className="text-indigo-300" /> {date}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={`${star <= fb.rating ? "fill-amber-400 text-amber-400" : "fill-gray-50 text-gray-100"}`}
                              strokeWidth={star <= fb.rating ? 2 : 1}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Info Badges (if not anonymous) */}
                      {!isAnonymous && (fb.phone || fb.email) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {fb.phone && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black border border-slate-100 tracking-tight">
                              <Phone size={10} /> {fb.phone}
                            </span>
                          )}
                          {fb.email && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black border border-slate-100 tracking-tight">
                              <Mail size={10} /> {fb.email}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="bg-slate-50/50 rounded-2xl p-4 text-slate-700 text-sm font-medium leading-relaxed border border-transparent group-hover:border-slate-100 transition-colors italic">
                        "{fb.message || "No written review provided."}"
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
            <div className="text-center space-y-2">
              <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 inline-block">
                LIVE PREVIEW MODE
              </div>
              <p className="text-sm text-gray-400 font-medium">This is exactly what your customers see when they scan your QR code.</p>
            </div>

            <div className="bg-white py-10 px-8 border border-gray-100 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <div className="space-y-10">
                {/* Headline Preview */}
                <div className="text-center">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{business.name}</h1>
                  <p className="text-gray-500 mt-2 font-medium">We value your opinion. Please rate your experience.</p>
                </div>

                {/* Rating Preview */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={42} className="text-gray-100 fill-gray-50" strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Tap a star to rate</p>
                </div>

                {/* Custom Fields Simulation */}
                {business.form_config?.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-gray-50">
                    {business.form_config.map((f: any) => (
                      <div key={f.id} className="space-y-2">
                        <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                          {f.label} {f.required && <span className="text-red-500 text-lg">*</span>}
                        </label>
                        <div className="h-12 bg-gray-50 rounded-xl border border-gray-100" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Info Simulation */}
                <div className="space-y-6 pt-6 border-t border-gray-50">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">Stay Anonymous</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Review won't show your name</span>
                    </div>
                    <div className="w-10 h-6 bg-indigo-600 rounded-full p-1 flex justify-end">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Message (Optional)</label>
                    <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100 p-4 relative">
                      <MessageSquare size={18} className="text-gray-300" />
                      <span className="text-gray-300 text-sm font-medium mt-2 block ml-6">Tell us about your experience...</span>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-indigo-600 text-white rounded-2xl py-5 font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 opacity-80 cursor-not-allowed">
                  <span>SEND FEEDBACK</span>
                  <Send size={18} />
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">Powered by TaqyeemDZ</p>
          </div>
        )
      }


      {/* DELETE MODAL */}
      {
        showDelete && (
          <DeleteBusinessModal id={id} onClose={() => setShowDelete(false)} />
        )
      }
    </div >
  );
}


/* ========================= DELETE MODAL ========================= */

function DeleteBusinessModal({ id, onClose }: any) {
  const supabase = supabaseBrowser; const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this business?")) return;

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting business: " + error.message);
      return;
    }

    router.push("/admin/businesses");
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Delete Business</h2>
        </div>

        <p className="text-gray-600 text-sm">
          Are you sure you want to delete this business? This cannot be undone.
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
