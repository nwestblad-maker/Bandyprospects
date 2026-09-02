'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export default function GatedContactCard({
  contactName,
  contactEmail,
  contactPhone,
  contactRole,
}: {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentLink, setSentLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Direct message form state for logged in users
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [directSenderName, setDirectSenderName] = useState('');
  const [directSenderClub, setDirectSenderClub] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(false);
  const [directError, setDirectError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setLoading(true);
    setErrorMsg('');
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`
      : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSentLink(true);
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSenderName.trim() || !directSenderClub.trim() || !directMessage.trim()) return;
    setSendingDirect(true);
    setDirectError('');
    setDirectSuccess(false);

    try {
      const payload = {
        toEmail: contactEmail || undefined,
        recipientName: contactName || "Spelare",
        senderEmail: user?.email || "",
        senderName: directSenderName.trim(),
        senderClub: directSenderClub.trim(),
        message: directMessage.trim(),
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Kunde inte skicka meddelandet.');
      }

      setDirectSuccess(true);
      setDirectMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ett fel uppstod vid utskicket.';
      setDirectError(msg);
    } finally {
      setSendingDirect(false);
    }
  };

  if (user) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-4 text-left shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-emerald-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Verifierad Åtkomst (Inloggad)
          </span>
          {user.email && (
            <span className="text-[11px] text-emerald-700 font-medium truncate max-w-[170px]" title={user.email}>
              {user.email}
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-800">
          {contactName && (
            <div>
              <span className="text-[11px] font-semibold text-emerald-900/80 block uppercase tracking-wider">
                Kontaktperson
              </span>
              <span className="font-semibold text-slate-900">
                {contactName} {contactRole ? `(${contactRole})` : ''}
              </span>
            </div>
          )}

          <div>
            <span className="text-[11px] font-semibold text-emerald-900/80 block uppercase tracking-wider">
              E-postadress
            </span>
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="text-blue-600 hover:text-blue-800 font-semibold underline break-all inline-flex items-center gap-1.5"
              >
                <span>✉️</span>
                <span>{contactEmail}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-500 italic">Ej angiven</span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-semibold text-emerald-900/80 block uppercase tracking-wider">
              Telefonnummer
            </span>
            {contactPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center gap-1.5"
              >
                <span>📞</span>
                <span>{contactPhone}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-500 italic">Ej angivet</span>
            )}
          </div>
        </div>

        {/* Clean Direktmeddelande Form */}
        <div className="mt-4 pt-3.5 border-t border-emerald-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>💬</span>
              <span>Skicka direktmeddelande via sajten</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDirectForm(!showDirectForm)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              {showDirectForm ? "Dölj formulär ✕" : "Öppna formulär ▾"}
            </button>
          </div>

          {showDirectForm && (
            <form onSubmit={handleSendDirectMessage} className="mt-3 space-y-2.5">
              {directSuccess && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-lg text-xs font-medium">
                  ✓ Ditt meddelande har skickats till {contactName || 'spelaren'}!
                </div>
              )}
              {directError && (
                <div className="p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-lg text-xs font-medium">
                  {directError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Avsändarens namn *
                </label>
                <input
                  type="text"
                  required
                  value={directSenderName}
                  onChange={(e) => setDirectSenderName(e.target.value)}
                  placeholder="Ditt för- och efternamn"
                  className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Klubb / Roll *
                </label>
                <input
                  type="text"
                  required
                  value={directSenderClub}
                  onChange={(e) => setDirectSenderClub(e.target.value)}
                  placeholder="T.ex. Bollnäs GIF / Sportchef"
                  className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Meddelande *
                </label>
                <textarea
                  required
                  rows={3}
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder={`Hej ${contactName || 'där'}, vi är intresserade av kontakt angående...`}
                  className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={sendingDirect}
                className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                {sendingDirect ? "Skickar meddelande..." : "Skicka meddelande"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-4 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-2xl mb-2">🔒</div>
        <h4 className="text-base font-bold text-slate-900">Kontaktuppgifter skyddade</h4>
        <p className="text-xs text-slate-600 mb-4">
          För att skydda spelare och ledare mot spam krävs inloggning med e-post för att visa kontaktuppgifter.
        </p>
        {sentLink ? (
          <div className="bg-white border border-emerald-300 text-emerald-800 text-sm p-3 rounded-lg">
            📩 En inloggningslänk har skickats till <strong>{authEmail}</strong>!
          </div>
        ) : (
          <form onSubmit={handleSendMagicLink} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="Fyll i din e-postadress..."
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Skickar...' : 'Visa kontakt'}
            </button>
          </form>
        )}
        {errorMsg && <p className="text-xs text-red-600 mt-2">{errorMsg}</p>}
      </div>
    </div>
  );
}

export { GatedContactCard };
