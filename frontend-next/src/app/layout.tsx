import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FloatingMetrics } from "@/components/layout/FloatingMetrics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TalentMind AI | Hackathon Edition",
  description: "Enterprise Recruiting Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0b0a0f]">
        <FloatingMetrics />
        <Sidebar />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0 overflow-x-hidden relative">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
