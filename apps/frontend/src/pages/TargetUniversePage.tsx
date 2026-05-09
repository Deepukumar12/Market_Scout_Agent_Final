import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Globe, Zap, Search,
    ArrowUpRight, Plus, Terminal, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { getIntelligenceStream, getRecommendations } from '@/services/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface IntelSignal {
    id: string;
    company_name: string;
    sector: string;
    signal_type: string;
    confidence_score: number;
    timestamp: string;
    summary: string;
    source: string;
    sentiment: string;
    impact_score: number;
}

interface Recommendation {
    id: string;
    company_name: string;
    sector: string;
    match_score: number;
    reason: string;
}

const TargetUniversePage = () => {
    const [signals, setSignals] = useState<IntelSignal[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const dataSignals = await getIntelligenceStream(50);
            setSignals(dataSignals.signals || []);

            const dataRecs = await getRecommendations();
            setRecommendations(dataRecs || []);
        } catch (error) {
            console.error("Failed to fetch intelligence data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        window.addEventListener('intelligence-refresh', fetchData);
        
        const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
        return () => {
            window.removeEventListener('intelligence-refresh', fetchData);
            clearInterval(interval);
        };
    }, [fetchData]);


const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
        case 'Positive': return 'text-emerald-400';
        case 'Use Caution': return 'text-amber-400';
        default: return 'text-slate-400';
    }
};

const getSectorIcon = (sector: string) => {
    if (sector.includes('University') || sector.includes('Education')) return <Globe className="w-4 h-4 text-pink-400" />;
    if (sector === 'IT' || sector === 'Tech') return <Terminal className="w-4 h-4 text-blue-400" />;
    return <Layers className="w-4 h-4 text-purple-400" />;
};

    const chartData = useMemo(() => {
        const counts = signals.reduce((acc: any, signal) => {
            acc[signal.sector] = (acc[signal.sector] || 0) + 1;
            return acc;
        }, {});
        
        return Object.keys(counts).map(key => ({ 
            subject: key, 
            A: counts[key], 
            fullMark: 100 
        }));
    }, [signals]);

    return (
        <div className="space-y-6 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-5xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        Target <span className="text-[#0071E3]">Universe</span>
                    </h1>
                    <p className="text-[#6E6E73] dark:text-[#86868B] text-lg font-medium italic mt-2">
                        Global intelligence collection stream and autonomous signal intercepts.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData} className="border-[#E5E5EA] dark:border-white/10 hover:bg-[#F5F5F7] dark:hover:bg-white/5 text-[#6E6E73] dark:text-[#86868B] rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        SYNC STREAM
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-10">
                <div className="bg-white/70 dark:bg-[#1D1D1F]/70 border border-[#E5E5EA] dark:border-white/10 rounded-[48px] overflow-hidden backdrop-blur-3xl shadow-apple-large transition-all duration-500">
                    <div className="px-8 py-6 border-b border-[#E5E5EA] dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-white/5">
                        <h2 className="text-[10px] font-black text-[#0071E3] uppercase tracking-[0.2em] flex items-center gap-3 italic">
                            <Activity className="w-4 h-4 animate-pulse" />
                            Live Signal Intercepts
                        </h2>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-black tracking-widest">
                            {signals.length} SIGNALS ACTIVE
                        </span>
                    </div>
                        
                    <div className="divide-y divide-[#E5E5EA] dark:divide-white/5 max-h-[800px] overflow-y-auto custom-scrollbar">
                        {signals.map((signal, idx) => (
                            <motion.div 
                                key={signal.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-8 hover:bg-white/50 dark:hover:bg-white/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-[#0071E3]"
                                    onClick={() => navigate('/dashboard/add-competitor', { state: { initialName: signal.company_name } })}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-5">
                                            <span className="w-12 h-12 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center font-black text-lg text-[#0071E3] border border-[#E5E5EA] dark:border-white/10 shadow-sm transition-transform group-hover:scale-110">
                                                {signal.company_name[0]}
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-black text-[#1D1D1F] dark:text-white group-hover:text-[#0071E3] transition-colors uppercase italic tracking-tight">
                                                    {signal.company_name}
                                                </h3>
                                                <div className="flex items-center gap-3 text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-black uppercase tracking-widest mt-1">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10">
                                                        {getSectorIcon(signal.sector)}
                                                        <span>{signal.sector}</span>
                                                    </div>
                                                    <span className="w-1 h-1 bg-[#E5E5EA] dark:bg-white/20 rounded-full" />
                                                    <span className="font-mono">{new Date(signal.timestamp).toLocaleTimeString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-current bg-current/5 italic ${getSentimentColor(signal.sentiment)}`}>
                                            {signal.sentiment}
                                        </div>
                                    </div>
                                    
                                    <p className="text-[#6E6E73] dark:text-[#86868B] text-sm leading-relaxed mb-4 pl-16 font-medium italic">
                                        {signal.summary}
                                    </p>
                                    
                                    <div className="pl-16 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono flex items-center gap-2">
                                                <span className="opacity-50">SOURCE:</span> <span className="text-[#1D1D1F] dark:text-white font-black">{signal.source}</span>
                                            </span>
                                            <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono flex items-center gap-2">
                                                <span className="opacity-50">TYPE:</span> <span className="text-[#0071E3] font-black">{signal.signal_type}</span>
                                            </span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black text-[#0071E3] hover:text-white hover:bg-[#0071E3] uppercase tracking-widest rounded-xl transition-all">
                                            Investigate <ArrowUpRight className="w-3 h-3 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recommendations Sidebar */}
                <div className="space-y-10">
                    {/* Radar Chart Widget */}
                    <div className="bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 p-10 rounded-[48px] relative overflow-hidden shadow-apple-large group transition-all duration-500">
                        <h3 className="text-[10px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3 italic">
                             <Layers className="w-5 h-5 text-[#AF52DE]" /> Sector Composition
                        </h3>
                        <div className="h-[300px] w-full relative z-10 transition-transform group-hover:scale-105">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                                    <PolarGrid stroke="#86868B" opacity={0.2} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#86868B', fontSize: 10, fontWeight: 900 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                    <Radar name="Signals" dataKey="A" stroke="#AF52DE" strokeWidth={4} fill="#AF52DE" fillOpacity={0.15} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#AF52DE]/5 blur-[50px] rounded-full pointer-events-none" />
                    </div>

                    <div className="bg-gradient-to-b from-[#0071E3]/10 to-[#AF52DE]/10 border border-[#E5E5EA] dark:border-white/10 rounded-[48px] p-10 backdrop-blur-3xl relative overflow-hidden shadow-apple-large group transition-all duration-500">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#0071E3]/20 blur-[60px] rounded-full pointer-events-none animate-pulse-slow" />
                        
                        <h2 className="text-[10px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10 italic">
                            <Zap className="w-5 h-5 text-amber-500 fill-current" />
                            AI Target Recommendations
                        </h2>
                        
                        <div className="space-y-4 relative z-10">
                            {Array.isArray(recommendations) && recommendations.map((rec) => (
                                <motion.div 
                                    key={rec.id}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    className="bg-white/60 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-2xl p-5 hover:border-[#0071E3]/40 transition-all group/card shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-sm text-[#1D1D1F] dark:text-white group-hover/card:text-[#0071E3] transition-colors uppercase italic tracking-tight">
                                            {rec.company_name}
                                        </h3>
                                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shadow-sm italic">
                                            {rec.match_score}% MATCH
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#6E6E73] dark:text-[#86868B] mb-5 leading-relaxed font-medium italic">
                                        {rec.reason}
                                    </p>
                                    <Button 
                                        className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                        onClick={() => navigate('/dashboard/add-competitor', { state: { initialName: rec.company_name } })}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Track Target
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/70 dark:bg-[#1D1D1F]/70 border border-[#E5E5EA] dark:border-white/10 rounded-[48px] p-10 backdrop-blur-3xl text-center shadow-apple-large group hover:border-[#0071E3]/20 transition-all duration-500">
                        <div className="w-16 h-16 bg-[#F5F5F7] dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#E5E5EA] dark:border-white/10 shadow-sm group-hover:rotate-12 transition-transform">
                             <Search className="w-7 h-7 text-[#0071E3]" />
                        </div>
                        <h3 className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.2em] mb-2 italic">
                            Manual Probe
                        </h3>
                        <p className="text-[10px] text-[#6E6E73] dark:text-[#86868B] mb-8 font-medium italic text-center leading-relaxed">
                            Deploy a custom scout to analyze specific targets not listed in the stream.
                        </p>
                        <Button 
                            variant="outline" 
                            className="w-full h-12 text-[10px] font-black uppercase tracking-widest border-[#E5E5EA] dark:border-white/10 hover:bg-[#F5F5F7] dark:hover:bg-white/5 rounded-xl transition-all" 
                            onClick={() => navigate('/dashboard/add-competitor')}
                        >
                            Initialize Deep Scan
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetUniversePage;
