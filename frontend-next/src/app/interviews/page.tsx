'use client';

import { motion } from 'framer-motion';
import { Video, Mic, BarChart2, StopCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function InterviewsPage() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] md:h-screen p-4 md:p-6 gap-6 max-w-7xl mx-auto">
      
      {/* Video Panel & Transcript */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Live Interview</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Technical Screening • John Doe</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors">
              <StopCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video Mockup */}
        <div className="relative aspect-video glass-panel overflow-hidden bg-slate-900 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          <UserVideo placeholder="JD" name="John Doe (Candidate)" />
          
          <div className="absolute bottom-4 right-4 w-32 aspect-video bg-slate-800 rounded-lg overflow-hidden border-2 border-white/20 z-20 shadow-2xl">
            <UserVideo placeholder="RJ" name="You" small />
          </div>
        </div>

        {/* Live Transcript */}
        <div className="flex-1 glass-card p-6 flex flex-col min-h-[250px]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Live Transcript
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-2">
            <TranscriptRow speaker="You" text="Can you walk me through a challenging problem you solved recently?" />
            <TranscriptRow speaker="John" text="Sure. At my last company, we faced a severe bottleneck with our database queries during peak traffic. I led the migration to a distributed caching layer using Redis, which reduced latency by 60%." />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} className="text-slate-400 text-sm italic">
              John is speaking...
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Intelligence Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {/* Speaking Time Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-500" />
            Speaking Time
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>You</span>
                <span>28%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '28%' }} 
                  transition={{ duration: 1 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>John Doe</span>
                <span>72%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '72%' }} 
                  transition={{ duration: 1 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Sentiment & Feedback */}
        <div className="flex-1 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-emerald-500 text-sm">Strong Technical Communication</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Candidate explained the Redis architecture clearly using STAR methodology.</p>
            </div>
            
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-amber-500 text-sm">Suggested Question</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">"How did you handle cache invalidation in that Redis setup?"</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function UserVideo({ placeholder, name, small = false }: { placeholder: string; name: string; small?: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className={`${small ? 'w-10 h-10 text-sm' : 'w-24 h-24 text-2xl'} rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 shadow-inner`}>
        {placeholder}
      </div>
      <div className="absolute bottom-2 left-3 z-20">
        <span className={`bg-black/60 text-white backdrop-blur-md px-2 py-1 rounded text-xs font-medium`}>{name}</span>
      </div>
    </div>
  );
}

function TranscriptRow({ speaker, text }: { speaker: string; text: string }) {
  const isYou = speaker === 'You';
  return (
    <div className="mb-3">
      <span className={`text-xs font-bold uppercase tracking-wider ${isYou ? 'text-blue-500' : 'text-emerald-500'}`}>
        {speaker}
      </span>
      <p className="text-sm mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}
