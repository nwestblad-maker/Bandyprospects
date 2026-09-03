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
}

export const BANDY_TRAITS: BandyTrait[] = [
  { name: "Hörnskytt", icon: "🎯", category: "offense" },
  { name: "Skridskostark", icon: "⚡", category: "physical" },
  { name: "Spelförståelse", icon: "🧠", category: "mental" },
  { name: "Duellstark", icon: "💪", category: "physical" },
  { name: "Bollskicklig", icon: "🏒", category: "offense" },
  { name: "Playmaker", icon: "👑", category: "offense" },
  { name: "Defensivt ankare", icon: "⚓", category: "defense" },
  { name: "Genombrottsstark", icon: "🚀", category: "offense" },
  { name: "Målfarlig", icon: "🔥", category: "offense" },
  { name: "Passningsskicklig", icon: "🎯", category: "offense" },
  { name: "Brytningssäker", icon: "🛡️", category: "defense" },
  { name: "Snabba reflexer", icon: "🧤", category: "goalkeeper" },
  { name: "Vinkelsäker", icon: "📐", category: "goalkeeper" },
  { name: "Utkastsäker", icon: "🎯", category: "goalkeeper" },
  { name: "Ledare / Pådrivare", icon: "🗣️", category: "mental" },
  { name: "Löpstark / Uthållig", icon: "🏃", category: "physical" },
  { name: "Snabb acceleration", icon: "⚡", category: "physical" },
];

export function getTraitIcon(traitName: string): string {
  const clean = traitName.replace(/^[^\wåäöÅÄÖ]+\s*/, "").trim().toLowerCase();
  const found = BANDY_TRAITS.find((t) => t.name.toLowerCase() === clean);
  return found?.icon || "✨";
}

