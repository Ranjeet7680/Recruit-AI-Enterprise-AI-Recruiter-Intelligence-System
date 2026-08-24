import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TalentMind AI | Enterprise Recruiting Intelligence",
  description: "AI-powered enterprise recruiting intelligence platform — screen, rank, and interview candidates with precision.",
  appleWebApp: {
    title: "TalentMind AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%236366f1'/><stop offset='100%25' stop-color='%238b5cf6'/></linearGradient></defs><circle cx='50' cy='50' r='16' fill='url(%23grad)'/><circle cx='25' cy='30' r='8' fill='url(%23grad)' opacity='0.8'/><circle cx='75' cy='30' r='8' fill='url(%23grad)' opacity='0.8'/><circle cx='25' cy='70' r='8' fill='url(%23grad)' opacity='0.8'/><circle cx='75' cy='70' r='8' fill='url(%23grad)' opacity='0.8'/><line x1='50' y1='50' x2='25' y2='30' stroke='%236366f1' stroke-width='4' opacity='0.6'/><line x1='50' y1='50' x2='75' y2='30' stroke='%236366f1' stroke-width='4' opacity='0.6'/><line x1='50' y1='50' x2='25' y2='70' stroke='%236366f1' stroke-width='4' opacity='0.6'/><line x1='50' y1='50' x2='75' y2='70' stroke='%236366f1' stroke-width='4' opacity='0.6'/></svg>" />
      </head>
      <body className="min-h-full min-h-dvh antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
