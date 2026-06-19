'use client';

import { motion } from 'framer-motion';
import { UserPlus, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

const activities = [
  { id: 1, type: 'ai', user: 'RecruitAI', action: 'Recommended 12 new candidates for Senior Frontend Engineer', time: '10 min ago', icon: Sparkles, color: 'text-purple-500 bg-purple-500/10' },
  { id: 2, type: 'user', user: 'Sarah Jenkins', action: 'Shortlisted John Doe for final interview round', time: '1 hour ago', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 3, type: 'user', user: 'Mike Ross', action: 'Added new candidate: Alex Smith', time: '3 hours ago', icon: UserPlus, color: 'text-blue-500 bg-blue-500/10' },
  { id: 4, type: 'system', user: 'Interview Bot', action: 'Completed technical screening with Emily Chen', time: '5 hours ago', icon: MessageSquare, color: 'text-amber-500 bg-amber-500/10' },
];

export function ActivityTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="glass-panel p-6"
    >
      <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
        {activities.map((activity, index) => (
          <motion.div 
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="relative pl-6"
          >
            <div className={`absolute -left-[18px] p-2 rounded-full border-[3px] border-white dark:border-[#13121a] ${activity.color}`}>
              <activity.icon className="w-3 h-3" />
            </div>
            <div>
              <p className="text-sm">
                <span className="font-semibold">{activity.user}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400">{activity.action}</span>
              </p>
              <span className="text-xs text-slate-400 mt-1 block">{activity.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
