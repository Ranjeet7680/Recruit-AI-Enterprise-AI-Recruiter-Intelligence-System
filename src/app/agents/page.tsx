'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Cpu, Play, CheckCircle2,
  Mail, FileText, Send, Copy, Check, RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { playClick, playSubmit, playSuccess } from '@/lib/sounds';

interface AgentStep {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: 'idle' | 'running' | 'completed';
  summary: string;
  durationMs: number;
}

interface Question {
  category: string;
  question: string;
  target_competency: string;
  expected_answer_points: string[];
  difficulty: string;
}

interface EmailDraft {
  subject: string;
  recipient_email: string;
  recipient_name: string;
  body: string;
  email_type: string;
  approved: boolean;
}

const INITIAL_STEPS: AgentStep[] = [
  {
    id: 'job_agent',
    name: 'Job Description Agent',
    role: 'Taxonomy & Competency Extraction',
    icon: '📋',
    status: 'idle',
    summary: 'Extracts mandatory vs optional skills, experience bounds, and domain requirements.',
    durationMs: 42
  },
  {
    id: 'resume_agent',
    name: 'Resume Screening Agent',
    role: 'Verification & PII Sanitization',
    icon: '📄',
    status: 'idle',
    summary: 'Sanitizes demographic PII, validates career timelines, and normalizes candidate profiles.',
    durationMs: 85
  },
  {
    id: 'matching_agent',
    name: 'Candidate Matching Agent',
    role: 'Deterministic 6-Factor Ranking',
    icon: '🎯',
    status: 'idle',
    summary: 'Calculates mathematically grounded fit scores (35% Semantic, 25% Skills, 15% Experience).',
    durationMs: 64
  },
  {
    id: 'interview_agent',
    name: 'Interview Agent',
    role: 'Tailored Question & Rubric Generator',
    icon: '🎙️',
    status: 'idle',
    summary: 'Generates candidate-specific technical and behavioral questions based on skill gaps.',
    durationMs: 112
  },
  {
    id: 'communication_agent',
    name: 'Communication Agent',
    role: 'Outreach & Invite Composer',
    icon: '✉️',
    status: 'idle',
    summary: 'Drafts personalized interview invitations and status updates with Human-in-the-Loop gating.',
    durationMs: 78
  },
  {
    id: 'analytics_agent',
    name: 'HR Analytics Agent',
    role: 'Pipeline Telemetry & Bottlenecks',
    icon: '📊',
    status: 'idle',
    summary: 'Analyzes funnel drop-off, time-to-hire projections, and diversity compliance ratios.',
    durationMs: 36
  }
];

const SAMPLE_QUESTIONS: Question[] = [
  {
    category: 'Deep Learning & Model Scaling',
    question: 'How have you optimized PyTorch model inference latency when deploying behind high-throughput microservices?',
    target_competency: 'Model Optimization & TensorRT',
    expected_answer_points: ['ONNX Runtime or TensorRT quantization', 'Dynamic batching strategies', 'GPU memory pooling'],
    difficulty: 'Advanced'
  },
  {
    category: 'Retrieval Architecture (RAG)',
    question: 'Explain your approach to vector index scaling and handling cosine distance recalculations across millions of embeddings in FAISS/Pinecone.',
    target_competency: 'Dense Vector Search & HNSW Indexing',
    expected_answer_points: ['IVFFlat vs HNSW trade-offs', 'Hierarchical clustering', 'Hybrid keyword + vector fusion'],
    difficulty: 'Advanced'
  },
  {
    category: 'System Design & High Availability',
    question: 'Given a peak load of 10,000 concurrent candidate ranking queries, how would you architect our FastAPI backend and vector caches?',
    target_competency: 'Distributed Caching & Async Pipelines',
    expected_answer_points: ['Redis embedding caches', 'Kubernetes HPA autoscaling', 'Worker queues (Celery/RabbitMQ)'],
    difficulty: 'Medium'
  },
  {
    category: 'Ownership & Post-Mortem Discipline',
    question: 'Describe a critical production bug or model drift event you encountered. How did you diagnose, resolve, and prevent recurrence?',
    target_competency: 'Root Cause Analysis',
    expected_answer_points: ['Structured telemetry debugging', 'Canary validation', 'Automated regression safeguards'],
    difficulty: 'Medium'
  }
];

export default function HRAgentsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'questions' | 'communication' | 'analytics'>('pipeline');
  const [copied, setCopied] = useState(false);
  const [hitlApproved, setHitlApproved] = useState(false);

  const [emailDraft, setEmailDraft] = useState<EmailDraft>({
    subject: 'Invitation to Technical Interview — Senior AI Engineer at Nexora',
    recipient_email: 'candidate.001@anonymized.org',
    recipient_name: 'Candidate CAND_001',
    body: `Dear Candidate,

Thank you for your interest in joining Nexora as a Senior AI Engineer.

Our AI screening team was highly impressed by your expertise in PyTorch, FAISS, and RAG architectures (Match Rating: 94.5%). We would love to invite you to a 45-minute live technical interview with our engineering leadership.

During this session, we will discuss your system architecture experience and walk through our vector retrieval pipelines.

Please select a convenient time on our scheduling portal or reply directly with your availability over the next 3 days.

Looking forward to speaking with you!

Best regards,
Nexora Recruitment Intelligence Team`,
    email_type: 'interview_invite',
    approved: false
  });

  const runOrchestrator = async () => {
    playClick();
    setIsRunning(true);
    setHitlApproved(false);

    // Reset steps to idle
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      
      // Artificial smooth delay for visual fidelity
      await new Promise(r => setTimeout(r, 650));
      
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' } : s));
    }

    setIsRunning(false);
    playSuccess();
  };

  const handleApproveAction = () => {
    playSubmit();
    setHitlApproved(true);
    setEmailDraft(prev => ({ ...prev, approved: true }));
  };

  const handleCopyEmail = () => {
    playClick();
    navigator.clipboard.writeText(emailDraft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070512] text-slate-100 p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Multi-Agent Architecture</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            HR AI Agents Studio
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              6 Agents Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end recruitment orchestration with Human-in-the-Loop (HITL) approval governance.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={runOrchestrator}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25 hover:scale-[1.02]'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Orchestrating Agents...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Full HR Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Human-in-the-Loop (HITL) Gate Banner */}
      <div
        className="rounded-2xl p-5 border relative overflow-hidden"
        style={{
          background: hitlApproved
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,78,59,0.2))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.2))',
          borderColor: hitlApproved ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              hitlApproved
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}>
              {hitlApproved ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlertIcon />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {hitlApproved ? 'Human Authorization Confirmed' : 'Human-in-the-Loop Review Gate'}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  hitlApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {hitlApproved ? 'Approved & Ready' : 'Review Required'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {hitlApproved
                  ? 'Candidate communications and technical interview slots have been authorized by Lead Recruiter.'
                  : 'AI Agents have drafted candidate communications and question rubrics. Explicit recruiter approval is required before dispatch.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hitlApproved ? (
              <button
                onClick={handleApproveAction}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Authorize Dispatch</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dispatched</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => { playClick(); setActiveTab('pipeline'); }}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'pipeline'
              ? 'border-indigo-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Orchestrator Pipeline</span>
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('questions'); }}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'questions'
              ? 'border-indigo-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tailored Questions ({SAMPLE_QUESTIONS.length})</span>
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('communication'); }}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'communication'
              ? 'border-indigo-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Communication Center</span>
        </button>
      </div>

      {/* Tab 1: Orchestrator Pipeline View */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isStepRunning = step.status === 'running';

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 ${
                  isStepRunning
                    ? 'border-indigo-400/80 shadow-lg shadow-indigo-500/20 bg-indigo-950/40'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-[#0d0c1c]'
                    : 'border-white/5 bg-[#0b0918]'
                }`}
              >
                {/* Status Indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <h3 className="font-bold text-white text-sm">{step.name}</h3>
                      <p className="text-[11px] text-indigo-300/80 font-medium">{step.role}</p>
                    </div>
                  </div>
                  <div>
                    {isStepRunning ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30 animate-pulse">
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        Running
                      </span>
                    ) : isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Done ({step.durationMs}ms)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                        Standby
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">
                  {step.summary}
                </p>

                {/* Progress Footer */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Step {idx + 1} of 6</span>
                  <span className="font-mono text-slate-400">Agent {step.id}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Tailored Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Candidate-Tailored Question Rubrics
              <span className="text-xs text-slate-400 font-normal">(Generated by Interview Agent)</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Role: Senior AI Engineer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-5 bg-[#0d0c1e] border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                    {q.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    q.difficulty === 'Advanced'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">
                  &ldquo;{q.question}&rdquo;
                </h4>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <p className="text-[11px] font-semibold text-slate-400">
                    Target Evaluation Points:
                  </p>
                  <ul className="space-y-1">
                    {q.expected_answer_points.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Communication Center */}
      {activeTab === 'communication' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-6 bg-[#0d0c1e] border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white text-base">Candidate Email Draft</h3>
                  <p className="text-xs text-slate-400">Drafted by Communication Agent</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Body'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailDraft.subject}
                    onChange={e => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Message Body</label>
                  <textarea
                    rows={12}
                    value={emailDraft.body}
                    onChange={e => setEmailDraft({ ...emailDraft, body: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-5 bg-[#0d0c1e] border border-white/10 space-y-4">
              <h3 className="font-bold text-white text-sm">Communication Settings</h3>
              
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-medium">{emailDraft.recipient_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Email Type:</span>
                  <span className="capitalize font-medium">{emailDraft.email_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Governance:</span>
                  <span className="text-amber-300 font-semibold">Human Approval Gate</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Status:</span>
                  <span className={hitlApproved ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
                    {hitlApproved ? 'Approved' : 'Pending Authorization'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleApproveAction}
                disabled={hitlApproved}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-transform ${
                  hitlApproved
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-emerald-500/20'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{hitlApproved ? 'Authorized & Dispatched' : 'Authorize & Dispatch Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldAlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
