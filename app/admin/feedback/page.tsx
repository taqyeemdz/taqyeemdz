'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Camera, X } from 'lucide-react';

export default function FeedbackForm({ businessId }: { businessId: string }) {
  const supabase = supabaseBrowser;
  // -------------------
  // States
  // -------------------
  const [anonymous, setAnonymous] = useState(true);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');

  const [service, setService] = useState('');

  const [rating, setRating] = useState<'good' | 'medium' | 'bad' | ''>('');

  const [comment, setComment] = useState('');

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // -------------------
  // Handle media preview
  // -------------------
  function handleMediaChange(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  // -------------------
  // Submit
  // -------------------
  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!rating) {
      setMessage('Please choose a rating.');
      return;
    }

    setLoading(true);
    setMessage('');

    let mediaUrl = null;

    // -------------------
    // Upload media (if any)
    // -------------------
    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('feedback-media')
        .upload(fileName, mediaFile, {
          upsert: false,
        });


      if (uploadErr) {
        setMessage(uploadErr.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('feedback-media')
        .getPublicUrl(fileName);

      mediaUrl = urlData.publicUrl;
    }

    // -------------------
    // Insert feedback
    // -------------------
    const { error } = await supabase.from('feedback').insert({
      business_id: businessId,
      rating,
      message: comment,
      is_anonymous: anonymous,
      client_name: anonymous ? null : clientName,
      client_phone: anonymous ? null : clientPhone,
      sex: gender,
      age,
      service,
      media_url: mediaUrl,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage('Thank you for your feedback!');
    setLoading(false);

    // Reset
    setComment('');
    setRating('');
    setMediaFile(null);
    setMediaPreview(null);
  }

  // -------------------
  // UI
  // -------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">

      {/* Identity choice */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setAnonymous(true)}
          className={`flex-1 py-2 rounded-xl text-center border ${anonymous ? 'bg-green-600 text-white' : 'bg-white'
            }`}
        >
          Anonyme
        </button>

        <button
          type="button"
          onClick={() => setAnonymous(false)}
          className={`flex-1 py-2 rounded-xl text-center border ${!anonymous ? 'bg-green-600 text-white' : 'bg-white'
            }`}
        >
          Identifié
        </button>
      </div>

      {/* Only show fields if identified */}
      {!anonymous && (
        <div className="space-y-4">
          <input
            className="w-full border rounded-xl px-4 py-2"
            placeholder="Votre nom"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <input
            className="w-full border rounded-xl px-4 py-2"
            placeholder="Numéro de téléphone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>
      )}

      {/* Demographics */}
      <div className="grid grid-cols-2 gap-3">
        <select
          className="border rounded-xl px-3 py-2"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Sexe</option>
          <option value="male">Homme</option>
          <option value="female">Femme</option>
        </select>

        <select
          className="border rounded-xl px-3 py-2"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        >
          <option value="">Âge</option>
          <option value="18-25">18–25</option>
          <option value="26-35">26–35</option>
          <option value="36-50">36–50</option>
          <option value="50+">50+</option>
        </select>
      </div>

      {/* Service selection */}
      <select
        className="w-full border rounded-xl px-3 py-2"
        value={service}
        onChange={(e) => setService(e.target.value)}
      >
        <option value="">Service utilisé</option>
        <option value="service1">Service 1</option>
        <option value="service2">Service 2</option>
        <option value="service3">Service 3</option>
      </select>

      {/* Rating */}
      <div className="flex gap-4 justify-center">
        {['good', 'medium', 'bad'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRating(r as any)}
            className={`px-4 py-3 rounded-xl border ${rating === r ? 'bg-green-600 text-white' : 'bg-white'
              }`}
          >
            {r === 'good' && '👍 Bon'}
            {r === 'medium' && '😐 Moyen'}
            {r === 'bad' && '👎 Mauvais'}
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        className="w-full border rounded-xl px-4 py-3"
        placeholder="Votre commentaire…"
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {/* Media upload */}
      <div>
        <label className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer">
          <Camera size={22} />
          Ajouter photo/vidéo
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
        </label>

        {mediaPreview && (
          <div className="relative mt-3">
            {/* Close button */}
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
              onClick={() => {
                setMediaPreview(null);
                setMediaFile(null);
              }}
            >
              <X size={16} />
            </button>

            {mediaFile?.type.startsWith('video') ? (
              <video src={mediaPreview} controls className="w-full rounded-xl" />
            ) : (
              <img src={mediaPreview} className="w-full rounded-xl" />
            )}
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-lg h-2 overflow-hidden">
          <div className="bg-green-600 h-2" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold mt-4"
      >
        {loading ? 'Envoi…' : 'Envoyer le feedback'}
      </button>

      {message && <p className="text-center text-sm text-green-700">{message}</p>}
    </form>
  );
}
