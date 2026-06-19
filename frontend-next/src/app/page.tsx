import { KPICards } from '@/components/dashboard/KPICards';
import { Charts } from '@/components/dashboard/Charts';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';

export default function Dashboard() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Ranjeet 👋</h1>
        <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your hiring pipeline today.</p>
      </div>
      
      <KPICards />
      <Charts />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6">AI Recommendations</h3>
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <p>Your AI assistant is analyzing new resumes...</p>
          </div>
        </div>
        <div className="lg:col-span-1">
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}
