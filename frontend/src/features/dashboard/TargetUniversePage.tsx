
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Globe, Zap, Search,
    ArrowUpRight, Plus, Terminal, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const [filter, setFilter] = useState('All');
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const resSignals = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/stream?limit=50`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dataSignals = await resSignals.json();
            setSignals(dataSignals.signals || []);

            const resRecs = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/recommendations`, {
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
    
    // Default mock sectors if empty to show the cool chart
    if (Object.keys(sectorCounts).length === 0) {
        sectorCounts['SaaS'] = 45;
        sectorCounts['Fintech'] = 28;
        sectorCounts['Health'] = 19;
        sectorCounts['EdTech'] = 32;
        sectorCounts['Cyber'] = 15;
        sectorCounts['CleanTech'] = 22;
    }

    const chartData = Object.keys(sectorCounts).map(key => ({ 
        subject: key, 
        A: sectorCounts[key], 
        fullMark: 100 
    }));

    return (
        <div className="space-y-6 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <Globe className="w-6 h-6 text-blue-500" />
                        Target Universe <span className="text-slate-600 text-lg not-italic font-mono ml-2">v4.2</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">
                        Global Intelligence Collection Stream
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData} className="border-white/10 hover:bg-white/5 text-slate-400">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        SYNC STREAM
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[#020617]/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Live Signal Intercepts
                            </h2>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-mono">
                                {signals.length} SIGNALS ACTIVE
                            </span>
                        </div>
                        
                        <div className="divide-y divide-white/5 max-h-[700px] overflow-y-auto custom-scrollbar">
                            {signals.map((signal, idx) => (
                                <motion.div 
                                    key={signal.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    onClick={() => navigate('/dashboard/add-competitor', { state: { initialName: signal.company_name } })}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 border border-white/5">
                                                {signal.company_name[0]}
                                            </span>
                                            <div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {signal.company_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                                                    {getSectorIcon(signal.sector)}
                                                    <span>{signal.sector}</span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                    <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-current bg-current/10 ${getSentimentColor(signal.sentiment)}`}>
                                            {signal.sentiment}
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-400 text-xs leading-relaxed mb-3 pl-11">
                                        {signal.summary}
                                    </p>
                                    
                                    <div className="pl-11 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                                                SOURCE: <span className="text-slate-400">{signal.source}</span>
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                                                TYPE: <span className="text-slate-400">{signal.signal_type}</span>
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
                <div className="space-y-6">
                    {/* Radar Chart Widget */}
                    <div className="bg-[#020617]/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Layers className="w-4 h-4 text-purple-400" /> Sector Composition
                        </h3>
                        <div className="h-[250px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid stroke="#1e293b" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                    <Radar name="Signals" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />
                        
                        <h2 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            AI Target Recommendations
                        </h2>
                        
                        <div className="space-y-3 relative z-10">
                            {recommendations.map((rec) => (
                                <motion.div 
                                    key={rec.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                                            {rec.company_name}
                                        </h3>
                                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                            {rec.match_score}% MATCH
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                                        {rec.reason}
                                    </p>
                                    <Button 
                                        className="w-full h-8 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white"
                                        onClick={() => navigate('/dashboard/add-competitor', { state: { initialName: rec.company_name } })}
                                    >
                                        <Plus className="w-3 h-3 mr-2" />
                                        Track Target
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#020617]/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl text-center">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">
                            Manual Probe
                        </h3>
                        <p className="text-[10px] text-slate-500 mb-4">
                            Deploy a custom scout to analyze specific targets not listed in the stream.
                        </p>
                        <Button variant="outline" size="sm" className="w-full text-xs border-white/10 hover:bg-white/5" onClick={() => navigate('/dashboard/add-competitor')}>
                            Initialize Scan
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetUniversePage;
