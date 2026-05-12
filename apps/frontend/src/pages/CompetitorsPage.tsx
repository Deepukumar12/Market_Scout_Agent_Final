import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect, useState, useMemo, useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Radar, Globe2, Search, Shield, Target, ArrowUpRight, Loader2, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, getCompetitorColor } from '@/utils/utils';
import { useIntelStore } from '@/store/intelStore';
import CompetitorDetailsModal from '@/components/dashboard/CompetitorDetailsModal';
import FeatureChart from '@/components/dashboard/FeatureChart';

const CompetitorsPage = () => {
  const { searchQuery: globalSearchQuery, setSearchQuery } = useOutletContext<{ searchQuery: string, setSearchQuery: (q: string) => void }>();
  const { competitors, loading, error, fetchCompetitors, removeCompetitor } = useCompetitorStore();
  const { 
    globalMetrics, 
    comparisonMatrix, 
    innovationTrends,
    fetchGlobalMetrics, 
    fetchMarketComparison,
    fetchInnovationTrends 
  } = useIntelStore();
  
  const navigate = useNavigate();
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      fetchCompetitors(globalSearchQuery);
      fetchGlobalMetrics();
      fetchMarketComparison();
      fetchInnovationTrends();
    };

    refresh();
    window.addEventListener('intelligence-refresh', refresh);
    
    const interval = setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('intelligence-refresh', refresh);
      clearInterval(interval);
    };
  }, [fetchCompetitors, fetchGlobalMetrics, fetchMarketComparison, fetchInnovationTrends, globalSearchQuery]);

  const filteredCompetitors = useMemo(() => {
    if (!globalSearchQuery.trim()) return competitors;
    return competitors.filter(c => 
      c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      (c.url && c.url.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    );
  }, [competitors, globalSearchQuery]);

  const enrichedCompetitors = useMemo(() => {
    return filteredCompetitors.map(c => {
      const metric = comparisonMatrix.find(m => m.competitor.toLowerCase() === c.name.toLowerCase());
      return {
        ...c,
        innovation_score: metric?.innovation_score || 0,
        features_count: metric?.features_count || 0,
        velocity: metric?.velocity || 'Low',
        risk_level: metric?.risk_level || 'Low',
        sentiment: metric?.sentiment || 'Neutral'
      };
    });
  }, [filteredCompetitors, comparisonMatrix]);

  const chartData = useMemo(() => innovationTrends?.timeline || [], [innovationTrends]);
  const chartCompetitors = useMemo(() => chartData.length > 0 ? Object.keys(chartData[0].releases) : [], [chartData]);
  const formattedChartData = useMemo(() => chartData.map((d: any) => ({
    name: d.date,
    ...d.releases
  })), [chartData]);

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
      <div className="pointer-events-none absolute -top-40 -left-10 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-slow" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Network Live</span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                NODES: {competitors.length}
             </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1D1D1F] dark:text-white tracking-tighter mb-2 uppercase italic leading-tight">
               Competitor <span className="text-[#0071E3]">Universe</span>
            </h1>
            <p className="text-lg text-[#6E6E73] dark:text-[#86868B] dark:text-[#A1A1A6] max-w-2xl font-medium leading-relaxed italic">
               Master surveillance grid of all identified entities. 
               Toggle mission-critical data streams or execute deep-level technical scans.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] group-focus-within:text-[#0071E3] transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH UNIVERSE..."
              value={globalSearchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.2em] placeholder:text-[#86868B] dark:placeholder:text-[#A1A1A6] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/30 transition-all w-full backdrop-blur-3xl italic"
            />
          </div>
          <Button
            onClick={() => navigate('/dashboard/add-competitor')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 px-8 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group uppercase tracking-widest text-[10px]"
          >
            <PlusCircle className="mr-2 h-4 w-4 fill-current" />
            Deploy New Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <SummaryCard
          idx={0}
          icon={<Radar className="w-6 h-6 text-cyan-400" />}
          title="Signals Today"
          value={globalMetrics?.features_found || 0}
          description="Global activity updates"
          color="text-cyan-400"
          border="border-cyan-500/20"
        />
        <SummaryCard
          idx={1}
          icon={<Target className="w-6 h-6 text-purple-400" />}
          title="Verified Nodes"
          value={competitors.length || 0}
          description="High-confidence entities"
          color="text-purple-400"
          border="border-purple-500/20"
        />
        <SummaryCard
          idx={2}
          icon={<Zap className="w-6 h-6 text-amber-400" />}
          title="Avg Innovation"
          value={`${Math.round(enrichedCompetitors.reduce((acc, c) => acc + (c.innovation_score || 0), 0) / (enrichedCompetitors.length || 1))}%`}
          description="Universe pulse score"
          color="text-amber-400"
          border="border-amber-500/20"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between mb-8">
           <div>
              <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Innovation <span className="text-[#0071E3]">Trajectory</span></h2>
              <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em] mt-1 italic">Real-time velocity tracking across 7-day window</p>
           </div>
        </div>
        <FeatureChart data={formattedChartData} competitors={chartCompetitors} />
      </motion.div>

      <div className="rounded-[40px] border border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl overflow-hidden relative z-10 shadow-apple">
        <div className="grid grid-cols-[1fr_120px_180px_120px_100px_130px_100px] items-center px-8 py-5 border-b border-[#E5E5EA] dark:border-white/10 text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-black uppercase tracking-[0.2em]">
          <span>ENTITY IDENTIFIER</span>
          <span className="text-center">SIGNALS</span>
          <span className="text-center">INNOVATION TRAJECTORY (7D)</span>
          <span className="text-center">SCORE</span>
          <span className="text-center">STATUS</span>
          <span className="text-center">RISK LEVEL</span>
          <span className="text-right">ACTIONS</span>
        </div>

        <div className="divide-y divide-white/5">
          {enrichedCompetitors.map((c: any, idx: number) => (
            <motion.div
              key={c._id || c.id || c.name || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => {
                setSelectedCompetitor(c);
                setIsDetailsOpen(true);
              }}
              className="grid grid-cols-[1fr_120px_180px_120px_100px_130px_100px] items-center px-8 py-6 text-sm text-[#1D1D1F] dark:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center text-lg font-black text-[#0071E3] border border-[#E5E5EA] dark:border-white/10 group-hover:border-[#0071E3]/30 transition-all group-hover:bg-[#0071E3]/5 uppercase italic overflow-hidden">
                  {c.firmographics?.logo ? (
                    <img src={c.firmographics.logo} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    c.name?.[0] || '?'
                  )}
                </div>
                <div>
                  <div className="font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-white transition-colors">{c.name}</div>
                  <a 
                    href={c.url.startsWith('http') ? c.url : `https://${c.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#6E6E73] dark:text-[#86868B] dark:text-[#A1A1A6] font-mono tracking-widest uppercase mt-1 break-all hover:text-[#0071E3] transition-all flex items-center gap-1 group/url"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.url}
                    <ArrowUpRight size={8} className="opacity-0 group-hover/url:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-blue-600 italic leading-none">{c.features_count}</div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Verified</div>
              </div>
              <div className="px-4 h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(innovationTrends?.timeline || []).map(t => ({ val: t.releases[c.name] || 0 }))} margin={{ left: -30 }}>
                    <YAxis 
                      hide={false} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#86868B', fontSize: 7, fontWeight: 900 }}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      width={30}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke={getCompetitorColor(c.name)} 
                      fill={getCompetitorColor(c.name)} 
                      fillOpacity={0.1} 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <div className="flex flex-col items-center gap-1.5">
                   <div className="text-xs font-black italic text-purple-500">{c.innovation_score}%</div>
                   <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${c.innovation_score}%` }}
                        className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      />
                   </div>
                </div>
              </div>
              <div className="text-center">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                  c.status === 'Scanning' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5 animate-pulse' : 
                  c.status === 'Failed' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' :
                  'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                )}>
                  {c.status || 'Active'}
                </span>
              </div>
              <div className="text-center">
                 <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    c.risk_level === 'Critical' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' : 
                    c.risk_level === 'High' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                    c.risk_level === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                    'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                 )}>
                    {c.risk_level || 'Low'}
                 </span>
              </div>
              <div className="text-right flex justify-end">
                  <div className="flex gap-2 relative z-20">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await useIntelStore.getState().runScan(c._id || c.id);
                        } catch (err) {
                          console.error("Manual scan failed", err);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all group/zap"
                      title="Initiate Deep Scan"
                    >
                      <Zap size={12} className="group-hover/zap:fill-emerald-400 transition-all" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Target ${c.name} for termination?`)) {
                          removeCompetitor(c._id || c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                      title="Terminate Node"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
              </div>
            </motion.div>
          ))}

          {!loading && filteredCompetitors.length === 0 && (
            <div className="px-8 py-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent" />
              <div className="relative z-10 space-y-4">
                  <Shield className="w-12 h-12 text-[#E5E5EA] mx-auto" />
                  <div>
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">No Entities Detected</h3>
                    <p className="text-sm text-[#6E6E73] dark:text-[#86868B] max-w-xs mx-auto mt-2 font-medium italic">
                       {globalSearchQuery ? `Filter "${globalSearchQuery}" returned zero signal nodes.` : "The competition universe is currently empty. Deploy an agent to begin surveillance."}
                    </p>
                 </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="px-8 py-20 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Syncing Universe Telemetry...</p>
            </div>
          )}

          {error && (
            <div className="px-8 py-10 text-center">
               <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 inline-flex flex-col items-center gap-2">
                  <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Protocol Sync Failure</div>
                  <div className="text-xs text-rose-300 font-mono font-bold uppercase">{String(error)}</div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em] font-black pt-4">
          <div>Verified Secure Interface</div>
          <div>Last Global Refresh: 1.2s Ago</div>
      </div>

      <CompetitorDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        competitor={selectedCompetitor}
      />
    </div>
  );
};

const SummaryCard = ({
  icon,
  title,
  value,
  description,
  idx,
  color,
  border
}: {
  icon: JSX.Element;
  title: string;
  value: string | number;
  description: string;
  idx: number;
  color: string;
  border: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: idx * 0.1 }}
    className={cn(
        "p-10 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 border border-[#E5E5EA] dark:border-white/10 flex items-start gap-6 backdrop-blur-xl group hover:scale-[1.02] transition-all shadow-apple",
        border
    )}
  >
    <div className={cn("p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 transition-transform group-hover:rotate-6", border)}>{icon}</div>
    <div className="space-y-1">
      <p className="text-[10px] text-[#86868B] uppercase font-black tracking-[0.2em]">{title}</p>
      <div className={cn("text-3xl font-black italic tracking-tighter uppercase", color)}>{value}</div>
      <p className="text-[10px] text-[#6E6E73] font-medium italic">{description}</p>
    </div>
  </motion.div>
);

export default CompetitorsPage;

