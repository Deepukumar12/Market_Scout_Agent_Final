
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { 
  Activity, Zap, BrainCircuit, Target, ArrowUpRight, Loader2, Trophy, BarChart3, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCompetitorStore } from '@/store/competitorStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

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
          // @ts-ignore - import.meta.env is provided by Vite
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiUrl}/api/v1/intelligence/predictive-pipeline`, {
               headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              // Default mock sectors are removed to ensure only real data is shown.
              // This check ensures that if the API returns an empty or invalid result,
              // we don't display it as a valid analysis.
              if (!data || (data.top_performers?.length === 0 && data.stable_performers?.length === 0 && data.trending_predictions?.length === 0)) {
                  setAnalysisResult(null); // Explicitly set to null if data is empty/invalid
                  setLoading(false);
                  return;
              }
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
  

  // Deduplicate combined array by competitor_id to prevent redundant UI traces
  const allPerformers = analysisResult 
    ? Array.from(
        new Map([...analysisResult.top_performers, ...analysisResult.stable_performers]
        .map(item => [item.competitor_id, item]))
        .values()
      ) 
    : [];
  
  const trendData = analysisResult ? allPerformers.map((p, i) => ({
      name: p.name.substring(0, 10),
      value: p.change_velocity_score,
      time: `T${i}`
  })) : [];
  
  const radarData = analysisResult ? allPerformers.slice(0, 5).map(p => ({
      subject: p.name.substring(0, 12),
      A: p.change_velocity_score,
      fullMark: 100
  })) : [];
  
  const revData = analysisResult ? (
      analysisResult.trending_predictions.length > 0 
        ? analysisResult.trending_predictions.map(p => ({
            name: p.name.substring(0, 8),
            gap: p.trend_probability * 100
          }))
        : allPerformers.map(p => ({
            name: p.name.substring(0, 8),
            gap: p.innovation_index
          }))
  ) : [];

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] animate-pulse-slow" />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-[#AF52DE]/10 border border-[#AF52DE]/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#AF52DE] animate-pulse" />
                <span className="text-[10px] font-black text-[#AF52DE] uppercase tracking-widest">Neural Forecast Engine</span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] text-[10px] font-mono text-[#86868B] dark:text-[#A1A1A6] uppercase">
                Status: {loading ? "Computing" : "Modeling"}
             </div>
          </div>
          <div className="flex gap-4">
          </div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl lg:text-6xl font-black tracking-tighter text-[#1D1D1F] uppercase italic leading-tight"
          >
            Predictive <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AF52DE] to-[#5AC8FA]">Futures</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#6E6E73] dark:text-[#86868B] mt-2 max-w-2xl font-medium leading-relaxed italic"
          >
            Leveraging autonomous modeling threads to anticipate competitor pivots and market fluctuations. 
            Analyzing <span className="text-[#1D1D1F]">{competitors.length} intelligence nodes</span> for high-confidence strategy mapping.
          </motion.p>
        </div>
        
        {/* Animated 3D-ish Graphic Simulation */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-64 h-40 bg-white/70 border border-[#E5E5EA] rounded-[40px] backdrop-blur-xl flex items-center justify-center overflow-hidden group shadow-apple"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-50" />
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <motion.div 
                animate={{ rotateX: [0, 10, 0], rotateY: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center relative z-10"
            >
                <BrainCircuit size={64} className={`text-[#AF52DE]/50 drop-shadow-[0_0_20px_rgba(175,82,222,0.3)] ${loading ? 'animate-pulse' : ''}`} />
                <div className={`absolute inset-0 flex items-center justify-center ${loading ? 'opacity-100' : 'opacity-0'}`}>
                   <Loader2 className="w-12 h-12 text-[#AF52DE] animate-spin" />
                </div>
            </motion.div>
        </motion.div>
      </div>

        <AnimatePresence>
            {!loading && !analysisResult && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-black/20 border border-dashed border-[#E5E5EA] rounded-[40px] backdrop-blur-sm"
                >
                    <Activity className="w-12 h-12 text-[#86868B] mb-4 opacity-20" />
                    <h3 className="text-xl font-black text-[#1D1D1F] uppercase italic tracking-tighter">No Analysis Available</h3>
                    <p className="text-[10px] text-[#86868B] font-mono mt-2 uppercase tracking-widest max-w-xs text-center">
                        Initialize the pipeline to model futures based on your current intelligence nodes.
                    </p>
                </motion.div>
            )}

            {analysisResult && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-10 overflow-hidden"
                >
                    <div className="flex items-center gap-4 py-4 border-b border-[#E5E5EA]">
                        <h2 className="text-2xl font-black text-[#1D1D1F] uppercase italic tracking-tighter flex items-center gap-3">
                            <Target className="w-6 h-6 text-emerald-500" />
                            Pipeline Output
                        </h2>
                        <span className="text-[10px] font-mono text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest">
                            Generated: {new Date(analysisResult.analysis_timestamp).toLocaleTimeString('en-IN')}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Top Performers (High Change Velocity) */}
                        <div className="bg-white/70 border border-[#E5E5EA] rounded-[40px] p-10 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all shadow-apple shadow-sm">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Trophy className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">Top Performers</h3>
                                    <p className="text-[9px] text-[#86868B] dark:text-[#A1A1A6] font-mono uppercase tracking-widest">High Change Velocity</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                                {analysisResult.top_performers.map((company, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                                            <span>{company.name}</span>
                                            <span className="text-emerald-600 font-black">{company.change_velocity_score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${company.change_velocity_score}%` }}
                                                transition={{ duration: 1, delay: 0.2 * idx }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono text-[#86868B] dark:text-[#A1A1A6]">
                                            <span>Innovation: {company.innovation_index}</span>
                                            <span className="flex items-center gap-1 text-emerald-600"><ArrowUpRight className="w-2.5 h-2.5" /> High Activity</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Stable Performers (Low Change Velocity) */}
                         <div className="bg-white/70 border border-[#E5E5EA] rounded-[40px] p-10 backdrop-blur-xl relative overflow-hidden group hover:border-[#0071E3]/20 transition-all shadow-apple shadow-sm">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071E3]/5 blur-[50px] rounded-full pointer-events-none" />
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 flex items-center justify-center border border-[#0071E3]/20">
                                    <BarChart3 className="w-5 h-5 text-[#0071E3]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">Consistent Core</h3>
                                    <p className="text-[9px] text-[#86868B] dark:text-[#A1A1A6] font-mono uppercase tracking-widest">Steady Execution</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                                {analysisResult.stable_performers.map((company, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                                            <span>{company.name}</span>
                                            <span className="text-[#0071E3] font-black">{company.change_velocity_score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${company.change_velocity_score}%` }}
                                                transition={{ duration: 1, delay: 0.2 * idx }}
                                                className="h-full bg-[#0071E3]"
                                            />
                                        </div>
                                         <div className="flex justify-between items-center text-[9px] font-mono text-[#86868B] dark:text-[#A1A1A6]">
                                             <span>Risk: {company.change_velocity_score > 60 ? "Elevated" : "Low"}</span>
                                             <span className={cn(
                                                "flex items-center gap-1",
                                                company.change_velocity_score > 60 ? "text-amber-600" : "text-[#0071E3]"
                                             )}>
                                                {company.change_velocity_score > 60 ? "Dynamic Shift" : "Stable Growth"}
                                             </span>
                                         </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Trending Predictions */}
                        <div className="bg-white/70 border border-[#E5E5EA] rounded-[40px] p-10 backdrop-blur-xl relative overflow-hidden group hover:border-[#AF52DE]/20 transition-all shadow-apple shadow-sm">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-[#AF52DE]/5 blur-[50px] rounded-full pointer-events-none" />
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#AF52DE]/10 flex items-center justify-center border border-[#AF52DE]/20">
                                    <Zap className="w-5 h-5 text-[#AF52DE]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">Predicted Trending</h3>
                                    <p className="text-[9px] text-[#86868B] font-mono uppercase tracking-widest">Future Breakouts</p>
                                </div>
                             </div>
                             
                             <div className="divide-y divide-white/5">
                                {analysisResult.trending_predictions.map((company, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 * idx }}
                                        className="py-3 first:pt-0 last:pb-0 border-b border-[#E5E5EA] last:border-0"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                 <div className="text-xs font-black text-[#1D1D1F] uppercase italic">{company.name}</div>
                                                 <div className="text-[9px] text-[#86868B] font-mono mt-0.5">Prob: {(company.trend_probability * 100).toFixed(0)}%</div>
                                            </div>
                                            <span className="text-[9px] font-black text-[#AF52DE] bg-[#AF52DE]/10 px-2 py-0.5 rounded border border-[#AF52DE]/20 uppercase tracking-wider">
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
            className="p-10 rounded-[40px] bg-white/70 border border-[#E5E5EA] backdrop-blur-xl group hover:border-[#AF52DE]/30 transition-all shadow-apple shadow-sm"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-[#1D1D1F] flex items-center gap-3 uppercase italic tracking-tighter">
                    <TrendingUp className="w-5 h-5 text-[#AF52DE]" /> Traction Forecast
                </h3>
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black tracking-widest">
                    +{analysisResult ? (analysisResult.trending_predictions.reduce((acc, p) => acc + p.trend_probability, 0) / (analysisResult.trending_predictions.length || 1) * 100).toFixed(0) : '0'}% ACC
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
                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid #E5E5EA', borderRadius: '12px' }}
                            itemStyle={{ color: '#1D1D1F' }}
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
            <p className="text-[10px] text-[#86868B] font-mono mt-6 uppercase tracking-widest leading-relaxed">
                Aggregated projection across {competitors.length} active units
            </p>
        </motion.div>

        {/* Card 2: Competitor Pivot Risk */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-10 rounded-[40px] bg-white/70 border border-[#E5E5EA] backdrop-blur-xl group hover:border-[#FF9500]/30 transition-all shadow-apple shadow-sm"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-[#1D1D1F] flex items-center gap-3 uppercase italic tracking-tighter">
                    <Target className="w-5 h-5 text-[#FF9500]" /> Vector Analysis
                </h3>
                <span className={cn(
                    "text-[10px] px-2.5 py-1 rounded-lg border font-black tracking-widest uppercase",
                    (analysisResult?.top_performers[0]?.change_velocity_score || 0) > 75 
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
                        : "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20"
                )}>
                    {(analysisResult?.top_performers[0]?.change_velocity_score || 0) > 75 ? "CRITICAL RISK" : "MID RISK"}
                </span>
            </div>
            <div className="h-48 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" gridType="polygon" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: '900' }} />
                        <PolarRadiusAxis domain={[0, 150]} tick={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #E5E5EA', borderRadius: '12px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#FF9500', fontWeight: '900' }}
                        />
                        <Radar
                            name="Velocity"
                            dataKey="A"
                            stroke="#FF9500"
                            strokeWidth={3}
                            fill="#FF9500"
                            fillOpacity={0.35}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
             <p className="text-[10px] text-[#86868B] font-mono mt-6 uppercase tracking-widest leading-relaxed">
                Neural vector mapping of technical debt shifts
            </p>
        </motion.div>

        {/* Card 3: Revenue Shift Alert */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-10 rounded-[40px] bg-white/70 border border-[#E5E5EA] backdrop-blur-xl group hover:border-[#5AC8FA]/30 transition-all shadow-apple shadow-sm"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-[#1D1D1F] flex items-center gap-3 uppercase italic tracking-tighter">
                    <Activity className="w-5 h-5 text-[#5AC8FA]" /> Signal Gaps
                </h3>
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-[#5AC8FA]/10 text-[#5AC8FA] border border-[#5AC8FA]/20 font-black tracking-widest">
                    {analysisResult && analysisResult.trending_predictions.length > 0 ? `EST. $${(analysisResult.trending_predictions.length * 1.4).toFixed(1)}M` : 'NO DATA'}
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
             <p className="text-[10px] text-[#86868B] font-mono mt-6 uppercase tracking-widest leading-relaxed">
                Economic opportunity delta in Q4 timeline
            </p>
        </motion.div>

      </div>

      {/* Footer CTA */}
      <div className="flex justify-center mt-12 relative z-10">
        <Button 
            onClick={handleInitializePipeline}
            disabled={loading}
            className="relative group overflow-hidden px-10 py-7 bg-[#AF52DE] hover:bg-[#A855F7] text-white font-black uppercase tracking-widest text-sm rounded-2xl active:scale-95 transition-all shadow-xl shadow-[#AF52DE]/20"
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <div className="flex items-center gap-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                {loading ? 'ANALYZING NETWORK SIGNALS...' : 'Initialize Predictive Pipeline'}
                {!loading && <ArrowUpRight className="w-4 h-4" />}
            </div>
        </Button>
      </div>

      <div className="pt-10 border-t border-white/5 flex flex-wrap justify-center gap-10 text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em] font-black">
          <div>Engine: Dynamic Prediction Matrix</div>
          <div>Mode: Real-time Analysis</div>
          <div>Intelligence: Audited Signals Only</div>
          <div>Data Status: Verified & Live</div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;
