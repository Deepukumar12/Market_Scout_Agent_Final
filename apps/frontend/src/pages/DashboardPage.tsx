import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Users, 
  Sparkles, 
  Newspaper, 
  ArrowUpRight,
  TrendingUp,
  Shield,
  Activity,
  Zap,
  Globe,
  Database,
  Cpu,
  Search,
  Lock,
  ChevronRight,
  AlertCircle,
  Network,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useCompetitorStore } from '@/store/competitorStore';
import { useIntelStore } from '@/store/intelStore';
import { useAuthStore } from '@/store/authStore';

import StatCard from '@/components/dashboard/StatCard';
import FeatureChart from '@/components/dashboard/FeatureChart';
import SourceCard from '@/components/dashboard/SourceCard';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import MarketComparison from '@/components/dashboard/MarketComparison';
import MissionBriefing from '@/components/dashboard/MissionBriefing';
import SevenDayReleases from '@/components/dashboard/SevenDayReleases';
import IntelligenceHub from '@/components/dashboard/IntelligenceHub';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/utils';

// --- Sub-components for Big Tech feel ---

const SystemStatusBar = ({ stats, latency, lastSync }: { stats: any, latency: number, lastSync: string }) => (
  <div className="flex flex-wrap items-center gap-6 px-8 py-3 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border-b border-[#F0F0F3] dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-[#86868B]">
    <div className="flex items-center gap-2">
      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stats?.status === 'Healthy' ? "bg-emerald-500" : "bg-amber-500")} />
      System: <span className="text-[#1D1D1F] dark:text-white">{stats?.status || 'Active'}</span>
    </div>
    <div className="w-[1px] h-3 bg-[#E5E5EA] dark:bg-white/10" />
    <div className="flex items-center gap-2">
      <Cpu size={12} className="text-blue-600" />
      Nodes: <span className="text-[#1D1D1F] dark:text-white">{stats?.nodes || 0} Active</span>
    </div>
    <div className="w-[1px] h-3 bg-[#E5E5EA] dark:bg-white/10" />
    <div className="flex items-center gap-2">
      <Zap size={12} className="text-amber-500" />
      Latency: <span className="text-[#1D1D1F] dark:text-white">{latency || 0}ms</span>
    </div>
    <div className="w-[1px] h-3 bg-[#E5E5EA] dark:bg-white/10" />
    <div className="flex items-center gap-2">
      <Globe size={12} className="text-purple-600" />
      Region: <span className="text-[#1D1D1F] dark:text-white">{stats?.region || 'Global'}</span>
    </div>
    <div className="ml-auto flex items-center gap-4">
      <span>Last Sync: <span className="text-[#1D1D1F] dark:text-white">{lastSync}</span></span>
      <div className="flex items-center gap-1 text-blue-600 cursor-pointer hover:opacity-70 transition-opacity">
        Live Feed <Activity size={10} className="animate-pulse" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { fetchCompetitors } = useCompetitorStore();
  const { 
    history, 
    signals, 
    activities, 
    innovationTrends, 
    globalMetrics,
    systemStats,
    comparisonMatrix,
    lastSevenDays,
    missionBriefing,
    scanReport,
    fetchHistory, 
    fetchSignals, 
    fetchActivityTimeline, 
    fetchInnovationTrends,
    fetchGlobalMetrics,
    fetchSystemStats,
    fetchMarketComparison,
    fetchLastSevenDays,
    fetchMissionBriefing,
    fetchLatestReport
  } = useIntelStore();
  const navigate = useNavigate();
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  const { user } = useAuthStore();

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  const refreshAllData = useCallback(() => {
    fetchCompetitors(searchQuery);
    fetchHistory(searchQuery);
    fetchSignals(searchQuery);
    fetchActivityTimeline(searchQuery);
    fetchInnovationTrends();
    fetchGlobalMetrics();
    fetchSystemStats();
    fetchMarketComparison();
    fetchLastSevenDays();
    fetchMissionBriefing();
    fetchLatestReport();
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [fetchCompetitors, fetchHistory, fetchSignals, fetchActivityTimeline, fetchInnovationTrends, fetchGlobalMetrics, fetchMarketComparison, fetchLastSevenDays, fetchMissionBriefing, fetchLatestReport, searchQuery]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    // Listen for manual refreshes from the modal completion
    window.addEventListener('intelligence-refresh', refreshAllData);
    
    const interval = setInterval(refreshAllData, 30000); // 30s Real-time Heartbeat
    return () => {
      window.removeEventListener('intelligence-refresh', refreshAllData);
      clearInterval(interval);
    };
  }, [refreshAllData]);

  const chartData = useMemo(() => innovationTrends?.timeline || [], [innovationTrends]);
  const chartCompetitors = useMemo(() => chartData.length > 0 ? Object.keys(chartData[0].releases) : [], [chartData]);
  const formattedChartData = useMemo(() => chartData.map((d: any) => ({
    name: d.date,
    ...d.releases
  })), [chartData]);

  const dashboardSources = useMemo(() => signals.slice(0, 9).map(s => ({
    title: s.summary,
    source: s.source,
    date: new Date(s.timestamp).toLocaleDateString('en-IN'),
    url: s.url || "#"
  })), [signals]);

  return (
    <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] -mx-8 -mt-8 selection:bg-blue-600 selection:text-white">
      <SystemStatusBar 
        stats={systemStats} 
        latency={globalMetrics?.system_latency || 0}
        lastSync={lastSyncTime} 
      />
      
      <div className="p-6 lg:p-10 space-y-12">
        {/* Header Section - The Big Tech "Identity" */}
        <header className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-[#0A0A0C] p-10 lg:p-12 shadow-apple flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6 flex-1">
            <div className="flex flex-wrap items-center gap-3">
               <div className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.25em] italic">
                 Strategic Console
               </div>
               <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.25em] italic">
                 Surveillance Active
               </div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-[0.9]">
              Welcome back, <span className="text-blue-600">{user?.full_name?.split(' ')[0] || 'Agent'}.</span>
            </h1>
            <p className="text-base lg:text-lg text-[#86868B] font-medium italic max-w-3xl leading-relaxed opacity-80">
              Strategic Console active for {user?.full_name || 'Authorized Personnel'}. 
              Synthesizing global market intelligence from {globalMetrics?.articles_processed || 0} technical sources. 
              Real-time monitoring of <span className="text-[#1D1D1F] dark:text-white font-bold">{globalMetrics?.total_competitors || 0} competitors</span> across all domains.
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
             <Button variant="outline" className="h-14 lg:h-16 px-8 lg:px-10 rounded-2xl border-[#F0F0F3] dark:border-white/10 bg-white dark:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs hover:bg-[#F5F5F7] dark:hover:bg-white/10 transition-all italic">
                Export Intel
             </Button>
             <Button className="h-14 lg:h-16 px-8 lg:px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs shadow-2xl shadow-blue-600/30 active:scale-95 transition-all italic">
                New Operation
             </Button>
          </div>
        </header>

        {/* Strategic Briefing - High Priority Executive Console */}
        <section className="mb-12">
           <MissionBriefing data={missionBriefing} />
        </section>

        {/* Global Telemetry - Real-Time Performance Gauges */}
        <section className="mb-16">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Global <span className="text-[#0071E3]">Intelligence</span></h2>
                <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em] mt-1 italic">Real-time surveillance across 50+ technical endpoints</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Global Coverage" 
                value={globalMetrics?.total_competitors || 0} 
                trendValue={globalMetrics?.competitors_trend || 0}
                icon={Globe} 
                loading={!globalMetrics}
                sourceUrl="https://exa.ai/search?q=top+market+competitors"
                showGauge={true}
              />
              <StatCard 
                title="Technical Signals" 
                value={globalMetrics?.features_found || 0} 
                trendValue={globalMetrics?.features_trend || 0}
                icon={Sparkles} 
                loading={!globalMetrics}
                sourceUrl="https://github.com/trending"
                showGauge={true}
              />
              <StatCard 
                title="Intelligence Volume" 
                value={globalMetrics?.articles_processed || 0} 
                trendValue={globalMetrics?.articles_trend || 0}
                icon={Database} 
                loading={!globalMetrics}
                sourceUrl="https://news.google.com"
                showGauge={true}
              />
           </div>
        </section>

           {/* 7-Day Innovation Pulse - High Priority Visibility */}
           <div className="col-span-12">
             <AnimatePresence>
               {lastSevenDays && lastSevenDays.length > 0 && (
                 <motion.section 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-[#0A0A0C] p-10 lg:p-12 shadow-apple"
                 >
                   <div className="max-h-[520px] overflow-y-auto custom-scrollbar pr-2">
                     <SevenDayReleases features={lastSevenDays} />
                   </div>
                 </motion.section>
               )}
             </AnimatePresence>
           </div>

        {/* Intelligence Visualization Layer */}
        <div className="grid grid-cols-12 gap-8">
           {/* Timeline Analysis */}
           <div className="col-span-12 xl:col-span-8">
              <div className="premium-card p-10 lg:p-12 overflow-hidden h-full">
                 <div className="flex items-center justify-between mb-10">
                    <div>
                       <h3 className="text-3xl font-black uppercase tracking-tighter italic">Innovation <span className="text-blue-600">Trajectory.</span></h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2 italic">Cross-Sector Release Velocity Analysis</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 hover:border-blue-600/30 transition-all cursor-pointer shadow-apple-sm">
                          <Activity size={14} className="text-blue-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest italic">7-Day surveillance</span>
                       </div>
                    </div>
                 </div>
                 <div className="h-[450px] w-full">
                    <FeatureChart data={formattedChartData} competitors={chartCompetitors} />
                 </div>
              </div>
           </div>

           {/* Innovation Surface - Right Panel */}
           <div className="col-span-12 xl:col-span-4">
              <div className="premium-card p-10 lg:p-12 h-full flex flex-col">
                 <div className="mb-10">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Sector <span className="text-purple-600">Pulse.</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2 italic">Real-time Velocity Shifts</p>
                 </div>
                 
                 <div className="flex-1 space-y-10">
                    {innovationTrends?.sector_shift.slice(0, 5).map((shift: any, i: number) => (
                       <div key={shift.sector || i} className="group relative">
                          <div className="flex items-center justify-between mb-4">
                             <div className="text-sm font-black uppercase tracking-tighter group-hover:text-blue-600 transition-colors italic">{shift.sector}</div>
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                   shift.delta > 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}>
                                   {shift.delta > 0 ? "+" : ""}{shift.delta}%
                                </span>
                             </div>
                          </div>
                          <div className="h-2 w-full bg-[#F5F5F7] dark:bg-white/5 rounded-full overflow-hidden shadow-inner-apple">
                             <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${Math.min(100, 40 + shift.delta)}%` }}
                                className={cn(
                                   "h-full rounded-full shadow-lg transition-all",
                                   shift.delta > 0 ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                                )}
                             />
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="mt-12 pt-10 border-t border-[#F0F0F3] dark:border-white/5">
                    <div className="flex items-center justify-between p-8 rounded-[32px] bg-blue-600 text-white shadow-2xl shadow-blue-600/30">
                       <div className="space-y-1">
                          <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-70 italic">Lead Disruptor</div>
                          <div className="text-2xl font-black uppercase italic tracking-tighter">{innovationTrends?.top_innovators[0]?.name || "NVIDIA"}</div>
                       </div>
                       <TrendingUp size={32} />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Live Surveillance Feed - Unified Operations Section */}
        <section className="space-y-10">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic dark:text-white">Live <span className="text-emerald-500">Surveillance.</span></h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] mt-1">Operational Activity Timeline & Signals</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868B]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Real-time
                 </div>
                 <div className="w-[1px] h-4 bg-[#F0F0F3] dark:border-white/5" />
                 <div className="text-blue-600 font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:opacity-70 transition-opacity">
                    View Full Logs
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-12 gap-8">
              {/* Activity Timeline */}
              <div className="col-span-12 lg:col-span-8">
                 <div className="premium-card p-10 lg:p-12 shadow-apple-large relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      <ActivityTimeline days={activities} />
                    </div>
                 </div>
              </div>


              {/* Real-time Signals Strip */}
              <div className="col-span-12 lg:col-span-4">
                 <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-1 space-y-3">
                    {signals.slice(0, 8).map((signal, i) => {
                       const domain = (() => {
                         try { return new URL(signal.url || signal.source || '').hostname.replace('www.', ''); }
                         catch { return signal.source || 'Signal'; }
                       })();
                       return (
                         <motion.div
                           key={signal.id || i}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           className="group flex flex-col gap-2.5 p-5 rounded-[20px] bg-white dark:bg-[#0A0A0C] border border-[#E5E5EA] dark:border-white/10 hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                         >
                           <div className="absolute left-0 top-0 w-[3px] h-full bg-blue-600 rounded-l-[20px] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-200" />
                           <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2 min-w-0">
                               <img
                                 src={`https://www.google.com/s2/favicons?sz=16&domain=${domain}`}
                                 alt=""
                                 className="w-3.5 h-3.5 rounded-sm shrink-0 opacity-75"
                                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                               />
                               <span className="text-[9px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest truncate">{domain}</span>
                             </div>
                             <span className="text-[9px] font-bold text-[#A1A1A6] shrink-0 tabular-nums">
                               {new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           </div>
                           <p className="text-[12px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                             {signal.summary}
                           </p>
                           {signal.url && (
                             <a
                               href={signal.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               onClick={(e) => e.stopPropagation()}
                               className="self-start flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                             >
                               Open Signal <ChevronRight size={10} />
                             </a>
                           )}
                         </motion.div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </section>

        {/* Intelligence Matrix - Market Comparison */}
        <section className="pt-20 border-t border-[#F0F0F3] dark:border-white/5">
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic dark:text-white leading-none">Intelligence <span className="text-blue-600">Matrix.</span></h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] mt-2 italic opacity-60">Comparative Analytics & Sector Dominance</p>
              </div>
           </div>
           {comparisonMatrix && comparisonMatrix.length > 0 ? (
             <div className="max-h-[540px] overflow-y-auto custom-scrollbar pr-2 rounded-[32px]">
               <MarketComparison data={comparisonMatrix} />
             </div>
           ) : (
             <div className="p-20 rounded-[40px] bg-white/50 dark:bg-white/5 border border-dashed border-[#E5E5EA] dark:border-white/10 text-center">
               <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic mb-2">Awaiting Sector Intelligence</p>
               <p className="text-xs font-medium text-[#6E6E73] italic">Execute a system-wide scan to populate the comparison matrix.</p>
             </div>
           )}
        </section>


        {/* Global Asset Mapping - Source Explorer */}
        <section className="space-y-10">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic dark:text-white">Source <span className="text-indigo-600">Assets.</span></h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] mt-1">Verification Endpoints & Citations</p>
              </div>
              <Button variant="outline" className="rounded-full h-10 px-6 border-[#E5E5EA] dark:border-white/10 text-[10px] font-black uppercase tracking-widest italic">
                 View All Signals
              </Button>
           </div>
           
           
           <div className="max-h-[640px] overflow-y-auto custom-scrollbar pr-2 rounded-[32px]">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {signals.length > 0 ? (
                  signals.slice(0, 12).map((source, i) => (
                    <SourceCard 
                     key={source.id || i} 
                     title={source.summary}
                     source={source.source}
                     date={new Date(source.timestamp).toLocaleDateString('en-IN')}
                     url={source.url || "#"}
                    />
                  ))
                ) : (
                  [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-[32px]" />)
                )}
             </div>
           </div>
        </section>

        {/* Production Verification - Bottom Intelligence Hub */}
        <section className="pt-20 border-t border-[#F0F0F3] dark:border-white/5">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <Shield className="text-blue-600" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Intelligence Hub <span className="text-blue-600">Verification</span></h2>
              </div>
              {!scanReport && (
                 <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                   System Standby
                 </div>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {scanReport ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <IntelligenceHub report={scanReport} />
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-3xl p-20 flex flex-col items-center justify-center text-center"
                >
                  <Cloud className="text-[#86868B] mb-6 animate-bounce" size={48} />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Awaiting Intelligence Scan</h3>
                  <p className="text-[#86868B] text-sm font-medium max-w-md">
                    Run a "New Operation" to generate a high-fidelity intelligence report and verify technical signals in real-time.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
