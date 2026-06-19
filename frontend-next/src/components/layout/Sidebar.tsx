'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Sparkles, BarChart3, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'AI Copilot', href: '/copilot', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0b0a0f]/80 backdrop-blur-xl z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          TalentMind
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                isActive 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110', isActive && 'text-primary')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
              <span className="font-bold text-sm">RJ</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Ranjeet</p>
            <p className="text-xs text-slate-500 truncate">Lead Recruiter</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
