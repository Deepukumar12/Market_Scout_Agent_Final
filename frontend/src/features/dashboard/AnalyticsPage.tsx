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
      setSelectedCompetitorId(competitors[0].id || competitors[0]._id || null);
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
          <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">Signal <span className="text-primary">Intelligence</span></h1>
          <p className="text-muted-foreground mt-2 font-medium italic">Global telemetry and real-time competitor movement tracking.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-10 px-4 rounded-full border border-border bg-card text-sm font-bold text-foreground focus:outline-none shadow-apple-sm"
          >
            <option value="" disabled>Select a competitor</option>
            {competitors.map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
            ))}
          </select>

           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-apple-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Stream Active</span>
           </div>
           
           <Button 
            variant="outline" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="h-10 px-4 rounded-full border border-border bg-card text-foreground hover:bg-muted"
          >
             <RefreshCw className={cn("w-4 h-4 mr-2 text-primary", loading && "animate-spin")} />
             Sync
          </Button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap size={20} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              (data?.total_signals_24h || 0) > 10 ? "text-green-500" : "text-muted-foreground"
            )}>
              {(data?.total_signals_24h || 0) > 0 ? `+${Math.floor((data?.total_signals_24h || 0) / 10)}%` : 'stable'}
            </span>
          </div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">24h Signal Volume</div>
          <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{data?.total_signals_24h.toLocaleString() || '---'}</div>
        </div>

        <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Globe size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">Active Sources</div>
          <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{data?.active_sources_count || '---'}</div>
        </div>

        <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">Network Latency</div>
          <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{data?.processing_latency_ms || '--'}ms</div>
        </div>

        <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple-sm group hover:shadow-apple transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu size={20} />
            </div>
          </div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">System Load</div>
          <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{data?.system_load_percent || 0}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Left: Signal History */}
        <div className="xl:col-span-2 space-y-10">
           <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple flex flex-col h-[400px]">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Intensity <span className="text-primary">Waves</span></h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic">Real-time spectral analysis of global signals</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-primary" />
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
                               <CartesianGrid strokeDasharray="4 4" stroke="currentColor" opacity={0.1} vertical={false} />
                              <XAxis 
                                  dataKey="time" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 'bold' }} 
                                  dy={10} 
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 'bold' }} 
                                  dx={-10}
                              />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'blur(12px)', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '900' }}
                                  formatter={(value: any) => [`${value.toLocaleString()}`, 'Signal Volume']}
                                  labelStyle={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontSize: '10px' }}
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
                      <div className="h-full flex items-center justify-center text-muted-foreground  animate-pulse font-medium">Initializing Visualization...</div>
                  )}
                </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Category Breakdown */}
              <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple-sm">
                  <div className="flex items-center gap-2 mb-8">
                      <Layers className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-black text-foreground uppercase italic tracking-tighter">Category <span className="text-primary">Distribution</span></h3>
                  </div>
                  <div className="space-y-6">
                      {data?.category_distribution.map((cat, i) => (
                          <div key={cat.category} className="group">
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-xs font-bold text-foreground">{cat.category}</span>
                                  <span className="text-xs font-bold text-muted-foreground">{cat.percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                  <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${cat.percentage}%` }}
                                      transition={{ duration: 1, delay: i * 0.1 }}
                                      className="h-full bg-primary rounded-full"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Geo Activity */}
              <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple-sm">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                          <Radio className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-black text-foreground uppercase italic tracking-tighter">Active <span className="text-primary">Regions</span></h3>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {data?.geo_activity.map((geo, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 dark:bg-[#3A3A3C]/50 hover:bg-muted dark:hover:bg-[#3A3A3C] transition-all cursor-default group">
                              <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
                                  <span className="text-sm font-bold text-foreground ">{geo.active_node}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground ">
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
            <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border  shadow-apple sticky top-24">
                <div className="flex items-center gap-2 mb-8">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h3 className="text-xl font-black text-foreground  uppercase italic tracking-tighter">Topic <span className="text-green-500">Resonance</span></h3>
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
                              t.sentiment > 0.5 ? "bg-green-500/10 border-green-500/20 text-green-500" :
                              t.sentiment < -0.5 ? "bg-red-500/10 border-red-500/20 text-red-500" :
                              "bg-muted border-border text-muted-foreground"
                          )}
                        >
                            {t.topic}
                        </motion.span>
                    ))}
                </div>
                
                <div className="mt-12 p-8 rounded-3xl bg-primary text-white">
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
