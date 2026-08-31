export const WISH_LABELS: Record<string, string> = {
  semi_pro: 'Semiprofessionell / Ersättning',
  pro: 'Heltidsproffs',
  full_time: 'Heltidsproffs',
  amateur: 'Amatör / Utveckling',
  study_combo: 'Kombinera med studier / jobb',
  tryout: 'Öppen för provspel / Tryout',
  youth_development: 'Junior- / Utvecklingslag',
  sports_only: 'Endast idrott / Spelarersättning',
};

export function formatWish(value?: string | null): string {
  if (!value) return 'Ej specificerat';
  return WISH_LABELS[value] || value.replace(/_/g, ' ');
}

export const COUNTRIES = [
  { code: 'SE', name: 'Sverige 🇸🇪' },
  { code: 'FI', name: 'Finland 🇫🇮' },
  { code: 'NO', name: 'Norge 🇳🇴' },
  { code: 'US', name: 'USA 🇺🇸' },
  { code: 'CA', name: 'Kanada 🇨🇦' },
  { code: 'NL', name: 'Nederländerna 🇳🇱' },
  { code: 'DE', name: 'Tyskland 🇩🇪' },
  { code: 'HU', name: 'Ungern 🇭🇺' },
  { code: 'CZ', name: 'Tjeckien 🇨🇿' },
  { code: 'CH', name: 'Schweiz 🇨🇭' },
  { code: 'EE', name: 'Estland 🇪🇪' },
  { code: 'LV', name: 'Lettland 🇱🇻' },
  { code: 'GB', name: 'Storbritannien 🇬🇧' },
  { code: 'UA', name: 'Ukraina 🇺🇦' },
  { code: 'KZ', name: 'Kazakstan 🇰🇿' },
  { code: 'MN', name: 'Mongoliet 🇲🇳' },
  { code: 'JP', name: 'Japan 🇯🇵' },
  { code: 'OTHER', name: 'Övrigt land' },
];
