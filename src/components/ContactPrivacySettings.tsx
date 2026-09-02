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
    <div className="pt-4 border-t border-zinc-200/80 space-y-4 text-xs">
      <div>
        <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span>
          <span>Integritet & Kontaktinställningar</span>
        </h3>
        <p className="text-zinc-500 text-xs mt-0.5">
          {entityType === 'club'
            ? 'Bestäm hur klubbens kontaktuppgifter exponeras för inloggade spelare och scouter.'
            : 'Bestäm hur dina kontaktuppgifter exponeras för inloggade scouter och klubbledare.'}
        </p>
      </div>

      {/* Radio: contact_preference */}
      <div className="space-y-2">
        <label className="block font-semibold text-zinc-800 text-xs">
          Hur vill du bli kontaktad?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-all ${
              contactPreference === 'all'
                ? 'border-zinc-900 bg-zinc-50/80 shadow-2xs ring-1 ring-zinc-900/10'
                : 'border-zinc-200 bg-white hover:bg-zinc-50/60'
            }`}
          >
            <input
              type="radio"
              name="contact_preference"
              value="all"
              checked={contactPreference === 'all'}
              onChange={() => setContactPreference('all')}
              className="mt-0.5 text-zinc-950 focus:ring-zinc-900 cursor-pointer"
            />
            <div>
              <span className="font-bold text-zinc-900 block">
                Både direktuppgifter och kontaktformulär
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5 block leading-relaxed">
                Visar dina valda kontaktuppgifter (e-post/telefon) samt ett direktmeddelandeformulär.
              </span>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-all ${
              contactPreference === 'form_only'
                ? 'border-zinc-900 bg-zinc-50/80 shadow-2xs ring-1 ring-zinc-900/10'
                : 'border-zinc-200 bg-white hover:bg-zinc-50/60'
            }`}
          >
            <input
              type="radio"
              name="contact_preference"
              value="form_only"
              checked={contactPreference === 'form_only'}
              onChange={() => setContactPreference('form_only')}
              className="mt-0.5 text-zinc-950 focus:ring-zinc-900 cursor-pointer"
            />
            <div>
              <span className="font-bold text-zinc-900 block">
                Endast via kontaktformuläret på sajten
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5 block leading-relaxed">
                Dölj dina direkta uppgifter. Meddelanden vidarebefordras säkert till din e-post.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Checkboxes: show_email & show_phone */}
      {contactPreference === 'all' ? (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3.5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block">
            Synliga uppgifter för verifierade användare:
          </span>

          <label className="flex items-center gap-2.5 cursor-pointer text-zinc-800">
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
            <span className="font-medium">Visa min e-postadress för verifierade användare</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-zinc-800">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
            <span className="font-medium">Visa mitt telefonnummer för verifierade användare</span>
          </label>
        </div>
      ) : (
        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs flex items-center gap-2">
          <span>🔒</span>
          <span>
            Dina direkta uppgifter är dolda. Kontaktkortet visar permanent formuläret för direktmeddelanden.
          </span>
        </div>
      )}
    </div>
  );
}

export { ContactPrivacySettings };
