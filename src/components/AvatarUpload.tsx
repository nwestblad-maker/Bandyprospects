'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AvatarUpload({
  currentUrl,
  onUploadSuccess,
}: {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (currentUrl) {
      setPreview(currentUrl);
    }
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast base64 preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreview(base64String);

      // Attempt upload to Supabase storage 'avatars'
      try {
        setUploading(true);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            onUploadSuccess(urlData.publicUrl);
            setPreview(urlData.publicUrl);
            return;
          }
        }
      } catch (err) {
        console.warn('Storage upload error, using base64 string fallback:', err);
      } finally {
        setUploading(false);
      }

      // Fallback directly to base64
      onUploadSuccess(base64String);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 text-2xl font-bold shrink-0 relative">
        {uploading ? (
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profilbild" className="w-full h-full object-cover" />
        ) : (
          '👤'
        )}
      </div>
      <div>
        <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition">
          <span>{uploading ? 'Laddar upp...' : preview ? 'Byt profilbild' : 'Ladda upp profilbild'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG eller WebP</p>
      </div>
    </div>
  );
}

export { AvatarUpload };
