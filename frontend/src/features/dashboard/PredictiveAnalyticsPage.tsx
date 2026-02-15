
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  BarChart, Bar, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Zap, BrainCircuit, Target, ArrowUpRight, Loader2, Trophy, BarChart3, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitorStore } from '@/store/competitorStore';
import { useAuthStore } from '@/store/authStore';

interface PerformerMetric {
    competitor_id: string;
    name: string;
    change_velocity_score: number;
    innovation_index: number;
    market_sentiment: string;
    predicted_trend: string;
    trend_probability: number;
}

interface PredictiveAnalysisResult {
    top_performers: PerformerMetric[];
    stable_performers: PerformerMetric[];
    trending_predictions: PerformerMetric[];
    analysis_timestamp: string;
}

const PredictiveAnalyticsPage = () => {
  const { competitors, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PredictiveAnalysisResult | null>(null);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const handleInitializePipeline = async () => {
      setLoading(true);
      setAnalysisResult(null);
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/predictive-pipeline`, {
               headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              // Add delay for effect
              setTimeout(() => {
                  setAnalysisResult(data);
                  setLoading(false);
              }, 1500);
          } else {
              setLoading(false);
          }
      } catch (e) {
          console.error(e);
          setLoading(false);
      }
  };

  // Static Data for simulation (Keep existing as fallback/context)
  const trendData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 67 },
    { month: 'Jul', value: 72 },
  ];

  const radarData = [
      { subject: 'Price', A: 120, fullMark: 150 },
      { subject: 'Product', A: 98, fullMark: 150 },
      { subject: 'Marketing', A: 86, fullMark: 150 },
      { subject: 'Tech', A: 99, fullMark: 150 },
      { subject: 'Support', A: 85, fullMark: 150 },
      { subject: 'Global', A: 65, fullMark: 150 },
    ];
  
    const revData = [
      { name: 'Q1', gap: 1.2 },
      { name: 'Q2', gap: 2.1 },
      { name: 'Q3', gap: 0.8 },
      { name: 'Q4', gap: 4.2 }, 
    ];

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] animate-pulse-slow" />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Neural Forecast Engine</span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                Status: {loading ? "Computing" : "Modeling"}
             </div>
          </div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase italic leading-tight"
          >
            Predictive <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Futures</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 mt-2 max-w-2xl font-medium leading-relaxed italic"
          >
            Leveraging autonomous modeling threads to anticipate competitor pivots and market fluctuations. 
            Analyzing <span className="text-slate-200">{competitors.length} intelligence nodes</span> for high-confidence strategy mapping.
          </motion.p>
        </div>
        
        {/* Animated 3D-ish Graphic Simulation */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-64 h-40 bg-[#020617]/40 border border-white/5 rounded-3xl backdrop-blur-xl flex items-center justify-center overflow-hidden group shadow-2xl"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-50" />
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <motion.div 
                animate={{ rotateX: [0, 10, 0], rotateY: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center relative z-10"
            >
                <BrainCircuit size={64} className={`text-purple-500/50 drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] ${loading ? 'animate-pulse' : ''}`} />
                <div className={`absolute inset-0 flex items-center justify-center ${loading ? 'opacity-100' : 'opacity-0'}`}>
                   <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            </motion.div>
        </motion.div>
      </div>

       {/* Analysis Results Section */}
       <AnimatePresence>
            {analysisResult && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-8 overflow-hidden"
                >
                    <div className="flex items-center gap-4 py-4 border-b border-white/5">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <Target className="w-6 h-6 text-emerald-400" />
                            Pipeline Output
                        </h2>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            Generated: {new Date(analysisResult.analysis_timestamp).toLocaleTimeString()}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Top Performers (High Change Velocity) */}
                        <div className="bg-[#020617]/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Trophy className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Top Performers</h3>
                                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">High Change Velocity</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                                {analysisResult.top_performers.map((company, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                                            <span>{company.name}</span>
                                            <span className="text-emerald-400">{company.change_velocity_score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${company.change_velocity_score}%` }}
                                                transition={{ duration: 1, delay: 0.2 * idx }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                                            <span>Innvoation: {company.innovation_index}</span>
                                            <span className="flex items-center gap-1 text-emerald-400"><ArrowUpRight className="w-2.5 h-2.5" /> High Activity</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Stable Performers (Low Change Velocity) */}
                         <div className="bg-[#020617]/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/20 transition-all">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Consistent Core</h3>
                                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Steady Execution</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                                {analysisResult.stable_performers.map((company, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                                            <span>{company.name}</span>
                                            <span className="text-blue-400">{company.change_velocity_score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${company.change_velocity_score}%` }}
                                                transition={{ duration: 1, delay: 0.2 * idx }}
                                                className="h-full bg-blue-500"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                                            <span>Risk: Low</span>
                                            <span className="flex items-center gap-1 text-blue-400">Stable Growth</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Trending Predictions */}
                        <div className="bg-[#020617]/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/20 transition-all">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Predicted Trending</h3>
                                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Future Breakouts</p>
                                </div>
                             </div>
                             
                             <div className="divide-y divide-white/5">
                                {analysisResult.trending_predictions.map((company, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 * idx }}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                 <div className="text-xs font-black text-white">{company.name}</div>
                                                 <div className="text-[9px] text-slate-400 font-mono mt-0.5">Prob: {(company.trend_probability * 100).toFixed(0)}%</div>
                                            </div>
                                            <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider">
                                                {company.market_sentiment}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                             </div>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      {/* Grid Cards (Static Visuals) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* Card 1: Market Trend Forecast */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 rounded-3xl bg-[#020617]/40 border border-white/5 backdrop-blur-xl group hover:border-purple-500/30 transition-all shadow-xl"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <TrendingUp className="w-5 h-5 text-purple-400" /> Traction Forecast
                </h3>
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black tracking-widest">
                    +23% ACC
                </span>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#c084fc" 
                            strokeWidth={4} 
                            dot={false}
                            activeDot={{ r: 6, stroke: '#c084fc', strokeWidth: 2, fill: '#020617' }} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-6 uppercase tracking-widest leading-relaxed">
                Aggregated projection across {competitors.length} active units
            </p>
        </motion.div>

        {/* Card 2: Competitor Pivot Risk */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-8 rounded-3xl bg-[#020617]/40 border border-white/5 backdrop-blur-xl group hover:border-amber-500/30 transition-all shadow-xl"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <Target className="w-5 h-5 text-amber-500" /> Vector Analysis
                </h3>
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black tracking-widest">
                    MID RISK
                </span>
            </div>
            <div className="h-48 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#ffffff05" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} />
                        <PolarRadiusAxis domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Competition"
                            dataKey="A"
                            stroke="#eab308"
                            strokeWidth={3}
                            fill="#eab308"
                            fillOpacity={0.1}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
             <p className="text-[10px] text-slate-500 font-mono mt-6 uppercase tracking-widest leading-relaxed">
                Neural vector mapping of technical debt shifts
            </p>
        </motion.div>

        {/* Card 3: Revenue Shift Alert */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-8 rounded-3xl bg-[#020617]/40 border border-white/5 backdrop-blur-xl group hover:border-cyan-500/30 transition-all shadow-xl"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <Activity className="w-5 h-5 text-cyan-400" /> Signal Gaps
                </h3>
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-black tracking-widest">
                    EST. $4.2M
                </span>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.02)'}}
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Bar dataKey="gap" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
             <p className="text-[10px] text-slate-500 font-mono mt-6 uppercase tracking-widest leading-relaxed">
                Economic opportunity delta in Q4 timeline
            </p>
        </motion.div>

      </div>

      {/* Footer CTA */}
      <div className="flex justify-center mt-12 relative z-10">
        <Button 
            onClick={handleInitializePipeline}
            disabled={loading}
            className="relative group overflow-hidden px-10 py-7 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl active:scale-95 transition-all shadow-2xl shadow-purple-500/30"
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <div className="flex items-center gap-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                {loading ? 'ANALYZING NETWORK SIGNALS...' : 'Initialize Predictive Pipeline'}
                {!loading && <ArrowUpRight className="w-4 h-4" />}
            </div>
        </Button>
      </div>

      {/* Tech Specs */}
      <div className="pt-10 border-t border-white/5 flex flex-wrap justify-center gap-10 text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em] font-black">
          <div>Engine Version: v4.2-NEURAL-LITE</div>
          <div>Model: Market-Prophet-1.5b</div>
          <div>Inference: 420ms (Avg)</div>
          <div>Data Source: Global Signal Stream</div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;
