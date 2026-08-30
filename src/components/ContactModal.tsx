"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  type: "club" | "player";
}

export function ContactModal({ isOpen, onClose, targetName, type }: ContactModalProps) {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      alert(t.contactModal.successMessage);
      setSubmitted(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white border border-zinc-300 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 text-sm rounded-md"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            {type === "club" ? "Club Inquiries & Scouting" : "Player Outreach"}
          </div>
          <h3 className="text-lg font-bold text-zinc-950">
            {t.contactModal.titlePrefix} {targetName}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{t.contactModal.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.nameLabel}</label>
            <input
              type="text"
              required
              placeholder={t.contactModal.namePlaceholder}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.emailLabel}</label>
              <input
                type="email"
                required
                placeholder={t.contactModal.emailPlaceholder}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.phoneLabel}</label>
              <input
                type="tel"
                placeholder={t.contactModal.phonePlaceholder}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.roleLabel}</label>
            <select
              defaultValue={type === "club" ? "player" : "clubDirector"}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              <option value="player">{t.contactModal.roleOptions.player}</option>
              <option value="clubDirector">{t.contactModal.roleOptions.clubDirector}</option>
              <option value="coach">{t.contactModal.roleOptions.coach}</option>
              <option value="agent">{t.contactModal.roleOptions.agent}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">{t.contactModal.messageLabel}</label>
            <textarea
              rows={3}
              required
              placeholder={t.contactModal.messagePlaceholder}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
              defaultValue={`Hello, I would like to establish contact regarding ${targetName}.`}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-zinc-600 hover:text-zinc-900 font-medium"
            >
              {t.contactModal.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              {t.contactModal.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
