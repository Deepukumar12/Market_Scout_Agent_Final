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

import StatCard from '@/components/dashboard/StatCard';
import FeatureChart from '@/components/dashboard/FeatureChart';
import SourceCard from '@/components/dashboard/SourceCard';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import MarketComparison from '@/components/dashboard/MarketComparison';
import MissionBriefing from '@/components/dashboard/MissionBriefing';
import SevenDayReleases from '@/components/dashboard/SevenDayReleases';
import IntelligenceHub from '@/components/dashboard/IntelligenceHub';
import { cn } from '@/utils/utils';

// --- Sub-components for Big Tech feel ---

const SystemStatusBar = ({ nodes, lastSync }: { nodes: number, lastSync: string }) => (
  <div className="flex flex-wrap items-center gap-6 px-8 py-3 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border-b border-[#F0F0F3] dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-[#86868B]">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      System: <span className="text-[#1D1D1F] dark:text-white">Operational</span>
    </div>
    <div className="w-[1px] h-3 bg-[#E5E5EA] dark:bg-white/10" />
    <div className="flex items-center gap-2">
      <Cpu size={12} className="text-blue-600" />
      Nodes: <span className="text-[#1D1D1F] dark:text-white">{nodes || 0} Active</span>
    </div>
    <div className="w-[1px] h-3 bg-[#E5E5EA] dark:bg-white/10" />
    <div className="flex items-center gap-2">
      <Globe size={12} className="text-purple-600" />
      Region: <span className="text-[#1D1D1F] dark:text-white">Global Mesh</span>
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
    comparisonMatrix,
    lastSevenDays,
    missionBriefing,
    scanReport,
    fetchHistory, 
    fetchSignals, 
    fetchActivityTimeline, 
    fetchInnovationTrends,
    fetchGlobalMetrics,
    fetchMarketComparison,
    fetchLastSevenDays,
    fetchMissionBriefing
  } = useIntelStore();
  const navigate = useNavigate();
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  const refreshAllData = useCallback(() => {
    fetchCompetitors(searchQuery);
    fetchHistory(searchQuery);
    fetchSignals();
    fetchActivityTimeline(searchQuery);
    fetchInnovationTrends();
    fetchGlobalMetrics();
    fetchMarketComparison();
    fetchLastSevenDays();
    fetchMissionBriefing();
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [fetchCompetitors, fetchHistory, fetchSignals, fetchActivityTimeline, fetchInnovationTrends, fetchGlobalMetrics, fetchMarketComparison, fetchLastSevenDays, fetchMissionBriefing, searchQuery]);

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

  const dashboardSources = useMemo(() => signals.slice(0, 3).map(s => ({
    title: s.summary,
    source: s.source,
    date: new Date(s.timestamp).toLocaleDateString('en-IN'),
    url: s.url || "#"
  })), [signals]);

  return (
    <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] -mx-8 -mt-8 selection:bg-blue-600 selection:text-white">
      <SystemStatusBar nodes={globalMetrics?.total_competitors || 0} lastSync={lastSyncTime} />
      
      <div className="p-10 space-y-12">
        {/* Header Section - The Big Tech "Identity" */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#F0F0F3] dark:border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest italic">
                 Strategic Console
               </div>
               <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                 Live Feed Active
               </div>
            </div>
            <h1 className="text-6xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-none">
              Command <span className="text-blue-600">Center.</span>
            </h1>
            <p className="text-lg text-[#86868B] font-medium italic max-w-xl">
              Synthesizing global market intelligence from 5,000+ technical sources. 
              Real-time monitoring of <span className="text-[#1D1D1F] dark:text-white font-bold">{globalMetrics?.total_competitors || 0} competitors</span> across all domains.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-white/5 font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all">
                Export Intelligence
             </Button>
             <Button className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                New Operation
             </Button>
          </div>
        </header>

        {/* Strategic Overview Grid */}
        <div className="grid grid-cols-12 gap-8">
           {/* Primary Stats */}
           <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard 
                title="Global Coverage" 
                value={globalMetrics?.total_competitors || 0} 
                change="Surveillance" 
                trend="up" 
                icon={Globe} 
                className="bg-blue-600 text-white dark:bg-blue-600"
              />
              <StatCard 
                title="Technical Signals" 
                value={globalMetrics?.features_found || 0} 
                change="Innovation" 
                trend="up" 
                icon={Sparkles} 
                className="bg-white dark:bg-[#0A0A0C]"
              />
              <StatCard 
                title="Intelligence Volume" 
                value={globalMetrics?.articles_processed || 0} 
                change="Processing" 
                trend="up" 
                icon={Database} 
                className="bg-white dark:bg-[#0A0A0C]"
              />
           </div>

           {/* Mission Briefing - High Priority Executive Summary */}
           <div className="col-span-12 lg:col-span-4 h-full">
              <div className="h-full rounded-[40px] bg-[#1D1D1F] text-white p-10 relative overflow-hidden shadow-2xl group">
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Strategic Briefing</h3>
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-45 transition-transform cursor-pointer">
                          <ArrowUpRight size={16} />
                       </div>
                    </div>
                    <div className="flex-1 space-y-6">
                       <p className="text-sm font-medium leading-relaxed opacity-70">
                          {missionBriefing?.summary || "Analyzing current technical momentum across all tracked sectors. System detecting high innovation velocity in Cloud & AI domains."}
                       </p>
                       <div className="pt-6 border-t border-white/10">
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">Core Objective</div>
                          <div className="flex items-center gap-3">
                             <Shield className="text-blue-500" size={18} />
                             <span className="text-xs font-bold uppercase tracking-wider">{missionBriefing?.objective || "Technical Superiority Verification"}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 {/* Decorative Pulse Background */}
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Network size={200} strokeWidth={1} />
                 </div>
              </div>
           </div>
        </div>

        {/* Intelligence Visualization Layer */}
        <div className="grid grid-cols-12 gap-8">
           {/* Timeline Analysis */}
           <div className="col-span-12 xl:col-span-8">
              <div className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white/70 dark:bg-[#0A0A0C]/70 backdrop-blur-3xl p-10 overflow-hidden shadow-xl">
                 <div className="flex items-center justify-between mb-10">
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter italic">Innovation <span className="text-blue-600">Trajectory.</span></h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] mt-1">Cross-Sector Release Velocity</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F7] dark:bg-white/5 border border-transparent hover:border-blue-600/30 transition-all cursor-pointer">
                          <Activity size={14} className="text-blue-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest">7 Days</span>
                       </div>
                    </div>
                 </div>
                 <div className="h-[400px] w-full">
                    <FeatureChart data={formattedChartData} competitors={chartCompetitors} />
                 </div>
              </div>
           </div>

           {/* Innovation Surface - Right Panel */}
           <div className="col-span-12 xl:col-span-4 h-full">
              <div className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white/70 dark:bg-[#0A0A0C]/70 backdrop-blur-3xl p-10 h-full flex flex-col shadow-xl">
                 <div className="mb-10">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Sector <span className="text-purple-600">Pulse.</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] mt-1">Real-time Velocity Shifts</p>
                 </div>
                 
                 <div className="flex-1 space-y-8">
                    {innovationTrends?.sector_shift.slice(0, 5).map((shift: any, i: number) => (
                       <div key={i} className="group relative">
                          <div className="flex items-center justify-between mb-3">
                             <div className="text-sm font-black uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{shift.sector}</div>
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                   "text-xs font-black",
                                   shift.delta > 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                   {shift.delta > 0 ? "+" : ""}{shift.delta}%
                                </span>
                             </div>
                          </div>
                          <div className="h-1.5 w-full bg-[#F5F5F7] dark:bg-white/5 rounded-full overflow-hidden">
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

                 <div className="mt-12 pt-8 border-t border-[#F0F0F3] dark:border-white/5">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                       <div className="space-y-1">
                          <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Lead Disruptor</div>
                          <div className="text-lg font-black uppercase italic tracking-tighter">{innovationTrends?.top_innovators[0]?.name || "NVIDIA"}</div>
                       </div>
                       <TrendingUp size={24} />
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
              <div className="col-span-12 lg:col-span-9">
                 <div className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white/70 dark:bg-[#0A0A0C]/70 backdrop-blur-3xl p-10 min-h-[500px] shadow-xl">
                    <ActivityTimeline days={activities} />
                 </div>
              </div>

              {/* Real-time Signals Strip */}
              <div className="col-span-12 lg:col-span-3">
                 <div className="space-y-6">
                    {signals.slice(0, 4).map((signal, i) => (
                       <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="glass-card rounded-3xl border border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-[#0A0A0C] p-6 hover:border-blue-600/30 transition-all cursor-pointer group"
                       >
                          <div className="flex items-center gap-3 mb-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#86868B]">{signal.source}</span>
                          </div>
                          <p className="text-xs font-bold leading-relaxed line-clamp-2 mb-3 dark:text-white group-hover:text-blue-600 transition-colors">
                             {signal.summary}
                          </p>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-medium text-[#A1A1A6]">{new Date(signal.timestamp).toLocaleTimeString()}</span>
                             <ChevronRight size={14} className="text-[#E5E5EA] group-hover:text-blue-600 transition-colors" />
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Intelligence Matrix - Market Comparison */}
        <section className="pt-20 border-t border-[#F0F0F3] dark:border-white/5">
           <MarketComparison data={comparisonMatrix} />
        </section>

        {/* Global Asset Mapping - Source Explorer */}
        <section className="space-y-10">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic dark:text-white">Source <span className="text-indigo-600">Assets.</span></h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] mt-1">Verification Endpoints & Citations</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dashboardSources.map((source, i) => (
                <SourceCard key={i} {...source} />
              ))}
           </div>
        </section>

        {/* Production Verification - Bottom Intelligence Hub */}
        {scanReport && (
          <section className="pt-20 border-t border-[#F0F0F3] dark:border-white/5">
             <div className="flex items-center gap-4 mb-10">
                <Shield className="text-blue-600" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Intelligence Hub <span className="text-blue-600">Verification</span></h2>
             </div>
             <IntelligenceHub report={scanReport} />
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
