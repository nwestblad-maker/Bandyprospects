import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            ← Tillbaka till start
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mt-4 tracking-tight">
            Integritetspolicy & Dataskydd (GDPR)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Senast uppdaterad: Augusti 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Ändamål och Personuppgiftsansvar</h2>
            <p>
              Bandy Prospects behandlar endast personuppgifter du själv registrerar i syfte att matcha spelare, klubbar och landslag. Uppgifterna används uteslutande för scouting och rekrytering inom bandysporten.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Skydd av kontaktuppgifter</h2>
            <p>
              Telefonnummer och e-postadresser är låsta bakom inloggning med Magic Link för att skydda mot spambottar och obehörig skrapning. Endast inloggade och verifierade föreningar och spelare kan komma åt direktkontakt.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Rätten till radering</h2>
            <p>
              Du kan när som helst ta bort din profil permanent via knappen &quot;Ta bort profil&quot; på din profilsida. Vid radering rensas samtliga sparade uppgifter omedelbart från databasen.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
