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
  showPhone?: boolean;
  showEmail?: boolean;
  contactPreference?: "all" | "form_only";
}

export function ContactModal({
  isOpen,
  onClose,
  targetName,
  targetEmail,
  targetId,
  type,
  showPhone,
  showEmail,
  contactPreference,
}: ContactModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderRole: type === "club" ? "player" : "clubDirector",
    message: `Hi! I am interested in connecting regarding ${targetName}.`,
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
        throw new Error(data.error || "Failed to send message.");
      }

      setSuccessMessage(t.contactModal?.successMessage || "Your message has been sent!");
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error("Contact form error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-1.5 text-sm rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>✉️</span>
            <span>{type === "club" ? "Club Inquiries & Scouting" : "Player Outreach"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.contactModal?.titlePrefix || "Contact"} {targetName}
          </h3>
          <p className="text-sm text-slate-600 mt-1">{t.contactModal?.subtitle || "Send a direct message or inquiry to start a conversation."}</p>
        </div>

        {/* Direct Gated Contact Card */}
        {targetEmail ? (
          <GatedContactCard
            contactName={targetName}
            contactEmail={targetEmail}
            contactRole={type === "club" ? "Club Official" : "Player"}
            showPhone={showPhone}
            showEmail={showEmail}
            contactPreference={contactPreference}
          />
        ) : successMessage ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
              ✓
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Inquiry Sent!
            </h4>
            <p className="text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t.contactModal?.nameLabel || "Your Name"} *</label>
              <input
                type="text"
                required
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                placeholder={t.contactModal?.namePlaceholder || "First and last name"}
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t.contactModal?.emailLabel || "Email Address"} *</label>
                <input
                  type="email"
                  required
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder={t.contactModal?.emailPlaceholder || "you@example.com"}
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t.contactModal?.phoneLabel || "Phone Number"}</label>
                <input
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  placeholder={t.contactModal?.phonePlaceholder || "+46..."}
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t.contactModal?.roleLabel || "Your Role"}</label>
              <select
                value={formData.senderRole}
                onChange={(e) => setFormData({ ...formData, senderRole: e.target.value })}
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
              >
                <option value="player">{t.contactModal?.roleOptions?.player || "Player"}</option>
                <option value="clubDirector">{t.contactModal?.roleOptions?.clubDirector || "Club Director / Scout"}</option>
                <option value="coach">{t.contactModal?.roleOptions?.coach || "Coach / Manager"}</option>
                <option value="agent">{t.contactModal?.roleOptions?.agent || "Agent / Representative"}</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t.contactModal?.messageLabel || "Message"} *</label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t.contactModal?.messagePlaceholder || "Write your message here..."}
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {t.contactModal?.cancelBtn || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isSubmitting ? "Sending..." : (t.contactModal?.submitBtn || "Send Message")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
