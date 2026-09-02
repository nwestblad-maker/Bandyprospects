import { Language } from "@/types";

export interface LeagueItem {
  id: string;
  name: Record<Language, string>;
  countryCode: string; // "SE", "NO", "FI", "RU", "US", "NL", "OTHER"
  genderCategory?: "men" | "women" | "junior" | "all";
}

export const CUSTOM_OTHER_LEAGUE_VALUE = "custom_other";

export const LEAGUES: LeagueItem[] = [
  // ==========================================
  // Sverige (SE)
  // ==========================================
  {
    id: "se_elitserien_herr",
    countryCode: "SE",
    genderCategory: "men",
    name: {
      en: "Elitserien Men (Sweden)",
      sv: "Elitserien Herr",
      fi: "Elitserien Miehet (Ruotsi)",
      no: "Elitserien Herr (Sverige)",
      nl: "Elitserien Men (Sweden)",
      de: "Elitserien Men (Sweden)",
      fr: "Elitserien Men (Sweden)",
    },
  },
  {
    id: "se_allsvenskan_herr",
    countryCode: "SE",
    genderCategory: "men",
    name: {
      en: "Allsvenskan Men (Sweden)",
      sv: "Allsvenskan Herr",
      fi: "Allsvenskan Miehet (Ruotsi)",
      no: "Allsvenskan Herr (Sverige)",
      nl: "Allsvenskan Men (Sweden)",
      de: "Allsvenskan Men (Sweden)",
      fr: "Allsvenskan Men (Sweden)",
    },
  },
  {
    id: "se_div1_herr",
    countryCode: "SE",
    genderCategory: "men",
    name: {
      en: "Division 1 Men (Sweden)",
      sv: "Division 1 Herr",
      fi: "Division 1 Miehet (Ruotsi)",
      no: "Division 1 Herr (Sverige)",
      nl: "Division 1 Men (Sweden)",
      de: "Division 1 Men (Sweden)",
      fr: "Division 1 Men (Sweden)",
    },
  },
  {
    id: "se_div2_herr",
    countryCode: "SE",
    genderCategory: "men",
    name: {
      en: "Division 2 Men (Sweden)",
      sv: "Division 2 Herr",
      fi: "Division 2 Miehet (Ruotsi)",
      no: "Division 2 Herr (Sverige)",
      nl: "Division 2 Men (Sweden)",
      de: "Division 2 Men (Sweden)",
      fr: "Division 2 Men (Sweden)",
    },
  },
  {
    id: "se_div3_herr",
    countryCode: "SE",
    genderCategory: "men",
    name: {
      en: "Division 3 Men (Sweden)",
      sv: "Division 3 Herr",
      fi: "Division 3 Miehet (Ruotsi)",
      no: "Division 3 Herr (Sverige)",
      nl: "Division 3 Men (Sweden)",
      de: "Division 3 Men (Sweden)",
      fr: "Division 3 Men (Sweden)",
    },
  },
  {
    id: "se_p19_nationell",
    countryCode: "SE",
    genderCategory: "junior",
    name: {
      en: "P19 Nationell (U19 Sweden)",
      sv: "P19 Nationell",
      fi: "P19 Nationell (U19 Ruotsi)",
      no: "P19 Nationell (U19 Sverige)",
      nl: "P19 Nationell (U19 Sweden)",
      de: "P19 Nationell (U19 Sweden)",
      fr: "P19 Nationell (U19 Sweden)",
    },
  },
  {
    id: "se_p17_nationell",
    countryCode: "SE",
    genderCategory: "junior",
    name: {
      en: "P17 Nationell (U17 Sweden)",
      sv: "P17 Nationell",
      fi: "P17 Nationell (U17 Ruotsi)",
      no: "P17 Nationell (U17 Sverige)",
      nl: "P17 Nationell (U17 Sweden)",
      de: "P17 Nationell (U17 Sweden)",
      fr: "P17 Nationell (U17 Sweden)",
    },
  },
  {
    id: "se_elitserien_dam",
    countryCode: "SE",
    genderCategory: "women",
    name: {
      en: "Elitserien Women (Sweden)",
      sv: "Elitserien Dam",
      fi: "Elitserien Naiset (Ruotsi)",
      no: "Elitserien Damer (Sverige)",
      nl: "Elitserien Women (Sweden)",
      de: "Elitserien Women (Sweden)",
      fr: "Elitserien Women (Sweden)",
    },
  },
  {
    id: "se_allsvenskan_dam",
    countryCode: "SE",
    genderCategory: "women",
    name: {
      en: "Allsvenskan Women (Sweden)",
      sv: "Allsvenskan Dam",
      fi: "Allsvenskan Naiset (Ruotsi)",
      no: "Allsvenskan Damer (Sverige)",
      nl: "Allsvenskan Women (Sweden)",
      de: "Allsvenskan Women (Sweden)",
      fr: "Allsvenskan Women (Sweden)",
    },
  },
  {
    id: "se_f17_nationell",
    countryCode: "SE",
    genderCategory: "junior",
    name: {
      en: "F17 Nationell (U17 Girls Sweden)",
      sv: "F17 Nationell",
      fi: "F17 Nationell (Tytöt Ruotsi)",
      no: "F17 Nationell (Jenter Sverige)",
      nl: "F17 Nationell (U17 Girls Sweden)",
      de: "F17 Nationell (U17 Girls Sweden)",
      fr: "F17 Nationell (U17 Girls Sweden)",
    },
  },

  // ==========================================
  // Norge (NO)
  // ==========================================
  {
    id: "no_elite_mann",
    countryCode: "NO",
    genderCategory: "men",
    name: {
      en: "NBF Elite mann (Norway)",
      sv: "NBF Elite mann",
      fi: "NBF Elite Miehet (Norja)",
      no: "NBF Elite mann",
      nl: "NBF Elite mann (Norway)",
      de: "NBF Elite mann (Norway)",
      fr: "NBF Elite mann (Norway)",
    },
  },
  {
    id: "no_1_divisjon",
    countryCode: "NO",
    genderCategory: "men",
    name: {
      en: "NBF 1. Divisjon (Norway)",
      sv: "NBF 1. Divisjon",
      fi: "NBF 1. Divisioona (Norja)",
      no: "NBF 1. Divisjon",
      nl: "NBF 1. Divisjon (Norway)",
      de: "NBF 1. Divisjon (Norway)",
      fr: "NBF 1. Divisjon (Norway)",
    },
  },
  {
    id: "no_junior",
    countryCode: "NO",
    genderCategory: "junior",
    name: {
      en: "NBF Junior (U19 Norway)",
      sv: "NBF Junior",
      fi: "NBF Juniorit (U19 Norja)",
      no: "NBF Junior",
      nl: "NBF Junior (U19 Norway)",
      de: "NBF Junior (U19 Norway)",
      fr: "NBF Junior (U19 Norway)",
    },
  },
  {
    id: "no_gutt",
    countryCode: "NO",
    genderCategory: "junior",
    name: {
      en: "NBF Gutt (U16 Norway)",
      sv: "NBF Gutt",
      fi: "NBF Pojat (U16 Norja)",
      no: "NBF Gutt",
      nl: "NBF Gutt (U16 Norway)",
      de: "NBF Gutt (U16 Norway)",
      fr: "NBF Gutt (U16 Norway)",
    },
  },
  {
    id: "no_dameserien",
    countryCode: "NO",
    genderCategory: "women",
    name: {
      en: "NBF Dameserien (Norway)",
      sv: "NBF Dameserien",
      fi: "NBF Naistensarja (Norja)",
      no: "NBF Dameserien",
      nl: "NBF Dameserien (Norway)",
      de: "NBF Dameserien (Norway)",
      fr: "NBF Dameserien (Norway)",
    },
  },
  {
    id: "no_smajenter",
    countryCode: "NO",
    genderCategory: "junior",
    name: {
      en: "NBF Småjenter (Girls Norway)",
      sv: "NBF Småjenter",
      fi: "NBF Tytöt (Norja)",
      no: "NBF Småjenter",
      nl: "NBF Småjenter (Girls Norway)",
      de: "NBF Småjenter (Girls Norway)",
      fr: "NBF Småjenter (Girls Norway)",
    },
  },

  // ==========================================
  // Finland (FI)
  // ==========================================
  {
    id: "fi_bandyliiga",
    countryCode: "FI",
    genderCategory: "men",
    name: {
      en: "Bandyliiga (Finland)",
      sv: "Bandyliiga",
      fi: "Bandyliiga",
      no: "Bandyliiga (Finland)",
      nl: "Bandyliiga (Finland)",
      de: "Bandyliiga (Finland)",
      fr: "Bandyliiga (Finland)",
    },
  },
  {
    id: "fi_suomisarja",
    countryCode: "FI",
    genderCategory: "men",
    name: {
      en: "Suomisarja / Div 1 (Finland)",
      sv: "Suomisarja (Div 1)",
      fi: "Suomisarja (1. Divisioona)",
      no: "Suomisarja (1. Divisjon)",
      nl: "Suomisarja / Div 1 (Finland)",
      de: "Suomisarja / Div 1 (Finland)",
      fr: "Suomisarja / Div 1 (Finland)",
    },
  },
  {
    id: "fi_naisten_bandyliiga",
    countryCode: "FI",
    genderCategory: "women",
    name: {
      en: "Naisten Bandyliiga (Finland)",
      sv: "Naisten Bandyliiga",
      fi: "Naisten Bandyliiga",
      no: "Naisten Bandyliiga (Damer Finland)",
      nl: "Naisten Bandyliiga (Finland)",
      de: "Naisten Bandyliiga (Finland)",
      fr: "Naisten Bandyliiga (Finland)",
    },
  },
  {
    id: "fi_nuorten_bandyliiga",
    countryCode: "FI",
    genderCategory: "junior",
    name: {
      en: "Nuorten Bandyliiga U21 (Finland)",
      sv: "Nuorten Bandyliiga (U21)",
      fi: "Nuorten Bandyliiga (U21)",
      no: "Nuorten Bandyliiga (U21 Finland)",
      nl: "Nuorten Bandyliiga U21 (Finland)",
      de: "Nuorten Bandyliiga U21 (Finland)",
      fr: "Nuorten Bandyliiga U21 (Finland)",
    },
  },

  // ==========================================
  // USA (US)
  // ==========================================
  {
    id: "us_premier_league",
    countryCode: "US",
    genderCategory: "men",
    name: {
      en: "US Premier League",
      sv: "US Premier League",
      fi: "US Premier League (USA)",
      no: "US Premier League",
      nl: "US Premier League",
      de: "US Premier League",
      fr: "US Premier League",
    },
  },
  {
    id: "us_division_1",
    countryCode: "US",
    genderCategory: "men",
    name: {
      en: "US Division 1",
      sv: "US Division 1",
      fi: "US Division 1 (USA)",
      no: "US Division 1",
      nl: "US Division 1",
      de: "US Division 1",
      fr: "US Division 1",
    },
  },
  {
    id: "us_womens_league",
    countryCode: "US",
    genderCategory: "women",
    name: {
      en: "Women's League (USA)",
      sv: "Women's League",
      fi: "Women's League (USA)",
      no: "Women's League (USA)",
      nl: "Women's League (USA)",
      de: "Women's League (USA)",
      fr: "Women's League (USA)",
    },
  },

  // ==========================================
  // Nederländerna (NL)
  // ==========================================
  {
    id: "nl_national_league",
    countryCode: "NL",
    genderCategory: "men",
    name: {
      en: "Dutch National League",
      sv: "Dutch National League",
      fi: "Dutch National League (Alankomaat)",
      no: "Dutch National League (Nederland)",
      nl: "Dutch National League",
      de: "Dutch National League",
      fr: "Dutch National League",
    },
  },
  {
    id: "nl_rinkbandy_league",
    countryCode: "NL",
    genderCategory: "all",
    name: {
      en: "Rinkbandy League (Netherlands)",
      sv: "Rinkbandy League",
      fi: "Rinkbandy League (Alankomaat)",
      no: "Rinkbandy League (Nederland)",
      nl: "Rinkbandy League (Netherlands)",
      de: "Rinkbandy League (Netherlands)",
      fr: "Rinkbandy League (Netherlands)",
    },
  },

  // ==========================================
  // Övriga länder / Default (OTHER)
  // ==========================================
  {
    id: "other_national_league",
    countryCode: "OTHER",
    genderCategory: "all",
    name: {
      en: "National League / Championship",
      sv: "National League / Championship",
      fi: "Kansallinen sarja / Mestaruussarja",
      no: "National League / Mesterskapsserie",
      nl: "National League / Championship",
      de: "National League / Championship",
      fr: "National League / Championship",
    },
  },
  {
    id: "other_rinkbandy_league",
    countryCode: "OTHER",
    genderCategory: "all",
    name: {
      en: "Rinkbandy League",
      sv: "Rinkbandy League",
      fi: "Rinkbandy League",
      no: "Rinkbandy League",
      nl: "Rinkbandy League",
      de: "Rinkbandy League",
      fr: "Rinkbandy League",
    },
  },
];

const LEAGUES_BY_COUNTRY: Record<string, LeagueItem[]> = {
  SE: LEAGUES.filter((l) => l.countryCode === "SE"),
  NO: LEAGUES.filter((l) => l.countryCode === "NO"),
  FI: LEAGUES.filter((l) => l.countryCode === "FI"),
  RU: LEAGUES.filter((l) => l.countryCode === "RU"),
  US: LEAGUES.filter((l) => l.countryCode === "US"),
  NL: LEAGUES.filter((l) => l.countryCode === "NL"),
  OTHER: LEAGUES.filter((l) => l.countryCode === "OTHER"),
};

const LEAGUE_MAP = new Map<string, LeagueItem>(LEAGUES.map((l) => [l.id.toLowerCase(), l]));

/**
 * Returns available leagues for a given country ISO code.
 * Falls back to "OTHER" default leagues if the country has no dedicated list.
 */
export function getLeaguesForCountry(countryCode?: string | null): LeagueItem[] {
  if (!countryCode) return LEAGUES;
  const upper = countryCode.toUpperCase().trim();
  if (LEAGUES_BY_COUNTRY[upper]) {
    return LEAGUES_BY_COUNTRY[upper];
  }
  return LEAGUES_BY_COUNTRY.OTHER;
}

/**
 * Returns a localized display name for a league id or raw string.
 */
export function getLeagueDisplayName(leagueIdOrRaw: string | undefined | null, lang: Language): string {
  if (!leagueIdOrRaw) return "";
  const norm = leagueIdOrRaw.toLowerCase().trim();

  // Check direct ID match
  const found = LEAGUE_MAP.get(norm);
  if (found) {
    return found.name[lang] || found.name.en || found.name.sv;
  }

  // Legacy mappings for backwards compatibility
  if (norm === "elitserien" || norm === "elitserien herr") {
    const item = LEAGUE_MAP.get("se_elitserien_herr");
    return item ? item.name[lang] || item.name.en : "Elitserien Herr";
  }
  if (norm === "allsvenskan" || norm === "bandyallsvenskan" || norm === "allsvenskan herr") {
    const item = LEAGUE_MAP.get("se_allsvenskan_herr");
    return item ? item.name[lang] || item.name.en : "Allsvenskan Herr";
  }
  if (norm === "division1" || norm === "div 1") {
    const item = LEAGUE_MAP.get("se_div1_herr");
    return item ? item.name[lang] || item.name.en : "Division 1 Herr";
  }
  if (norm === "bandyliiga") {
    const item = LEAGUE_MAP.get("fi_bandyliiga");
    return item ? item.name[lang] || item.name.en : "Bandyliiga";
  }
  if (norm === "eliteserien_no" || norm === "eliteserien") {
    const item = LEAGUE_MAP.get("no_elite_mann");
    return item ? item.name[lang] || item.name.en : "NBF Elite mann";
  }
  if (norm === "international") {
    const item = LEAGUE_MAP.get("other_national_league");
    return item ? item.name[lang] || item.name.en : "International League";
  }

  // Raw text entered via "Annat (skriv själv)"
  return leagueIdOrRaw;
}
