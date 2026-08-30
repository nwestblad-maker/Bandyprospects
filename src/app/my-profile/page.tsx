"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { KeyAttributesPicker } from "@/components/KeyAttributesPicker";
import { TargetCountriesPicker } from "@/components/TargetCountriesPicker";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { OccupationPreference, PlayerGrip, PlayerStatus, PositionCategory } from "@/types";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry, getLeagueDisplayName } from "@/lib/leagues";

interface DbPlayer {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  nationality: string;
  current_club: string;
  position: string;
  stick_hand: string;
  status: string;
  package_preference?: string;
  target_countries?: string[] | string;
  occupation_preference?: string[] | string;
  spoken_languages?: string[] | string;
  key_attributes?: string[] | string;
  secondary_citizenship?: string[] | string;
  secondary_citizenships?: string[] | string;
  heritage_country?: string;
  open_for_national_team?: boolean;
  bio?: string;
  video_url?: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [noProfileFound, setNoProfileFound] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthYear: "2002",
    nationality: "SE",
    currentClub: "",
    league: "se_elitserien_herr",
    customLeague: "",
    position: "halv" as PositionCategory,
    stickGrip: "left" as PlayerGrip,
    heightCm: "",
    weightKg: "",
    keyAttributes: ["skating", "game_sense"] as string[],
    secondaryCitizenships: [] as string[],
    heritageCountry: "",
    openForNationalTeam: true,
    status: "seeking_26_27" as PlayerStatus,
    targetCountries: ["SE", "FI", "NO"] as string[],
    occupationPreferences: ["housing", "studies"] as OccupationPreference[],
    spokenLanguages: ["sv", "en"] as string[],
    contractType: "semi_pro",
    bio: "",
    videoUrl: "",
    phone: "",
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
            } catch {
              parsedLangs = p.spoken_languages.split(",").map((s) => s.trim().toLowerCase());
            }
          }

          let parsedKeyAttrs: string[] = [];
          if (Array.isArray(p.key_attributes)) {
            parsedKeyAttrs = p.key_attributes;
          } else if (typeof p.key_attributes === "string") {
            try {
              const res = JSON.parse(p.key_attributes);
              if (Array.isArray(res)) parsedKeyAttrs = res;
            } catch {
              parsedKeyAttrs = p.key_attributes.split(",").map((s) => s.trim());
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

          setFormData({
            firstName: p.first_name || "",
            lastName: p.last_name || "",
            birthYear: p.birth_year ? String(p.birth_year) : "2002",
            nationality: (p.nationality || "SE").toUpperCase(),
            currentClub: p.current_club || "",
            league: "se_elitserien_herr",
            customLeague: "",
            position: (p.position as PositionCategory) || "halv",
            stickGrip: (p.stick_hand as PlayerGrip) || "left",
            heightCm: "",
            weightKg: "",
            keyAttributes: parsedKeyAttrs,
            secondaryCitizenships: parsedCitizenships,
            heritageCountry: p.heritage_country || "",
            openForNationalTeam: p.open_for_national_team !== false,
            status: (p.status as PlayerStatus) || "seeking_26_27",
            targetCountries: parsedTarget.length > 0 ? parsedTarget : ["SE", "FI", "NO"],
            occupationPreferences: parsedOcc.length > 0 ? parsedOcc : ["housing"],
            spokenLanguages: parsedLangs.length > 0 ? parsedLangs : ["sv", "en"],
            contractType: p.package_preference || "semi_pro",
            bio: p.bio || "",
            videoUrl: p.video_url || "",
            phone: p.phone || "",
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

  const handleQuickStatusChange = async (newStatus: PlayerStatus) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
    setSaveSuccess(false);

    if (profileId) {
      try {
        const { error } = await supabase
          .from("players")
          .update({ status: newStatus })
          .eq("id", profileId);

        if (!error) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (err) {
        console.error("Quick status update error:", err);
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

      const updatePayload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        birth_year: parseInt(formData.birthYear, 10) || 2000,
        nationality: formData.nationality.toUpperCase(),
        secondary_citizenship: formData.secondaryCitizenships,
        heritage_country: formData.heritageCountry.trim() || null,
        open_for_national_team: Boolean(formData.openForNationalTeam),
        current_club: clubFormatted,
        position: formData.position,
        stick_hand: formData.stickGrip,
        status: formData.status,
        package_preference: formData.contractType,
        target_countries: formData.targetCountries,
        occupation_preference: formData.occupationPreferences,
        spoken_languages: formData.spokenLanguages,
        key_attributes: formData.keyAttributes,
        bio: formData.bio.trim() || null,
        video_url: formData.videoUrl.trim() || null,
        phone: formData.phone.trim() || null,
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

  if (noProfileFound) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-10 max-w-lg w-full text-center shadow-xs">
            <div className="text-3xl mb-3">👤</div>
            <h1 className="text-xl font-bold text-zinc-950 mb-2">
              {lang === "sv" ? "Ingen spelarprofil hittades" : "No Player Profile Found"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed">
              {lang === "sv"
                ? `Du är inloggad som ${userEmail}, men det finns ingen registrerad spelarprofil med denna e-postadress ännu.`
                : `You are logged in as ${userEmail}, but no player profile exists with this email yet.`}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/join"
                className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                + {lang === "sv" ? "Skapa din spelarprofil nu" : "Create Your Player Profile"}
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg border border-zinc-200 transition-colors"
              >
                {lang === "sv" ? "Logga ut" : "Log out"}
              </button>
            </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Inloggad som {userEmail}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                {formData.firstName} {formData.lastName}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {lang === "sv"
                  ? "Hantera din synlighet på transfermarknaden och uppdatera dina profiluppgifter."
                  : "Manage your visibility on the transfer market and keep your scouting profile up to date."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {profileId && (
                <Link
                  href={`/players/${profileId}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold border border-zinc-200 transition-colors"
                >
                  👁️ {lang === "sv" ? "Visa offentlig profil" : "View Public Profile"} ↗
                </Link>
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
                className="font-bold text-rose-900 hover:underline"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. QUICK TRANSFER STATUS TOGGLE */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs mb-8">
            <div className="pb-3 border-b border-zinc-100 mb-4">
              <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <span>🔄</span>
                <span>{lang === "sv" ? "Transferstatus & Tillgänglighet" : "Transfer Status & Availability"}</span>
              </h2>
              <p className="text-xs text-zinc-500">
                {lang === "sv"
                  ? "Välj din nuvarande status för att styra hur klubbar och tränare ser dig på marknaden."
                  : "Control how clubs and scouts discover your profile in search results."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleQuickStatusChange("seeking_26_27")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.status === "seeking_26_27"
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium"
                }`}
              >
                <span className="text-lg">🟢</span>
                <div>
                  <div className="font-bold text-zinc-900">{t.statuses.seeking_26_27}</div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {lang === "sv" ? "Aktivt sökande efter nytt klubbavtal inför säsongen 26/27." : "Actively looking for a new club contract."}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickStatusChange("available_free_agent")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.status === "available_free_agent"
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium"
                }`}
              >
                <span className="text-lg">⚡</span>
                <div>
                  <div className="font-bold text-zinc-900">{t.statuses.available_free_agent}</div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {lang === "sv" ? "Kontraktslös och redo för direkt övergång eller provspel." : "Free agent ready for immediate signing."}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickStatusChange("open_for_trials")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.status === "open_for_trials"
                    ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium"
                }`}
              >
                <span className="text-lg">🟡</span>
                <div>
                  <div className="font-bold text-zinc-900">{t.statuses.open_for_trials}</div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {lang === "sv" ? "Öppen för träningsmatcher, tryout och provträningar." : "Open for trials and tryout invitations."}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickStatusChange("contracted_transferable")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.status === "contracted_transferable"
                    ? "bg-zinc-200 border-zinc-500 ring-2 ring-zinc-500/20 text-zinc-950 font-bold"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium"
                }`}
              >
                <span className="text-lg">⚪</span>
                <div>
                  <div className="font-bold text-zinc-900">{t.statuses.contracted_transferable}</div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {lang === "sv" ? "Under kontrakt / Dold för aktiv scouting." : "Currently under contract / Inactive."}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. FULL EDIT FORM */}
          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* Athletic & Personal Details */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <h2 className="text-base font-bold text-zinc-950">
                  {lang === "sv" ? "Spelarprofil & Klubbdetaljer" : "Player & Club Details"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv" ? "Uppdatera dina grundläggande spelaruppgifter." : "Update your basic athletic information."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                    onChange={(code) => {
                      const available = getLeaguesForCountry(code);
                      const newLeague = available[0]?.id || "other_national_league";
                      setFormData({
                        ...formData,
                        nationality: code,
                        league: newLeague,
                        customLeague: "",
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nuvarande klubb *</label>
                  <input
                    type="text"
                    required
                    value={formData.currentClub}
                    onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <LeagueSelect
                    countryCode={formData.nationality}
                    value={formData.league}
                    onChange={(l) => setFormData({ ...formData, league: l })}
                    customLeagueName={formData.customLeague}
                    onCustomLeagueNameChange={(c) => setFormData({ ...formData, customLeague: c })}
                    label={lang === "sv" ? "Nuvarande serie / Liganivå" : "Current League / Division"}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="goalkeeper">{t.positions.goalkeeper}</option>
                    <option value="defender">{t.positions.defender}</option>
                    <option value="halv">{t.positions.halv}</option>
                    <option value="midfielder">{t.positions.midfielder}</option>
                    <option value="forward">{t.positions.forward}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Klubbfattning *</label>
                  <select
                    value={formData.stickGrip}
                    onChange={(e) => setFormData({ ...formData, stickGrip: e.target.value as PlayerGrip })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="left">{t.grips.left}</option>
                    <option value="right">{t.grips.right}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Key Attributes on Ice (Max 4) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <KeyAttributesPicker
                selectedAttributes={formData.keyAttributes}
                onChange={(attrs) => setFormData({ ...formData, keyAttributes: attrs })}
                maxAttributes={4}
              />
            </div>

            {/* Video Highlights & Tape */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <span>🎥</span>
                  <span>{lang === "sv" ? "Videolänk & Spelsekvenser" : "Video Highlights & Clips"}</span>
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv"
                    ? "Klistra in en länk till YouTube, Vimeo eller Google Drive med matchklipp eller skills."
                    : "Add a YouTube, Vimeo, or Drive link to game clips or skills tape."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {lang === "sv" ? "Videolänk (URL)" : "Video URL"}
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* Geographic Mobility & Target Countries */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <h2 className="text-base font-bold text-zinc-950">
                  {lang === "sv" ? "Önskade destinationsländer" : "Target Destination Countries"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv" ? "Var är du öppen för att spela nästa säsong?" : "Where are you open to playing next season?"}
                </p>
              </div>

              <TargetCountriesPicker
                selectedCodes={formData.targetCountries}
                onChange={(countries) => setFormData({ ...formData, targetCountries: countries })}
              />
            </div>

            {/* National Team Hub & International Eligibility */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span>🌍</span>
                  <span>National Team Hub</span>
                </div>
                <h2 className="text-base font-bold text-zinc-950">
                  {lang === "sv" ? "Landslag & Internationell behörighet" : "National Team & International Eligibility"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv"
                    ? "Gör det möjligt för förbundskaptener i FIB:s medlemsländer att scouta dig för landslagsspel."
                    : "Make your profile discoverable to national team coaches and federations worldwide."}
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.openForNationalTeam}
                    onChange={(e) => setFormData({ ...formData, openForNationalTeam: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">
                      🏆 {lang === "sv" ? "Jag är öppen för att representera ett landslag internationellt" : "I am open to representing a national team internationally"}
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      {lang === "sv"
                        ? "Visar din profil för förbundskaptener under filtrering för VM & landslag."
                        : "Includes your profile when national team coaches filter prospects for international competition."}
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Övriga medborgarskap / Dubbla pass" : "Secondary Citizenships / Passports"}
                    </label>
                    <TargetCountriesPicker
                      selectedCodes={formData.secondaryCitizenships}
                      onChange={(codes) => setFormData({ ...formData, secondaryCitizenships: codes })}
                      label={lang === "sv" ? "Välj länder där du har pass" : "Select countries where you hold a passport"}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Landslagsanknytning / Rötter (Heritage)" : "Heritage / Family Ancestry"}
                    </label>
                    <input
                      type="text"
                      value={formData.heritageCountry}
                      onChange={(e) => setFormData({ ...formData, heritageCountry: e.target.value })}
                      placeholder={
                        lang === "sv"
                          ? "t.ex. Morförälder från Nederländerna / Rötter i Tyskland / USA..."
                          : "e.g. Grandparent from Netherlands, German roots, US ancestry..."
                      }
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {lang === "sv"
                        ? "Många landslag i VM B-gruppen söker spelare med familjeband."
                        : "Many FIB federations scout players with family roots."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Civil Profile & Setup */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <h2 className="text-base font-bold text-zinc-950">
                  {lang === "sv" ? "Civil profil & Önskat upplägg" : "Civil Profile & Dual-Career Preferences"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv"
                    ? "Specificera vad du önskar kombinera ditt bandyspelande med."
                    : "Select what you wish to combine your bandy career with."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.occupationPreferences.includes("studies")}
                    onChange={() => handleToggleOccupation("studies")}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                  />
                  <span className="font-medium text-zinc-800">{t.occupationPreferences.studies}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.occupationPreferences.includes("fulltime_job")}
                    onChange={() => handleToggleOccupation("fulltime_job")}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                  />
                  <span className="font-medium text-zinc-800">{t.occupationPreferences.fulltime_job}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.occupationPreferences.includes("parttime_job")}
                    onChange={() => handleToggleOccupation("parttime_job")}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                  />
                  <span className="font-medium text-zinc-800">{t.occupationPreferences.parttime_job}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.occupationPreferences.includes("housing")}
                    onChange={() => handleToggleOccupation("housing")}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                  />
                  <span className="font-medium text-zinc-800">{t.occupationPreferences.housing}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.occupationPreferences.includes("sports_only")}
                    onChange={() => handleToggleOccupation("sports_only")}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                  />
                  <span className="font-medium text-zinc-800">{t.occupationPreferences.sports_only}</span>
                </label>
              </div>
            </div>

            {/* Spoken Languages */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <h2 className="text-base font-bold text-zinc-950">
                  {lang === "sv" ? "Talade språk" : "Spoken Languages"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv" ? "Vilka språk talar du obehindrat?" : "What languages do you speak comfortably?"}
                </p>
              </div>

              <SpokenLanguagesPicker
                selectedLanguages={formData.spokenLanguages}
                onChange={(languages) => setFormData({ ...formData, spokenLanguages: languages })}
              />
            </div>

            {/* Scouting Bio & Merits */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="pb-3 border-b border-zinc-100 mb-5">
                <h2 className="text-base font-bold text-zinc-950">
                  {lang === "sv" ? "Scoutingrapport, styrkor & meriter" : "Scouting Bio & Key Strengths"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {lang === "sv"
                    ? "Berätta kort om din spelstil, dina främsta styrkor på isen och dina meriter."
                    : "Describe your playing style, strengths, and background."}
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    {lang === "sv" ? "Beskrivning / Spelarbiografi" : "Player Bio"}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="e.g. Offensiv halv med god spelförståelse, bra skridskoåkning och stark i passningsspelet..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    {lang === "sv" ? "Telefonnummer (frivilligt)" : "Phone number (optional)"}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+46 70 123 45 67"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-between pt-4">
              {profileId && (
                <Link
                  href={`/players/${profileId}`}
                  target="_blank"
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 underline cursor-pointer"
                >
                  👁️ {lang === "sv" ? "Förhandsgranska profil" : "Preview Profile"}
                </Link>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSaving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {isSaving
                    ? lang === "sv"
                      ? "Sparar ändringar..."
                      : "Saving..."
                    : lang === "sv"
                    ? "Spara ändringar →"
                    : "Save Changes →"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
