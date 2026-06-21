import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FloatingMetrics } from "@/components/layout/FloatingMetrics";
import { FloatingCopilot } from "@/components/layout/FloatingCopilot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TalentMind AI | Enterprise Recruiting Intelligence",
  description: "AI-powered enterprise recruiting intelligence platform — screen, rank, and interview candidates with precision.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: "#070610",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TalentMind AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full min-h-dvh bg-[#070610] text-slate-100 overflow-x-hidden">
        {/* Ambient background glow */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 60%)",
          }}
        />

        <FloatingMetrics />
        <Sidebar />

        {/* Main — offset by sidebar on md+, padded bottom for BottomNav on mobile */}
        <main
          className="relative z-10 md:ml-64 pb-[72px] md:pb-0 min-h-screen min-h-dvh overflow-x-hidden"
          style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
        >
          <div className="md:pb-0" style={{ paddingBottom: 0 }}>
            {children}
          </div>
        </main>

        <BottomNav />
        <FloatingCopilot />
      </body>
    </html>
  );
}
