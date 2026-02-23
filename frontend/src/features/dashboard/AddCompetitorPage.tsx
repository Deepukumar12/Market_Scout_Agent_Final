
import { FormEvent, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    ShieldCheck,
    Cpu,
    BarChart3,
    Globe,
    Database,
    GitBranch,
    MousePointer2,
    Plus,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntelStore } from '@/store/intelStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    AreaChart,
    Area,
    ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { generateCompanyReport } from '@/lib/pdfGenerator';

const mockData = [
    { name: 'Mon', signals: 4, velocity: 2400 },
    { name: 'Tue', signals: 7, velocity: 1398 },
    { name: 'Wed', signals: 5, velocity: 9800 },
    { name: 'Thu', signals: 12, velocity: 3908 },
    { name: 'Fri', signals: 9, velocity: 4800 },
    { name: 'Sat', signals: 6, velocity: 3800 },
    { name: 'Sun', signals: 15, velocity: 4300 },
];

interface SuggestedCompany {
    id: string;
    name: string;
    similarity_score: number;
    common_features: string[];
    sector: string;
    deployment_status: string;
}

const AddCompetitorPage = () => {
    const { agentReport, loading, error, analyzeCompany, clear } = useIntelStore();
    const { token } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { initialName?: string };
    const [name, setName] = useState(state?.initialName || '');
    const [submitting, setSubmitting] = useState(false);

    // Suggestions State
    const [suggestions, setSuggestions] = useState<SuggestedCompany[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        if (state?.initialName) {
            handleAutoSubmit(state.initialName);
        }
    }, [state?.initialName]);

    // Debounced Suggestion Fetching
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (name.length < 3) {
                setSuggestions([]);
                return;
            }

            setLoadingSuggestions(true);
            try {
                // Mock fetch or real endpoint
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/suggest-similar?query=${name}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 800); // 800ms debounce
        return () => clearTimeout(timeoutId);
    }, [name, token]);

    const handleAutoSubmit = async (targetName: string) => {
        setSubmitting(true);
        clear();
        try {
            await analyzeCompany(targetName.trim());
        } finally {
            setSubmitting(false);
        }
    };

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

    const handleSuggestionClick = (suggestionName: string) => {
        setName(suggestionName);
        // Optional: Auto-submit or just fill
    };

    return (
        <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
            <div className="pointer-events-none absolute -top-40 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow" />

            <div className="flex flex-col lg:flex-row items-start justify-between gap-12 relative z-10">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Autonomous Scout v4.2</span>
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            DECRYPT: ENABLED
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-4 uppercase italic leading-tight">
                            Deep <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Intelligence</span> Synthesis
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed italic">
                            Deploy specialized scout threads to scan technical artifacts, release vectors, and market signals.
                            Powered by the <span className="text-blue-400">Neural-Tavily Pipeline</span>.
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-96 bg-[#020617]/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-blue-500/20 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Activity className="w-4 h-4 text-blue-500" /> Market Volatility
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">TELEMETRY_LIVE</div>
                    </div>
                    <div className="h-32 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData}>
                                <defs>
                                    <linearGradient id="colorValueAdd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="signals" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValueAdd)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Signals Found</div>
                            <div className="text-2xl font-black text-white italic tracking-tighter">1,240</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Scan Velocity</div>
                            <div className="text-2xl font-black text-blue-400 italic tracking-tighter">840<span className="text-xs font-mono ml-1">/min</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                <div className="lg:col-span-1 space-y-8">
                    <div className="rounded-3xl border border-white/5 bg-[#020617]/40 p-8 space-y-8 shadow-xl relative backdrop-blur-xl group hover:border-blue-500/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white italic">
                                <Zap className="w-5 h-5 text-blue-400 fill-current" />
                                Command Console
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Target Identifier</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="ENTER NAME..."
                                        className="w-full bg-[#020617]/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-widest text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all backdrop-blur-xl"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 group uppercase tracking-widest text-[10px]"
                                disabled={submitting || !name.trim()}
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        DEPLOYING AGENTS...
                                    </span>
                                ) : 'INITIATE TACTICAL SCAN'}
                                {!submitting && <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />}
                            </Button>
                        </form>

                        {/* --- SUGGESTIONS MODULE START --- */}
                        <AnimatePresence>
                            {(suggestions.length > 0 || loadingSuggestions) && name.length >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 pt-6 border-t border-white/5 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <GitBranch className="w-3 h-3 text-purple-400" />
                                            Feature Correlation Found
                                        </span>
                                        {loadingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-slate-600" />}
                                    </div>

                                    <div className="space-y-2">
                                        {suggestions.map((suggestion) => (
                                            <motion.div
                                                key={suggestion.id}
                                                layout
                                                onClick={() => handleSuggestionClick(suggestion.name)}
                                                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 cursor-pointer group/suggestion transition-all"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-white text-xs font-bold group-hover/suggestion:text-purple-400 transition-colors">
                                                        {suggestion.name}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                        {suggestion.similarity_score}% MATCH
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {suggestion.common_features.map((feat, idx) => (
                                                        <span key={idx} className="text-[9px] text-slate-500 font-mono bg-black/20 px-1 py-0.5 rounded border border-white/5">
                                                            {feat}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-2 flex items-center justify-end opacity-0 group-hover/suggestion:opacity-100 transition-opacity">
                                                    <span className="text-[9px] text-purple-400 flex items-center gap-1 font-black uppercase tracking-widest">
                                                        Inject Target <Plus className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* --- SUGGESTIONS MODULE END --- */}

                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Pipeline Alpha</span>
                                <span className="text-slate-200 font-mono">v4.2.1-PRO</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Engine Node</span>
                                <span className="text-blue-400 font-mono">GROQ-LLAMA-3</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Retrieval Vector</span>
                                <span className="text-slate-200 font-mono">TAVILY-V2</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-[#020617]/80 p-6 space-y-4 h-[320px] flex flex-col shadow-2xl backdrop-blur-3xl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2 text-[10px] font-mono font-black text-blue-500 uppercase">
                                <Terminal className="w-3.5 h-3.5" /> Execution Trace
                            </div>
                            <div className="text-[10px] font-mono text-slate-700">60FPS // 12ms</div>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-none font-mono text-[10px] space-y-3 opacity-90">
                            <div className="text-slate-500 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                Link established... secure_tunnel:8080
                            </div>
                            <div className="text-blue-400 flex items-center gap-2 font-bold italic">
                                <span className="w-1 h-1 rounded-full bg-blue-400" />
                                CLUSTER_READY: US-EAST-DEPLOY
                            </div>
                            <AnimatePresence>
                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-3"
                                    >
                                        <div className="text-cyan-400 uppercase tracking-tighter">
                                            [PLANNER] Analyzing target: "{name}"
                                        </div>
                                        <div className="text-cyan-400 uppercase tracking-tighter">
                                            [PLANNER] Compiling multi-query matrix...
                                        </div>
                                        <div className="text-purple-400 uppercase tracking-tighter">
                                            [SEARCH] Invoking parallel data retrieval...
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-400 font-black animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>[ACTIVE] SYNTHESIZING SIGNAL LAYERS...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!loading && agentReport && (
                                <div className="text-emerald-400 font-black uppercase tracking-[0.2em] pt-4 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    DEPLOYMENT_SUCCESS // REPORT_READY
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] text-slate-700 font-black uppercase tracking-widest pt-2 border-t border-white/5">
                            Real-time autonomous telemetry
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col h-full min-h-[700px]">
                    <div className="rounded-3xl border border-white/5 bg-[#020617]/60 flex-1 flex flex-col shadow-2xl relative overflow-hidden group backdrop-blur-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between px-8 py-6 bg-white/[0.02] border-b border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-6">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/20" />
                                </div>
                                <div className="text-[11px] font-black font-mono text-slate-500 tracking-[0.2em] uppercase">
                                    INTELLIGENCE_STREAM // <span className="text-white italic">{name || 'SYSTEM_READY'}</span>
                                </div>
                            </div>
                            {agentReport && !loading && (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => generateCompanyReport(name, agentReport)}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors group/download"
                                    >
                                        <Download className="w-3 h-3 group-hover/download:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Download Report</span>
                                    </button>
                                    <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">
                                        VERIFIED_INTEL
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-10 overflow-y-auto font-medium leading-relaxed relative z-10 custom-scrollbar scroll-smooth">
                            {loading && (
                                <div className="h-full flex flex-col items-center justify-center space-y-8">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse rounded-full" />
                                        <div className="w-24 h-24 rounded-3xl border-2 border-blue-500/10 border-t-blue-500 animate-spin relative z-10 bg-[#020617]/60 backdrop-blur-xl flex items-center justify-center">
                                            <Cpu className="w-10 h-10 text-blue-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-3">
                                        <div className="text-white text-xl font-black italic tracking-tighter uppercase animate-pulse">Synthesizing Tactical Data</div>
                                        <div className="text-xs text-slate-500 font-black uppercase tracking-[0.3em]">Processing Neural Inference Pipeline</div>
                                    </div>
                                </div>
                            )}

                            {!loading && !agentReport && !error && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 select-none grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <div className="w-32 h-32 rounded-full border border-slate-700 flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping shadow-[0_0_50px_rgba(59,130,246,0.1)]" />
                                        <Database className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <p className="max-w-sm text-center font-black uppercase tracking-widest text-[10px] leading-relaxed text-slate-500">
                                        Awaiting target authorization. Deployment sequence initialized. Input company name to begin deep-sector analysis.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="p-8 border border-rose-500/20 bg-rose-500/5 rounded-3xl text-rose-400">
                                    <div className="flex items-center gap-3 font-black uppercase tracking-widest text-sm mb-4">
                                        <Activity className="w-5 h-5" /> Protocol Extraction Error
                                    </div>
                                    <p className="font-mono text-xs font-bold leading-relaxed">{error}</p>
                                    <Button variant="outline" onClick={clear} className="mt-8 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest">
                                        RESET_SEQUENCE
                                    </Button>
                                </div>
                            )}

                            {agentReport && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="prose prose-invert prose-blue max-w-none text-slate-300 font-medium italic"
                                >
                                    <ReactMarkdown
                                        components={{
                                            h2: ({ node, ...props }) => <h2 {...props} className="text-3xl font-black text-white mt-12 mb-8 border-b border-white/5 pb-6 flex items-center gap-4 uppercase tracking-tighter italic" />,
                                            h3: ({ node, ...props }) => <h3 {...props} className="text-xl font-black text-blue-400 mt-10 mb-5 uppercase tracking-tight flex items-center gap-3 italic" />,
                                            ul: ({ node, ...props }) => <ul {...props} className="space-y-4 my-6 list-none pl-2" />,
                                            li: ({ node, ...props }) => (
                                                <li {...props} className="grid grid-cols-[20px_1fr] gap-4 items-start group">
                                                    <span className="mt-1 text-blue-500 group-hover:scale-125 transition-transform"><Zap className="w-4 h-4 fill-current" /></span>
                                                    <span className="text-slate-300 group-hover:text-white transition-colors text-sm">{props.children}</span>
                                                </li>
                                            ),
                                            strong: ({ node, ...props }) => <strong {...props} className="text-white font-black uppercase tracking-tight" />,
                                            a: ({ node, ...props }) => (
                                                <a
                                                    {...props}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 decoration-blue-500/40 underline-offset-4"
                                                >
                                                    <span className="border-b border-blue-500/30 font-black uppercase tracking-widest text-[10px]">{props.children}</span>
                                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                </a>
                                            ),
                                            p: ({ node, ...props }) => <p {...props} className="mb-6 text-slate-400 leading-relaxed text-base" />,
                                        }}
                                    >
                                        {agentReport}
                                    </ReactMarkdown>
                                </motion.div>
                            )}
                        </div>

                        <div className="px-8 py-3 bg-[#020617] border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-600 uppercase tracking-widest font-black">
                            <div className="flex gap-8">
                                <div>LINK_STATUS: <span className={loading ? "text-amber-500 animate-pulse" : "text-emerald-500"}>{loading ? 'EXECUTING' : 'READY'}</span></div>
                                <div className="hidden md:block">ENCRYPTION: AES-256-GCM</div>
                                <div className="hidden md:block">LOC: GRID_US_NORTH</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                SECURE_RELAY_ACTIVE
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-700 font-mono uppercase tracking-[0.3em] font-black pt-6">
                <div className="flex items-center gap-3">
                    <Globe className="w-3 h-3" /> DISTRIBUTED_INTELLIGENCE_NETWORK
                </div>
                <div>CORE_VER: OS-MARKET-X7</div>
            </div>
        </div>
    );
};

export default AddCompetitorPage;
