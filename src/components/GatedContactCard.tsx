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
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
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

  if (user) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-4 text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Verifierad Åtkomst (Inloggad)
        </span>
        <div className="space-y-1.5 text-sm text-slate-800">
          {contactName && (
            <p>
              <strong>Kontaktperson:</strong> {contactName} {contactRole ? `(${contactRole})` : ''}
            </p>
          )}
          {contactEmail && (
            <p>
              <strong>E-post:</strong>{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 font-semibold underline">
                {contactEmail}
              </a>
            </p>
          )}
          {contactPhone && (
            <p>
              <strong>Telefon:</strong>{' '}
              <a href={`tel:${contactPhone}`} className="text-blue-600 font-semibold underline">
                {contactPhone}
              </a>
            </p>
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
