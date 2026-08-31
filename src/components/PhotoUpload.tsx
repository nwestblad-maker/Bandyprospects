"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface PhotoUploadProps {
  photoUrl?: string | null;
  onChange: (url: string) => void;
  initials?: string;
  label?: string;
  subtitle?: string;
}

export function PhotoUpload({
  photoUrl,
  onChange,
  initials = "P",
  label,
  subtitle,
}: PhotoUploadProps) {
  const { lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(photoUrl || "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setErrorMessage(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        lang === "sv"
          ? "Bilden är för stor. Max tillåten storlek är 5 MB."
          : "File is too large. Maximum allowed size is 5 MB."
      );
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        lang === "sv" ? "Vänligen välj en giltig bildfil (JPG, PNG, WEBP)." : "Please select a valid image file."
      );
      return;
    }

    try {
      setIsUploading(true);

      const fileExt = file.name.split(".").pop() || "jpg";
      const cleanFileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${cleanFileName}`;

      // Upload to Supabase storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.warn("Supabase storage upload error:", uploadError.message);

        // Try reading as base64 / Data URL fallback if storage bucket is not configured
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            onChange(reader.result);
            setManualUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (publicData?.publicUrl) {
        onChange(publicData.publicUrl);
        setManualUrl(publicData.publicUrl);
      }
    } catch (err: unknown) {
      console.error("Photo upload failed:", err);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setManualUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {(label || subtitle) && (
        <div>
          {label && <label className="block font-semibold text-zinc-800 text-xs">{label}</label>}
          {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-rose-900 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
        {/* Avatar Display */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-900 text-white font-bold text-xl flex items-center justify-center overflow-hidden border border-zinc-300 shadow-xs relative">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Player avatar preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <span>{initials.toUpperCase()}</span>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>📷</span>
              <span>
                {isUploading
                  ? lang === "sv"
                    ? "Laddar upp..."
                    : "Uploading..."
                  : photoUrl
                  ? lang === "sv"
                    ? "Byt profilbild"
                    : "Change Photo"
                  : lang === "sv"
                    ? "Ladda upp profilbild"
                    : "Upload Photo"}
              </span>
            </button>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-semibold text-xs rounded-lg border border-zinc-200 hover:border-rose-200 transition-colors cursor-pointer"
              >
                {lang === "sv" ? "Ta bort" : "Remove"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUrlInput((prev) => !prev)}
              className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-900 font-medium text-xs underline cursor-pointer"
            >
              {showUrlInput
                ? lang === "sv"
                  ? "Dölj URL"
                  : "Hide URL"
                : lang === "sv"
                ? "Eller ange bildlänk (URL)"
                : "Or image URL"}
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 leading-tight">
            {lang === "sv"
              ? "Rekommenderat: Fyrkantigt porträtt (JPG/PNG), max 5 MB. Visas på ditt spelarkort."
              : "Recommended: Square headshot (JPG/PNG), max 5 MB. Displayed on player directory cards."}
          </p>

          {showUrlInput && (
            <div className="pt-2 flex items-center gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://images.example.com/avatar.jpg"
                className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <button
                type="button"
                onClick={handleManualUrlSubmit}
                className="px-3 py-1.5 bg-zinc-900 text-white font-semibold text-xs rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {lang === "sv" ? "Använd" : "Apply"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
