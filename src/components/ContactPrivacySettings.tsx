'use client';

import React from 'react';

interface ContactPrivacySettingsProps {
  showPhone: boolean;
  setShowPhone: (val: boolean) => void;
  showEmail: boolean;
  setShowEmail: (val: boolean) => void;
  contactPreference: 'all' | 'form_only';
  setContactPreference: (val: 'all' | 'form_only') => void;
  entityType?: 'player' | 'club';
}

export default function ContactPrivacySettings({
  showPhone,
  setShowPhone,
  showEmail,
  setShowEmail,
  contactPreference,
  setContactPreference,
  entityType = 'player',
}: ContactPrivacySettingsProps) {
  return (
    <div className="pt-4 border-t border-slate-200/80 space-y-4 text-xs">
      <div>
        <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span>
          <span>PRIVACY & CONTACT SETTINGS</span>
        </h3>
        <p className="text-slate-500 text-xs mt-0.5">
          Decide how your contact details are displayed to verified scouts and club officials.
        </p>
      </div>

      {/* Radio: contact_preference */}
      <div className="space-y-2">
        <label className="block font-semibold text-slate-800 text-xs">
          How do you prefer to be contacted?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-all ${
              contactPreference === 'all'
                ? 'border-slate-900 bg-slate-50/80 shadow-2xs ring-1 ring-slate-900/10'
                : 'border-slate-200 bg-white hover:bg-slate-50/60'
            }`}
          >
            <input
              type="radio"
              name="contact_preference"
              value="all"
              checked={contactPreference === 'all'}
              onChange={() => setContactPreference('all')}
              className="mt-0.5 text-slate-950 focus:ring-slate-900 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-900 block">
                Both direct contact details and messaging form
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                Displays your chosen contact details (email/phone) along with an on-site direct message form.
              </span>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-all ${
              contactPreference === 'form_only'
                ? 'border-slate-900 bg-slate-50/80 shadow-2xs ring-1 ring-slate-900/10'
                : 'border-slate-200 bg-white hover:bg-slate-50/60'
            }`}
          >
            <input
              type="radio"
              name="contact_preference"
              value="form_only"
              checked={contactPreference === 'form_only'}
              onChange={() => setContactPreference('form_only')}
              className="mt-0.5 text-slate-950 focus:ring-slate-900 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-900 block">
                Only via on-site messaging form
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                Hides your direct contact info. Messages are securely routed through the platform inbox.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Checkboxes: show_email & show_phone */}
      {contactPreference === 'all' ? (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            VISIBLE INFO FOR VERIFIED USERS:
          </span>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="font-medium">Show my email address to verified users</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="font-medium">Show my phone number to verified users</span>
          </label>
        </div>
      ) : (
        <div className="p-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs flex items-center gap-2">
          <span>🔒</span>
          <span>
            Hides your direct contact info. Messages are securely routed through the platform inbox.
          </span>
        </div>
      )}
    </div>
  );
}

export { ContactPrivacySettings };
