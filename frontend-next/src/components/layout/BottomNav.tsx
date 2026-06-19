'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Sparkles, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'AI', href: '/copilot', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0b0a0f]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-full scale-75"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon 
                className={clsx(
                  'w-6 h-6 z-10 transition-colors',
                  isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                )} 
              />
              <span className={clsx(
                "text-[10px] mt-1 z-10 font-medium transition-colors",
                isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
