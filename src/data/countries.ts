import { CountryItem, Language, LocalizedString, SpokenLanguageItem } from "@/types";

export type { CountryItem, SpokenLanguageItem };

export const COUNTRIES: CountryItem[] = [
  // Core Bandy Nations & Nordic
  {
    code: "SE",
    flag: "🇸🇪",
    popularBandy: true,
    names: { en: "Sweden", sv: "Sverige", fi: "Ruotsi", no: "Sverige", nl: "Sweden", de: "Sweden", fr: "Sweden" },
  },
  {
    code: "FI",
    flag: "🇫🇮",
    popularBandy: true,
    names: { en: "Finland", sv: "Finland", fi: "Suomi", no: "Finland", nl: "Finland", de: "Finland", fr: "Finland" },
  },
  {
    code: "NO",
    flag: "🇳🇴",
    popularBandy: true,
    names: { en: "Norway", sv: "Norge", fi: "Norja", no: "Norge", nl: "Norway", de: "Norway", fr: "Norway" },
  },
  {
    code: "NL",
    flag: "🇳🇱",
    popularBandy: true,
    names: { en: "Netherlands", sv: "Nederländerna", fi: "Alankomaat", no: "Nederland", nl: "Netherlands", de: "Netherlands", fr: "Netherlands" },
  },
  {
    code: "US",
    flag: "🇺🇸",
    popularBandy: true,
    names: { en: "United States", sv: "USA", fi: "Yhdysvallat", no: "USA", nl: "United States", de: "United States", fr: "United States" },
  },
  {
    code: "CA",
    flag: "🇨🇦",
    popularBandy: true,
    names: { en: "Canada", sv: "Kanada", fi: "Kanada", no: "Canada", nl: "Canada", de: "Canada", fr: "Canada" },
  },
  {
    code: "DE",
    flag: "🇩🇪",
    popularBandy: true,
    names: { en: "Germany", sv: "Tyskland", fi: "Saksa", no: "Tyskland", nl: "Germany", de: "Germany", fr: "Germany" },
  },
  {
    code: "CH",
    flag: "🇨🇭",
    popularBandy: true,
    names: { en: "Switzerland", sv: "Schweiz", fi: "Sveitsi", no: "Sveits", nl: "Switzerland", de: "Switzerland", fr: "Switzerland" },
  },
  {
    code: "KZ",
    flag: "🇰🇿",
    popularBandy: true,
    names: { en: "Kazakhstan", sv: "Kazakstan", fi: "Kazakstan", no: "Kasakhstan", nl: "Kazakhstan", de: "Kazakhstan", fr: "Kazakhstan" },
  },
  {
    code: "EE",
    flag: "🇪🇪",
    popularBandy: true,
    names: { en: "Estonia", sv: "Estland", fi: "Viro", no: "Estland", nl: "Estonia", de: "Estonia", fr: "Estonia" },
  },
  {
    code: "CZ",
    flag: "🇨🇿",
    popularBandy: true,
    names: { en: "Czech Republic", sv: "Tjeckien", fi: "Tšekki", no: "Tsjekkia", nl: "Czech Republic", de: "Czech Republic", fr: "Czech Republic" },
  },
  {
    code: "HU",
    flag: "🇭🇺",
    popularBandy: true,
    names: { en: "Hungary", sv: "Ungern", fi: "Unkari", no: "Ungarn", nl: "Hungary", de: "Hungary", fr: "Hungary" },
  },
  {
    code: "GB",
    flag: "🇬🇧",
    popularBandy: true,
    names: { en: "United Kingdom", sv: "Storbritannien", fi: "Iso-Britannia", no: "Storbritannia", nl: "United Kingdom", de: "United Kingdom", fr: "United Kingdom" },
  },
  {
    code: "JP",
    flag: "🇯🇵",
    popularBandy: true,
    names: { en: "Japan", sv: "Japan", fi: "Japani", no: "Japan", nl: "Japan", de: "Japan", fr: "Japan" },
  },
  {
    code: "LV",
    flag: "🇱🇻",
    popularBandy: true,
    names: { en: "Latvia", sv: "Lettland", fi: "Latvia", no: "Latvia", nl: "Latvia", de: "Latvia", fr: "Latvia" },
  },
  {
    code: "UA",
    flag: "🇺🇦",
    popularBandy: true,
    names: { en: "Ukraine", sv: "Ukraina", fi: "Ukraina", no: "Ukraina", nl: "Ukraine", de: "Ukraine", fr: "Ukraine" },
  },
  {
    code: "IT",
    flag: "🇮🇹",
    popularBandy: true,
    names: { en: "Italy", sv: "Italien", fi: "Italia", no: "Italia", nl: "Italy", de: "Italy", fr: "Italy" },
  },
  {
    code: "PL",
    flag: "🇵🇱",
    popularBandy: true,
    names: { en: "Poland", sv: "Polen", fi: "Puola", no: "Polen", nl: "Poland", de: "Poland", fr: "Poland" },
  },
  {
    code: "MN",
    flag: "🇲🇳",
    popularBandy: true,
    names: { en: "Mongolia", sv: "Mongoliet", fi: "Mongolia", no: "Mongolia", nl: "Mongolia", de: "Mongolia", fr: "Mongolia" },
  },
  {
    code: "SO",
    flag: "🇸🇴",
    popularBandy: true,
    names: { en: "Somalia", sv: "Somalia", fi: "Somalia", no: "Somalia", nl: "Somalia", de: "Somalia", fr: "Somalia" },
  },
  {
    code: "SK",
    flag: "🇸🇰",
    popularBandy: true,
    names: { en: "Slovakia", sv: "Slovakien", fi: "Slovakia", no: "Slovakia", nl: "Slovakia", de: "Slovakia", fr: "Slovakia" },
  },
  {
    code: "DK",
    flag: "🇩🇰",
    names: { en: "Denmark", sv: "Danmark", fi: "Tanska", no: "Danmark", nl: "Denmark", de: "Denmark", fr: "Denmark" },
  },
  {
    code: "IS",
    flag: "🇮🇸",
    names: { en: "Iceland", sv: "Island", fi: "Islanti", no: "Island", nl: "Iceland", de: "Iceland", fr: "Iceland" },
  },
  {
    code: "AT",
    flag: "🇦🇹",
    names: { en: "Austria", sv: "Österrike", fi: "Itävalta", no: "Østerrike", nl: "Austria", de: "Austria", fr: "Austria" },
  },
  {
    code: "BE",
    flag: "🇧🇪",
    names: { en: "Belgium", sv: "Belgien", fi: "Belgia", no: "Belgia", nl: "Belgium", de: "Belgium", fr: "Belgium" },
  },
  {
    code: "FR",
    flag: "🇫🇷",
    names: { en: "France", sv: "Frankrike", fi: "Ranska", no: "Frankrike", nl: "France", de: "France", fr: "France" },
  },
  {
    code: "ES",
    flag: "🇪🇸",
    names: { en: "Spain", sv: "Spanien", fi: "Espanja", no: "Spania", nl: "Spain", de: "Spain", fr: "Spain" },
  },
  {
    code: "PT",
    flag: "🇵🇹",
    names: { en: "Portugal", sv: "Portugal", fi: "Portugali", no: "Portugal", nl: "Portugal", de: "Portugal", fr: "Portugal" },
  },
  {
    code: "IE",
    flag: "🇮🇪",
    names: { en: "Ireland", sv: "Irland", fi: "Irlanti", no: "Irland", nl: "Ireland", de: "Ireland", fr: "Ireland" },
  },
  {
    code: "LU",
    flag: "🇱🇺",
    names: { en: "Luxembourg", sv: "Luxemburg", fi: "Luxemburg", no: "Luxembourg", nl: "Luxembourg", de: "Luxembourg", fr: "Luxembourg" },
  },
  {
    code: "LT",
    flag: "🇱🇹",
    names: { en: "Lithuania", sv: "Litauen", fi: "Liettua", no: "Litauen", nl: "Lithuania", de: "Lithuania", fr: "Lithuania" },
  },
  {
    code: "RO",
    flag: "🇷🇴",
    names: { en: "Romania", sv: "Rumänien", fi: "Romania", no: "Romania", nl: "Romania", de: "Romania", fr: "Romania" },
  },
  {
    code: "BG",
    flag: "🇧🇬",
    names: { en: "Bulgaria", sv: "Bulgarien", fi: "Bulgaria", no: "Bulgaria", nl: "Bulgaria", de: "Bulgaria", fr: "Bulgaria" },
  },
  {
    code: "GR",
    flag: "🇬🇷",
    names: { en: "Greece", sv: "Grekland", fi: "Kreikka", no: "Hellas", nl: "Greece", de: "Greece", fr: "Greece" },
  },
  {
    code: "HR",
    flag: "🇭🇷",
    names: { en: "Croatia", sv: "Kroatien", fi: "Kroatia", no: "Kroatia", nl: "Croatia", de: "Croatia", fr: "Croatia" },
  },
  {
    code: "SI",
    flag: "🇸🇮",
    names: { en: "Slovenia", sv: "Slovenien", fi: "Slovenia", no: "Slovenia", nl: "Slovenia", de: "Slovenia", fr: "Slovenia" },
  },
  {
    code: "RS",
    flag: "🇷🇸",
    names: { en: "Serbia", sv: "Serbien", fi: "Serbia", no: "Serbia", nl: "Serbia", de: "Serbia", fr: "Serbia" },
  },
  {
    code: "BA",
    flag: "🇧🇦",
    names: { en: "Bosnia & Herzegovina", sv: "Bosnien och Hercegovina", fi: "Bosnia ja Hertsegovina", no: "Bosnia-Hercegovina", nl: "Bosnia & Herzegovina", de: "Bosnia & Herzegovina", fr: "Bosnia & Herzegovina" },
  },
  {
    code: "ME",
    flag: "🇲🇪",
    names: { en: "Montenegro", sv: "Montenegro", fi: "Montenegro", no: "Montenegro", nl: "Montenegro", de: "Montenegro", fr: "Montenegro" },
  },
  {
    code: "MK",
    flag: "🇲🇰",
    names: { en: "North Macedonia", sv: "Nordmakedonien", fi: "Pohjois-Makedonia", no: "Nord-Makedonia", nl: "North Macedonia", de: "North Macedonia", fr: "North Macedonia" },
  },
  {
    code: "AL",
    flag: "🇦🇱",
    names: { en: "Albania", sv: "Albanien", fi: "Albania", no: "Albania", nl: "Albania", de: "Albania", fr: "Albania" },
  },
  {
    code: "CY",
    flag: "🇨🇾",
    names: { en: "Cyprus", sv: "Cypern", fi: "Kypros", no: "Kypros", nl: "Cyprus", de: "Cyprus", fr: "Cyprus" },
  },
  {
    code: "MT",
    flag: "🇲🇹",
    names: { en: "Malta", sv: "Malta", fi: "Malta", no: "Malta", nl: "Malta", de: "Malta", fr: "Malta" },
  },
  {
    code: "AD",
    flag: "🇦🇩",
    names: { en: "Andorra", sv: "Andorra", fi: "Andorra", no: "Andorra", nl: "Andorra", de: "Andorra", fr: "Andorra" },
  },
  {
    code: "LI",
    flag: "🇱🇮",
    names: { en: "Liechtenstein", sv: "Liechtenstein", fi: "Liechtenstein", no: "Liechtenstein", nl: "Liechtenstein", de: "Liechtenstein", fr: "Liechtenstein" },
  },
  {
    code: "MC",
    flag: "🇲🇨",
    names: { en: "Monaco", sv: "Monaco", fi: "Monaco", no: "Monaco", nl: "Monaco", de: "Monaco", fr: "Monaco" },
  },
  {
    code: "SM",
    flag: "🇸🇲",
    names: { en: "San Marino", sv: "San Marino", fi: "San Marino", no: "San Marino", nl: "San Marino", de: "San Marino", fr: "San Marino" },
  },
  {
    code: "VA",
    flag: "🇻🇦",
    names: { en: "Vatican City", sv: "Vatikanstaten", fi: "Vatikaani", no: "Vatikanstaten", nl: "Vatican City", de: "Vatican City", fr: "Vatican City" },
  },
  {
    code: "MD",
    flag: "🇲🇩",
    names: { en: "Moldova", sv: "Moldavien", fi: "Moldova", no: "Moldova", nl: "Moldova", de: "Moldova", fr: "Moldova" },
  },
  {
    code: "BY",
    flag: "🇧🇾",
    names: { en: "Belarus", sv: "Belarus", fi: "Valko-Venäjä", no: "Belarus", nl: "Belarus", de: "Belarus", fr: "Belarus" },
  },
  {
    code: "GE",
    flag: "🇬🇪",
    names: { en: "Georgia", sv: "Georgien", fi: "Georgia", no: "Georgia", nl: "Georgia", de: "Georgia", fr: "Georgia" },
  },
  {
    code: "AM",
    flag: "🇦🇲",
    names: { en: "Armenia", sv: "Armenien", fi: "Armenia", no: "Armenia", nl: "Armenia", de: "Armenia", fr: "Armenia" },
  },
  {
    code: "AZ",
    flag: "🇦🇿",
    names: { en: "Azerbaijan", sv: "Azerbajdzjan", fi: "Azerbaidžan", no: "Aserbajdsjan", nl: "Azerbaijan", de: "Azerbaijan", fr: "Azerbaijan" },
  },
  {
    code: "TR",
    flag: "🇹🇷",
    names: { en: "Turkey", sv: "Turkiet", fi: "Turkki", no: "Tyrkia", nl: "Turkey", de: "Turkey", fr: "Turkey" },
  },

  // Americas
  {
    code: "MX",
    flag: "🇲🇽",
    names: { en: "Mexico", sv: "Mexiko", fi: "Meksiko", no: "Mexico", nl: "Mexico", de: "Mexico", fr: "Mexico" },
  },
  {
    code: "BR",
    flag: "🇧🇷",
    names: { en: "Brazil", sv: "Brasilien", fi: "Brasilia", no: "Brasil", nl: "Brazil", de: "Brazil", fr: "Brazil" },
  },
  {
    code: "AR",
    flag: "🇦🇷",
    names: { en: "Argentina", sv: "Argentina", fi: "Argentiina", no: "Argentina", nl: "Argentina", de: "Argentina", fr: "Argentina" },
  },
  {
    code: "CL",
    flag: "🇨🇱",
    names: { en: "Chile", sv: "Chile", fi: "Chile", no: "Chile", nl: "Chile", de: "Chile", fr: "Chile" },
  },
  {
    code: "CO",
    flag: "🇨🇴",
    names: { en: "Colombia", sv: "Colombia", fi: "Kolumbia", no: "Colombia", nl: "Colombia", de: "Colombia", fr: "Colombia" },
  },
  {
    code: "PE",
    flag: "🇵🇪",
    names: { en: "Peru", sv: "Peru", fi: "Peru", no: "Peru", nl: "Peru", de: "Peru", fr: "Peru" },
  },
  {
    code: "UY",
    flag: "🇺🇾",
    names: { en: "Uruguay", sv: "Uruguay", fi: "Uruguay", no: "Uruguay", nl: "Uruguay", de: "Uruguay", fr: "Uruguay" },
  },
  {
    code: "EC",
    flag: "🇪🇨",
    names: { en: "Ecuador", sv: "Ecuador", fi: "Ecuador", no: "Ecuador", nl: "Ecuador", de: "Ecuador", fr: "Ecuador" },
  },
  {
    code: "VE",
    flag: "🇻🇪",
    names: { en: "Venezuela", sv: "Venezuela", fi: "Venezuela", no: "Venezuela", nl: "Venezuela", de: "Venezuela", fr: "Venezuela" },
  },
  {
    code: "CR",
    flag: "🇨🇷",
    names: { en: "Costa Rica", sv: "Costa Rica", fi: "Costa Rica", no: "Costa Rica", nl: "Costa Rica", de: "Costa Rica", fr: "Costa Rica" },
  },
  {
    code: "PA",
    flag: "🇵🇦",
    names: { en: "Panama", sv: "Panama", fi: "Panama", no: "Panama", nl: "Panama", de: "Panama", fr: "Panama" },
  },
  {
    code: "CU",
    flag: "🇨🇺",
    names: { en: "Cuba", sv: "Kuba", fi: "Kuuba", no: "Cuba", nl: "Cuba", de: "Cuba", fr: "Cuba" },
  },
  {
    code: "JM",
    flag: "🇯🇲",
    names: { en: "Jamaica", sv: "Jamaica", fi: "Jamaika", no: "Jamaica", nl: "Jamaica", de: "Jamaica", fr: "Jamaica" },
  },

  // Asia & Oceania
  {
    code: "CN",
    flag: "🇨🇳",
    names: { en: "China", sv: "Kina", fi: "Kiina", no: "Kina", nl: "China", de: "China", fr: "China" },
  },
  {
    code: "KR",
    flag: "🇰🇷",
    names: { en: "South Korea", sv: "Sydkorea", fi: "Etelä-Korea", no: "Sør-Korea", nl: "South Korea", de: "South Korea", fr: "South Korea" },
  },
  {
    code: "IN",
    flag: "🇮🇳",
    names: { en: "India", sv: "Indien", fi: "Intia", no: "India", nl: "India", de: "India", fr: "India" },
  },
  {
    code: "AU",
    flag: "🇦🇺",
    names: { en: "Australia", sv: "Australien", fi: "Australia", no: "Australia", nl: "Australia", de: "Australia", fr: "Australia" },
  },
  {
    code: "NZ",
    flag: "🇳🇿",
    names: { en: "New Zealand", sv: "Nya Zeeland", fi: "Uusi-Seelanti", no: "New Zealand", nl: "New Zealand", de: "New Zealand", fr: "New Zealand" },
  },
  {
    code: "SG",
    flag: "🇸🇬",
    names: { en: "Singapore", sv: "Singapore", fi: "Singapore", no: "Singapore", nl: "Singapore", de: "Singapore", fr: "Singapore" },
  },
  {
    code: "TH",
    flag: "🇹🇭",
    names: { en: "Thailand", sv: "Thailand", fi: "Thaimaa", no: "Thailand", nl: "Thailand", de: "Thailand", fr: "Thailand" },
  },
  {
    code: "VN",
    flag: "🇻🇳",
    names: { en: "Vietnam", sv: "Vietnam", fi: "Vietnam", no: "Vietnam", nl: "Vietnam", de: "Vietnam", fr: "Vietnam" },
  },
  {
    code: "MY",
    flag: "🇲🇾",
    names: { en: "Malaysia", sv: "Malaysia", fi: "Malesia", no: "Malaysia", nl: "Malaysia", de: "Malaysia", fr: "Malaysia" },
  },
  {
    code: "ID",
    flag: "🇮🇩",
    names: { en: "Indonesia", sv: "Indonesien", fi: "Indonesia", no: "Indonesia", nl: "Indonesia", de: "Indonesia", fr: "Indonesia" },
  },
  {
    code: "PH",
    flag: "🇵🇭",
    names: { en: "Philippines", sv: "Filippinerna", fi: "Filippiinit", no: "Filippinene", nl: "Philippines", de: "Philippines", fr: "Philippines" },
  },
  {
    code: "PK",
    flag: "🇵🇰",
    names: { en: "Pakistan", sv: "Pakistan", fi: "Pakistan", no: "Pakistan", nl: "Pakistan", de: "Pakistan", fr: "Pakistan" },
  },
  {
    code: "BD",
    flag: "🇧🇩",
    names: { en: "Bangladesh", sv: "Bangladesh", fi: "Bangladesh", no: "Bangladesh", nl: "Bangladesh", de: "Bangladesh", fr: "Bangladesh" },
  },
  {
    code: "LK",
    flag: "🇱🇰",
    names: { en: "Sri Lanka", sv: "Sri Lanka", fi: "Sri Lanka", no: "Sri Lanka", nl: "Sri Lanka", de: "Sri Lanka", fr: "Sri Lanka" },
  },
  {
    code: "NP",
    flag: "🇳🇵",
    names: { en: "Nepal", sv: "Nepal", fi: "Nepal", no: "Nepal", nl: "Nepal", de: "Nepal", fr: "Nepal" },
  },
  {
    code: "AE",
    flag: "🇦🇪",
    names: { en: "United Arab Emirates", sv: "Förenade Arabemiraten", fi: "Yhdistyneet arabiemiirikunnat", no: "De forente arabiske emirater", nl: "United Arab Emirates", de: "United Arab Emirates", fr: "United Arab Emirates" },
  },
  {
    code: "SA",
    flag: "🇸🇦",
    names: { en: "Saudi Arabia", sv: "Saudiarabien", fi: "Saudi-Arabia", no: "Saudi-Arabia", nl: "Saudi Arabia", de: "Saudi Arabia", fr: "Saudi Arabia" },
  },
  {
    code: "QA",
    flag: "🇶🇦",
    names: { en: "Qatar", sv: "Qatar", fi: "Qatar", no: "Qatar", nl: "Qatar", de: "Qatar", fr: "Qatar" },
  },
  {
    code: "KW",
    flag: "🇰🇼",
    names: { en: "Kuwait", sv: "Kuwait", fi: "Kuwait", no: "Kuwait", nl: "Kuwait", de: "Kuwait", fr: "Kuwait" },
  },
  {
    code: "IL",
    flag: "🇮🇱",
    names: { en: "Israel", sv: "Israel", fi: "Israel", no: "Israel", nl: "Israel", de: "Israel", fr: "Israel" },
  },
  {
    code: "JO",
    flag: "🇯🇴",
    names: { en: "Jordan", sv: "Jordanien", fi: "Jordania", no: "Jordan", nl: "Jordan", de: "Jordan", fr: "Jordan" },
  },
  {
    code: "LB",
    flag: "🇱🇧",
    names: { en: "Lebanon", sv: "Libanon", fi: "Libanon", no: "Libanon", nl: "Lebanon", de: "Lebanon", fr: "Lebanon" },
  },
  {
    code: "TW",
    flag: "🇹🇼",
    names: { en: "Taiwan", sv: "Taiwan", fi: "Taiwan", no: "Taiwan", nl: "Taiwan", de: "Taiwan", fr: "Taiwan" },
  },
  {
    code: "HK",
    flag: "🇭🇰",
    names: { en: "Hong Kong", sv: "Hongkong", fi: "Hongkong", no: "Hongkong", nl: "Hong Kong", de: "Hong Kong", fr: "Hong Kong" },
  },

  // Africa
  {
    code: "ZA",
    flag: "🇿🇦",
    names: { en: "South Africa", sv: "Sydafrika", fi: "Etelä-Afrikka", no: "Sør-Afrika", nl: "South Africa", de: "South Africa", fr: "South Africa" },
  },
  {
    code: "EG",
    flag: "🇪🇬",
    names: { en: "Egypt", sv: "Egypten", fi: "Egypti", no: "Egypt", nl: "Egypt", de: "Egypt", fr: "Egypt" },
  },
  {
    code: "MA",
    flag: "🇲🇦",
    names: { en: "Morocco", sv: "Marocko", fi: "Marokko", no: "Marokko", nl: "Morocco", de: "Morocco", fr: "Morocco" },
  },
  {
    code: "NG",
    flag: "🇳🇬",
    names: { en: "Nigeria", sv: "Nigeria", fi: "Nigeria", no: "Nigeria", nl: "Nigeria", de: "Nigeria", fr: "Nigeria" },
  },
  {
    code: "KE",
    flag: "🇰🇪",
    names: { en: "Kenya", sv: "Kenya", fi: "Kenia", no: "Kenya", nl: "Kenya", de: "Kenya", fr: "Kenya" },
  },
  {
    code: "GH",
    flag: "🇬🇭",
    names: { en: "Ghana", sv: "Ghana", fi: "Ghana", no: "Ghana", nl: "Ghana", de: "Ghana", fr: "Ghana" },
  },
  {
    code: "SN",
    flag: "🇸🇳",
    names: { en: "Senegal", sv: "Senegal", fi: "Senegal", no: "Senegal", nl: "Senegal", de: "Senegal", fr: "Senegal" },
  },
  {
    code: "ET",
    flag: "🇪🇹",
    names: { en: "Ethiopia", sv: "Etiopien", fi: "Etiopia", no: "Etiopia", nl: "Ethiopia", de: "Ethiopia", fr: "Ethiopia" },
  },
  {
    code: "TZ",
    flag: "🇹🇿",
    names: { en: "Tanzania", sv: "Tanzania", fi: "Tansania", no: "Tanzania", nl: "Tanzania", de: "Tanzania", fr: "Tanzania" },
  },
  {
    code: "UG",
    flag: "🇺🇬",
    names: { en: "Uganda", sv: "Uganda", fi: "Uganda", no: "Uganda", nl: "Uganda", de: "Uganda", fr: "Uganda" },
  },
  {
    code: "DZ",
    flag: "🇩🇿",
    names: { en: "Algeria", sv: "Algeriet", fi: "Algeria", no: "Algerie", nl: "Algeria", de: "Algeria", fr: "Algeria" },
  },
  {
    code: "TN",
    flag: "🇹🇳",
    names: { en: "Tunisia", sv: "Tunisien", fi: "Tunisia", no: "Tunisia", nl: "Tunisia", de: "Tunisia", fr: "Tunisia" },
  },
];

// Spoken languages options
export const SPOKEN_LANGUAGES: SpokenLanguageItem[] = [
  {
    code: "sv",
    flag: "🇸🇪",
    name: { en: "Swedish", sv: "Svenska", fi: "Ruotsi", no: "Svensk", nl: "Swedish", de: "Swedish", fr: "Swedish" },
  },
  {
    code: "en",
    flag: "🇬🇧",
    name: { en: "English", sv: "Engelska", fi: "Englanti", no: "Engelsk", nl: "English", de: "English", fr: "English" },
  },
  {
    code: "fi",
    flag: "🇫🇮",
    name: { en: "Finnish", sv: "Finska", fi: "Suomi", no: "Finsk", nl: "Finnish", de: "Finnish", fr: "Finnish" },
  },
  {
    code: "no",
    flag: "🇳🇴",
    name: { en: "Norwegian", sv: "Norska", fi: "Norja", no: "Norsk", nl: "Norwegian", de: "Norwegian", fr: "Norwegian" },
  },
  {
    code: "ru",
    flag: "🇷🇺",
    name: { en: "Russian", sv: "Ryska", fi: "Venäjä", no: "Russisk", nl: "Russian", de: "Russian", fr: "Russian" },
  },
  {
    code: "de",
    flag: "🇩🇪",
    name: { en: "German", sv: "Tyska", fi: "Saksa", no: "Tysk", nl: "German", de: "German", fr: "German" },
  },
  {
    code: "nl",
    flag: "🇳🇱",
    name: { en: "Dutch", sv: "Nederländska", fi: "Hollanti", no: "Nederlandsk", nl: "Dutch", de: "Dutch", fr: "Dutch" },
  },
  {
    code: "fr",
    flag: "🇫🇷",
    name: { en: "French", sv: "Franska", fi: "Ranska", no: "Fransk", nl: "French", de: "French", fr: "French" },
  },
  {
    code: "es",
    flag: "🇪🇸",
    name: { en: "Spanish", sv: "Spanska", fi: "Espanja", no: "Spansk", nl: "Spanish", de: "Spanish", fr: "Spanish" },
  },
  {
    code: "it",
    flag: "🇮🇹",
    name: { en: "Italian", sv: "Italienska", fi: "Italia", no: "Italiensk", nl: "Italian", de: "Italian", fr: "Italian" },
  },
  {
    code: "da",
    flag: "🇩🇰",
    name: { en: "Danish", sv: "Danska", fi: "Tanska", no: "Dansk", nl: "Danish", de: "Danish", fr: "Danish" },
  },
  {
    code: "et",
    flag: "🇪🇪",
    name: { en: "Estonian", sv: "Estniska", fi: "Viro", no: "Estisk", nl: "Estonian", de: "Estonian", fr: "Estonian" },
  },
  {
    code: "hu",
    flag: "🇭🇺",
    name: { en: "Hungarian", sv: "Ungerska", fi: "Unkari", no: "Ungarsk", nl: "Hungarian", de: "Hungarian", fr: "Hungarian" },
  },
  {
    code: "cs",
    flag: "🇨🇿",
    name: { en: "Czech", sv: "Tjeckiska", fi: "Tšekki", no: "Tsjekkisk", nl: "Czech", de: "Czech", fr: "Czech" },
  },
  {
    code: "ja",
    flag: "🇯🇵",
    name: { en: "Japanese", sv: "Japanska", fi: "Japani", no: "Japansk", nl: "Japanese", de: "Japanese", fr: "Japanese" },
  },
  {
    code: "zh",
    flag: "🇨🇳",
    name: { en: "Chinese / Mandarin", sv: "Kinesiska", fi: "Kiina", no: "Kinesisk", nl: "Chinese / Mandarin", de: "Chinese / Mandarin", fr: "Chinese / Mandarin" },
  },
];

// Quick regions for target destinations
export interface RegionOption {
  id: string;
  name: LocalizedString;
  countryCodes: string[];
}

export const REGIONS: RegionOption[] = [
  {
    id: "worldwide",
    name: {
      en: "🌍 Worldwide / Anywhere",
      sv: "🌍 Öppen för hela världen",
      fi: "🌍 Avoin koko maailmalle",
      no: "🌍 Åpen for hele verden",
      nl: "🌍 Worldwide / Anywhere",
      de: "🌍 Worldwide / Anywhere",
      fr: "🌍 Worldwide / Anywhere",
    },
    countryCodes: ["ALL"],
  },
  {
    id: "nordic",
    name: {
      en: "❄️ Nordic (SWE, FIN, NOR)",
      sv: "❄️ Norden (Sverige, Finland, Norge)",
      fi: "❄️ Pohjoismaat (Ruotsi, Suomi, Norja)",
      no: "❄️ Norden (Sverige, Finland, Norge)",
      nl: "❄️ Nordic (SWE, FIN, NOR)",
      de: "❄️ Nordic (SWE, FIN, NOR)",
      fr: "❄️ Nordic (SWE, FIN, NOR)",
    },
    countryCodes: ["SE", "FI", "NO"],
  },
  {
    id: "europe",
    name: {
      en: "🇪🇺 Europe (All leagues)",
      sv: "🇪🇺 Europa (Alla ligor)",
      fi: "🇪🇺 Eurooppa (Kaikki sarjat)",
      no: "🇪🇺 Europa (Alle ligaer)",
      nl: "🇪🇺 Europe (All leagues)",
      de: "🇪🇺 Europe (All leagues)",
      fr: "🇪🇺 Europe (All leagues)",
    },
    countryCodes: ["SE", "FI", "NO", "NL", "DE", "CH", "EE", "CZ", "HU", "GB", "IT", "LV", "PL", "AT", "SK"],
  },
  {
    id: "north_america",
    name: {
      en: "🇺🇸 North America (USA, CAN)",
      sv: "🇺🇸 Nordamerika (USA, Kanada)",
      fi: "🇺🇸 Pohjois-Amerikka (USA, Kanada)",
      no: "🇺🇸 Nord-Amerika (USA, Canada)",
      nl: "🇺🇸 North America (USA, CAN)",
      de: "🇺🇸 North America (USA, CAN)",
      fr: "🇺🇸 North America (USA, CAN)",
    },
    countryCodes: ["US", "CA"],
  },
];

// Lookup Map by uppercase code
const COUNTRY_MAP = new Map<string, CountryItem>();
COUNTRIES.forEach((c) => {
  COUNTRY_MAP.set(c.code.toUpperCase(), c);
});

export function getCountry(code: string | undefined | null): CountryItem | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  // Handle some common aliases
  if (upper === "SWE" || upper === "SVERIGE" || upper === "SWEDEN") return COUNTRY_MAP.get("SE");
  if (upper === "FIN" || upper === "FINLAND" || upper === "SUOMI") return COUNTRY_MAP.get("FI");
  if (upper === "NOR" || upper === "NORGE" || upper === "NORWAY") return COUNTRY_MAP.get("NO");
  if (upper === "NED" || upper === "NETHERLANDS" || upper === "NEDERLAND") return COUNTRY_MAP.get("NL");
  if (upper === "USA" || upper === "UNITED STATES") return COUNTRY_MAP.get("US");
  if (upper === "CAN" || upper === "CANADA") return COUNTRY_MAP.get("CA");
  if (upper === "GER" || upper === "GERMANY" || upper === "DEUTSCHLAND") return COUNTRY_MAP.get("DE");
  return COUNTRY_MAP.get(upper);
}

export function getCountryName(code: string | undefined | null, lang: Language): string {
  const c = getCountry(code);
  if (c) return c.names[lang] || c.names.en || c.names.sv;
  return code || "Unknown";
}

export function getCountryFlag(code: string | undefined | null): string {
  const c = getCountry(code);
  if (c) return c.flag;
  return "🌍";
}

export function getLanguageItem(code: string): SpokenLanguageItem | undefined {
  const norm = code.toLowerCase().trim();
  return SPOKEN_LANGUAGES.find((l) => l.code.toLowerCase() === norm || l.name.en.toLowerCase() === norm);
}

export function getLanguageName(code: string, lang: Language): string {
  const item = getLanguageItem(code);
  if (item) return item.name[lang] || item.name.en || item.name.sv;
  return code;
}

export function getLanguageFlag(code: string): string {
  const item = getLanguageItem(code);
  if (item) return item.flag;
  return "🗣️";
}
