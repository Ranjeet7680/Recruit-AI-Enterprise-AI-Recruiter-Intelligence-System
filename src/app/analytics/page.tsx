export default function AnalyticsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">📊</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
      <p className="text-slate-500 text-center max-w-md">Detailed reporting and metrics on your hiring pipeline, candidate demographics, and AI efficiency will appear here.</p>
      
      <div className="mt-8 px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium animate-pulse text-slate-500">
        Coming Soon
      </div>
    </div>
  );
}
