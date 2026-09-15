/**
 * Club Email Domain Verification Utilities
 * 
 * Verifies whether an email address belongs to an official bandy club domain
 * or federation.
 */

// Common generic/free email providers that should NEVER be auto-verified
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.se",
  "yahoo.com",
  "yahoo.se",
  "outlook.com",
  "outlook.se",
  "icloud.com",
  "me.com",
  "live.com",
  "live.se",
  "msn.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "aol.com",
  "zoho.com",
  "gmx.com",
  "telia.com",
  "spray.se",
  "swipnet.se",
  "comhem.se",
  "bredband.net",
  "tele2.se",
  "telenor.se",
]);

// Known club domains (explicit list of top Swedish and international club domains)
const KNOWN_CLUB_DOMAINS = new Set([
  "vskbandy.se",
  "vsk.nu",
  "bollnasbandy.se",
  "vetlandabk.se",
  "villalidkoping.se",
  "edsbynsifbandy.se",
  "edsbyn.se",
  "brobergsif.se",
  "sandvikensaik.se",
  "saikbandy.com",
  "siriusbandy.se",
  "hammarbybandy.se",
  "motalabandy.se",
  "ifkmotalabandy.se",
  "frillesasbk.com",
  "gripenbk.se",
  "kungalvbandy.se",
  "ifkvanersborg.se",
  "faluif.se",
  "falubandy.se",
  "kalixbandy.se",
  "tellusbandy.se",
  "peaceandlovecity.se",
  "akilles.fi",
  "kampparit.fi",
  "veitera.fi",
  "jpsbandy.fi",
  "botniabandy.fi",
  "hifkbandy.fi",
  "narukera.fi",
  "drammenbandy.no",
  "stabakif.no",
  "solbergbandy.no",
  "readybandy.no",
  "sarpsborgbandy.no",
  "ullevaal.no",
  "nederlandsebandybond.nl",
  "svenskbandy.se",
  "worldbandy.com",
]);

// Keywords in domain name that indicate club affiliation
const CLUB_DOMAIN_KEYWORDS = [
  "bandy",
  "klubb",
  "aik",
  "gif",
  "bk",
  "ifk",
  "vsk",
  "bs",
  "fik",
  "sik",
  "ibk",
  "idrott",
  "forening",
  "sport",
  "villa",
  "bollnas",
  "vetlanda",
  "edsbyn",
  "broberg",
  "sandviken",
  "sirius",
  "hammarby",
  "motala",
  "frillesas",
  "gripen",
  "kungalv",
  "vanersborg",
  "tellus",
  "nassjo",
  "akilles",
  "kampparit",
  "veitera",
  "botnia",
  "hifk",
  "narukera",
  "drammen",
  "stabak",
  "solberg",
  "ready",
  "sarpsborg",
  "ulleval",
  "ullevaal",
];

/**
 * Extracts clean domain name from an email address
 */
export function getDomainFromEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const parts = email.trim().toLowerCase().split("@");
  return parts[parts.length - 1] || "";
}

/**
 * Checks if the email domain matches official club domain rules:
 * - Not a public provider (gmail, hotmail, etc.)
 * - Matches known club domain OR
 * - Ends in country code (.se, .no, .fi, etc.) and domain contains club keywords (bandy, klubb, aik, gif, etc.)
 */
export function isOfficialClubDomain(email?: string | null): boolean {
  if (!email) return false;
  const domain = getDomainFromEmail(email);
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) return false;

  if (KNOWN_CLUB_DOMAINS.has(domain)) return true;

  // Check if domain contains common club keywords
  const domainParts = domain.split(".");
  const namePart = domainParts[0] || "";

  // Suffix check (.se, .no, .fi, .nl, .de, .nu, .org, .com)
  const isAcceptedTld =
    domain.endsWith(".se") ||
    domain.endsWith(".no") ||
    domain.endsWith(".fi") ||
    domain.endsWith(".nl") ||
    domain.endsWith(".de") ||
    domain.endsWith(".nu") ||
    domain.endsWith(".org") ||
    domain.endsWith(".com");

  if (!isAcceptedTld) return false;

  // Check if name contains any of the club keywords
  const hasKeyword = CLUB_DOMAIN_KEYWORDS.some((kw) => {
    // If keyword is short (2 chars like bk, bs), ensure it's at start/end or bordered
    if (kw.length <= 2) {
      return namePart.endsWith(kw) || namePart.startsWith(kw);
    }
    return namePart.includes(kw);
  });

  return hasKeyword;
}
