'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { FloatingMetrics } from '@/components/layout/FloatingMetrics';
import { FloatingCopilot } from '@/components/layout/FloatingCopilot';
import { SoundToggle } from '@/components/layout/SoundToggle';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[#fcf8ff] text-[#1b1b24] overflow-x-hidden">
        <main className="w-full min-h-screen">
          {children}
        </main>
        <SoundToggle />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070610] text-slate-100 overflow-x-hidden">
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
        className="relative z-10 md:ml-64 min-h-screen min-h-dvh overflow-x-hidden"
        style={{ paddingBottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))" }}
      >
        <div className="md:pb-0" style={{ paddingBottom: 0 }}>
          {children}
        </div>
      </main>

      <BottomNav />
      <FloatingCopilot />
      <SoundToggle />
    </div>
  );
}
