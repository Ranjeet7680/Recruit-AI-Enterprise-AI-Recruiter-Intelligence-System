import { CandidateCard } from '@/components/candidates/CandidateCard';

const mockCandidates = [
  { id: 1, name: 'John Doe', role: 'Senior Frontend Engineer', matchScore: 92, skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'] },
  { id: 2, name: 'Emily Chen', role: 'Full Stack Developer', matchScore: 88, skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'] },
  { id: 3, name: 'Michael Smith', role: 'UI/UX Designer', matchScore: 95, skills: ['Figma', 'Framer', 'CSS', 'User Testing'] },
  { id: 4, name: 'Sarah Jenkins', role: 'Backend Engineer', matchScore: 84, skills: ['Python', 'FastAPI', 'Docker', 'Redis'] },
  { id: 5, name: 'David Kim', role: 'DevOps Engineer', matchScore: 91, skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS'] },
  { id: 6, name: 'Lisa Wang', role: 'Data Scientist', matchScore: 89, skills: ['Python', 'TensorFlow', 'SQL', 'Pandas'] },
];

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function CandidatesPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Candidates</h1>
          <p className="text-slate-500 dark:text-slate-400">Review your top AI-matched candidates.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search candidates..." 
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13121a] focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button className="px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            Filter
          </button>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {mockCandidates.map((candidate) => (
          <motion.div key={candidate.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <CandidateCard {...candidate} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
