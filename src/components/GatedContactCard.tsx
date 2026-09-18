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
      setErrorMsg('Please enter username/email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const resolvedEmail = await resolveEmailFromIdentifier(cleanIdentifier);
      if (!resolvedEmail.includes('@')) {
        throw new Error('Could not find an account for that username. Please enter your email address.');
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
      const msg = err instanceof Error ? err.message : 'Login failed. Please verify your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authIdentifier.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
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
        setSuccessMsg(`Account created! A confirmation link has been sent to ${cleanEmail}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authIdentifier.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please enter your email address to reset password.');
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
      setSuccessMsg(`Password reset link sent to ${cleanEmail}! Please check your inbox.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send password reset link.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authIdentifier.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
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
        recipientName: contactName || "Player",
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
        throw new Error(data?.error || 'Could not send message.');
      }

      setDirectSuccess(true);
      setDirectMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while sending message.';
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
            Verified Access (Logged In)
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
                Contact Person
              </span>
              <span className="font-semibold text-slate-900">
                {contactName} {contactRole ? `(${contactRole})` : ''}
              </span>
            </div>
          )}

          {isFormOnly ? (
            <div className="p-2.5 bg-emerald-100/70 border border-emerald-300/80 text-emerald-950 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <span>✉️</span>
              <span>Contact is handled via the form below</span>
            </div>
          ) : (
            <>
              {canShowEmail && (
                <div>
                  <span className="text-[11px] font-semibold text-emerald-900/80 block uppercase tracking-wider">
                    Email Address
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
                    Phone Number
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
                <span>Send direct message via platform</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDirectForm(!showDirectForm)}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                {showDirectForm ? "Hide form ✕" : "Open form ▾"}
              </button>
            </div>
          ) : (
            <div className="mb-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>💬</span>
                <span>Send message to {contactName || 'recipient'}</span>
              </span>
            </div>
          )}

          {(isFormOnly || showDirectForm) && (
            <form onSubmit={handleSendDirectMessage} className="mt-3 space-y-2.5">
              {directSuccess && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-lg text-xs font-medium">
                  ✓ Your message has been sent to {contactName || 'the player'}!
                </div>
              )}
              {directError && (
                <div className="p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-lg text-xs font-medium">
                  {directError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sender Name *
                </label>
                <input
                  type="text"
                  required
                  value={directSenderName}
                  onChange={(e) => setDirectSenderName(e.target.value)}
                  placeholder="Your first and last name"
                  className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Club / Role *
                </label>
                <input
                  type="text"
                  required
                  value={directSenderClub}
                  onChange={(e) => setDirectSenderClub(e.target.value)}
                  placeholder="e.g. Bollnäs GIF / Head of Scouting"
                  className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={3}
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder={`Hi ${contactName || 'there'}, we would like to get in touch regarding...`}
                  className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={sendingDirect}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                {sendingDirect ? "Sending message..." : "Send Message"}
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
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-lg border border-slate-200 shadow-2xs">
            🔒
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900">
            {authMode === 'register'
              ? 'Create Account for Contact Details'
              : authMode === 'forgot_password'
              ? 'Reset Password'
              : authMode === 'magic_link'
              ? 'Log In with Magic Link'
              : 'Log In to View Contact Details'}
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            {authMode === 'register'
              ? 'Register with email and password to contact clubs and players.'
              : authMode === 'forgot_password'
              ? 'Enter your email address and we will send a password reset link.'
              : authMode === 'magic_link'
              ? 'Enter your email address and we will send a direct login link.'
              : 'Enter your username/email and password to view contact details directly.'}
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
                Email / Username
              </label>
              <input
                type="text"
                required
                placeholder="name@example.com or username"
                value={authIdentifier}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Password
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
                  Forgot password?
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
              <span>{loading ? 'Logging in...' : 'Log in & View Contact →'}</span>
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
                No account? Register
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
                Magic link instead
              </button>
            </div>
          </form>
        )}

        {/* REGISTER MODE */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={authIdentifier}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Choose Password (min 6 characters)
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
              <span>{loading ? 'Creating account...' : 'Create Account & View Contact →'}</span>
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
                Already have an account? Log in
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {authMode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address for Reset
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
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
              <span>{loading ? 'Sending...' : 'Send Reset Link →'}</span>
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
                ← Back to log in
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
                Magic link sent to <span className="text-emerald-800 font-extrabold break-all">{authIdentifier}</span>!
              </p>
              <p className="text-[11px] text-slate-600">
                Click the link in your inbox to unlock contact details automatically.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSentLink(false);
                  setAuthMode('login');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Back to password login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
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
                <span>{loading ? 'Sending link...' : 'Send Magic Link →'}</span>
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
                  ← Back to password login
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
