'use client';

import React from 'react';

interface SocialLinksProps {
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
}

export default function SocialLinks({ instagramUrl, youtubeUrl, tiktokUrl }: SocialLinksProps) {
  if (!instagramUrl && !youtubeUrl && !tiktokUrl) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {instagramUrl && (
        <a
          href={instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition"
        >
          <span>📸</span> Instagram
        </a>
      )}

      {youtubeUrl && (
        <a
          href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://${youtubeUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
        >
          <span>▶️</span> YouTube Video
        </a>
      )}

      {tiktokUrl && (
        <a
          href={tiktokUrl.startsWith('http') ? tiktokUrl : `https://${tiktokUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 transition"
        >
          <span>🎵</span> TikTok
        </a>
      )}
    </div>
  );
}
