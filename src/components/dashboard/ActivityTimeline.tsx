'use client';

import { motion } from 'framer-motion';
import { UserPlus, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'ai',
    user: 'RecruitAI',
    action: 'Recommended 12 new candidates for Senior Frontend Engineer',
    time: '10 min ago',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.25)',
    isLatest: true,
  },
  {
    id: 2,
    type: 'user',
    user: 'Sarah Jenkins',
    action: 'Shortlisted John Doe for final interview round',
    time: '1 hour ago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.25)',
    isLatest: false,
  },
  {
    id: 3,
    type: 'user',
    user: 'Mike Ross',
    action: 'Added new candidate: Alex Smith',
    time: '3 hours ago',
    icon: UserPlus,
    color: 'text-blue-400',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.25)',
    isLatest: false,
  },
  {
    id: 4,
    type: 'system',
    user: 'Interview Bot',
    action: 'Completed technical screening with Emily Chen',
    time: '5 hours ago',
    icon: MessageSquare,
    color: 'text-amber-400',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.25)',
    isLatest: false,
  },
];

export function ActivityTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-4 md:p-6 h-full"
      style={{
        background: 'rgba(12,10,28,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base md:text-lg font-bold text-white">Recent Activity</h3>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live" />
          Live
        </span>
      </div>

      <div className="relative space-y-1">
        {/* Timeline line */}
        <div
          className="absolute left-[18px] top-5 bottom-5 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.3), transparent)' }}
        />

        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex gap-3 pl-1 py-2 rounded-xl hover:bg-white/3 transition-colors"
          >
            {/* Icon dot */}
            <div className="flex-shrink-0 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${activity.color}`}
                style={{ background: activity.bg, border: `1px solid ${activity.border}` }}
              >
                <activity.icon className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-xs md:text-sm leading-snug">
                <span className="font-semibold text-white">{activity.user}</span>
                {' '}
                <span className="text-slate-400">{activity.action}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-600">{activity.time}</span>
                {activity.isLatest && (
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    New
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
