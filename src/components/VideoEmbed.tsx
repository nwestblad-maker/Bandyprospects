'use client';

import React from 'react';

interface VideoEmbedProps {
  url?: string | null;
  title?: string;
  lang?: string;
}

export function parseVideoUrl(rawUrl?: string | null): { type: 'youtube' | 'vimeo' | 'direct' | 'invalid'; embedUrl?: string } {
  if (!rawUrl) return { type: 'invalid' };
  const trimmed = rawUrl.trim();

  // YouTube matchers
  // 1. youtu.be/<id>
  const shortYt = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortYt && shortYt[1]) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${shortYt[1]}` };
  }

  // 2. youtube.com/watch?v=<id> or youtube.com/shorts/<id> or /embed/<id>
  const fullYt = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  if (fullYt && fullYt[1]) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${fullYt[1]}` };
  }

  // Vimeo matcher
  const vimeo = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeo && vimeo[1]) {
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  // Direct MP4 or unknown link
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { type: 'direct', embedUrl: trimmed };
  }

  return { type: 'invalid' };
}

export function VideoEmbed({ url, title = 'Player Highlights', lang = 'sv' }: VideoEmbedProps) {
  if (!url) return null;

  const parsed = parseVideoUrl(url);

  if (parsed.type === 'youtube' || parsed.type === 'vimeo') {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
              {lang === 'sv' ? 'Matchklipp & Highlights' : 'Game Tape & Highlights'}
            </h3>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
          >
            <span>{lang === 'sv' ? 'Öppna extern länk' : 'Open link'}</span>
            <span>↗</span>
          </a>
        </div>
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={parsed.embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  if (parsed.type === 'direct') {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold text-base shrink-0">
            ▶
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-950">
              {lang === 'sv' ? 'Se spelarens videoklipp' : 'Watch Player Highlights'}
            </h4>
            <span className="text-xs text-zinc-500 truncate max-w-sm block">{url}</span>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
        >
          {lang === 'sv' ? 'Öppna video' : 'Watch video'} ↗
        </a>
      </div>
    );
  }

  return null;
}
