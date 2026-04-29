import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Globe, Zap, Search,
    ArrowUpRight, Plus, Terminal, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
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

    const fetchData = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const resSignals = await fetch(`${apiUrl}/api/v1/intelligence/stream?limit=50`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dataSignals = await resSignals.json();
            setSignals(dataSignals.signals || []);

            const resRecs = await fetch(`${apiUrl}/api/v1/intelligence/recommendations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dataRecs = await resRecs.json();
            setRecommendations(dataRecs || []);
        } catch (error) {
            console.error("Failed to fetch intelligence data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [token]);


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

    const sectorCounts = signals.reduce((acc: any, signal) => {
        acc[signal.sector] = (acc[signal.sector] || 0) + 1;
        return acc;
    }, {});
    
    // Mock fallbacks removed to ensure 100% project accuracy

    const chartData = Object.keys(sectorCounts).map(key => ({ 
        subject: key, 
        A: sectorCounts[key], 
        fullMark: 100 
    }));

    return (
        <div className="space-y-6 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-5xl font-black text-[#1D1D1F] uppercase tracking-tighter italic flex items-center gap-3">
                        Target <span className="text-[#0071E3]">Universe</span>
                    </h1>
                    <p className="text-[#6E6E73] dark:text-[#86868B] text-lg font-medium italic mt-2">
                        Global intelligence collection stream and autonomous signal intercepts.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData} className="border-[#E5E5EA] hover:bg-white/50 text-[#6E6E73] dark:text-[#86868B]">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        SYNC STREAM
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-10">
                <div className="bg-white/70 border border-[#E5E5EA] rounded-[40px] overflow-hidden backdrop-blur-xl shadow-apple shadow-sm">
                    <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between bg-white/40">
                        <h2 className="text-xs font-black text-[#0071E3] uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Live Signal Intercepts
                        </h2>
                        <span className="text-[10px] bg-[#0071E3]/10 text-[#0071E3] px-2 py-1 rounded border border-[#0071E3]/20 font-mono">
                            {signals.length} SIGNALS ACTIVE
                        </span>
                    </div>
                        
                    <div className="divide-y divide-[#E5E5EA] max-h-[700px] overflow-y-auto custom-scrollbar">
                        {signals.map((signal, idx) => (
                            <motion.div 
                                key={signal.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-5 hover:bg-white/50 transition-colors group cursor-pointer"
                                    onClick={() => navigate('/dashboard/add-competitor', { state: { initialName: signal.company_name } })}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded bg-[#F5F5F7] flex items-center justify-center font-black text-xs text-[#86868B] dark:text-[#A1A1A6] border border-[#E5E5EA]">
                                                {signal.company_name[0]}
                                            </span>
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                                                    {signal.company_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono uppercase">
                                                    {getSectorIcon(signal.sector)}
                                                    <span>{signal.sector}</span>
                                                    <span className="w-1 h-1 bg-[#E5E5EA] rounded-full" />
                                                    <span>{new Date(signal.timestamp).toLocaleTimeString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-current bg-current/10 ${getSentimentColor(signal.sentiment)}`}>
                                            {signal.sentiment}
                                        </div>
                                    </div>
                                    
                                    <p className="text-[#6E6E73] dark:text-[#86868B] text-xs leading-relaxed mb-3 pl-11 font-medium italic">
                                        {signal.summary}
                                    </p>
                                    
                                    <div className="pl-11 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono flex items-center gap-1">
                                                SOURCE: <span className="text-[#6E6E73] dark:text-[#86868B]">{signal.source}</span>
                                            </span>
                                            <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono flex items-center gap-1">
                                                TYPE: <span className="text-[#6E6E73] dark:text-[#86868B]">{signal.signal_type}</span>
                                            </span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-6 text-[9px] hover:text-blue-400 hover:bg-blue-500/10 uppercase tracking-wider">
                                            Analyze <ArrowUpRight className="w-3 h-3 ml-1" />
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
                    <div className="glass-panel border-[#E5E5EA] p-10 rounded-[40px] relative overflow-hidden shadow-apple shadow-sm">
                        <h3 className="text-xs font-black text-[#1D1D1F] uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Layers className="w-4 h-4 text-[#AF52DE]" /> Sector Composition
                        </h3>
                        <div className="h-[250px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid stroke="#E5E5EA" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#86868B', fontSize: 10, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                    <Radar name="Signals" dataKey="A" stroke="#AF52DE" strokeWidth={2} fill="#AF52DE" fillOpacity={0.1} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-[#0071E3]/5 to-[#AF52DE]/5 border border-[#E5E5EA] rounded-[40px] p-10 backdrop-blur-xl relative overflow-hidden shadow-apple shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071E3]/10 blur-[50px] rounded-full pointer-events-none" />
                        
                        <h2 className="text-xs font-black text-[#1D1D1F] uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                            <Zap className="w-4 h-4 text-amber-500" />
                            AI Target Recommendations
                        </h2>
                        
                        <div className="space-y-3 relative z-10">
                            {recommendations.map((rec) => (
                                <motion.div 
                                    key={rec.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white/60 border border-[#E5E5EA] rounded-xl p-4 hover:border-[#0071E3]/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-sm text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                                            {rec.company_name}
                                        </h3>
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                            {rec.match_score}% MATCH
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#6E6E73] mb-3 leading-relaxed font-medium italic">
                                        {rec.reason}
                                    </p>
                                    <Button 
                                        className="w-full h-8 text-[10px] font-black uppercase tracking-widest bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-lg"
                                        onClick={() => navigate('/dashboard/add-competitor', { state: { initialName: rec.company_name } })}
                                    >
                                        <Plus className="w-3 h-3 mr-2" />
                                        Track Target
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/70 border border-[#E5E5EA] rounded-[40px] p-10 backdrop-blur-xl text-center shadow-apple shadow-sm">
                        <div className="w-12 h-12 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#E5E5EA]">
                             <Search className="w-5 h-5 text-[#86868B]" />
                        </div>
                        <h3 className="text-xs font-black text-[#1D1D1F] uppercase tracking-widest mb-1">
                            Manual Probe
                        </h3>
                        <p className="text-[10px] text-[#6E6E73] mb-4 font-medium italic text-center">
                            Deploy a custom scout to analyze specific targets not listed in the stream.
                        </p>
                        <Button variant="outline" size="sm" className="w-full text-xs border-[#E5E5EA] hover:bg-white/50" onClick={() => navigate('/dashboard/add-competitor')}>
                            Initialize Scan
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetUniversePage;
