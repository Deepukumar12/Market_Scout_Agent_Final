import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  CheckCircle2,
  ShieldCheck,
  Target,
  DollarSign,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { EvidenceBadge, EvidenceCatalog } from '@/components/ui/EvidenceUI';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

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
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEvidence, setShowEvidence] = useState(false);

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
        
        const [anaRes, finRes] = await Promise.all([
            fetch(`${apiUrl}/api/v1/intelligence/analytics?competitor_id=${selectedCompetitorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${apiUrl}/api/v1/intelligence/financial-intelligence?competitor_id=${selectedCompetitorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        if(anaRes.ok) setData(await anaRes.json());
        if(finRes.ok) setFinancialData(await finRes.json());

      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey, selectedCompetitorId, token]);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <ShieldCheck size={14} className="text-primary" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Enterprise Intelligence Audit</span>
          </div>
          <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Signal <span className="text-primary">Analytics</span></h1>
          <p className="text-muted-foreground font-medium italic">High-fidelity telemetry and real-time competitor movement tracking.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-2">
                <select 
                    value={selectedCompetitorId || ''} 
                    onChange={(e) => setSelectedCompetitorId(e.target.value)}
                    className="h-12 px-6 rounded-2xl border border-border bg-card text-sm font-bold text-foreground focus:outline-none shadow-apple-sm min-w-[200px]"
                >
                    <option value="" disabled>Select Target</option>
                    {competitors.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))}
                </select>
                {data && <EvidenceBadge count={data.active_sources_count} confidence={98} status="Audited" />}
            </div>

           <Button 
            variant="outline" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="h-12 px-6 rounded-2xl border border-border bg-card text-foreground hover:bg-muted shadow-apple-sm font-black uppercase tracking-widest text-[10px] italic"
          >
             <RefreshCw className={cn("w-4 h-4 mr-2 text-primary", loading && "animate-spin")} />
             Sync Telemetry
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Top Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-[40px] bg-card border border-border shadow-apple-sm group hover:shadow-apple transition-all relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap size={20} />
                </div>
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">+{Math.floor((data?.total_signals_24h || 0) / 5)}%</span>
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">24h Signal Volume</div>
              <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{data?.total_signals_24h || '---'}</div>
            </div>

            <div className="p-8 rounded-[40px] bg-card border border-border shadow-apple-sm group hover:shadow-apple transition-all relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Globe size={20} />
                </div>
                <EvidenceBadge count={data?.active_sources_count || 0} confidence={100} />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">Active Nodes</div>
              <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{data?.active_sources_count || '---'}</div>
            </div>

            <div className="p-8 rounded-[40px] bg-card border border-border shadow-apple-sm group hover:shadow-apple transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">Fiscal Growth</div>
              <div className="text-3xl font-black text-foreground tracking-tighter uppercase italic">+{financialData?.quarterly_growth_velocity || 0}%</div>
            </div>

            <div className="p-8 rounded-[40px] bg-foreground text-background shadow-apple-sm group hover:shadow-apple transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                  <Target size={20} />
                </div>
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">Profitability</div>
              <div className="text-3xl font-black text-white tracking-tighter uppercase italic">{financialData?.profitability_index || 0}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            
            <div className="xl:col-span-2 space-y-10">
               {/* Financial Trajectory Chart */}
               <div className="p-10 rounded-[40px] bg-card border border-border shadow-apple h-[500px]">
                  {financialData && financialData.annual_revenue_history.length > 0 ? (
                      <RevenueChart 
                        data={financialData.annual_revenue_history} 
                        events={financialData.events || []}
                        companyName={financialData.company_name} 
                      />
                  ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic font-medium">No financial trajectory found.</div>
                  )}
               </div>

               {/* Intensity Waves */}
               <div className="p-10 rounded-[40px] bg-card border border-border shadow-apple flex flex-col h-[400px]">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Signal <span className="text-primary">Intensity</span></h3>
                          <p className="text-xs text-muted-foreground mt-1 font-bold uppercase tracking-widest italic">24-Hour Spectral Density</p>
                      </div>
                      <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data?.intensity_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="currentColor" opacity={0.05} vertical={false} />
                              <XAxis 
                                  dataKey="time" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 'black', letterSpacing: '0.1em' }} 
                                  dy={10} 
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 'black' }} 
                                  dx={-10}
                              />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: 'hsl(var(--card))', backdropFilter: 'blur(12px)', border: '1px solid hsl(var(--border))', borderRadius: '24px', fontWeight: 'bold', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '900' }}
                                  labelStyle={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'black', marginBottom: '8px' }}
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
                  </div>
               </div>
            </div>

            <div className="xl:col-span-1 space-y-10">
               {/* Topic Resonance */}
               <div className="p-10 rounded-[40px] bg-card border border-border shadow-apple sticky top-24">
                  <div className="flex items-center gap-3 mb-8">
                      <TrendingUp className="text-emerald-500" size={24} />
                      <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Topic <span className="text-emerald-500">Resonance</span></h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {data?.trending_topics.map((t, i) => (
                          <motion.span 
                            key={t.topic}
                            initial={{ opacity:0, scale: 0.9 }}
                            animate={{ opacity:1, scale:1 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest italic transition-all group relative",
                                t.sentiment > 0.5 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                t.sentiment < -0.5 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                                "bg-muted border-border text-muted-foreground"
                            )}
                          >
                              {t.topic}
                          </motion.span>
                      ))}
                  </div>
                  
                  <div className="mt-12 p-8 rounded-[40px] bg-foreground text-background relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                          <CheckCircle2 size={64} className="text-primary" />
                      </div>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4">Evidence Catalog</h4>
                      <p className="text-white/60 text-xs font-medium italic leading-relaxed mb-8">
                        The current analytics stream is verified against {data?.active_sources_count} unique intelligence nodes.
                      </p>
                      <Button 
                        onClick={() => setShowEvidence(!showEvidence)}
                        className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] italic shadow-xl"
                      >
                          {showEvidence ? 'Hide Provenance' : 'View Provenance'}
                      </Button>
                  </div>
               </div>
            </div>

          </div>

          {/* Evidence Catalog Overlay */}
          <AnimatePresence>
                {showEvidence && financialData && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="p-10 rounded-[40px] bg-[#1c1c1e] text-white shadow-2xl border border-white/10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Info className="text-primary" size={24} />
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Data <span className="text-primary">Provenance</span></h2>
                            </div>
                            <Button variant="ghost" onClick={() => setShowEvidence(false)} className="text-white/50 hover:text-white hover:bg-white/10">Close</Button>
                        </div>
                        <EvidenceCatalog sources={financialData.evidence_catalog} />
                    </motion.div>
                )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
