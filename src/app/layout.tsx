import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import { ShortlistProvider } from "@/context/ShortlistContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bandyprospects | The Global Marketplace & Database for Bandy",
  description:
    "Connect bandy players and clubs worldwide. Discover transfer postings, contract opportunities, verified player profiles, and tryouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-zinc-50">
        <LanguageProvider>
          <ShortlistProvider>{children}</ShortlistProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
