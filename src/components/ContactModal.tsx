"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { GatedContactCard } from "@/components/GatedContactCard";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetEmail?: string;
  targetId?: string;
  type: "club" | "player";
}

export function ContactModal({
  isOpen,
  onClose,
  targetName,
  targetEmail,
  targetId,
  type,
}: ContactModalProps) {
  const { lang, t } = useLanguage();
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderRole: type === "club" ? "player" : "clubDirector",
    message: `Hej! Jag är intresserad och vill etablera kontakt gällande ${targetName}.`,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: formData.senderName.trim(),
          senderEmail: formData.senderEmail.trim(),
          senderPhone: formData.senderPhone.trim() || undefined,
          senderRole: formData.senderRole,
          message: formData.message.trim(),
          targetName,
          targetEmail,
          targetId,
          type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Misslyckades med att skicka meddelandet.");
      }

      setSuccessMessage(t.contactModal.successMessage || "Ditt meddelande har skickats!");
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error("Contact form error:", err);
      const msg = err instanceof Error ? err.message : "Ett oväntat fel uppstod.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1.5 text-sm rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>✉️</span>
            <span>{type === "club" ? "Club Inquiries & Scouting" : "Player Outreach"}</span>
          </div>
          <h3 className="text-xl font-extrabold text-zinc-950 tracking-tight">
            {t.contactModal.titlePrefix} {targetName}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">{t.contactModal.subtitle}</p>
        </div>

        {/* Direct Gated Contact Card */}
        {targetEmail && (
          <div className="mb-4">
            <GatedContactCard
              contactName={targetName}
              contactEmail={targetEmail}
              contactRole={type === "club" ? (lang === "sv" ? "Klubbledare" : "Club Staff") : (lang === "sv" ? "Spelare" : "Player")}
            />
          </div>
        )}

        {successMessage ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
              ✓
            </div>
            <h4 className="text-base font-bold text-zinc-950">
              {lang === "sv" ? "Förfrågan skickad!" : "Inquiry Sent!"}
            </h4>
            <p className="text-xs text-zinc-600 max-w-xs mx-auto leading-relaxed">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.nameLabel} *</label>
              <input
                type="text"
                required
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                placeholder={t.contactModal.namePlaceholder}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.emailLabel} *</label>
                <input
                  type="email"
                  required
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder={t.contactModal.emailPlaceholder}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.phoneLabel}</label>
                <input
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  placeholder={t.contactModal.phonePlaceholder}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.roleLabel}</label>
              <select
                value={formData.senderRole}
                onChange={(e) => setFormData({ ...formData, senderRole: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer"
              >
                <option value="player">{t.contactModal.roleOptions.player}</option>
                <option value="clubDirector">{t.contactModal.roleOptions.clubDirector}</option>
                <option value="coach">{t.contactModal.roleOptions.coach}</option>
                <option value="agent">{t.contactModal.roleOptions.agent}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.messageLabel} *</label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t.contactModal.messagePlaceholder}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-zinc-600 hover:text-zinc-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.contactModal.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isSubmitting ? (lang === "sv" ? "Skickar..." : "Sending...") : t.contactModal.submitBtn}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
