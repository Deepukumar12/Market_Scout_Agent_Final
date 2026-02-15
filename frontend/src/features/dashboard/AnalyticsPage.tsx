
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart3, Cpu, Globe, LineChart, Shield, Zap, RefreshCw, Terminal, Layers, Radio, MapPin, Hash, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';

// --- Types ---
interface IntensityPoint { time: string; value: number; }
interface CategoryDistribution { category: string; count: number; percentage: number; }
interface SourceMetric { source: string; count: number; }
interface TopicMetric { topic: string; volume: number; sentiment: number; }
interface GeoMetric { region: string; count: number; active_node: string; }

interface SignalAnalytics {
  total_signals_24h: number;
  active_sources_count: number;
  system_load_percent: number;
  processing_latency_ms: number;
  intensity_history: IntensityPoint[];
  category_distribution: CategoryDistribution[];
  top_sources: SourceMetric[];
  trending_topics: TopicMetric[];
  geo_activity: GeoMetric[];
  recent_signals: string[];
}

const AnalyticsPage = () => {
  const { competitors, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<SignalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const fetchData = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/signal-analytics`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if(res.ok) {
              const json = await res.json();
              setData(json);
          }
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8s refresh
    return () => clearInterval(interval);
  }, [refreshKey]);

  // Accumulate logs when data updates
  useEffect(() => {
    if (data?.recent_signals) {
        setLogs(prev => {
            const newLogs = [...data.recent_signals, ...prev];
            return newLogs.slice(0, 50); // Keep last 50
        });
    }
  }, [data]);

  return (
    <div className="relative max-w-[1600px] mx-auto space-y-8 pb-20 px-4">
      
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -top-40 left-10 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 border-b border-white/5 pb-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Telemetry Stream Active
                </span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2">
                <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
                LATENCY: {data?.processing_latency_ms || '--'}ms
             </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-1 uppercase italic">
               Signal <span className="text-blue-500">Analytics</span>
            </h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
               Global Intelligence Command Center
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="hidden lg:flex items-center gap-6 mr-6">
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">24h Volume</p>
                    <p className="text-xl font-mono font-bold text-white">{data?.total_signals_24h.toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active Sources</p>
                    <p className="text-xl font-mono font-bold text-blue-400">{data?.active_sources_count}</p>
                </div>
           </div>
           
           <Button 
            variant="outline" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="h-12 w-12 p-0 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
          >
             <RefreshCw className={cn("w-4 h-4 text-blue-400", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Main Command Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative z-10">
        
        {/* LEFT COLUMN: System & Categories */}
        <div className="xl:col-span-1 space-y-6">
             {/* System Load Radial */}
            <motion.div
                layout
                className="p-6 rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Engine Load</span>
                    <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="relative py-2 flex justify-center z-10">
                     <div className="relative w-40 h-40 mx-auto">
                        <div className="absolute inset-0 rounded-full border-[8px] border-white/5" />
                        <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: Math.max(2, (100 - (data?.system_load_percent || 50)) / 5), repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-[8px] border-purple-500 border-t-transparent border-l-transparent opacity-60 blur-[1px]" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white tracking-tighter">{data?.system_load_percent || 0}%</span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Utilized</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div className="p-6 rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl">
                 <div className="flex items-center gap-2 mb-6">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Category Dist.</span>
                 </div>
                 <div className="space-y-4">
                    {data?.category_distribution.map((cat, i) => (
                        <div key={cat.category} className="group/row">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] font-bold text-slate-300 group-hover/row:text-white transition-colors">{cat.category}</span>
                                <span className="text-[9px] font-mono text-emerald-400">{cat.percentage}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cat.percentage}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                 </div>
            </motion.div>
        </div>

        {/* CENTER COLUMN: Main Viz & Topics */}
        <div className="xl:col-span-2 space-y-6">
             {/* Signal Intensity Chart */}
             <motion.div className="p-8 rounded-3xl border border-white/5 bg-[#020617]/60 backdrop-blur-xl h-[340px] flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1">Global Signal Volume</p>
                          <h3 className="text-lg font-bold text-white uppercase italic tracking-tighter">Intensity Waves (12h)</h3>
                      </div>
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    {data ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.intensity_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                <XAxis dataKey="time" stroke="#475569" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 animate-pulse">Initializing Visualization...</div>
                    )}
                  </div>
             </motion.div>

             {/* Trending Topics Cloud */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <motion.div className="p-6 rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-4">
                          <Hash className="w-4 h-4 text-amber-400" />
                          <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest">Topic Resonance</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {data?.trending_topics.map((t, i) => (
                              <motion.span 
                                key={t.topic}
                                initial={{ opacity:0, scale: 0.8 }}
                                animate={{ opacity:1, scale:1 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide cursor-default hover:scale-105 transition-transform",
                                    t.sentiment > 0.5 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                    t.sentiment < -0.5 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                    "bg-blue-500/10 border-blue-500/20 text-slate-300"
                                )}
                              >
                                  {t.topic}
                              </motion.span>
                          ))}
                      </div>
                 </motion.div>

                 {/* Top Sources */}
                 <motion.div className="p-6 rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-4">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest">Active Nodes</span>
                      </div>
                      <div className="space-y-3">
                          {data?.geo_activity.map((geo, i) => (
                              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                                      <span className="text-slate-300 font-mono group-hover:text-white">{geo.active_node}</span>
                                  </div>
                                  <span className="font-bold text-slate-500">{geo.count} Hits</span>
                              </div>
                          ))}
                      </div>
                 </motion.div>
             </div>
        </div>

        {/* RIGHT COLUMN: Live Wire */}
        <div className="xl:col-span-1 h-full">
            <motion.div className="h-full min-h-[500px] bg-[#050b1a] rounded-3xl border border-white/5 relative flex flex-col font-mono shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest animate-pulse">Live Wire</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500/20" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-1 relative custom-scrollbar bg-black/40 flex flex-col-reverse">
                    <AnimatePresence initial={false}>
                        {logs.map((sig, i) => {
                            const parts = sig.match(/\[(.*?)\] \[(.*?)\] (.*)/);
                            const latency = parts?.[1] || "0ms";
                            const level = parts?.[2] || "INFO";
                            const msg = parts?.[3] || sig;
                            
                            let color = "text-blue-400";
                            let Icon = Info;
                            if (level === 'CRITICAL') { color = "text-rose-500"; Icon = AlertTriangle; }
                            if (level === 'WARN') { color = "text-amber-400"; Icon = AlertTriangle; }
                            if (level === 'SUCCESS') { color = "text-emerald-400"; Icon = CheckCircle2; }

                            return (
                                <motion.div 
                                    key={`${i}-${sig.substring(0, 10)}`}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[10px] border-l border-white/5 pl-3 py-1.5 hover:bg-white/5 transition-colors group cursor-default shrink-0"
                                >
                                    <div className="flex items-center justify-between mb-0.5 opacity-50 text-[9px]">
                                        <div className="flex gap-2">
                                            <span>{new Date().toLocaleTimeString()}</span>
                                            <span>•</span>
                                            <span>{latency}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Icon className={cn("w-3 h-3 mt-0.5", color)} />
                                        <div className="flex flex-col">
                                            <span className={cn("font-bold uppercase tracking-wider text-[9px]", color)}>{level}</span>
                                            <span className="text-slate-300 leading-relaxed group-hover:text-white">{msg}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {!data && logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                             <RefreshCw className="w-6 h-6 animate-spin" />
                             <span className="text-xs uppercase tracking-widest">Establishing Uplink...</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
