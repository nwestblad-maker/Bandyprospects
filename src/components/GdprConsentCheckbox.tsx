'use client';

import React from 'react';
import Link from 'next/link';

export default function GdprConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mt-6">
      <input
        type="checkbox"
        id="gdpr-consent"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
      />
      <label htmlFor="gdpr-consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
        Jag godkänner att mina uppgifter sparas i enlighet med Bandy Prospects{' '}
        <Link href="/integritet" target="_blank" className="font-semibold text-slate-900 underline">
          Integritetspolicy
        </Link>
        . Jag förstår att mina kontaktuppgifter endast visas för inloggade och verifierade användare och att jag när som helst kan radera min profil.
      </label>
    </div>
  );
}

export { GdprConsentCheckbox };
