import { FormEvent, useState } from 'react';
import { 
  Building2, 
  Search, 
  Loader2, 
  Sparkles, 
  Terminal, 
  Activity, 
  ChevronRight,
  Globe2,
  ExternalLink,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntelStore } from '@/store/intelStore';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockData = [
  { name: 'Mon', signals: 4, velocity: 2400 },
  { name: 'Tue', signals: 7, velocity: 1398 },
  { name: 'Wed', signals: 5, velocity: 9800 },
  { name: 'Thu', signals: 12, velocity: 3908 },
  { name: 'Fri', signals: 9, velocity: 4800 },
  { name: 'Sat', signals: 6, velocity: 3800 },
  { name: 'Sun', signals: 15, velocity: 4300 },
];

const AddCompetitorPage = () => {
  const { agentReport, loading, error, analyzeCompany, clear } = useIntelStore();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    clear();
    try {
      await analyzeCompany(name.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-10 pb-20">
      <div className="pointer-events-none absolute -top-40 left-0 w-80 h-80 bg-cyan-500/10 blur-3xl opacity-50" />
      
      {/* Hero Section Alignment */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            V3 Deployment // Autonomous Scout
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Perform deep <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">market intelligence</span> gathering
          </h1>
          <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
            Trigger our agent network to scan documentation, release logs, and technical wikis. 
            Powered by Groq Llama-3 & Tavily API.
          </p>
        </div>

        <div className="w-full md:w-1/3 bg-black/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-gray-500 uppercase">
                <Activity className="w-3 h-3 text-cyan-500" /> Market Volatility Index [MOCK]
            </div>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="signals" stroke="#06b6d4" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                <div>
                    <div className="text-[9px] text-gray-500 uppercase font-mono">Signals Found</div>
                    <div className="text-lg font-bold text-white">1,240</div>
                </div>
                <div>
                    <div className="text-[9px] text-gray-500 uppercase font-mono">Scan Velocity</div>
                    <div className="text-lg font-bold text-cyan-400">840/min</div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Interaction Component - DashboardPreview style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Input and Agent Status */}
        <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-6 shadow-xl relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-white">
                    <Zap className="w-4 h-4 text-cyan-500" />
                    Agent Command Console
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider ml-1">Company Target</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter company name..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            />
                        </div>
                    </div>
                    
                    <Button 
                        type="submit" 
                        variant="neon" 
                        className="w-full justify-between h-12"
                        disabled={submitting || !name.trim()}
                    >
                        {submitting ? 'SCOUTING...' : 'INITIATE SCOUT'}
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </form>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Pipeline Version</span>
                        <span className="text-gray-300 font-mono">v4.2.1-stable</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">LLM Provider</span>
                        <span className="text-cyan-400 font-mono">Groq Llama-3</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Retrieval Node</span>
                        <span className="text-gray-300 font-mono">Tavily Engine</span>
                    </div>
                </div>
            </div>

            {/* Execution Trace (as per reference logs) */}
            <div className="rounded-2xl border border-white/10 bg-black/80 p-5 space-y-3 h-[300px] flex flex-col shadow-inner">
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500 uppercase border-b border-white/5 pb-2">
                    <Terminal className="w-3 h-3" /> Agent Execution Trace
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-none font-mono text-[10px] space-y-2 opacity-80">
                    <div className="text-gray-500">Initializing connection...</div>
                    <div className="text-blue-400">WS Connected: US-EAST-1</div>
                    <AnimatePresence>
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="space-y-2"
                            >
                                <div className="text-cyan-400">PLANNER: Analyzing target "{name}"</div>
                                <div className="text-cyan-400">PLANNER: Generating 2 targeted queries...</div>
                                <div className="text-cyan-400">SEARCH: Invoking Tavily API retrieval...</div>
                                <div className="flex items-center gap-1 text-cyan-400">
                                    <Loader2 className="w-2 h-2 animate-spin" />
                                    <span>PENDING: Data extraction cycle</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!loading && agentReport && (
                        <div className="text-green-400">SUCCESS: Report compiled and synced.</div>
                    )}
                </div>
                <div className="text-[9px] text-gray-700 font-mono italic">
                    Real-time status updates from autonomous scout network.
                </div>
            </div>
        </div>

        {/* Right: Terminal Intelligence Report */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-full min-h-[600px]">
            <div className="rounded-2xl border border-white/10 bg-black/60 flex-1 flex flex-col shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5 pl-1">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="text-[11px] font-mono text-gray-400 tracking-wider">
                            TERMINAL_REPORT // {name || 'IDLE'}
                        </div>
                    </div>
                    {agentReport && !loading && (
                        <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-mono uppercase font-bold tracking-wider">
                            Verified Intel
                        </div>
                    )}
                </div>

                {/* Report Content */}
                <div className="flex-1 p-8 overflow-y-auto font-mono text-sm leading-relaxed relative z-10 custom-scrollbar">
                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/30 blur-3xl animate-pulse rounded-full" />
                                <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-1">
                                <div className="text-white font-bold animate-pulse uppercase tracking-widest">Compiling Intelligence</div>
                                <div className="text-xs text-gray-500">Synthesizing raw data via Groq Inference Engine...</div>
                            </div>
                        </div>
                    )}

                    {!loading && !agentReport && !error && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                            <Terminal className="w-12 h-12 mb-4" />
                            <p className="max-w-xs text-center">
                                Initializing scout protocols. Ready for target command input to begin synthesis.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-xl text-red-400 text-xs">
                            <div className="flex items-center gap-2 font-bold uppercase mb-2">
                                <Activity className="w-3 h-3" /> Connection Error
                            </div>
                            {error}
                        </div>
                    )}

                    {agentReport && !loading && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="prose prose-invert prose-cyan max-w-none text-gray-300"
                        >
                            <ReactMarkdown
                                components={{
                                    h2: ({node, ...props}) => <h2 {...props} className="text-2xl font-black text-white mt-8 mb-6 border-b border-white/10 pb-4 flex items-center gap-3 uppercase tracking-tighter" />,
                                    h3: ({node, ...props}) => <h3 {...props} className="text-lg font-bold text-cyan-400 mt-6 mb-3 uppercase tracking-tight flex items-center gap-2" />,
                                    ul: ({node, ...props}) => <ul {...props} className="space-y-3 my-4 list-none pl-1" />,
                                    li: ({node, ...props}) => (
                                        <li {...props} className="grid grid-cols-[16px_1fr] gap-2 items-start group">
                                            <span className="mt-1.5 text-cyan-500 group-hover:scale-125 transition-transform"><Activity className="w-3.5 h-3.5" /></span>
                                            <span className="text-gray-300 group-hover:text-white transition-colors">{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({node, ...props}) => <strong {...props} className="text-white font-bold" />,
                                    a: ({node, ...props}) => (
                                        <a 
                                            {...props} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1 decoration-cyan-500/40 underline-offset-4" 
                                        >
                                            <span className="border-b border-cyan-500/50">{props.children}</span>
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                    ),
                                    p: ({node, ...props}) => <p {...props} className="mb-4 text-gray-400" />,
                                }}
                            >
                                {agentReport}
                            </ReactMarkdown>
                        </motion.div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="px-6 py-2 bg-black border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-600">
                    <div className="flex gap-4">
                        <div>STATUS: <span className={loading ? "text-yellow-500 animate-pulse" : "text-emerald-500"}>{loading ? 'EXECUTING' : 'IDLE'}</span></div>
                        <div>NODE: CLUSTER_1</div>
                    </div>
                    <div>SECURE TRANSVERSE CHANNEL v1.0.4</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddCompetitorPage;
