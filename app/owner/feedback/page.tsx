"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Star,
  Ghost,
  MessageCircle,
  Loader2,
  ChevronRight,
  QrCode as QrIcon,
  Calendar,
  Phone,
  Mail,
  Trash2,
  AlertCircle,
  Building2,
  Image as ImageIcon,
  AudioLines,
  Files,
  Play
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const RATING_CONFIG: Record<string, { label: string, color: string, dot: string }> = {
  all: { label: "Tous", color: "text-slate-400", dot: "bg-slate-300" },
  positive: { label: "Positifs", color: "text-emerald-500", dot: "bg-emerald-400" },
  negative: { label: "Négatifs", color: "text-rose-500", dot: "bg-rose-400" },
};

const isAudio = (url: string | null) => {
  if (!url) return false;
  return /\.(mp3|wav|ogg|m4a|webm|aac)($|\?)/i.test(url);
};

const isVideo = (url: string | null) => {
  if (!url) return false;
  return /\.(mp4|mov|avi|wmv|flv|mkv)($|\?)/i.test(url);
};

export default function FeedbackPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return router.replace("/auth/login");

      const { data: links } = await supabase
        .from("user_business")
        .select("business_id")
        .eq("user_id", user.id);

      const businessIds = links?.map(l => l.business_id) || [];

      if (businessIds.length === 0) {
        setLoading(false);
        return;
      }

      const [busRes, fbRes] = await Promise.all([
        supabase.from("businesses").select("id, name, address, phone").in("id", businessIds),
        supabase.from("feedback").select("*, businesses(*)").in("business_id", businessIds).order("created_at", { ascending: false })
      ]);

      setBusinesses(busRes.data || []);
      setFeedbacks(fbRes.data || []);
      setLoading(false);
    };

    fetchInitialData();
  }, [router, supabase]);

  const handleDelete = async () => {
    if (!selectedFeedback) return;
    setDeletingId(selectedFeedback.id);
    try {
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", selectedFeedback.id);

      if (error) throw error;

      toast.success("Avis supprimé");
      setFeedbacks(prev => prev.filter(f => f.id !== selectedFeedback.id));
      setSelectedFeedback(null);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = feedbacks.filter(fb => {
    const matchesRating = statusFilter === "all" ||
      (statusFilter === "positive" && fb.rating >= 4) ||
      (statusFilter === "negative" && fb.rating <= 2);

    const matchesBusiness = selectedBusinessId === "all" || fb.business_id === selectedBusinessId;

    const matchesSearch = search === "" ||
      (fb.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (fb.message?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (fb.businesses?.name?.toLowerCase() || "").includes(search.toLowerCase());

    return matchesRating && matchesBusiness && matchesSearch;
  });

  const translateSex = (sex: string) => {
    if (!sex) return "";
    const s = sex.toLowerCase();
    return s === 'male' ? 'Homme' : s === 'female' ? 'Femme' : sex;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedBusinessId, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedFeedbacks = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      {/* Lightbox */}
      {isZoomed && selectedMedia && !isVideo(selectedMedia) && !isAudio(selectedMedia) && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 backdrop-blur-md" onClick={() => setIsZoomed(false)}>
          <div className="relative max-w-[80vw] max-h-[80vh]">
            <img src={selectedMedia} alt="Zoom" className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-100 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Flux d'Avis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Consultez et gérez les retours de vos clients.</p>
        </div>

        {/* Business Selector & Rating Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "positive", "negative"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                                    ${statusFilter === s
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {RATING_CONFIG[s].label}
              </button>
            ))}
          </div>

          <div className="relative group min-w-[200px]">
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 py-2.5 px-4 pr-10 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:border-slate-400 outline-none transition-all cursor-pointer appearance-none shadow-sm"
            >
              <option value="all">Tous les produits</option>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors rotate-90" size={14} />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* List Side */}
        <div className="lg:col-span-4 space-y-6">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              placeholder="Rechercher par client, message ou produit..."
              className="w-full bg-transparent border-b border-slate-100 pl-8 pr-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-slate-200" size={20} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-slate-400">Aucun avis trouvé.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                {paginatedFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    onClick={() => setSelectedFeedback(fb)}
                    className={`p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden
                                        ${selectedFeedback?.id === fb.id
                        ? 'bg-indigo-50/50 ring-1 ring-inset ring-indigo-100'
                        : 'hover:bg-slate-50/50'}
                                    `}
                  >
                    {selectedFeedback?.id === fb.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                    )}

                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0
                                            ${fb.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : fb.rating >= 3 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                        {fb.rating}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {fb.anonymous ? "Anonyme" : fb.full_name || "Client"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                          {fb.businesses?.name} • {format(new Date(fb.created_at), "dd/MM")}
                          {(() => {
                            const params = fb.custom_responses || {};
                            const medias = params._media_urls && Array.isArray(params._media_urls) && params._media_urls.length > 0
                              ? params._media_urls
                              : fb.media_urls && fb.media_urls.length > 0 ? fb.media_urls
                                : fb.media_url ? [fb.media_url] : [];

                            if (medias.length === 0) return null;
                            if (medias.length > 1) return <Files size={10} className="text-indigo-400" />;

                            const url = medias[0];
                            if (isAudio(url)) return <AudioLines size={10} className="text-indigo-400" />;
                            if (isVideo(url)) return <Play size={10} className="text-indigo-400" />;
                            return <ImageIcon size={10} className="text-indigo-400" />;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">

                      <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Page {currentPage} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Side */}
        <div className="lg:col-span-8">
          {selectedFeedback ? (
            <div className="sticky top-8 space-y-8 animate-in mt-10 lg:mt-0 fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= selectedFeedback.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100"} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">{selectedFeedback.rating}.0 / 5</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 leading-tight">
                    {selectedFeedback.anonymous ? "Avis Anonyme" : selectedFeedback.full_name || "Client"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>



              <div className="space-y-4 py-8 border-y border-slate-50 text-sm">
                <DetailItem icon={Building2} label="Établissement" value={selectedFeedback.businesses?.name} />
                <DetailItem icon={Calendar} label="Date" value={format(new Date(selectedFeedback.created_at), "PPP 'à' HH:mm", { locale: fr })} />
                {!selectedFeedback.anonymous && (
                  <>
                    <DetailItem icon={Phone} label="Contact" value={selectedFeedback.phone} />
                    <DetailItem icon={Mail} label="Email" value={selectedFeedback.email} />
                    <DetailItem icon={User} label="Genre" value={translateSex(selectedFeedback.sex)} />
                  </>
                )}
              </div>

              {/* Custom Form Data */}
              {selectedFeedback.custom_responses && Object.keys(selectedFeedback.custom_responses).length > 0 && selectedFeedback.businesses?.form_config && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questionnaire</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedFeedback.businesses.form_config.map((field: any) => {
                      const res = selectedFeedback.custom_responses[field.id];
                      if (res === undefined || res === "" || res === null) return null;
                      return (
                        <div key={field.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <span className="text-xs font-medium text-slate-500">{field.label}</span>
                          <span className="text-xs font-bold text-slate-900">{field.type === 'boolean' ? (res ? "Oui" : "Non") : field.type === 'rating' ? `${res}/5` : res}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {(() => {
                const params = selectedFeedback.custom_responses || {};
                const medias: string[] = params._media_urls && Array.isArray(params._media_urls) && params._media_urls.length > 0
                  ? params._media_urls
                  : selectedFeedback.media_urls && selectedFeedback.media_urls.length > 0
                    ? selectedFeedback.media_urls
                    : selectedFeedback.media_url ? [selectedFeedback.media_url] : [];

                if (medias.length === 0) return null;

                const audios = medias.filter(url => isAudio(url));
                const videos = medias.filter(url => isVideo(url));
                const images = medias.filter(url => !isAudio(url) && !isVideo(url));

                return (
                  <div className="pt-6 space-y-6">
                    {/* Audio Section */}
                    {audios.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <AudioLines size={12} /> Messages Vocaux
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {audios.map((url, idx) => (
                            <div key={idx} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                <AudioLines size={14} />
                              </div>
                              <audio controls src={url} className="w-full h-8" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Section */}
                    {videos.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Play size={12} /> Vidéos
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {videos.map((url, idx) => (
                            <video key={idx} controls src={url} className="w-full rounded-2xl bg-black aspect-video object-contain border border-slate-100" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photos Section */}
                    {images.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon size={12} /> Photos
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {images.map((url, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden border border-slate-100 shadow-sm group relative w-20 h-20 shrink-0 cursor-pointer bg-slate-50" onClick={() => { setSelectedMedia(url); setIsZoomed(true); }}>
                              <img src={url} alt="Media" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white">
                                  <ImageIcon size={16} />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-4 mt-10 lg:mt-0">
              <MessageCircle size={40} className="opacity-20" />
              <p className="text-xs font-medium uppercase tracking-widest">Sélectionnez un avis</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Supprimer ?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors text-sm">Annuler</button>
              <button onClick={handleDelete} disabled={deletingId !== null} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-100 transition-all flex items-center justify-center text-sm">
                {deletingId !== null ? <Loader2 size={16} className="animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: any) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4">
      <div className="w-5 h-5 text-slate-300 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex justify-between flex-1 items-center">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <span className="text-sm font-medium text-slate-900 truncate ml-4">{value}</span>
      </div>
    </div>
  );
}
