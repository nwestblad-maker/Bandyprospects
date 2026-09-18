"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { TargetCountriesPicker } from "@/components/TargetCountriesPicker";
import { AvatarUpload } from "@/components/AvatarUpload";
import { DeleteProfileButton } from "@/components/DeleteProfileButton";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { ContactPrivacySettings } from "@/components/ContactPrivacySettings";
import { BandyTraitsPicker } from "@/components/BandyTraitsPicker";
import { CareerHistoryEditor } from "@/components/CareerHistoryEditor";
import { supabase } from "@/lib/supabaseClient";
import { CareerSeason, OccupationPreference, PlayerGrip, PositionCategory } from "@/types";
import { parseCareerHistory } from "@/lib/dataMappers";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeagueDisplayName } from "@/lib/leagues";

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

export default function MyProfilePage() {
  const router = useRouter();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [noProfileFound, setNoProfileFound] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Section A: Core details
    firstName: "",
    lastName: "",
    birthYear: "2002",
    nationality: "SE",
    photoUrl: "",
    youthClub: "",
    academyType: "none" as "NIU" | "international" | "local" | "none",
    heightCm: "",
    weightKg: "",
    stickGrip: "left" as PlayerGrip,
    currentClub: "",
    league: "se_elitserien_herr",
    customLeague: "",

    // Section B: Position & Strengths
    position: "halv" as PositionCategory,
    secondaryPosition: "" as string,
    playerTraits: ["Corner Specialist", "Vision & Game IQ"] as string[],

    // Section C: Contract & Mobility
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

    // Section D: Career History
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
              parsedOcc = ["housing", "studies"];
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
              parsedLangs = ["sv", "en"];
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
              parsedTraits = ["Corner Specialist", "Vision & Game IQ"];
            }
          }

          let parsedCitizenships: string[] = [];
          const rawCitizenships = p.secondary_citizenship || p.secondary_citizenships;
          if (Array.isArray(rawCitizenships)) {
            parsedCitizenships = rawCitizenships;
          } else if (typeof rawCitizenships === "string") {
            try {
              const res = JSON.parse(rawCitizenships);
              if (Array.isArray(res)) parsedCitizenships = res;
              else parsedCitizenships = rawCitizenships.split(",").map((s) => s.trim());
            } catch {
              parsedCitizenships = [];
            }
          }

          const parsedCareer = parseCareerHistory(p.career_history);

          let cStatus: "free_agent" | "expiring_26_27" | "under_contract_loan" = "free_agent";
          if (p.contract_status === "expiring_26_27") cStatus = "expiring_26_27";
          else if (p.contract_status === "under_contract_loan") cStatus = "under_contract_loan";
          else if (p.status === "seeking_26_27") cStatus = "expiring_26_27";

          let acad: "NIU" | "international" | "local" | "none" = "none";
          if (p.academy_type === "NIU") acad = "NIU";
          else if (p.academy_type === "international") acad = "international";
          else if (p.academy_type === "local") acad = "local";

          setFormData({
            firstName: p.first_name || "",
            lastName: p.last_name || "",
            birthYear: String(p.birth_year || 2002),
            nationality: p.nationality || "SE",
            photoUrl: p.photo_url || "",
            youthClub: p.youth_club || "",
            academyType: acad,
            heightCm: p.height ? String(p.height) : "",
            weightKg: p.weight ? String(p.weight) : "",
            stickGrip: (p.stick_hand as PlayerGrip) || "left",
            currentClub: p.current_club || "",
            league: "se_elitserien_herr",
            customLeague: "",
            position: (p.position as PositionCategory) || "halv",
            secondaryPosition: p.secondary_position || "",
            playerTraits: parsedTraits,
            contractStatus: cStatus,
            videoUrl: p.youtube_url || p.video_url || "",
            contractType: p.package_preference || "semi_pro",
            targetCountries: parsedTarget,
            occupationPreferences: parsedOcc,
            spokenLanguages: parsedLangs,
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
      setErrorMessage("No linked profile found to save to.");
      return;
    }

    try {
      setIsSaving(true);

      const resolvedLeague =
        formData.league === CUSTOM_OTHER_LEAGUE_VALUE
          ? formData.customLeague.trim()
          : getLeagueDisplayName(formData.league, "en");

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
        academy_type: formData.academyType !== "none" ? formData.academyType : null,
        academy_school: null,
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
        career_history: formData.careerHistory.length > 0 ? formData.careerHistory : null,
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center text-sm text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Loading your profile...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Signed in as {userEmail}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formData.firstName || "Player"} {formData.lastName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your player prospect card, physical attributes, and career history.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {profileId && (
                <>
                  <Link
                    href={`/players/${profileId}`}
                    target="_blank"
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  >
                    View Public Profile ↗
                  </Link>
                  <DeleteProfileButton recordId={profileId} table="players" redirectPath="/join" />
                </>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between animate-in fade-in duration-150">
              <span className="font-semibold">
                ✓ Changes saved! Your profile has been updated.
              </span>
              {profileId && (
                <Link
                  href={`/players/${profileId}`}
                  className="font-bold underline text-emerald-950 ml-2"
                >
                  View live profile →
                </Link>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-bold text-rose-900 hover:underline cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* QUICK CONTRACT STATUS TOGGLE */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>🔄</span>
                <span>Quick Availability Toggle</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Click to immediately update your transfer availability in club directory searches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "free_agent", title: "Free Agent / Seeking Club", desc: "Ready for immediate transfer discussions", icon: "🔓" },
                { id: "expiring_26_27", title: "Expiring Contract 2026/27", desc: "Under contract, exploring options", icon: "⏳" },
                { id: "under_contract_loan", title: "Under Contract (Seeking Loan)", desc: "Seeking loan or dual registration", icon: "🤝" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleQuickStatusChange(opt.id as any)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.contractStatus === opt.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm font-semibold"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <span>{opt.icon}</span>
                      <span>{opt.title}</span>
                    </span>
                    {formData.contractStatus === opt.id && <span className="text-xs">✓</span>}
                  </div>
                  <p className={`text-xs leading-relaxed ${formData.contractStatus === opt.id ? "text-slate-300" : "text-slate-500"}`}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN EDIT FORM */}
          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* SECTION A: CORE DETAILS & PHYSICAL METRICS */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                  <span className="font-bold mr-1.5">A</span>
                  <span>Basic Details & Background</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Personal Information, Youth Background & Physical Metrics</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Origin club, sports academy, physical metrics, and current club affiliation.
                </p>
              </div>

              {/* Avatar Upload */}
              <AvatarUpload
                currentUrl={formData.photoUrl}
                onUploadSuccess={(url) => setFormData({ ...formData, photoUrl: url })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Birth Year *</label>
                  <input
                    type="number"
                    required
                    min="1975"
                    max="2015"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <CountrySelect
                    label="Primary Nationality *"
                    required
                    value={formData.nationality}
                    onChange={(code) => setFormData({ ...formData, nationality: code })}
                  />
                </div>
              </div>

              {/* Origin / Youth Club & Sports Academy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Origin / Youth Club (where you started playing bandy)
                  </label>
                  <input
                    type="text"
                    value={formData.youthClub}
                    onChange={(e) => setFormData({ ...formData, youthClub: e.target.value })}
                    placeholder="e.g. Vetlanda BK, Brobergs IF, Edsbyns IF"
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Sports Academy / Bandy High School
                  </label>
                  <select
                    value={formData.academyType}
                    onChange={(e) => setFormData({ ...formData, academyType: e.target.value as "NIU" | "international" | "local" | "none" })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="NIU">NIU Bandy Academy (Sweden)</option>
                    <option value="international">Sports Academy (International)</option>
                    <option value="local">Sports Academy (Local / Other)</option>
                  </select>
                </div>
              </div>

              {/* Physics & Stick Grip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Height (cm)</label>
                  <input
                    type="number"
                    min="140"
                    max="220"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    placeholder="185"
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Weight (kg)</label>
                  <input
                    type="number"
                    min="40"
                    max="140"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="82"
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Stick Grip *</label>
                  <select
                    value={formData.stickGrip}
                    onChange={(e) => setFormData({ ...formData, stickGrip: e.target.value as PlayerGrip })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="left">Left (L)</option>
                    <option value="right">Right (R)</option>
                  </select>
                </div>
              </div>

              {/* Current Club */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Current Club *</label>
                <input
                  type="text"
                  required
                  value={formData.currentClub}
                  onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                  placeholder="e.g. Sandvikens AIK, Villa Lidköping, Edsbyns IF"
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* SECTION B: POSITION & KEY ATTRIBUTES */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                  <span className="font-bold mr-1.5">B</span>
                  <span>Position & Core Traits</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">On-Ice Role & Key Strengths</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Primary position, secondary versatility, and your key player strengths.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Primary Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="halv">Halv</option>
                    <option value="midfielder">Midfielder</option>
                    <option value="defender">Defender</option>
                    <option value="forward">Forward</option>
                    <option value="goalkeeper">Goalkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Secondary Position (Optional)</label>
                  <select
                    value={formData.secondaryPosition}
                    onChange={(e) => setFormData({ ...formData, secondaryPosition: e.target.value })}
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="">None / Primary position only</option>
                    <option value="halv">Halv</option>
                    <option value="midfielder">Midfielder</option>
                    <option value="defender">Defender</option>
                    <option value="forward">Forward</option>
                    <option value="goalkeeper">Goalkeeper</option>
                  </select>
                </div>
              </div>

              {/* Spetsegenskaper */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Key Attributes (Select your core strengths) *
                </label>
                <BandyTraitsPicker
                  selectedTraits={formData.playerTraits}
                  onChange={(traits) => setFormData({ ...formData, playerTraits: traits })}
                  lang="en"
                />
              </div>
            </div>

            {/* SECTION C: CONTRACT & OFF-ICE PROFILE */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                  <span className="font-bold mr-1.5">C</span>
                  <span>Contract & Off-Ice Preferences</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Contract Status, Video & Off-Ice Preferences</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Define your contract availability, highlight video link, and dual-career preferences.
                </p>
              </div>

              {/* Video URL */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  ▶️ Video / Highlights (YouTube or Vimeo link)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>

              {/* Contract Type */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Desired Agreement Level:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "semi_pro", title: "Semi-Professional", desc: "Player compensation + work/studies" },
                    { id: "full_time", title: "Full-time Pro", desc: "Full-time contract & elite focus" },
                    { id: "amateur", title: "Amateur / Development", desc: "Housing support & job matching" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, contractType: opt.id })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.contractType === opt.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm font-semibold"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{opt.title}</span>
                        {formData.contractType === opt.id && <span className="text-xs">✓</span>}
                      </div>
                      <p className={`text-xs leading-relaxed ${formData.contractType === opt.id ? "text-slate-300" : "text-slate-500"}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Occupation Preferences */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  Off-Ice Preferences (Combine bandy with):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "studies", icon: "🎓", label: "University / Academic Studies" },
                    { id: "fulltime_job", icon: "💼", label: "Civilian Full-Time Employment" },
                    { id: "parttime_job", icon: "🕒", label: "Flexible Part-Time Work" },
                    { id: "housing", icon: "🏠", label: "Apartment / Housing Assistance" },
                    { id: "sports_only", icon: "🏒", label: "Sports Only / Pro Contract" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      onClick={() => handleToggleOccupation(item.id as OccupationPreference)}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                        formData.occupationPreferences.includes(item.id as OccupationPreference)
                          ? "bg-slate-50 border-slate-900 text-slate-950 font-semibold"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.occupationPreferences.includes(item.id as OccupationPreference)}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-slate-900"
                      />
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Countries */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Open to clubs in the following countries:
                </label>
                <TargetCountriesPicker
                  selectedCodes={formData.targetCountries}
                  onChange={(codes) => setFormData({ ...formData, targetCountries: codes })}
                />
              </div>

              {/* Spoken Languages */}
              <div className="pt-3 border-t border-slate-100">
                <SpokenLanguagesPicker
                  selectedLanguages={formData.spokenLanguages}
                  onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                  label="Spoken Languages"
                  subtitle="Languages you speak comfortably for scout and club discussions."
                />
              </div>

              {/* Bio */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  Player Presentation & Ambitions
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your playing style, career ambitions, and what you are looking for in a new club..."
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>

              {/* Contact Information & Privacy */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+46 70 123 45 67"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
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

            {/* SECTION D: CAREER HISTORY & PREVIOUS CLUBS */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                  <span className="font-bold mr-1.5">D</span>
                  <span>Career History & Previous Clubs</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Career History</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Add previous seasons, clubs, leagues, and roles you have represented.
                </p>
              </div>

              <CareerHistoryEditor
                careerHistory={formData.careerHistory}
                onChange={(history) => setFormData({ ...formData, careerHistory: history })}
                lang="en"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <span>Save Profile Changes</span>
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
