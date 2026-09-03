export type Language = "en" | "sv" | "fi" | "no" | "nl" | "de" | "fr";

export type PositionCategory = "goalkeeper" | "defender" | "halv" | "midfielder" | "forward";
export type PlayerGrip = "left" | "right";
export type PlayerStatus =
  | "seeking_26_27"
  | "available_free_agent"
  | "open_for_trials"
  | "open_abroad"
  | "contracted_transferable";

export type OccupationPreference =
  | "studies"
  | "fulltime_job"
  | "parttime_job"
  | "housing"
  | "sports_only";

export interface LocalizedString {
  en: string;
  sv: string;
  fi: string;
  no: string;
  nl: string;
  de: string;
  fr: string;
}

export interface LocalizedArray {
  en: string[];
  sv: string[];
  fi: string[];
  no: string[];
  nl: string[];
  de: string[];
  fr: string[];
}

export interface CountryItem {
  code: string;
  flag: string;
  names: LocalizedString;
  popularBandy?: boolean;
}

export interface SpokenLanguageItem {
  code: string;
  flag: string;
  name: LocalizedString;
}

export interface CareerSeason {
  season: string; // e.g. "2025/26"
  club: string;   // e.g. "Vetlanda BK"
  league: string; // e.g. "Elitserien"
  role?: string;  // e.g. "Ordinarie / Lagkapten"
}

export interface PlayerProfile {
  id: string;
  name: string;
  age: number;
  countryCode: string;
  countryFlag: string;
  countryName: LocalizedString;
  positionCategory: PositionCategory;
  positionName: LocalizedString;
  secondaryPosition?: PositionCategory | string;
  secondaryPositionName?: LocalizedString;
  grip: PlayerGrip;
  gripName: LocalizedString;
  heightWeight: string;
  heightCm: number;
  weightKg: number;
  previousClub: string;
  currentStatus: PlayerStatus;
  statusLabel: LocalizedString;
  contractStatus?: string;
  contractStatusLabel?: LocalizedString;
  youthClub?: string;
  academyType?: "RIG" | "NIU" | "none" | string;
  academySchool?: string;
  playerTraits?: string[];
  careerHistory?: CareerSeason[];
  avatarInitials: string;
  photoUrl?: string;
  highlightStats: LocalizedString;
  bio: LocalizedString;
  skills: LocalizedArray;
  seekingPreferences: LocalizedString;
  packagePreference?: string;
  packagePreferenceLabel?: LocalizedString;
  email?: string;
  phone?: string;
  verified: boolean;
  appearancesCount: number;
  pointsCount: number;
  videoUrlPlaceholder?: string;
  videoUrl?: string;
  targetCountries?: string[];
  occupationPreferences?: OccupationPreference[];
  spokenLanguages?: string[];
  secondaryCitizenships?: string[];
  heritageCountry?: string;
  openForNationalTeam?: boolean;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  showPhone?: boolean;
  showEmail?: boolean;
  contactPreference?: "all" | "form_only";
}

export type PerkCategory = "housing" | "job" | "studies" | "salary" | "travel" | "equipment" | "gym";
export type TeamCategory = "men" | "women" | "junior";
export type OrgType = "club" | "national_team";

export interface ClubAd {
  id: string;
  club: string;
  countryCode: string;
  countryFlag: string;
  countryName: LocalizedString;
  city: string;
  teamCategory?: TeamCategory;
  orgType?: OrgType;
  tournament?: string;
  eligibilityRequirements?: string[];
  divisionCategory: "elitserien" | "allsvenskan" | "bandyliiga" | "eliteserien_no" | "division1" | "international";
  divisionName: LocalizedString;
  positionCategory: PositionCategory;
  positionName: LocalizedString;
  positions?: PositionCategory[];
  rolesDescription?: LocalizedString;
  contractType: LocalizedString;
  compensationDetails: LocalizedString;
  urgent: boolean;
  postedDate: LocalizedString;
  applicantsCount: number;
  description: LocalizedString;
  perkCategories: PerkCategory[];
  perks: LocalizedArray;
  requirements: LocalizedArray;
  spokenLanguages?: string[];
  contactPerson: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  showPhone?: boolean;
  showEmail?: boolean;
  contactPreference?: "all" | "form_only";
}
