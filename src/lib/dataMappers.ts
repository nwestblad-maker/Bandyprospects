import { ClubAd, CareerSeason, Language, OccupationPreference, PerkCategory, PlayerGrip, PlayerProfile, PlayerStatus, PositionCategory, OrgType } from "@/types";
import { getCountry, getCountryName } from "@/data/countries";
import { mapRawAttributesToLocalized } from "@/data/attributes";
import { getLeagueDisplayName } from "@/lib/leagues";

export interface SupabasePlayerRow {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  nationality: string;
  current_club: string;
  position: string;
  stick_hand: string;
  status: string;
  package_preference?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  video_url?: string | null;
  email: string;
  phone?: string | null;
  target_countries?: string[] | string | null;
  occupation_preference?: string[] | string | null;
  spoken_languages?: string[] | string | null;
  key_attributes?: string[] | string | null;
  secondary_citizenship?: string[] | string | null;
  secondary_citizenships?: string[] | string | null;
  heritage_country?: string | null;
  open_for_national_team?: boolean | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  show_phone?: boolean | null;
  show_email?: boolean | null;
  contact_preference?: string | null;
  height?: number | string | null;
  weight?: number | string | null;
  secondary_position?: string | null;
  youth_club?: string | null;
  academy_type?: string | null;
  academy_school?: string | null;
  contract_status?: string | null;
  player_traits?: string[] | string | null;
  career_history?: CareerSeason[] | string | null;
}

export interface SupabaseClubAdRow {
  id: string;
  created_at?: string;
  club_name: string;
  country: string;
  city: string;
  league: string;
  org_type?: string | null;
  tournament?: string | null;
  eligibility_requirements?: string[] | string | null;
  needed_position?: string;
  needed_positions?: string[] | string | null;
  positions_needed?: string[] | string | null;
  team_category?: string | null;
  team_gender?: string | null;
  description?: string | null;
  roles_description?: string | null;
  benefits?: string[] | string | null;
  spoken_languages?: string[] | string | null;
  languages_spoken?: string[] | string | null;
  housing_provided?: boolean | null;
  job_study_help?: boolean | null;
  salary_offered?: boolean | null;
  contact_name?: string | null;
  contact_role?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  show_phone?: boolean | null;
  show_email?: boolean | null;
  contact_preference?: string | null;
}

export function mapCountryCode(nat: string): { code: string; flag: string; names: Record<Language, string> } {
  const found = getCountry(nat);
  if (found) {
    return {
      code: found.code,
      flag: found.flag,
      names: {
        en: found.names.en || found.names.sv,
        sv: found.names.sv || found.names.en,
        fi: found.names.fi || found.names.en,
        no: found.names.no || found.names.en,
        nl: found.names.nl || found.names.en,
        de: found.names.de || found.names.en,
        fr: found.names.fr || found.names.en,
      },
    };
  }

  // Graceful fallback
  const cleanCode = (nat || "SE").toUpperCase();
  return {
    code: cleanCode,
    flag: "🌍",
    names: {
      en: cleanCode,
      sv: cleanCode,
      fi: cleanCode,
      no: cleanCode,
      nl: cleanCode,
      de: cleanCode,
      fr: cleanCode,
    },
  };
}

export function mapPositionCategory(pos: string): {
  cat: PositionCategory;
  names: Record<Language, string>;
} {
  const p = (pos || "halv").toLowerCase();
  if (p === "goalkeeper" || p === "målvakt" || p === "maalivahti" || p === "keeper" || p === "doelman" || p === "torhüter" || p === "gardien") {
    return {
      cat: "goalkeeper",
      names: {
        en: "Goalkeeper",
        sv: "Målvakt",
        fi: "Maalivahti",
        no: "Målvakt / Keeper",
        nl: "Doelman / Keeper",
        de: "Torhüter",
        fr: "Gardien de but",
      },
    };
  }
  if (p === "defender" || p === "back" || p === "försvarare" || p === "puolustaja" || p === "forsvar" || p === "verdediger" || p === "verteidiger" || p === "défenseur") {
    return {
      cat: "defender",
      names: {
        en: "Defender / Back",
        sv: "Försvarare / Back",
        fi: "Puolustaja / Toppari",
        no: "Forsvar / Stopper",
        nl: "Verdediger / Back",
        de: "Verteidiger",
        fr: "Défenseur",
      },
    };
  }
  if (p === "midfielder" || p === "mittfält" || p === "mittfältare" || p === "keskikenttä" || p === "midtbane" || p === "middenvelder" || p === "mittelfeldspieler" || p === "milieu") {
    return {
      cat: "midfielder",
      names: {
        en: "Midfielder",
        sv: "Mittfältare",
        fi: "Keskikenttäpelaaja",
        no: "Midtbanespiller",
        nl: "Middenvelder",
        de: "Mittelfeldspieler",
        fr: "Milieu de terrain",
      },
    };
  }
  if (p === "forward" || p === "anfallare" || p === "hyökkääjä" || p === "spiss" || p === "aanvaller" || p === "stürmer" || p === "attaquant") {
    return {
      cat: "forward",
      names: {
        en: "Forward / Striker",
        sv: "Anfallare / Forward",
        fi: "Hyökkääjä / Kärki",
        no: "Angriper / Spiss",
        nl: "Aanvaller / Spits",
        de: "Stürmer",
        fr: "Attaquant",
      },
    };
  }
  // Default: Halv / Wing Halfback
  return {
    cat: "halv",
    names: {
      en: "Halfback (Halv)",
      sv: "Halv",
      fi: "Sivutuki (Halv)",
      no: "Halvback",
      nl: "Halve / Halfback",
      de: "Halbspieler",
      fr: "Demi / Demi-centre",
    },
  };
}

export function mapStatus(st: string): {
  status: PlayerStatus;
  labels: Record<Language, string>;
} {
  const s = (st || "seeking_26_27").toLowerCase();
  if (s === "available_free_agent" || s.includes("free_agent") || s.includes("kontraktslös")) {
    return {
      status: "available_free_agent",
      labels: {
        en: "Available Free Agent",
        sv: "Tillgänglig Free Agent",
        fi: "Vapaa pelaaja",
        no: "Tilgjengelig Free Agent",
        nl: "Vrije speler",
        de: "Vereinslos / Free Agent",
        fr: "Agent libre",
      },
    };
  }
  if (s === "open_for_trials" || s.includes("trial") || s.includes("provspel")) {
    return {
      status: "open_for_trials",
      labels: {
        en: "Open for Trials / Tryouts",
        sv: "Öppen för provspel",
        fi: "Avoin testileireille",
        no: "Åpen for prøvespill",
        nl: "Open voor try-out",
        de: "Offen für Probetraining",
        fr: "Ouvert aux essais",
      },
    };
  }
  if (s === "open_abroad" || s.includes("abroad") || s.includes("utland")) {
    return {
      status: "open_abroad",
      labels: {
        en: "Open for Relocation Abroad",
        sv: "Öppen för utlandsflytt",
        fi: "Avoin ulkomaansiirrolle",
        no: "Åpen for utenlandsopphold",
        nl: "Open voor buitenland",
        de: "Offen für Auslandswechsel",
        fr: "Ouvert à l'étranger",
      },
    };
  }
  if (s === "contracted_transferable" || s.includes("contract") || s.includes("under kontrakt")) {
    return {
      status: "contracted_transferable",
      labels: {
        en: "Under Contract / Transferable",
        sv: "Under kontrakt / Dold",
        fi: "Sopimuksen alainen",
        no: "Under kontrakt",
        nl: "Onder contract",
        de: "Unter Vertrag",
        fr: "Sous contrat",
      },
    };
  }
  // Default: Seeking for 26/27
  return {
    status: "seeking_26_27",
    labels: {
      en: "Seeking Club 26/27",
      sv: "Söker klubb 26/27",
      fi: "Etsii seuraa 26/27",
      no: "Søker klubb 26/27",
      nl: "Zoekt club 26/27",
      de: "Sucht Verein 26/27",
      fr: "Cherche club 26/27",
    },
  };
}

export function mapContractStatus(st: string | undefined | null): {
  key: string;
  labels: Record<Language, string>;
} {
  const s = (st || "").toLowerCase().trim();
  if (s === "expiring_26_27" || s.includes("utgående") || s.includes("expiring")) {
    return {
      key: "expiring_26_27",
      labels: {
        en: "Expiring Contract 2026/27",
        sv: "Utgående kontrakt 2026/27",
        fi: "Päättyvä sopimus 2026/27",
        no: "Utgående kontrakt 2026/27",
        nl: "Aflopend contract 2026/27",
        de: "Auslaufender Vertrag 2026/27",
        fr: "Contrat expirant 2026/27",
      },
    };
  }
  if (s === "under_contract_loan" || s.includes("lån") || s.includes("samarbete") || s.includes("loan")) {
    return {
      key: "under_contract_loan",
      labels: {
        en: "Under Contract (Seeking Loan / Dual-Registration)",
        sv: "Under kontrakt (Söker lån/samarbetsavtal)",
        fi: "Sopimuksen alainen (Etsii lainasopimusta)",
        no: "Under kontrakt (Søker lån/samarbeidsavtale)",
        nl: "Onder contract (Zoekt uitleenbeurt)",
        de: "Unter Vertrag (Leihgeschäft gesucht)",
        fr: "Sous contrat (Recherche un prêt)",
      },
    };
  }
  // Default: Kontraktslös / Söker klubb
  return {
    key: "free_agent",
    labels: {
      en: "Free Agent / Seeking Club",
      sv: "Kontraktslös / Söker klubb",
      fi: "Vapaa pelaaja / Etsii seuraa",
      no: "Kontraktsløs / Søker klubb",
      nl: "Contractvrij / Zoekt club",
      de: "Vereinslos / Sucht Verein",
      fr: "Sans contrat / Cherche club",
    },
  };
}

export function parseCareerHistory(val: unknown): CareerSeason[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    const list: CareerSeason[] = [];
    for (const item of val) {
      if (item && typeof item === "object") {
        const s = item as Record<string, unknown>;
        const season = String(s.season || "").trim();
        const club = String(s.club || "").trim();
        const league = String(s.league || "").trim();
        const role = s.role ? String(s.role).trim() : undefined;
        if (season || club) {
          list.push({ season, club, league, role });
        }
      }
    }
    return list;
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return parseCareerHistory(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export function mapContractPreference(pref: string | undefined | null): {
  key: string;
  labels: Record<Language, string>;
} {
  const p = (pref || "").toLowerCase().trim();
  if (p === "full_time" || p === "fulltime" || p === "pro" || p === "heltid" || p.includes("full_time") || p.includes("fulltime")) {
    return {
      key: "full_time",
      labels: {
        en: "Full-Time Pro",
        sv: "Heltidsproffs",
        fi: "Ammattilainen",
        no: "Heltidsproff",
        nl: "Fulltime prof",
        de: "Vollprofi",
        fr: "Professionnel à plein temps",
      },
    };
  }
  if (p === "semi_pro" || p === "semipro" || p.includes("semi") || p.includes("delvis")) {
    return {
      key: "semi_pro",
      labels: {
        en: "Semi-Professional",
        sv: "Semiprofessionell",
        fi: "Puoliammattilainen",
        no: "Semiprofesjonell",
        nl: "Semi-professioneel",
        de: "Halbprofi",
        fr: "Semi-professionnel",
      },
    };
  }
  if (p === "amateur" || p === "amator" || p === "utveckling" || p.includes("amateur") || p.includes("amatör")) {
    return {
      key: "amateur",
      labels: {
        en: "Amateur / Development",
        sv: "Amatör / Utveckling",
        fi: "Amatööri / Kehitys",
        no: "Amatør / Utvikling",
        nl: "Amateur / Ontwikkeling",
        de: "Amateur / Entwicklung",
        fr: "Amateur / Développement",
      },
    };
  }
  if (p === "sports_only") {
    return {
      key: "sports_only",
      labels: {
        en: "Athletic Salary Only",
        sv: "Endast idrott / Spelarersättning",
        fi: "Vain urheilijapalkkio",
        no: "Kun idrettslønn",
        nl: "Alleen sportvergoeding",
        de: "Nur Sportvergütung",
        fr: "Indemnité sportive uniquement",
      },
    };
  }

  if (p) {
    const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
    return {
      key: p,
      labels: {
        en: capitalized,
        sv: capitalized,
        fi: capitalized,
        no: capitalized,
        nl: capitalized,
        de: capitalized,
        fr: capitalized,
      },
    };
  }

  return {
    key: "semi_pro",
    labels: {
      en: "Semi-Professional",
      sv: "Semiprofessionell",
      fi: "Puoliammattilainen",
      no: "Semiprofesjonell",
      nl: "Semi-professioneel",
      de: "Halbprofi",
      fr: "Semi-professionnel",
    },
  };
}

function parseArrayField(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function transformSupabasePlayer(row: SupabasePlayerRow): PlayerProfile {
  const currentYear = new Date().getFullYear();
  const age = row.birth_year ? Math.max(16, currentYear - row.birth_year) : 22;
  const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Player";
  const initials = `${(row.first_name || "P")[0] || ""}${(row.last_name || "B")[0] || ""}`.toUpperCase();
  const countryInfo = mapCountryCode(row.nationality);
  const posInfo = mapPositionCategory(row.position);
  const statusInfo = mapStatus(row.status);
  const contractInfo = mapContractPreference(row.package_preference);

  const grip: PlayerGrip = (row.stick_hand || "left").toLowerCase() === "right" ? "right" : "left";
  const gripName: Record<Language, string> = {
    en: grip === "left" ? "Left (L)" : "Right (R)",
    sv: grip === "left" ? "Vänster (L)" : "Höger (R)",
    fi: grip === "left" ? "Left (L)" : "Right (R)",
    no: grip === "left" ? "Venstre (L)" : "Høyre (R)",
    nl: grip === "left" ? "Links (L)" : "Rechts (R)",
    de: grip === "left" ? "Links (L)" : "Rechts (R)",
    fr: grip === "left" ? "Gauche (L)" : "Droite (R)",
  };

  const bioText = row.bio?.trim() || "";
  const bio: Record<Language, string> = {
    en: bioText,
    sv: bioText,
    fi: bioText,
    no: bioText,
    nl: bioText,
    de: bioText,
    fr: bioText,
  };

  const targetCountries = parseArrayField(row.target_countries);
  const occupationPreferences = parseArrayField(row.occupation_preference) as OccupationPreference[];
  const spokenLanguages = parseArrayField(row.spoken_languages);

  const rawKeyAttributes = parseArrayField(row.key_attributes);
  const localizedAttributes = mapRawAttributesToLocalized(rawKeyAttributes);

  const secondaryCitizenships = parseArrayField(row.secondary_citizenship || row.secondary_citizenships);

  // Bandy-tailored fields (Strictly from database record)
  const heightCm = row.height ? Number(row.height) : undefined;
  const weightKg = row.weight ? Number(row.weight) : undefined;
  let heightWeight = "—";
  if (heightCm && weightKg) {
    heightWeight = `${heightCm} cm / ${weightKg} kg`;
  } else if (heightCm) {
    heightWeight = `${heightCm} cm`;
  } else if (weightKg) {
    heightWeight = `${weightKg} kg`;
  }

  const secondaryPosInfo = row.secondary_position ? mapPositionCategory(row.secondary_position) : undefined;
  const contractStatusInfo = mapContractStatus(row.contract_status || row.status);

  const youthClub = row.youth_club?.trim() || undefined;
  const rawAcademy = row.academy_type?.trim() as "RIG" | "NIU" | "none" | undefined;
  const academyType = rawAcademy && rawAcademy !== "none" ? rawAcademy : undefined;
  const academySchool = row.academy_school?.trim() || undefined;

  const rawTraits = parseArrayField(row.player_traits);
  const playerTraits = rawTraits.length > 0 ? rawTraits : rawKeyAttributes;

  const careerHistory = parseCareerHistory(row.career_history);
  const resolvedVideo = row.video_url || row.youtube_url || undefined;

  return {
    id: row.id,
    name: fullName,
    avatarInitials: initials,
    photoUrl: row.photo_url || undefined,
    age,
    countryCode: countryInfo.code,
    countryFlag: countryInfo.flag,
    countryName: countryInfo.names,
    positionCategory: posInfo.cat,
    positionName: posInfo.names,
    secondaryPosition: secondaryPosInfo ? secondaryPosInfo.cat : undefined,
    secondaryPositionName: secondaryPosInfo ? secondaryPosInfo.names : undefined,
    previousClub: row.current_club?.trim() || "—",
    grip,
    gripName,
    heightWeight,
    heightCm,
    weightKg,
    currentStatus: statusInfo.status,
    statusLabel: statusInfo.labels,
    contractStatus: contractStatusInfo.key,
    contractStatusLabel: contractStatusInfo.labels,
    youthClub,
    academyType,
    academySchool,
    playerTraits,
    careerHistory,
    packagePreference: contractInfo.key,
    packagePreferenceLabel: contractInfo.labels,
    highlightStats: {
      en: "Verified Bandyprospects Member",
      sv: "Registrerad Bandyprospects-profil",
      fi: "Vahvistettu jäsenprofiili",
      no: "Registrert spillerprofil",
      nl: "Geverifieerd Bandyprospects-lid",
      de: "Verifiziertes Bandyprospects-Mitglied",
      fr: "Membre vérifié Bandyprospects",
    },
    bio,
    skills: localizedAttributes,
    seekingPreferences: {
      en: `Preferred Agreement: ${contractInfo.labels.en}`,
      sv: `Önskad avtalstyp: ${contractInfo.labels.sv}`,
      fi: `Toivottu sopimustyyppi: ${contractInfo.labels.fi}`,
      no: `Ønsket avtaletype: ${contractInfo.labels.no}`,
      nl: `Gewenst contract: ${contractInfo.labels.nl}`,
      de: `Gewünschter Vertrag: ${contractInfo.labels.de}`,
      fr: `Type d'accord souhaité : ${contractInfo.labels.fr}`,
    },
    email: row.email || undefined,
    phone: row.phone || undefined,
    appearancesCount: 0,
    pointsCount: 0,
    verified: true,
    videoUrl: resolvedVideo,
    targetCountries: targetCountries,
    occupationPreferences: occupationPreferences,
    spokenLanguages: spokenLanguages,
    secondaryCitizenships: secondaryCitizenships.length > 0 ? secondaryCitizenships : undefined,
    heritageCountry: row.heritage_country || undefined,
    openForNationalTeam: Boolean(row.open_for_national_team),
    instagramUrl: row.instagram_url || undefined,
    youtubeUrl: resolvedVideo,
    tiktokUrl: row.tiktok_url || undefined,
    showPhone: row.show_phone !== false,
    showEmail: row.show_email !== false,
    contactPreference: (row.contact_preference as "all" | "form_only") || "all",
  };
}

export function mapLeagueName(league: string): Record<Language, string> {
  const nameEn = getLeagueDisplayName(league, "en") || "Elitserien";
  const nameSv = getLeagueDisplayName(league, "sv") || nameEn;
  const nameFi = getLeagueDisplayName(league, "fi") || nameEn;
  const nameNo = getLeagueDisplayName(league, "no") || nameEn;
  const nameNl = getLeagueDisplayName(league, "nl") || nameEn;
  const nameDe = getLeagueDisplayName(league, "de") || nameEn;
  const nameFr = getLeagueDisplayName(league, "fr") || nameEn;

  return {
    en: nameEn,
    sv: nameSv,
    fi: nameFi,
    no: nameNo,
    nl: nameNl,
    de: nameDe,
    fr: nameFr,
  };
}

export function transformSupabaseClubAd(row: SupabaseClubAdRow): ClubAd {
  const countryInfo = mapCountryCode(row.country);
  const divisionNames = mapLeagueName(row.league);

  // Position Category & Multiple positions
  const rawPosList = parseArrayField(row.positions_needed || row.needed_positions);
  let positions: PositionCategory[] = [];

  if (rawPosList.length > 0) {
    positions = rawPosList.map((p) => mapPositionCategory(p).cat);
  } else if (row.needed_position) {
    positions = [mapPositionCategory(row.needed_position).cat];
  } else {
    positions = ["halv"];
  }

  const primaryPosInfo = mapPositionCategory(positions[0] || "halv");

  // Team Category
  let teamCategory: "men" | "women" | "junior" = "men";
  const g = (row.team_gender || row.team_category || "").toLowerCase();
  if (g.includes("dam") || g.includes("women") || g.includes("naiset")) {
    teamCategory = "women";
  } else if (g.includes("junior") || g.includes("ungdom") || g.includes("nuoret") || g.includes("u19") || g.includes("u17")) {
    teamCategory = "junior";
  }

  // Perk categories & Perks list
  const rawBenefits = parseArrayField(row.benefits);
  const perksList: string[] = [];
  const perkCategories: PerkCategory[] = [];

  if (row.housing_provided) {
    perksList.push("Boende ordnas / Housing provided");
    perkCategories.push("housing");
  }
  if (row.job_study_help) {
    perksList.push("Hjälp med civilt jobb / studier (Job/Studies help)");
    perkCategories.push("job", "studies");
  }
  if (row.salary_offered) {
    perksList.push("Kontraktslön / Ersättning (Salary/Compensation)");
    perkCategories.push("salary");
  }

  rawBenefits.forEach((b) => {
    if (!perksList.includes(b)) perksList.push(b);
  });

  const bLower = rawBenefits.join(" ").toLowerCase();
  if (bLower.includes("boende") || bLower.includes("housing") || bLower.includes("asunto") || bLower.includes("bosted")) {
    if (!perkCategories.includes("housing")) perkCategories.push("housing");
  }
  if (bLower.includes("studier") || bLower.includes("studies") || bLower.includes("skola") || bLower.includes("opiskelu")) {
    if (!perkCategories.includes("studies")) perkCategories.push("studies");
  }
  if (bLower.includes("job") || bLower.includes("arbete") || bLower.includes("työ") || bLower.includes("praktik")) {
    if (!perkCategories.includes("job")) perkCategories.push("job");
  }
  if (bLower.includes("salary") || bLower.includes("lön") || bLower.includes("ersättning") || bLower.includes("palkkio") || bLower.includes("arvode")) {
    if (!perkCategories.includes("salary")) perkCategories.push("salary");
  }
  if (bLower.includes("travel") || bLower.includes("resa") || bLower.includes("flyg") || bLower.includes("matka") || bLower.includes("körersättning")) {
    if (!perkCategories.includes("travel")) perkCategories.push("travel");
  }
  if (bLower.includes("gym") || bLower.includes("fys") || bLower.includes("kuntosali")) {
    if (!perkCategories.includes("gym")) perkCategories.push("gym");
  }
  if (bLower.includes("equipment") || bLower.includes("material") || bLower.includes("varuste") || bLower.includes("utrustning")) {
    if (!perkCategories.includes("equipment")) perkCategories.push("equipment");
  }
  if (perkCategories.length === 0) {
    perkCategories.push("housing", "salary", "job");
  }

  // Spoken languages in team
  const spokenLanguages = row.languages_spoken
    ? parseArrayField(row.languages_spoken)
    : row.spoken_languages
    ? parseArrayField(row.spoken_languages)
    : ["sv", "en"];

  const desc = row.description || "Active roster opportunity listed on Bandyprospects.";
  const rolesDesc = row.roles_description || undefined;

  const contactRole = row.contact_role || "Sports Director / Sportchef";
  const contactName = row.contact_name || "Representative";
  const contactEmail = row.contact_email || "kontakt@bandyprospects.com";
  const contactPhone = row.contact_phone || undefined;

  const orgType: OrgType = row.org_type === "national_team" ? "national_team" : "club";
  const eligibilityRequirements = parseArrayField(row.eligibility_requirements);

  return {
    id: row.id,
    club: row.club_name || "Bandy Club",
    countryCode: countryInfo.code,
    countryFlag: countryInfo.flag,
    countryName: countryInfo.names,
    city: row.city || "Arena",
    teamCategory,
    orgType,
    tournament: row.tournament || undefined,
    eligibilityRequirements: eligibilityRequirements.length > 0 ? eligibilityRequirements : undefined,
    divisionCategory: (row.league || "elitserien") as any,
    divisionName: divisionNames,
    positionCategory: primaryPosInfo.cat,
    positionName: primaryPosInfo.names,
    positions,
    rolesDescription: rolesDesc
      ? {
          en: rolesDesc,
          sv: rolesDesc,
          fi: rolesDesc,
          no: rolesDesc,
          nl: rolesDesc,
          de: rolesDesc,
          fr: rolesDesc,
        }
      : undefined,
    contractType: {
      en: orgType === "national_team" ? "National Team Roster" : "1-2 Season Contract",
      sv: orgType === "national_team" ? "Landslagstrupp / Mästerskap" : "1-2 säsongers avtal",
      fi: orgType === "national_team" ? "Maajoukkue / Turnaus" : "1-2 kauden sopimus",
      no: orgType === "national_team" ? "Landslagstropp" : "1-2 sesongers avtale",
      nl: orgType === "national_team" ? "Nationale Selectie" : "1-2 Seizoenen contract",
      de: orgType === "national_team" ? "Nationalmannschaft" : "1-2 Saison-Vertrag",
      fr: orgType === "national_team" ? "Équipe nationale" : "Contrat 1-2 saisons",
    },
    compensationDetails: {
      en: "Competitive compensation package with housing and partner support.",
      sv: "Föreningsavtal med boendelösning och partnernätverk.",
      fi: "Kilpailukykyinen sopimuspaketti asunnolla.",
      no: "Konkurransedyktig avtale med bosted.",
      nl: "Competitief pakket met huisvesting.",
      de: "Attraktives Vereinspaket mit Unterkunft.",
      fr: "Pack compétitif avec logement et accompagnement.",
    },
    perkCategories,
    perks: {
      en: perksList,
      sv: perksList,
      fi: perksList,
      no: perksList,
      nl: perksList,
      de: perksList,
      fr: perksList,
    },
    requirements: {
      en: ["Competition experience", "Committed attitude", "Team player"],
      sv: ["Erfarenhet från seriespel", "Hög träningsnärvaro", "Lagspelare"],
      fi: ["Kokemus sarjapeleistä", "Korkea sitoutuminen", "Joukkuepelaaja"],
      no: ["Erfaring fra seriespill", "Treningsvillig", "Lagspiller"],
      nl: ["Wedstrijdervaring", "Hoge inzet", "Teamspeler"],
      de: ["Wettkampferfahrung", "Hohe Einsatzbereitschaft", "Teamplayer"],
      fr: ["Expérience en compétition", "Engagement", "Esprit d'équipe"],
    },
    spokenLanguages,
    contactPerson: `${contactName} (${contactRole})`,
    contactRole,
    contactEmail,
    contactPhone,
    postedDate: {
      en: "Recently",
      sv: "Nyligen",
      fi: "Äskettäin",
      no: "Nylig",
      nl: "Recent",
      de: "Kürzlich",
      fr: "Récemment",
    },
    applicantsCount: 3,
    description: {
      en: desc,
      sv: desc,
      fi: desc,
      no: desc,
      nl: desc,
      de: desc,
      fr: desc,
    },
    urgent: false,
    showPhone: row.show_phone !== false,
    showEmail: row.show_email !== false,
    contactPreference: (row.contact_preference as "all" | "form_only") || "all",
  };
}
