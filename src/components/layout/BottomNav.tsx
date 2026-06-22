'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Sparkles, Video, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { playClick } from '@/lib/sounds';

const navItems = [
  { name: 'Overview',   href: '/overview',   icon: Layers },
  { name: 'Home',       href: '/',           icon: Home },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Interview',  href: '/interviews', icon: Video, live: true },
  { name: 'AI',         href: '/copilot',    icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(7,6,18,0.92)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <nav className="flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={playClick}
              className="relative flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 no-select"
            >
              <motion.div
                whileTap={{ scale: 0.82 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex flex-col items-center gap-0.5"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute -inset-x-2 top-0 bottom-1 rounded-xl"
                    style={{ background: 'rgba(99,102,241,0.12)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10">
                  <motion.div
                    animate={isActive ? { y: -1 } : { y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <item.icon
                      className={clsx(
                        'w-5 h-5 transition-colors duration-200',
                        isActive ? 'text-indigo-400' : 'text-slate-500'
                      )}
                    />
                  </motion.div>

                  {/* Live badge for Interview */}
                  {item.live && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-red-500 animate-live border border-[#070612]" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={clsx(
                    'text-[9px] font-semibold tracking-wide transition-colors duration-200 relative z-10',
                    isActive ? 'text-indigo-400' : 'text-slate-500'
                  )}
                >
                  {item.name}
                </span>

                {/* Active dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-dot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-indigo-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
