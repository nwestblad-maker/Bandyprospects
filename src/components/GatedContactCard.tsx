'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { resolveEmailFromIdentifier } from '@/lib/authHelpers';

const AUTH_SYNC_CHANNEL = 'bp_auth_sync_channel';
const AUTH_SYNC_STORAGE_KEY = 'bp_auth_sync_timestamp';

function broadcastAuthSuccess(userEmail?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_SYNC_STORAGE_KEY, Date.now().toString());
  } catch {
    // ignore storage restrictions
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      channel.postMessage({ type: 'AUTH_SUCCESS', email: userEmail, timestamp: Date.now() });
      channel.close();
    }
  } catch {
    // ignore broadcast errors
  }
}

export default function GatedContactCard({
  contactName,
  contactEmail,
  contactPhone,
  contactRole,
  showPhone = true,
  showEmail = true,
  contactPreference = 'all',
  targetId,
  targetType,
}: {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
  showPhone?: boolean | null;
  showEmail?: boolean | null;
  contactPreference?: 'all' | 'form_only' | null;
  targetId?: string | null;
  targetType?: 'player' | 'club' | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password' | 'magic_link'>('login');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentLink, setSentLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Privacy evaluation
  const isFormOnly = contactPreference === 'form_only' || (showPhone === false && showEmail === false);
  const canShowPhone = !isFormOnly && showPhone !== false && Boolean(contactPhone);
  const canShowEmail = !isFormOnly && showEmail !== false && Boolean(contactEmail);

  // Direct message form state for logged in users
  const [showDirectForm, setShowDirectForm] = useState(isFormOnly);
  const [directSenderName, setDirectSenderName] = useState('');
  const [directSenderClub, setDirectSenderClub] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(false);
  const [directError, setDirectError] = useState('');

  // Cross-tab synchronization and auth state listener
  useEffect(() => {
    const syncUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          broadcastAuthSuccess(session.user.email);
          return session.user;
        } else {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            setUser(data.user);
            broadcastAuthSuccess(data.user.email);
            return data.user;
          }
        }
      } catch (err) {
        console.debug('Error syncing user session:', err);
      }
      return null;
    };

    syncUser();

    // 1. Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        broadcastAuthSuccess(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // 2. BroadcastChannel cross-tab listener
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        channel.onmessage = async (event) => {
          if (event.data?.type === 'AUTH_SUCCESS') {
            await syncUser();
          }
        };
      } catch (e) {
        console.debug('BroadcastChannel listener error:', e);
      }
    }

    // 3. Storage event listener for cross-window / cross-tab sync
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === AUTH_SYNC_STORAGE_KEY) {
        await syncUser();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Focus & visibility change listeners (re-check when returning to tab from inbox)
    const handleFocus = () => {
      syncUser();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncUser();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Active polling when waiting for magic link verification in another tab/window
  useEffect(() => {
    if (!sentLink || user) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          broadcastAuthSuccess(session.user.email);
          return;
        }

        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          broadcastAuthSuccess(data.user.email);
        }
      } catch (err) {
        console.debug('Auth verification poll error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [sentLink, user]);

  useEffect(() => {
    if (isFormOnly) {
      setShowDirectForm(true);
    }
  }, [isFormOnly]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = authIdentifier.trim();
    if (!cleanIdentifier || !authPassword) {
      setErrorMsg('Vänligen ange användarnamn/e-post och lösenord.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const resolvedEmail = await resolveEmailFromIdentifier(cleanIdentifier);
      if (!resolvedEmail.includes('@')) {
        throw new Error('Kunde inte hitta ett konto för det användarnamnet. Vänligen ange din e-postadress.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: authPassword,
      });

      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        broadcastAuthSuccess(data.user.email);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inloggningen misslyckades. Kontrollera dina uppgifter.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authIdentifier.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Vänligen ange en giltig e-postadress.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setErrorMsg('Lösenordet måste bestå av minst 6 tecken.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`
        : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: authPassword,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) throw error;
      if (data?.session?.user) {
        setUser(data.session.user);
        broadcastAuthSuccess(data.session.user.email);
      } else {
        setSuccessMsg(`Konto skapat! En bekräftelselänk har skickats till ${cleanEmail}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registreringen misslyckades.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authIdentifier.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Vänligen fyll i din e-postadress för återställning.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      setSuccessMsg(`Återställningslänk skickad till ${cleanEmail}! Kontrollera din inkorg.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunde inte skicka återställningslänk.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authIdentifier.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Vänligen ange en giltig e-postadress.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`
      : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
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

        {/* Contact Info Details */}
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

          {isFormOnly ? (
            <div className="p-2.5 bg-emerald-100/70 border border-emerald-300/80 text-emerald-950 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <span>✉️</span>
              <span>Kontakt sker via formuläret nedan</span>
            </div>
          ) : (
            <>
              {canShowEmail && (
                <div>
                  <span className="text-[11px] font-semibold text-emerald-900/80 block uppercase tracking-wider">
                    E-postadress
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline break-all inline-flex items-center gap-1.5"
                  >
                    <span>✉️</span>
                    <span>{contactEmail}</span>
                  </a>
                </div>
              )}

              {canShowPhone && (
                <div>
                  <span className="text-[11px] font-semibold text-emerald-900/80 block uppercase tracking-wider">
                    Telefonnummer
                  </span>
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center gap-1.5"
                  >
                    <span>📞</span>
                    <span>{contactPhone}</span>
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Direct Message Form Section */}
        <div className="mt-4 pt-3.5 border-t border-emerald-200/80">
          {!isFormOnly ? (
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
          ) : (
            <div className="mb-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>💬</span>
                <span>Skicka meddelande till {contactName || 'mottagaren'}</span>
              </span>
            </div>
          )}

          {(isFormOnly || showDirectForm) && (
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
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 mt-4 text-left shadow-2xs">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-zinc-100 flex items-center justify-center text-lg border border-zinc-200 shadow-2xs">
            🔒
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900">
            {authMode === 'register'
              ? 'Skapa konto för kontakt'
              : authMode === 'forgot_password'
              ? 'Återställ lösenord'
              : authMode === 'magic_link'
              ? 'Logga in med engångslänk'
              : 'Logga in för att visa kontaktuppgifter'}
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            {authMode === 'register'
              ? 'Registrera dig med e-post och lösenord för att kontakta klubbar och spelare.'
              : authMode === 'forgot_password'
              ? 'Ange din e-postadress så skickar vi en länk för att återställa lösenordet.'
              : authMode === 'magic_link'
              ? 'Fyll i din e-postadress så skickar vi en direktinloggningslänk.'
              : 'Ange ditt användarnamn/e-post och lösenord för att låsa upp kontaktuppgifter direkt.'}
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="font-bold text-rose-900 ml-2 hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="font-bold text-emerald-900 ml-2 hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* PRIMARY FORM: LOGIN WITH PASSWORD */}
        {authMode === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                E-post / Användarnamn
              </label>
              <input
                type="text"
                required
                placeholder="namn@exempel.se eller användarnamn"
                value={authIdentifier}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Lösenord
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot_password');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                >
                  Glömt lösenord?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors shadow-xs mt-1 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Loggar in...' : 'Logga in & visa kontakt →'}</span>
            </button>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-semibold text-slate-900 hover:underline cursor-pointer"
              >
                Inget konto? Registrera dig
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('magic_link');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="hover:text-slate-800 underline cursor-pointer"
              >
                Engångslänk istället
              </button>
            </div>
          </form>
        )}

        {/* REGISTER MODE */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                E-postadress
              </label>
              <input
                type="email"
                required
                placeholder="namn@exempel.se"
                value={authIdentifier}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Välj lösenord (minst 6 tecken)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors shadow-xs mt-1 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Skapar konto...' : 'Skapa konto & visa kontakt →'}</span>
            </button>

            <div className="pt-2 border-t border-slate-200/80 text-center text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
              >
                Har du redan ett konto? Logga in
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {authMode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                E-postadress för återställning
              </label>
              <input
                type="email"
                required
                placeholder="namn@exempel.se"
                value={authIdentifier.includes('@') ? authIdentifier : ''}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors shadow-xs mt-1 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Skickar...' : 'Skicka återställningslänk →'}</span>
            </button>

            <div className="pt-2 border-t border-slate-200/80 text-center text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
              >
                ← Tillbaka till inloggning
              </button>
            </div>
          </form>
        )}

        {/* MAGIC LINK MODE */}
        {authMode === 'magic_link' && (
          sentLink ? (
            <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-xl p-4 text-center shadow-2xs space-y-2.5">
              <div className="w-9 h-9 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-base shadow-2xs">
                ✉️
              </div>
              <p className="text-xs font-bold text-slate-900">
                Engångslänk skickad till <span className="text-emerald-800 font-extrabold break-all">{authIdentifier}</span>!
              </p>
              <p className="text-[11px] text-slate-600">
                Klicka på länken i din inkorg för att låsa upp kontaktuppgifterna automatiskt.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSentLink(false);
                  setAuthMode('login');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Tillbaka till lösenordsinloggning
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  E-postadress
                </label>
                <input
                  type="email"
                  required
                  placeholder="namn@exempel.se"
                  value={authIdentifier.includes('@') ? authIdentifier : ''}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors shadow-xs mt-1 flex items-center justify-center gap-2"
              >
                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Skickar länk...' : 'Skicka engångslänk →'}</span>
              </button>

              <div className="pt-2 border-t border-slate-200/80 text-center text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                >
                  ← Tillbaka till lösenordsinloggning
                </button>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
}

export { GatedContactCard };
