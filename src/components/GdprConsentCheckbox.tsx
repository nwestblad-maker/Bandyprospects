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
      <label htmlFor="gdpr-consent" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
        I agree that my information is stored in accordance with the Bandy Prospects{' '}
        <Link href="/integritet" target="_blank" className="font-semibold text-slate-900 underline">
          Privacy Policy
        </Link>
        . I understand that my contact details are only visible to verified scouts and club officials, and that I can delete my profile at any time.
      </label>
    </div>
  );
}

export { GdprConsentCheckbox };
