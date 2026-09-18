import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5">
            ← Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-4 tracking-tight">
            Privacy Policy & GDPR Data Protection
          </h1>
          <p className="text-sm text-slate-500 mt-1">Last updated: August 2026</p>
        </div>

        <div className="space-y-6 text-base text-slate-600 leading-relaxed">
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Purpose and Data Controller</h2>
            <p>
              Bandy Prospects processes only the personal data you provide for the purpose of connecting players, clubs, and national team federations. Information is used solely for legitimate bandy scouting and recruitment purposes.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Contact Information Protection</h2>
            <p>
              Direct contact details (email and phone number) are gated behind authenticated accounts to prevent spam bots and scraping. Only logged-in and verified clubs, scouts, and players can view contact details or send direct inquiries.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Right to Erasure & Data Portability</h2>
            <p>
              You maintain complete ownership of your data. You can edit your privacy settings or permanently delete your profile at any time through the &quot;Delete Profile&quot; action in your dashboard. Upon deletion, all associated personal records are immediately and permanently removed from our active database.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
