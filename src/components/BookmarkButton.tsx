"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useShortlist } from "@/context/ShortlistContext";
import { useLanguage } from "@/context/LanguageContext";

interface BookmarkButtonProps {
  playerId: string;
  playerName?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  playerId,
  playerName,
  size = "md",
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { lang, t } = useLanguage();
  const { isSaved, toggleSave, user } = useShortlist();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [animating, setAnimating] = useState(false);

  const saved = isSaved(playerId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setAnimating(true);
    await toggleSave(playerId);
    setTimeout(() => setAnimating(false), 300);
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "px-3.5 py-2 text-xs gap-1.5",
  };

  const labelText = saved ? "Shortlisted" : "Save to shortlist";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        title={labelText}
        aria-label={labelText}
        className={`inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
          size === "lg" ? sizeClasses.lg : sizeClasses[size]
        } ${
          saved
            ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100 shadow-2xs"
            : "bg-white/90 hover:bg-white border-slate-200 text-slate-400 hover:text-slate-800 shadow-2xs backdrop-blur-xs"
        } ${animating ? "scale-115" : "scale-100"} ${className}`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${saved ? "fill-amber-400 stroke-amber-500" : "fill-none stroke-current"}`}
          viewBox="0 0 24 24"
          strokeWidth={saved ? "1.5" : "2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        {showLabel && (
          <span className={`font-semibold ${saved ? "text-amber-900" : "text-slate-700"}`}>
            {labelText}
          </span>
        )}
      </button>

      {/* Auth Prompt Dropdown if user is unauthenticated */}
      {showAuthModal && (
        <div
          className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>⭐</span>
              <span>Save to shortlist</span>
            </span>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-slate-400 hover:text-white font-bold p-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
            Sign in to save players to your personal shortlist and keep scout notes.
          </p>
          <Link
            href="/login"
            className="block w-full py-1.5 text-center bg-white text-slate-950 font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Sign in here →
          </Link>
        </div>
      )}
    </div>
  );
}
