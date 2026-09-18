export const WISH_LABELS: Record<string, string> = {
  semi_pro: 'Semi-Professional / Allowance',
  pro: 'Full-time Professional',
  full_time: 'Full-time Professional',
  amateur: 'Amateur / Development',
  study_combo: 'Combine with Studies / Work',
  tryout: 'Open for Trials / Tryouts',
  youth_development: 'Junior / Development Squad',
  sports_only: 'Sports Only / Player Compensation',
};

export function formatWish(value?: string | null): string {
  if (!value) return 'Not specified';
  return WISH_LABELS[value] || value.replace(/_/g, ' ');
}

export const COUNTRIES = [
  { code: 'SE', name: 'Sweden 🇸🇪' },
  { code: 'FI', name: 'Finland 🇫🇮' },
  { code: 'NO', name: 'Norway 🇳🇴' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'CA', name: 'Canada 🇨🇦' },
  { code: 'NL', name: 'Netherlands 🇳🇱' },
  { code: 'DE', name: 'Germany 🇩🇪' },
  { code: 'HU', name: 'Hungary 🇭🇺' },
  { code: 'CZ', name: 'Czech Republic 🇨🇿' },
  { code: 'CH', name: 'Switzerland 🇨🇭' },
  { code: 'EE', name: 'Estonia 🇪🇪' },
  { code: 'LV', name: 'Latvia 🇱🇻' },
  { code: 'GB', name: 'United Kingdom 🇬🇧' },
  { code: 'UA', name: 'Ukraine 🇺🇦' },
  { code: 'KZ', name: 'Kazakhstan 🇰🇿' },
  { code: 'MN', name: 'Mongolia 🇲🇳' },
  { code: 'JP', name: 'Japan 🇯🇵' },
  { code: 'OTHER', name: 'Other Country' },
];

export function formatCareerPeriod(
  item: {
    season?: string;
    from_season?: string;
    to_season?: string;
  },
  lang: string = 'en'
): string {
  const from = item.from_season?.trim();
  const to = item.to_season?.trim();

  if (from && to) {
    if (from === to) return from;
    const isCurrent = to.toLowerCase() === 'nuvarande' || to.toLowerCase() === 'current';
    const toFormatted = isCurrent ? 'Current' : to;
    return `${from} – ${toFormatted}`;
  }
  if (from) return from;
  if (to) {
    const isCurrent = to.toLowerCase() === 'nuvarande' || to.toLowerCase() === 'current';
    return isCurrent ? 'Current' : to;
  }
  return item.season?.trim() || '—';
}

/**
 * Validates if a given string matches standard UUID pattern (hexadecimal 8-4-4-4-12).
 * Prevents invalid cast errors when querying Supabase/PostgreSQL.
 */
export function isValidUuid(id: unknown): id is string {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}
