import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  Cpu, 
  Globe, 
  RotateCw, 
  Layers, 
  Radio, 
  ArrowUpRight,
  TrendingUp,
  Zap,
  ExternalLink,
  Shield,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { getSignalAnalytics, runCompetitorScan } from '@/services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatTimeToIST } from '@/utils/dateUtils';

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
}

const AnalyticsPage = () => {
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<SignalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  const fetchData = useCallback(async (forceScan = false) => {
      if (!selectedCompetitorId || selectedCompetitorId === 'null') return;
      setLoading(true);
      try {
          if (forceScan) {
            // Trigger a real-time AI scan before fetching analytics
            await runCompetitorScan(selectedCompetitorId);
          }
          const json = await getSignalAnalytics(selectedCompetitorId);
          setData(json);
          setLastSyncTime(formatTimeToIST(new Date()));
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  }, [selectedCompetitorId]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (competitors.length > 0 && !selectedCompetitorId) {
      setSelectedCompetitorId(competitors[0].id || null);
    }
  }, [competitors, selectedCompetitorId, setSelectedCompetitorId]);

  useEffect(() => {
    const onRefresh = () => { fetchData(); };
    fetchData();
    
    // Listen for manual refreshes from the modal completion or websocket
    window.addEventListener('intelligence-refresh', onRefresh);
    
    const interval = setInterval(() => { fetchData(); }, 30000); 
    return () => {
      window.removeEventListener('intelligence-refresh', onRefresh);
      clearInterval(interval);
    };
  }, [fetchData]);

  const activeComp = competitors.find(c => c.id === selectedCompetitorId);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Signal <span className="text-[#AF52DE]">Intelligence.</span></h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] dark:text-[#A1A1A6] mt-2 italic">Global telemetry and real-time competitor movement tracking.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-12 px-6 rounded-2xl border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1D1D1F] text-sm font-black uppercase italic text-[#1D1D1F] dark:text-white focus:outline-none shadow-apple-sm transition-all"
          >
            <option value="" disabled>Select a competitor</option>
            {competitors.filter(c => c.name.toLowerCase().includes(globalSearchQuery.toLowerCase())).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

           <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm">
              <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-[9px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-widest italic">Stream Active</span>
           </div>
           
           <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            disabled={loading}
            className="h-12 px-6 rounded-2xl border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1D1D1F] text-[#1D1D1F] dark:text-white font-black uppercase tracking-widest text-[10px] italic flex items-center gap-2 group shadow-apple-sm"
          >
             <RotateCw className={cn("w-3.5 h-3.5 text-blue-600 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
             Recalibrate
          </Button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[40px] bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group cursor-pointer hover:border-blue-500/30 transition-all"
          onClick={() => document.getElementById('intensity-waves')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
              (data?.total_signals_24h || 0) > 0 ? "text-[#34C759]" : "text-[#86868B] dark:text-[#A1A1A6]"
            )}>
              {(data?.total_signals_24h || 0) > 0 ? <><ArrowUpRight size={10} /> {Math.floor((data?.total_signals_24h || 0) / 10)}%</> : 'stable'}
            </span>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">24h Signal Volume</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
            {data?.total_signals_24h.toLocaleString() || '0'}
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[40px] bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group cursor-pointer hover:border-purple-500/30 transition-all"
          onClick={() => {
            const query = activeComp?.name || "Competitor";
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}+latest+features+news`, '_blank');
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-600/10 flex items-center justify-center text-purple-600 border border-purple-600/20 group-hover:scale-110 transition-transform">
              <Globe size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">Active Sources</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
            {data?.active_sources_count || '---'}
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-[40px] bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group cursor-pointer hover:border-orange-500/30 transition-all"
          onClick={() => document.getElementById('active-regions')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-600/10 flex items-center justify-center text-orange-600 border border-orange-600/20 group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">Network Latency</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
            {data?.processing_latency_ms || '--'}MS
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 rounded-[40px] bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group cursor-pointer hover:border-emerald-500/30 transition-all"
          onClick={() => document.getElementById('category-distribution')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20 group-hover:scale-110 transition-transform">
              <Cpu size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">System Load</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
            {data?.system_load_percent || 0}%
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Left: Signal History */}
        <div className="xl:col-span-2 space-y-10">
            <div id="intensity-waves" className="p-10 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple flex flex-col h-[400px] group/waves">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Intensity <span className="text-blue-600">Waves.</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] dark:text-[#A1A1A6] mt-1 italic">Real-time spectral analysis of global signals</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+technical+announcements+signals`, '_blank')}
                        variant="outline"
                        className="h-9 px-4 rounded-xl border-blue-600/20 text-blue-600 text-[9px] font-black uppercase tracking-widest italic opacity-0 group-hover/waves:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white"
                      >
                         Verify History <ExternalLink size={10} className="ml-2" />
                      </Button>
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                  {data && data.intensity_history.some(h => h.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.intensity_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="currentColor" opacity={0.1} vertical={false} />
                              <XAxis 
                                  dataKey="time" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 'bold' }} 
                                  className="text-[#86868B] dark:text-[#A1A1A6]"
                                  dy={10} 
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 'bold' }} 
                                  className="text-[#86868B] dark:text-[#A1A1A6]"
                                  dx={-10}
                              />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #E5E5EA', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                                  itemStyle={{ color: '#0071E3', fontWeight: '900' }}
                                  formatter={(value: any) => [`${value.toLocaleString()}`, 'Signal Volume']}
                                  labelStyle={{ color: '#86868B', textTransform: 'uppercase', fontSize: '10px' }}
                              />
                              <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#0071E3" 
                                  strokeWidth={4} 
                                  fillOpacity={1} 
                                  fill="url(#colorVal)" 
                                  activeDot={{ r: 6, stroke: '#0071E3', strokeWidth: 3, fill: '#ffffff' }}
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic mb-4">Verifying Signal History Density</p>
                          <Button 
                            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+latest+technical+updates`, '_blank')}
                            variant="outline" 
                            className="h-10 px-6 rounded-2xl border-blue-500/20 bg-blue-500/5 text-blue-600 text-[9px] font-black uppercase tracking-widest italic hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Audit Raw Signals <ArrowUpRight size={12} className="ml-2" />
                          </Button>
                      </div>
                  )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Category Breakdown */}
               <div id="category-distribution" className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group/cat">
                   <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-2">
                           <Layers className="w-5 h-5 text-purple-600" />
                           <h3 className="text-lg font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Category <span className="text-purple-600">Distribution.</span></h3>
                       </div>
                       <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+technical+features+architecture`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-purple-500/10 text-purple-600 opacity-0 group-hover/cat:opacity-100 transition-opacity hover:bg-purple-500 hover:text-white"
                       >
                          <ExternalLink size={14} />
                       </a>
                   </div>
                   <div className="space-y-6">
                       {data && data.category_distribution.length > 0 ? (
                           data.category_distribution.map((cat, i) => (
                               <div key={cat.category} className="group cursor-default">
                                   <div className="flex justify-between items-end mb-2">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white italic">{cat.category}</span>
                                       <span className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] tabular-nums">{cat.percentage}%</span>
                                   </div>
                                   <div className="h-1.5 w-full bg-[#F5F5F7] dark:bg-white/5 rounded-full overflow-hidden">
                                       <motion.div 
                                           initial={{ width: 0 }}
                                           animate={{ width: `${cat.percentage}%` }}
                                           transition={{ duration: 1, delay: i * 0.1 }}
                                           className="h-full bg-purple-600 rounded-full shadow-lg"
                                       />
                                   </div>
                               </div>
                           ))
                       ) : (
                           <div className="py-10 text-center">
                               <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic mb-4">Verifying Technical Vectors</p>
                               <Button 
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+product+categories+features`, '_blank')}
                                variant="outline" 
                                className="h-10 px-6 rounded-2xl border-purple-500/20 bg-purple-500/5 text-purple-600 text-[9px] font-black uppercase tracking-widest italic hover:bg-purple-500 hover:text-white transition-all"
                               >
                                  Verify Categories <ArrowUpRight size={12} className="ml-2" />
                               </Button>
                           </div>
                       )}
                   </div>
               </div>

               {/* Geo Activity */}
               <div id="active-regions" className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group/geo">
                   <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-2">
                           <Radio className="w-5 h-5 text-blue-600" />
                           <h3 className="text-lg font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Active <span className="text-blue-600">Regions.</span></h3>
                       </div>
                       <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+global+office+locations+hq`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-600 opacity-0 group-hover/geo:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white"
                       >
                          <ExternalLink size={14} />
                       </a>
                   </div>
                   <div className="space-y-3">
                       {data && data.geo_activity.length > 0 ? (
                           data.geo_activity.map((geo, i) => (
                               <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7]/50 dark:bg-white/5 border border-transparent hover:border-blue-600/20 hover:bg-white dark:hover:bg-white/10 transition-all cursor-default group">
                                   <div className="flex items-center gap-3">
                                       <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.4)]" />
                                       <span className="text-[11px] font-black uppercase italic text-[#1D1D1F] dark:text-white">{geo.active_node}</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] tabular-nums">
                                       {geo.count} <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                   </div>
                               </div>
                           ))
                       ) : (
                           <div className="py-10 text-center">
                               <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic mb-4">Scanning Global Presence</p>
                               <Button 
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+global+footprint+regions`, '_blank')}
                                variant="outline" 
                                className="h-10 px-6 rounded-2xl border-blue-500/20 bg-blue-500/5 text-blue-600 text-[9px] font-black uppercase tracking-widest italic hover:bg-blue-500 hover:text-white transition-all"
                               >
                                  Verify Presence <ArrowUpRight size={12} className="ml-2" />
                               </Button>
                           </div>
                       )}
                   </div>
               </div>
            </div>
        </div>

        {/* Right: Topic Resonance */}
         <div className="xl:col-span-1">
            <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large sticky top-24 transition-all duration-500 group/sidebar">
                <div className="flex items-center gap-3 mb-10">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Topic <span className="text-emerald-500">Resonance.</span></h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {data?.trending_topics.map((t, i) => (
                        <motion.span 
                          key={t.topic}
                          initial={{ opacity:0, scale: 0.9 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                              "px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer italic hover:scale-105",
                              t.sentiment > 0.5 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                              t.sentiment < -0.5 ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400" :
                              "bg-[#F5F5F7] dark:bg-white/5 border-[#E5E5EA] dark:border-white/10 text-[#6E6E73] dark:text-[#86868B]"
                          )}
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activeComp?.name || '')}+${encodeURIComponent(t.topic)}`, '_blank')}
                        >
                            {t.topic}
                        </motion.span>
                    ))}
                </div>
                
                <div 
                  className="mt-12 p-10 rounded-[40px] bg-blue-600 dark:bg-white text-white dark:text-black relative overflow-hidden shadow-2xl shadow-blue-600/30 group/insights cursor-pointer hover:scale-[1.02] transition-all active:scale-95"
                  onClick={() => {
                    const topTopic = data?.trending_topics?.[0]?.topic || "market+trends";
                    const query = `${activeComp?.name || 'Competitor'}+${topTopic}+analysis`;
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                  }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 dark:bg-black/5 blur-3xl rounded-full -mr-16 -mt-16 animate-pulse" />
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-5 h-5 opacity-70" />
                      <h4 className="text-lg font-black italic uppercase tracking-tighter relative z-10">Neural Insights</h4>
                    </div>
                    <p className="text-white/80 dark:text-black/70 text-xs leading-relaxed font-black uppercase italic relative z-10 tracking-tight">
                        {data && data.trending_topics.length > 0 
                            ? `Real-time clustering suggests a breakout in ${data.trending_topics[0].topic} across the active intelligence network.`
                            : "Awaiting sufficient signal density to generate cross-competitor neural insights. Verify cluster data."
                        }
                    </p>
                    <div className="mt-8 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 group-hover/insights:gap-5 transition-all relative z-10 italic">
                        Explore Cluster <ArrowUpRight size={14} strokeWidth={3} />
                    </div>
                </div>

                <div className="mt-8 text-center">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#86868B] italic">Last Synchronized: <span className="text-blue-600">{lastSyncTime}</span></p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
