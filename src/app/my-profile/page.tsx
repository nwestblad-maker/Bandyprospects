"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { TargetCountriesPicker } from "@/components/TargetCountriesPicker";
import { CountryMultiSelect } from "@/components/CountryMultiSelect";
import { AvatarUpload } from "@/components/AvatarUpload";
import { DeleteProfileButton } from "@/components/DeleteProfileButton";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { ContactPrivacySettings } from "@/components/ContactPrivacySettings";
import { BandyTraitsPicker } from "@/components/BandyTraitsPicker";
import { CareerHistoryEditor } from "@/components/CareerHistoryEditor";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { CareerSeason, OccupationPreference, PlayerGrip, PlayerStatus, PositionCategory } from "@/types";
import { parseCareerHistory } from "@/lib/dataMappers";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry, getLeagueDisplayName } from "@/lib/leagues";

interface DbPlayer {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  nationality: string;
  photo_url?: string;
  current_club: string;
  position: string;
  secondary_position?: string;
  stick_hand: string;
  status: string;
  contract_status?: string;
  package_preference?: string;
  target_countries?: string[] | string;
  occupation_preference?: string[] | string;
  spoken_languages?: string[] | string;
  key_attributes?: string[] | string;
  player_traits?: string[] | string;
  secondary_citizenship?: string[] | string;
  secondary_citizenships?: string[] | string;
  heritage_country?: string;
  open_for_national_team?: boolean;
  bio?: string;
  video_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  email: string;
  phone?: string;
  show_phone?: boolean | null;
  show_email?: boolean | null;
  contact_preference?: string | null;
  height?: number | string;
  weight?: number | string;
  youth_club?: string;
  academy_type?: string;
  academy_school?: string;
  career_history?: CareerSeason[] | string;
  created_at?: string;
}

const SWEDISH_BANDY_ACADEMIES = [
  "Sandviken (Bessemerskolan - RIG)",
  "Nässjö (Brinellgymnasiet - RIG)",
  "Vetlanda (Njudungsgymnasiet - NIU)",
  "Edsbyn (Voxnadalens gymnasium - NIU)",
  "Bollnäs (Torsbergsgymnasiet - NIU)",
  "Västerås (Widénska gymnasiet - NIU)",
  "Ljusdal (Slottegymnasiet - NIU)",
  "Lidköping (De la Gardiegymnasiet - NIU)",
  "Vänersborg (Birger Sjöberggymnasiet - NIU)",
  "Falun (Lugnetgymnasiet - NIU)",
  "Söderhamn (Staffangymnasiet - NIU)",
  "Motala (Platengymnasiet - NIU)",
  "Uppsala (Celsiusskolan - NIU)",
  "Katrineholm (Duveholmsgymnasiet - NIU)",
  "Stockholm (Midsommarkransens gymnasium - NIU)",
];

export default function MyProfilePage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [noProfileFound, setNoProfileFound] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Section A: Grundfakta & Fysik
    firstName: "",
    lastName: "",
    birthYear: "2002",
    nationality: "SE",
    photoUrl: "",
    youthClub: "",
    academyType: "none" as "RIG" | "NIU" | "none",
    academySchool: "",
    heightCm: "",
    weightKg: "",
    stickGrip: "left" as PlayerGrip,
    currentClub: "",
    league: "se_elitserien_herr",
    customLeague: "",

    // Section B: Position & Spetsegenskaper
    position: "halv" as PositionCategory,
    secondaryPosition: "" as string,
    playerTraits: ["Skridskostark", "Spelförståelse"] as string[],

    // Section C: Kontrakt & Civil profil
    contractStatus: "free_agent" as "free_agent" | "expiring_26_27" | "under_contract_loan",
    videoUrl: "",
    contractType: "semi_pro",
    targetCountries: ["SE", "FI", "NO"] as string[],
    occupationPreferences: ["housing", "studies"] as OccupationPreference[],
    spokenLanguages: ["sv", "en"] as string[],
    secondaryCitizenships: [] as string[],
    heritageCountry: "",
    openForNationalTeam: true,
    bio: "",
    instagram_url: "",
    youtube_url: "",
    tiktok_url: "",
    phone: "",
    showPhone: true,
    showEmail: true,
    contactPreference: "all" as "all" | "form_only",

    // Section D: Tidigare klubbar & Säsonger
    careerHistory: [] as CareerSeason[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Auth & Player Data
  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        setLoadingAuth(true);
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
          router.push("/login");
          return;
        }

        const email = authData.user.email?.toLowerCase().trim() || "";
        setUserEmail(email);

        // Fetch player profile from Supabase
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .ilike("email", email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching player profile:", error);
        }

        if (!data) {
          setNoProfileFound(true);
        } else {
          const p = data as DbPlayer;
          setProfileId(p.id);

          // Parse array fields safely
          let parsedTarget: string[] = [];
          if (Array.isArray(p.target_countries)) {
            parsedTarget = p.target_countries;
          } else if (typeof p.target_countries === "string") {
            try {
              const res = JSON.parse(p.target_countries);
              if (Array.isArray(res)) parsedTarget = res;
              else parsedTarget = p.target_countries.split(",").map((s) => s.trim().toUpperCase());
            } catch {
              parsedTarget = p.target_countries.split(",").map((s) => s.trim().toUpperCase());
            }
          }

          let parsedOcc: OccupationPreference[] = [];
          if (Array.isArray(p.occupation_preference)) {
            parsedOcc = p.occupation_preference as OccupationPreference[];
          } else if (typeof p.occupation_preference === "string") {
            try {
              const res = JSON.parse(p.occupation_preference);
              if (Array.isArray(res)) parsedOcc = res;
              else parsedOcc = p.occupation_preference.split(",").map((s) => s.trim()) as OccupationPreference[];
            } catch {
              parsedOcc = p.occupation_preference.split(",").map((s) => s.trim()) as OccupationPreference[];
            }
          }

          let parsedLangs: string[] = [];
          if (Array.isArray(p.spoken_languages)) {
            parsedLangs = p.spoken_languages;
          } else if (typeof p.spoken_languages === "string") {
            try {
              const res = JSON.parse(p.spoken_languages);
              if (Array.isArray(res)) parsedLangs = res;
              else parsedLangs = p.spoken_languages.split(",").map((s) => s.trim());
            } catch {
              parsedLangs = p.spoken_languages.split(",").map((s) => s.trim());
            }
          }

          let parsedTraits: string[] = [];
          const rawTraits = p.player_traits || p.key_attributes;
          if (Array.isArray(rawTraits)) {
            parsedTraits = rawTraits;
          } else if (typeof rawTraits === "string") {
            try {
              const res = JSON.parse(rawTraits);
              if (Array.isArray(res)) parsedTraits = res;
              else parsedTraits = rawTraits.split(",").map((s) => s.trim());
            } catch {
              parsedTraits = rawTraits.split(",").map((s) => s.trim());
            }
          }

          let parsedCitizenships: string[] = [];
          const rawCit = p.secondary_citizenship || p.secondary_citizenships;
          if (Array.isArray(rawCit)) {
            parsedCitizenships = rawCit;
          } else if (typeof rawCit === "string") {
            try {
              const res = JSON.parse(rawCit);
              if (Array.isArray(res)) parsedCitizenships = res;
              else parsedCitizenships = rawCit.split(",").map((s) => s.trim().toUpperCase());
            } catch {
              parsedCitizenships = rawCit.split(",").map((s) => s.trim().toUpperCase());
            }
          }

          const parsedCareer = parseCareerHistory(p.career_history);

          // Contract status mapping
          let cStatus: "free_agent" | "expiring_26_27" | "under_contract_loan" = "free_agent";
          const rawStatus = (p.contract_status || p.status || "").toLowerCase();
          if (rawStatus.includes("expiring") || rawStatus.includes("utgående")) {
            cStatus = "expiring_26_27";
          } else if (rawStatus.includes("loan") || rawStatus.includes("lån") || rawStatus.includes("under_contract")) {
            cStatus = "under_contract_loan";
          }

          setFormData({
            firstName: p.first_name || "",
            lastName: p.last_name || "",
            birthYear: p.birth_year ? String(p.birth_year) : "2002",
            nationality: (p.nationality || "SE").toUpperCase(),
            photoUrl: p.photo_url || "",
            youthClub: p.youth_club || "",
            academyType: (p.academy_type as "RIG" | "NIU" | "none") || "none",
            academySchool: p.academy_school || "",
            heightCm: p.height ? String(p.height) : "",
            weightKg: p.weight ? String(p.weight) : "",
            stickGrip: (p.stick_hand as PlayerGrip) || "left",
            currentClub: p.current_club || "",
            league: "se_elitserien_herr",
            customLeague: "",
            position: (p.position as PositionCategory) || "halv",
            secondaryPosition: p.secondary_position || "",
            playerTraits: parsedTraits.length > 0 ? parsedTraits : ["Skridskostark", "Spelförståelse"],
            contractStatus: cStatus,
            videoUrl: p.youtube_url || p.video_url || "",
            contractType: p.package_preference || "semi_pro",
            targetCountries: parsedTarget.length > 0 ? parsedTarget : ["SE", "FI", "NO"],
            occupationPreferences: parsedOcc.length > 0 ? parsedOcc : ["housing"],
            spokenLanguages: parsedLangs.length > 0 ? parsedLangs : ["sv", "en"],
            secondaryCitizenships: parsedCitizenships,
            heritageCountry: p.heritage_country || "",
            openForNationalTeam: p.open_for_national_team !== false,
            bio: p.bio || "",
            instagram_url: p.instagram_url || "",
            youtube_url: p.youtube_url || p.video_url || "",
            tiktok_url: p.tiktok_url || "",
            phone: p.phone || "",
            showPhone: p.show_phone !== false,
            showEmail: p.show_email !== false,
            contactPreference: (p.contact_preference as "all" | "form_only") || "all",
            careerHistory: parsedCareer,
          });
        }
      } catch (err) {
        console.error("Auth / Profile check failed:", err);
      } finally {
        setLoadingAuth(false);
      }
    }

    loadUserAndProfile();
  }, [router]);

  const handleToggleOccupation = (pref: OccupationPreference) => {
    if (formData.occupationPreferences.includes(pref)) {
      setFormData({
        ...formData,
        occupationPreferences: formData.occupationPreferences.filter((p) => p !== pref),
      });
    } else {
      setFormData({
        ...formData,
        occupationPreferences: [...formData.occupationPreferences, pref],
      });
    }
  };

  const handleQuickStatusChange = async (newStatus: "free_agent" | "expiring_26_27" | "under_contract_loan") => {
    setFormData((prev) => ({ ...prev, contractStatus: newStatus }));
    setSaveSuccess(false);

    if (profileId) {
      try {
        const { error } = await supabase
          .from("players")
          .update({
            contract_status: newStatus,
            status: newStatus === "free_agent" ? "available_free_agent" : "seeking_26_27",
          })
          .eq("id", profileId);

        if (!error) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (e) {
        console.error("Quick status update failed:", e);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!profileId) {
      setErrorMessage("Ingen profil kopplad att spara till.");
      return;
    }

    try {
      setIsSaving(true);

      const resolvedLeague =
        formData.league === CUSTOM_OTHER_LEAGUE_VALUE
          ? formData.customLeague.trim()
          : getLeagueDisplayName(formData.league, "sv");

      let clubFormatted = formData.currentClub.trim();
      if (resolvedLeague && !clubFormatted.includes(resolvedLeague)) {
        clubFormatted = `${clubFormatted} (${resolvedLeague})`;
      }

      const resolvedVideo = formData.videoUrl.trim() || formData.youtube_url.trim() || null;

      const updatePayload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        birth_year: parseInt(formData.birthYear, 10) || 2000,
        nationality: formData.nationality.toUpperCase(),
        photo_url: formData.photoUrl.trim() || null,
        youth_club: formData.youthClub.trim() || null,
        academy_type: formData.academyType,
        academy_school: formData.academyType !== "none" ? formData.academySchool.trim() : null,
        height: formData.heightCm ? Number(formData.heightCm) : null,
        weight: formData.weightKg ? Number(formData.weightKg) : null,
        stick_hand: formData.stickGrip,
        current_club: clubFormatted,
        position: formData.position,
        secondary_position: formData.secondaryPosition.trim() || null,
        player_traits: formData.playerTraits,
        key_attributes: formData.playerTraits,
        contract_status: formData.contractStatus,
        status: formData.contractStatus === "free_agent" ? "available_free_agent" : "seeking_26_27",
        video_url: resolvedVideo,
        youtube_url: resolvedVideo,
        package_preference: formData.contractType,
        target_countries: formData.targetCountries,
        occupation_preference: formData.occupationPreferences,
        spoken_languages: formData.spokenLanguages,
        secondary_citizenship: formData.secondaryCitizenships,
        heritage_country: formData.heritageCountry.trim() || null,
        open_for_national_team: Boolean(formData.openForNationalTeam),
        bio: formData.bio.trim() || null,
        career_history: formData.careerHistory,
        instagram_url: formData.instagram_url.trim() || null,
        tiktok_url: formData.tiktok_url.trim() || null,
        phone: formData.phone.trim() || null,
        show_phone: formData.showPhone,
        show_email: formData.showEmail,
        contact_preference: formData.contactPreference,
      };

      const { error } = await supabase
        .from("players")
        .update(updatePayload)
        .eq("id", profileId);

      if (error) {
        console.error("Update error:", error);
        throw new Error(error.message || "Failed to update profile.");
      }

      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center text-xs text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Laddar din profil...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Inloggad som {userEmail}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                {formData.firstName || "Spelare"} {formData.lastName}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {lang === "sv"
                  ? "Hantera din bandyprofil, moderklubb, gymnasium och karriärhistorik."
                  : "Manage your bandy profile, youth club, academy, and career history."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {profileId && (
                <>
                  <Link
                    href={`/players/${profileId}`}
                    target="_blank"
                    className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold border border-zinc-200 transition-colors"
                  >
                    👁️ {lang === "sv" ? "Visa offentlig profil" : "View Public Profile"} ↗
                  </Link>
                  <DeleteProfileButton recordId={profileId} table="players" redirectPath="/join" />
                </>
              )}
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                {lang === "sv" ? "Logga ut" : "Log out"}
              </button>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-150">
              <span className="font-semibold">
                ✓ {lang === "sv" ? "Ändringarna har sparats! Din profil är uppdaterad." : "Changes saved! Your profile is updated."}
              </span>
              {profileId && (
                <Link
                  href={`/players/${profileId}`}
                  className="font-bold underline text-emerald-950"
                >
                  {lang === "sv" ? "Se profilen live →" : "View live →"}
                </Link>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-bold text-rose-900 hover:underline cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* QUICK CONTRACT STATUS TOGGLE */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs mb-8">
            <div className="pb-3 border-b border-zinc-100 mb-4">
              <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <span>🔄</span>
                <span>{lang === "sv" ? "Snabbval: Kontraktsstatus" : "Quick Status"}</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Klicka för att direkt uppdatera din status i klubbarnas sökvy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                { id: "free_agent", title: "Kontraktslös / Söker klubb", desc: "Öppen för dialog direkt", icon: "🔓" },
                { id: "expiring_26_27", title: "Utgående kontrakt 2026/27", desc: "Sonderar terrängen", icon: "⏳" },
                { id: "under_contract_loan", title: "Under kontrakt (Lån/Samarbete)", desc: "Söker lån/samarbetsavtal", icon: "🤝" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleQuickStatusChange(opt.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.contractStatus === opt.id
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-xs font-semibold"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>{opt.icon}</span>
                      <span>{opt.title}</span>
                    </span>
                    {formData.contractStatus === opt.id && <span className="text-xs">✓</span>}
                  </div>
                  <p className={`text-[11px] ${formData.contractStatus === opt.id ? "text-zinc-300" : "text-zinc-500"}`}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN EDIT FORM */}
          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* SECTION A: GRUNDFAKTA & FYSIK */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="pb-3 border-b border-zinc-100">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>A</span>
                  <span>Grundfakta & Fysik</span>
                </div>
                <h2 className="text-base font-bold text-zinc-950">Personuppgifter, Moderklubb & Skola</h2>
                <p className="text-xs text-zinc-500">
                  Moderklubb, gymnasium, fysiska mått och klubbtillhörighet.
                </p>
              </div>

              {/* Avatar Upload */}
              <AvatarUpload
                currentUrl={formData.photoUrl}
                onUploadSuccess={(url) => setFormData({ ...formData, photoUrl: url })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Förnamn *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Efternamn *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Födelseår *</label>
                  <input
                    type="number"
                    required
                    min="1975"
                    max="2015"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <CountrySelect
                    label="Nationalitet"
                    required
                    value={formData.nationality}
                    onChange={(code) => setFormData({ ...formData, nationality: code })}
                  />
                </div>
              </div>

              {/* Moderklubb & Bandygymnasium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-zinc-100">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-zinc-800 mb-1">
                    Moderklubb (där du startade spela bandy) *
                  </label>
                  <input
                    type="text"
                    value={formData.youthClub}
                    onChange={(e) => setFormData({ ...formData, youthClub: e.target.value })}
                    placeholder="t.ex. Vetlanda BK, Brobergs IF, Edsbyns IF"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Bandygymnasium</label>
                  <select
                    value={formData.academyType}
                    onChange={(e) => setFormData({ ...formData, academyType: e.target.value as "RIG" | "NIU" | "none" })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer font-medium"
                  >
                    <option value="none">Inget / Lokalt gymnasium</option>
                    <option value="NIU">NIU (Nationellt godkänd idrottsutbildning)</option>
                    <option value="RIG">RIG (Riksidrottsgymnasium)</option>
                  </select>
                </div>

                {formData.academyType !== "none" ? (
                  <div>
                    <label className="block font-semibold text-zinc-800 mb-1">Ort / Skola</label>
                    <input
                      type="text"
                      list="edit-academy-suggestions"
                      value={formData.academySchool}
                      onChange={(e) => setFormData({ ...formData, academySchool: e.target.value })}
                      placeholder="t.ex. Sandviken (Bessemerskolan) eller Vetlanda"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                    <datalist id="edit-academy-suggestions">
                      {SWEDISH_BANDY_ACADEMIES.map((school) => (
                        <option key={school} value={school} />
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-zinc-400 italic pt-6">
                    Vanligt gymnasium eller studier utanför RIG/NIU.
                  </div>
                )}
              </div>

              {/* Fysik & Fattning */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-zinc-100">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Längd (cm)</label>
                  <input
                    type="number"
                    min="140"
                    max="220"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    placeholder="185"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Vikt (kg)</label>
                  <input
                    type="number"
                    min="40"
                    max="140"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="82"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Fattning *</label>
                  <select
                    value={formData.stickGrip}
                    onChange={(e) => setFormData({ ...formData, stickGrip: e.target.value as PlayerGrip })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="left">Vänster (L)</option>
                    <option value="right">Höger (R)</option>
                  </select>
                </div>
              </div>

              {/* Nuvarande klubb */}
              <div className="pt-3 border-t border-zinc-100">
                <label className="block font-semibold text-zinc-700 text-xs mb-1">Nuvarande klubb *</label>
                <input
                  type="text"
                  required
                  value={formData.currentClub}
                  onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                  placeholder="t.ex. Sandvikens AIK"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* SECTION B: POSITION & SPETSEGENSKAPER */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="pb-3 border-b border-zinc-100">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>B</span>
                  <span>Position & Spetsegenskaper</span>
                </div>
                <h2 className="text-base font-bold text-zinc-950">Roll på isen & Spetsegenskaper</h2>
                <p className="text-xs text-zinc-500">
                  Primär roll, sekundär flexibilitet och dina starkaste spetsegenskaper.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Primär position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="halv">Halv</option>
                    <option value="midfielder">Mittfältare</option>
                    <option value="defender">Försvarare / Back</option>
                    <option value="forward">Anfallare / Forward</option>
                    <option value="goalkeeper">Målvakt</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Sekundär position (Valfritt)</label>
                  <select
                    value={formData.secondaryPosition}
                    onChange={(e) => setFormData({ ...formData, secondaryPosition: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="">Ingen / Endast primär position</option>
                    <option value="halv">Halv</option>
                    <option value="midfielder">Mittfältare</option>
                    <option value="defender">Försvarare / Back</option>
                    <option value="forward">Anfallare / Forward</option>
                    <option value="goalkeeper">Målvakt</option>
                  </select>
                </div>
              </div>

              {/* Spetsegenskaper */}
              <div className="pt-3 border-t border-zinc-100">
                <label className="block font-semibold text-zinc-900 text-xs mb-2">
                  Spetsegenskaper (Klicka för att välja dina främsta styrkor)
                </label>
                <BandyTraitsPicker
                  selectedTraits={formData.playerTraits}
                  onChange={(traits) => setFormData({ ...formData, playerTraits: traits })}
                  lang={lang}
                />
              </div>
            </div>

            {/* SECTION C: KONTRAKT & CIVIL PROFIL */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
              <div className="pb-3 border-b border-zinc-100">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>C</span>
                  <span>Kontrakt & Civil profil</span>
                </div>
                <h2 className="text-base font-bold text-zinc-950">Avtalssituation, Video & Civila önskemål</h2>
                <p className="text-xs text-zinc-500">
                  Definiera din kontraktsstatus, länk till matchvideo och dubbla karriärval.
                </p>
              </div>

              {/* Video URL */}
              <div>
                <label className="block font-semibold text-zinc-800 text-xs mb-1 flex items-center gap-1.5">
                  <span>▶️</span>
                  <span>Video / Highlights (YouTube eller Vimeo länk)</span>
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... eller https://vimeo.com/..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 text-xs font-medium"
                />
              </div>

              {/* Contract Type */}
              <div className="pt-2 border-t border-zinc-100">
                <label className="block font-bold text-zinc-800 text-xs mb-2">
                  Önskad avtalsnivå:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "semi_pro", title: "Semiprofessionell", desc: "Spelarersättning + jobb/studier" },
                    { id: "full_time", title: "Heltidsproffs", desc: "Heltidsavtal och elitfokus" },
                    { id: "amateur", title: "Amatör / Utveckling", desc: "Hjälp med boende & jobbmatchning" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, contractType: opt.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.contractType === opt.id
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-xs font-semibold"
                          : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{opt.title}</span>
                        {formData.contractType === opt.id && <span className="text-xs">✓</span>}
                      </div>
                      <p className={`text-[11px] ${formData.contractType === opt.id ? "text-zinc-300" : "text-zinc-500"}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Occupation Preferences */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <span className="block font-bold text-zinc-800 text-xs">
                  Civila önskemål (Kombinera idrott med):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "studies", icon: "🎓", label: "Studier på universitet / högskola" },
                    { id: "fulltime_job", icon: "💼", label: "Civilt heltidsjobb vid sidan av" },
                    { id: "parttime_job", icon: "🕒", label: "Flexibelt deltidsarbete" },
                    { id: "housing", icon: "🏠", label: "Hjälp med lägenhet / boende" },
                    { id: "sports_only", icon: "🏒", label: "Endast idrott / Spelarersättning" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      onClick={() => handleToggleOccupation(item.id as OccupationPreference)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        formData.occupationPreferences.includes(item.id as OccupationPreference)
                          ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                          : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.occupationPreferences.includes(item.id as OccupationPreference)}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                      />
                      <span className="flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Countries */}
              <div className="pt-3 border-t border-zinc-100">
                <label className="block font-bold text-zinc-800 text-xs mb-2">
                  Öppen för klubbar i följande länder:
                </label>
                <TargetCountriesPicker
                  selectedCodes={formData.targetCountries}
                  onChange={(codes) => setFormData({ ...formData, targetCountries: codes })}
                />
              </div>

              {/* Spoken Languages */}
              <div className="pt-3 border-t border-zinc-100">
                <SpokenLanguagesPicker
                  selectedLanguages={formData.spokenLanguages}
                  onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                />
              </div>

              {/* Bio */}
              <div className="pt-3 border-t border-zinc-100 text-xs">
                <label className="block font-semibold text-zinc-700 mb-1">
                  Spelarens presentation & Ambitioner
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Beskriv din spelstil, ambitioner och vad du söker hos en ny förening..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Contact Information & Privacy */}
              <div className="pt-4 border-t border-zinc-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+46 70 123 45 67"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <ContactPrivacySettings
                  showPhone={formData.showPhone}
                  setShowPhone={(val) => setFormData((prev) => ({ ...prev, showPhone: val }))}
                  showEmail={formData.showEmail}
                  setShowEmail={(val) => setFormData((prev) => ({ ...prev, showEmail: val }))}
                  contactPreference={formData.contactPreference}
                  setContactPreference={(val) => setFormData((prev) => ({ ...prev, contactPreference: val }))}
                  entityType="player"
                />
              </div>
            </div>

            {/* SECTION D: TIDIGARE KLUBBAR & SÄSONGER */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="pb-3 border-b border-zinc-100">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>D</span>
                  <span>Tidigare klubbar & Säsonger</span>
                </div>
                <h2 className="text-base font-bold text-zinc-950">Karriärhistorik</h2>
                <p className="text-xs text-zinc-500">
                  Lägg till tidigare säsonger och klubbar du representerat.
                </p>
              </div>

              <CareerHistoryEditor
                careerHistory={formData.careerHistory}
                onChange={(history) => setFormData({ ...formData, careerHistory: history })}
                lang={lang}
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sparar ändringar...</span>
                  </>
                ) : (
                  <>
                    <span>Spara alla ändringar</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
