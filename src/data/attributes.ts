import { Language } from "@/types";

export type KeyAttributeKey =
  | "skating"
  | "game_sense"
  | "passing"
  | "shooting"
  | "physicality"
  | "leadership"
  | "defensive_awareness"
  | "ball_control";

export interface KeyAttributeItem {
  key: KeyAttributeKey;
  icon: string;
  names: Record<Language, string>;
  descriptions?: Record<Language, string>;
}

export const KEY_ATTRIBUTES: KeyAttributeItem[] = [
  {
    key: "skating",
    icon: "⚡",
    names: {
      en: "Skating Speed & Agility",
      sv: "Skridskoåkning & Snabbhet",
      fi: "Luisteluvoima & Ketteryys",
      no: "Skøyteferdigheter & Hurtighet",
      nl: "Schaatssnelheid & Wendbaarheid",
      de: "Eislaufschnelligkeit & Wendigkeit",
      fr: "Vitesse de patinage & Agilité",
    },
  },
  {
    key: "game_sense",
    icon: "🧠",
    names: {
      en: "Game Sense & Vision",
      sv: "Spelförståelse & Belysning",
      fi: "Pelikäsitys & Havainnointi",
      no: "Spillforståelse & Overblikk",
      nl: "Speloverzicht & Visie",
      de: "Spielverständnis & Übersicht",
      fr: "Sens du jeu & Vision",
    },
  },
  {
    key: "passing",
    icon: "🎯",
    names: {
      en: "Passing & Distribution",
      sv: "Passningsspel & Distribution",
      fi: "Syöttöpeli & Avaussyötöt",
      no: "Pasningsspill & Distribusjon",
      nl: "Passen & Spelverdeling",
      de: "Passspiel & Spielaufbau",
      fr: "Passe & Distribution",
    },
  },
  {
    key: "shooting",
    icon: "💥",
    names: {
      en: "Shooting & Finishing",
      sv: "Skytte & Avslut",
      fi: "Laukaus & Viimeistely",
      no: "Skyting & Avslutninger",
      nl: "Schieten & Afmaken",
      de: "Schusskraft & Torgefahr",
      fr: "Tir & Finition",
    },
  },
  {
    key: "physicality",
    icon: "💪",
    names: {
      en: "Physicality & Strength",
      sv: "Fysiskt spel & Styrka",
      fi: "Fyysinen peli & Voima",
      no: "Fysisk spill & Styrke",
      nl: "Fysieke kracht & Duels",
      de: "Physische Stärke & Zweikampf",
      fr: "Physique & Puissance",
    },
  },
  {
    key: "leadership",
    icon: "👑",
    names: {
      en: "Leadership & Work Ethic",
      sv: "Ledarskap & Arbetsmoral",
      fi: "Johtajuus & Työmoraali",
      no: "Lederskap & Arbeidsinnsats",
      nl: "Leiderschap & Werkethiek",
      de: "Führungsqualität & Einsatz",
      fr: "Leadership & Éthique de travail",
    },
  },
  {
    key: "defensive_awareness",
    icon: "🛡️",
    names: {
      en: "Defensive Awareness & Tackling",
      sv: "Defensiv disciplin & Brytningar",
      fi: "Puolustusosaaminen & Katkot",
      no: "Defensiv disiplin & Brytninger",
      nl: "Verdedigend inzicht & Tackles",
      de: "Defensivverhalten & Zweikämpfe",
      fr: "Discipline défensive & Tacles",
    },
  },
  {
    key: "ball_control",
    icon: "🏒",
    names: {
      en: "1-on-1 & Ball Control",
      sv: "1-mot-1 / Dribbling & Kontroll",
      fi: "1v1 & Pallonhallinta",
      no: "1-mot-1 / Dribling & Kontroll",
      nl: "1-op-1 & Balcontrole",
      de: "1-gegen-1 & Ballkontrolle",
      fr: "1-contre-1 & Maniement de balle",
    },
  },
];

const ATTRIBUTE_MAP = new Map<string, KeyAttributeItem>(
  KEY_ATTRIBUTES.map((attr) => [attr.key.toLowerCase(), attr])
);

/**
 * Returns localized name for key attribute slug or falls back to raw string.
 */
export function getKeyAttributeName(keyOrRaw: string, lang: Language): string {
  if (!keyOrRaw) return "";
  const found = ATTRIBUTE_MAP.get(keyOrRaw.toLowerCase().trim());
  if (found) {
    return `${found.icon} ${found.names[lang] || found.names.en}`;
  }
  return keyOrRaw;
}

/**
 * Maps raw array of attribute keys into localized arrays for all supported languages
 */
export function mapRawAttributesToLocalized(rawKeys: string[] | string | null | undefined): Record<Language, string[]> {
  if (!rawKeys) {
    return { en: [], sv: [], fi: [], no: [], nl: [], de: [], fr: [] };
  }

  let keysArray: string[] = [];
  if (Array.isArray(rawKeys)) {
    keysArray = rawKeys;
  } else if (typeof rawKeys === "string") {
    try {
      const parsed = JSON.parse(rawKeys);
      if (Array.isArray(parsed)) keysArray = parsed;
      else keysArray = rawKeys.split(",").map((s) => s.trim());
    } catch {
      keysArray = rawKeys.split(",").map((s) => s.trim());
    }
  }

  return {
    en: keysArray.map((k) => getKeyAttributeName(k, "en")),
    sv: keysArray.map((k) => getKeyAttributeName(k, "sv")),
    fi: keysArray.map((k) => getKeyAttributeName(k, "fi")),
    no: keysArray.map((k) => getKeyAttributeName(k, "no")),
    nl: keysArray.map((k) => getKeyAttributeName(k, "nl")),
    de: keysArray.map((k) => getKeyAttributeName(k, "de")),
    fr: keysArray.map((k) => getKeyAttributeName(k, "fr")),
  };
}

export interface BandyTrait {
  name: string;
  icon: string;
  category?: "offense" | "defense" | "physical" | "mental" | "goalkeeper";
  swedishAlias?: string;
}

export const BANDY_TRAITS: BandyTrait[] = [
  { name: "Corner Specialist", icon: "🎯", category: "offense", swedishAlias: "Hörnskytt" },
  { name: "Skating Speed & Power", icon: "⚡", category: "physical", swedishAlias: "Skridskostark" },
  { name: "Vision & Game IQ", icon: "🧠", category: "mental", swedishAlias: "Spelförståelse" },
  { name: "Strong in Duels", icon: "💪", category: "physical", swedishAlias: "Duellstark" },
  { name: "Ball Control & Dribbling", icon: "🏒", category: "offense", swedishAlias: "Bollskicklig" },
  { name: "Playmaker", icon: "👑", category: "offense", swedishAlias: "Playmaker" },
  { name: "Defensive Anchor", icon: "⚓", category: "defense", swedishAlias: "Defensivt ankare" },
  { name: "Breakthrough Runner", icon: "🚀", category: "offense", swedishAlias: "Genombrottsstark" },
  { name: "Clinical Finisher", icon: "🔥", category: "offense", swedishAlias: "Målfarlig" },
  { name: "Passing Specialist", icon: "🎯", category: "offense", swedishAlias: "Passningsskicklig" },
  { name: "Interceptions & Tackling", icon: "🛡️", category: "defense", swedishAlias: "Brytningssäker" },
  { name: "Quick Reflexes", icon: "🧤", category: "goalkeeper", swedishAlias: "Snabba reflexer" },
  { name: "Angle Coverage", icon: "📐", category: "goalkeeper", swedishAlias: "Vinkelsäker" },
  { name: "Throw-out Precision", icon: "🎯", category: "goalkeeper", swedishAlias: "Utkastsäker" },
  { name: "Leader & Organizer", icon: "🗣️", category: "mental", swedishAlias: "Ledare / Pådrivare" },
  { name: "High Stamina / Workrate", icon: "🏃", category: "physical", swedishAlias: "Löpstark / Uthållig" },
  { name: "Rapid Acceleration", icon: "⚡", category: "physical", swedishAlias: "Snabb acceleration" },
];

export function getTraitIcon(traitName: string): string {
  const clean = traitName.replace(/^[^\wåäöÅÄÖ]+\s*/, "").trim().toLowerCase();
  const found = BANDY_TRAITS.find(
    (t) => t.name.toLowerCase() === clean || t.swedishAlias?.toLowerCase() === clean
  );
  return found?.icon || "✨";
}

