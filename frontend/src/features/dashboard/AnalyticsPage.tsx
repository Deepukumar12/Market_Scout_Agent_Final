import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  Cpu, 
  Globe, 
  RefreshCw, 
  Layers, 
  Radio, 
  ArrowUpRight,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<SignalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (!selectedCompetitorId && competitors.length > 0) {
      setSelectedCompetitorId(competitors[0].id);
    }
  }, [competitors, selectedCompetitorId, setSelectedCompetitorId]);

  const fetchData = async () => {
      if (!selectedCompetitorId) return;
      setLoading(true);
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/analytics?competitor_id=${selectedCompetitorId}`, {
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh for high-fidelity real-time feel
    return () => clearInterval(interval);
  }, [refreshKey, selectedCompetitorId]);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Signal <span className="text-[#AF52DE]">Intelligence</span></h1>
          <p className="text-[#6E6E73] dark:text-[#A1A1A6] mt-2 font-medium italic">Global telemetry and real-time competitor movement tracking.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm font-bold text-[#1D1D1F] dark:text-white focus:outline-none shadow-apple-sm"
          >
            <option value="" disabled>Select a competitor</option>
            {competitors.map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
            ))}
          </select>

           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm">
              <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase tracking-wider">Stream Active</span>
           </div>
           
           <Button 
            variant="outline" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="h-10 px-4 rounded-full border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C]"
          >
             <RefreshCw className={cn("w-4 h-4 mr-2 text-[#0071E3]", loading && "animate-spin")} />
             Sync
          </Button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#0071E3]/20 flex items-center justify-center text-[#0071E3]">
              <Zap size={20} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              (data?.total_signals_24h || 0) > 10 ? "text-[#34C759]" : "text-[#86868B] dark:text-[#A1A1A6]"
            )}>
              {(data?.total_signals_24h || 0) > 0 ? `+${Math.floor((data?.total_signals_24h || 0) / 10)}%` : 'stable'}
            </span>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">24h Signal Volume</div>
          <div className="text-3xl font-black text-[#1D1D1F] tracking-tighter uppercase italic">{data?.total_signals_24h.toLocaleString() || '---'}</div>
        </div>

        <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-[#AF52DE]/20 flex items-center justify-center text-[#AF52DE]">
              <Globe size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">Active Sources</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic">{data?.active_sources_count || '---'}</div>
        </div>

        <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-[#FF9500]/20 flex items-center justify-center text-[#FF9500]">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">Network Latency</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic">{data?.processing_latency_ms || '--'}ms</div>
        </div>

        <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#34C759]/20 flex items-center justify-center text-[#34C759]">
              <Cpu size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">System Load</div>
          <div className="text-3xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic">{data?.system_load_percent || 0}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Left: Signal History */}
        <div className="xl:col-span-2 space-y-10">
           <div className="p-10 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple flex flex-col h-[400px]">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Intensity <span className="text-[#0071E3]">Waves</span></h3>
                        <p className="text-sm text-[#86868B] dark:text-[#A1A1A6] mt-1 font-medium italic">Real-time spectral analysis of global signals</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-[#0071E3]" />
                </div>
                <div className="flex-1 w-full min-h-0">
                  {data ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.intensity_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="#E5E5EA" vertical={false} />
                              <XAxis 
                                  dataKey="time" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#86868B', fontSize: 10, fontWeight: 'bold' }} 
                                  dy={10} 
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#86868B', fontSize: 10, fontWeight: 'bold' }} 
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
                      <div className="h-full flex items-center justify-center text-[#86868B] dark:text-[#A1A1A6] animate-pulse font-medium">Initializing Visualization...</div>
                  )}
                </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Category Breakdown */}
              <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm">
                  <div className="flex items-center gap-2 mb-8">
                      <Layers className="w-5 h-5 text-[#AF52DE]" />
                      <h3 className="text-lg font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Category <span className="text-[#AF52DE]">Distribution</span></h3>
                  </div>
                  <div className="space-y-6">
                      {data?.category_distribution.map((cat, i) => (
                          <div key={cat.category} className="group">
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">{cat.category}</span>
                                  <span className="text-xs font-bold text-[#86868B] dark:text-[#A1A1A6]">{cat.percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-[#F5F5F7] dark:bg-[#3A3A3C] rounded-full overflow-hidden">
                                  <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${cat.percentage}%` }}
                                      transition={{ duration: 1, delay: i * 0.1 }}
                                      className="h-full bg-[#AF52DE] rounded-full"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Geo Activity */}
              <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                          <Radio className="w-5 h-5 text-[#0071E3]" />
                          <h3 className="text-lg font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Active <span className="text-[#0071E3]">Regions</span></h3>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {data?.geo_activity.map((geo, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7]/50 dark:bg-[#3A3A3C]/50 hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-all cursor-default group">
                              <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-[#34C759] shadow-sm" />
                                  <span className="text-sm font-bold text-[#1D1D1F] dark:text-white">{geo.active_node}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] dark:text-[#A1A1A6]">
                                  {geo.count} <ArrowUpRight size={12} />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
           </div>
        </div>

        {/* Right: Topic Resonance */}
         <div className="xl:col-span-1">
            <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple sticky top-24">
                <div className="flex items-center gap-2 mb-8">
                    <TrendingUp className="w-5 h-5 text-[#34C759]" />
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Topic <span className="text-[#34C759]">Resonance</span></h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {data?.trending_topics.map((t, i) => (
                        <motion.span 
                          key={t.topic}
                          initial={{ opacity:0, scale: 0.9 }}
                          animate={{ opacity:1, scale:1 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                              "px-5 py-2.5 rounded-full border text-xs font-bold transition-all cursor-default",
                              t.sentiment > 0.5 ? "bg-[#EBFBF0] border-[#34C759]/20 text-[#34C759]" :
                              t.sentiment < -0.5 ? "bg-[#FFF2F2] border-[#FF3B30]/20 text-[#FF3B30]" :
                              "bg-[#F5F5F7] border-[#E5E5EA] text-[#6E6E73] dark:text-[#86868B]"
                          )}
                        >
                            {t.topic}
                        </motion.span>
                    ))}
                </div>
                
                <div className="mt-12 p-8 rounded-3xl bg-[#0071E3] text-white">
                    <h4 className="text-lg font-bold mb-2 italic">Neural Insights</h4>
                    <p className="text-white/80 text-sm leading-relaxed font-medium italic">
                        {data && data.trending_topics.length > 0 
                            ? `Real-time clustering suggests a breakout in ${data.trending_topics[0].topic} across the active intelligence network.`
                            : "Awaiting sufficient signal density to generate cross-competitor neural insights."
                        }
                    </p>
                    <button className="mt-6 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                        Explore Cluster <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
