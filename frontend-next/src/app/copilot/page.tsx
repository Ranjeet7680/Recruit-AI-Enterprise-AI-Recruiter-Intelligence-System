'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, FileText, CheckSquare, Search, BookOpen } from 'lucide-react';

const options = [
  { id: 1, title: 'Resume Analyzer', icon: FileText, color: 'text-blue-500' },
  { id: 2, title: 'Candidate Ranking', icon: Search, color: 'text-purple-500' },
  { id: 3, title: 'Interview Generator', icon: CheckSquare, color: 'text-emerald-500' },
  { id: 4, title: 'JD Optimizer', icon: BookOpen, color: 'text-amber-500' },
];

export default function CopilotPage() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am your TalentMind AI Copilot. How can I help you streamline your hiring process today?' }
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setQuery('');
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I am analyzing your request. Here are some insights based on my initial scan of the candidate pipeline. John Doe seems to be the highest match at 92%.' 
      }]);
    }, 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/25">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Copilot</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ask me anything about your candidates or hiring process.</p>
        </div>
      </div>

      <div className="flex-1 glass-card p-4 md:p-6 mb-6 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-4">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                <span className="text-sm font-medium mr-2">Thinking</span>
                <motion.div className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
            {options.map((opt) => (
              <button key={opt.id} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors group">
                <opt.icon className={`w-6 h-6 mb-2 ${opt.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-semibold text-center">{opt.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI to analyze resumes, schedule interviews, etc..."
          className="w-full glass-card py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-white placeholder:text-slate-400"
        />
        <button 
          onClick={handleSend}
          className="absolute right-2 top-2 bottom-2 w-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
