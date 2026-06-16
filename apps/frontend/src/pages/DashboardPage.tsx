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
  Cloud,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useCompetitorStore } from '@/store/competitorStore';
import { useIntelStore } from '@/store/intelStore';
import { useAuthStore } from '@/store/authStore';
import { triggerReport } from '@/services/api';

import StatCard from '@/components/dashboard/StatCard';
import FeatureChart from '@/components/dashboard/FeatureChart';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import MissionBriefing from '@/components/dashboard/MissionBriefing';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/utils';
import { formatToIST, formatTimeToIST, formatShortDateToIST } from '@/utils/dateUtils';

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
      <div 
        className="flex items-center gap-1 text-blue-600 cursor-pointer hover:opacity-70 transition-opacity"
        onClick={() => document.getElementById('live-surveillance')?.scrollIntoView({ behavior: 'smooth' })}
      >
        Live Feed <Activity size={10} className="animate-pulse" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { competitors, selectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { 
    history, 
    signals, 
    activities, 
    innovationTrends, 
    globalMetrics,
    systemStats,
    comparisonMatrix,
    missionBriefing,
    fetchHistory, 
    fetchSignals, 
    fetchActivityTimeline, 
    fetchInnovationTrends,
    fetchGlobalMetrics,
    fetchSystemStats,
    fetchMarketComparison,
    fetchMissionBriefing,
  } = useIntelStore();
  const navigate = useNavigate();
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuthStore();

  const activeCompetitor = useMemo(() => {
    return competitors.find(c => c.id === selectedCompetitorId || c._id === selectedCompetitorId);
  }, [competitors, selectedCompetitorId]);

  const activeCompetitorName = activeCompetitor?.name || '';

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  const refreshAllData = useCallback(() => {
    fetchCompetitors(searchQuery);
    if (activeCompetitorName) {
      fetchHistory(activeCompetitorName);
      fetchSignals(activeCompetitorName);
      fetchActivityTimeline(activeCompetitorName);
      fetchInnovationTrends(activeCompetitorName);
      fetchGlobalMetrics(activeCompetitorName);
      fetchMarketComparison(activeCompetitorName);
      fetchMissionBriefing(activeCompetitorName);
    }
    fetchSystemStats();
    setLastSyncTime(formatToIST(new Date()));
  }, [fetchCompetitors, fetchHistory, fetchSignals, fetchActivityTimeline, fetchInnovationTrends, fetchGlobalMetrics, fetchMarketComparison, fetchMissionBriefing, fetchSystemStats, searchQuery, activeCompetitorName]);

  const handleExportIntel = () => {
    // Generate a comprehensive strategic briefing PDF report
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const html = `
      <html>
        <head>
          <title>Global Market Intelligence Briefing - ${formatShortDateToIST(new Date())}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1d1d1f; line-height: 1.6; }
            .header { border-bottom: 2px solid #0071e3; padding-bottom: 20px; margin-bottom: 40px; }
            h1 { margin: 0; font-size: 42px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; }
            .meta { color: #86868b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
            .section { margin-bottom: 50px; page-break-inside: avoid; }
            .section-title { font-size: 10px; font-weight: 900; color: #86868b; text-transform: uppercase; letter-spacing: 3px; border-bottom: 1px solid #e5e5ea; padding-bottom: 10px; margin-bottom: 25px; }
            .grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { padding: 25px; background: #f5f5f7; border-radius: 24px; border: 1px solid #e5e5ea; }
            .card-val { font-size: 28px; font-weight: 900; font-style: italic; color: #0071e3; }
            .card-label { font-size: 9px; font-weight: 900; color: #86868b; text-transform: uppercase; letter-spacing: 1px; }
            .list-item { padding: 15px 0; border-bottom: 1px solid #f5f5f7; }
            .item-title { font-size: 14px; font-weight: 900; text-transform: uppercase; font-style: italic; }
            .item-meta { font-size: 10px; font-weight: 700; color: #0071e3; }
            .item-summary { font-size: 13px; color: #424245; margin-top: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #0071e3; color: white; border: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; cursor: pointer; letter-spacing: 1px;">Download Briefing</button>
          </div>
          <div class="header">
            <div class="meta">Strategic Command | Operational Briefing</div>
            <h1>Global Market <span style="color: #0071e3;">Intelligence</span></h1>
            <div class="meta">Generated: ${formatToIST(new Date())} | Source: ScoutForge AI Node</div>
          </div>

          <div class="section">
            <div class="section-title">Global Performance Telemetry</div>
            <div class="grid">
              <div class="card"><div class="card-label">Entities Monitored</div><div class="card-val">${globalMetrics?.total_competitors || 0}</div></div>
              <div class="card"><div class="card-label">Signals Processed</div><div class="card-val">${globalMetrics?.features_found || 0}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Mission Briefing Summary</div>
            <div style="background: #f5f5f7; padding: 30px; border-radius: 24px;">
              <p style="font-size: 16px; font-weight: 500; font-style: italic; line-height: 1.8;">${missionBriefing?.executive_summary || 'No briefing summary available.'}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Latest Intelligence Signals</div>
            ${signals.slice(0, 10).map(s => `
              <div class="list-item">
                <div class="item-meta">${formatToIST(s.timestamp)} | ${s.source || 'Open Web'} | ${s.sentiment || 'Neutral'}</div>
                <div class="item-title">${s.summary.split(':')[0]}</div>
                <div class="item-summary">${s.summary}</div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">Top Sector Innovators</div>
            <div class="grid">
              ${innovationTrends?.top_innovators.slice(0, 3).map(i => `
                <div class="card">
                  <div class="card-label">Innovator</div>
                  <div class="card-val" style="font-size: 20px;">${i.name}</div>
                  <div class="card-label" style="margin-top: 10px;">Score: ${i.score}%</div>
                  <div class="item-summary" style="font-size: 10px; font-weight: 700;">${i.top_feature}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <script>window.onload = () => setTimeout(() => { window.print(); }, 800);</script>
        </body>
      </html>
    `;
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const handleSendReport = async () => {
    setIsSending(true);
    try {
      await triggerReport();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewOperation = () => {
    navigate('/dashboard/add-competitor');
  };

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    // Listen for manual refreshes from the modal completion
    window.addEventListener('intelligence-refresh', refreshAllData);
    
    const interval = setInterval(refreshAllData, 10000); // 10s Real-time Heartbeat
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
    date: formatToIST(s.timestamp),
    url: s.url || "#"
  })), [signals]);

  if (competitors.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] p-6 lg:p-10 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-[32px] p-8 border border-[#E5E5EA] dark:border-white/10 bg-white/80 dark:bg-[#0A0A0C]/80 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Zap size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">No Surveillance Targets</h2>
          <p className="text-sm text-[#86868B] leading-relaxed">
            Initialize your surveillance network by adding a competitor. ScoutForge AI will automatically scan and track their technical releases.
          </p>
          <Button 
            onClick={handleNewOperation}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            Add Competitor
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedCompetitorId) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] p-6 lg:p-10 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-[32px] p-8 border border-[#E5E5EA] dark:border-white/10 bg-white/80 dark:bg-[#0A0A0C]/80 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Search size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Select a Target</h2>
          <p className="text-sm text-[#86868B] leading-relaxed">
            Please select a surveillance target from the top navbar to display competitor intelligence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] -mx-4 md:-mx-10 -mt-4 md:-mt-10 selection:bg-blue-600 selection:text-white">
      <SystemStatusBar 
        stats={systemStats} 
        latency={globalMetrics?.system_latency || 0}
        lastSync={lastSyncTime} 
      />
      
      <div className="p-6 lg:p-10 space-y-12">
        {/* Header Section - The Big Tech "Identity" */}
        <header className="glass-card rounded-[24px] md:rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-[#0A0A0C] p-6 md:p-10 lg:p-12 shadow-apple flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-10">
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
              Synthesizing global market intelligence from technical sources. 
              Real-time monitoring of <span className="text-[#1D1D1F] dark:text-white font-bold">{globalMetrics?.total_competitors || 0} competitors</span> across all domains.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:gap-4 w-full lg:w-auto mt-6 lg:mt-0">
             <Button 
               variant="outline" 
               onClick={refreshAllData}
               className="h-12 lg:h-16 px-4 lg:px-10 rounded-2xl border-[#F0F0F3] dark:border-white/10 bg-white dark:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs hover:bg-[#F5F5F7] dark:hover:bg-white/10 transition-all italic flex items-center gap-2 group"
             >
                <Activity size={14} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                Recalibrate
             </Button>
             <Button 
               variant="outline" 
               onClick={handleExportIntel}
               className="h-12 lg:h-16 px-4 lg:px-10 rounded-2xl border-[#F0F0F3] dark:border-white/10 bg-white dark:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs hover:bg-[#F5F5F7] dark:hover:bg-white/10 transition-all italic"
             >
                Export Intel
             </Button>
             <Button 
               variant="outline" 
               onClick={handleSendReport}
               disabled={isSending}
               className="h-12 lg:h-16 px-4 lg:px-10 rounded-2xl border-[#F0F0F3] dark:border-white/10 bg-white dark:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs hover:bg-[#F5F5F7] dark:hover:bg-white/10 transition-all italic text-blue-600 border-blue-600/30 hover:bg-blue-50"
             >
                {isSending ? "Sending..." : "Email Report"}
             </Button>
             <Button 
               onClick={handleNewOperation}
               className="h-12 lg:h-16 px-4 lg:px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs shadow-2xl shadow-blue-600/30 active:scale-95 transition-all italic"
             >
                New Operation
             </Button>
          </div>
        </header>

        {/* Strategic Briefing - High Priority Executive Console */}
        <section className="mb-12">
           <MissionBriefing data={missionBriefing} />
        </section>


        {/* Intelligence Visualization Layer */}
        <div className="grid grid-cols-12 gap-8">
           {/* Timeline Analysis */}
           <div className="col-span-12">
              <div className="premium-card p-6 md:p-10 lg:p-12 overflow-hidden h-full">
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
        </div>


        {/* Live Surveillance Feed - Unified Operations Section */}
        <section id="live-surveillance" className="space-y-10">
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
              <div className="col-span-12">
                 <div className="premium-card p-6 md:p-10 lg:p-12 shadow-apple-large relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      <ActivityTimeline days={activities} />
                    </div>
                 </div>
              </div>


              {/* Real-time Signals Strip */}
              <div className="col-span-12">
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
                               <Globe className="w-3.5 h-3.5 text-blue-500 opacity-75 shrink-0" />
                               <span className="text-[9px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest truncate">{domain}</span>
                             </div>
                             <span className="text-[9px] font-bold text-[#A1A1A6] shrink-0 tabular-nums">
                               {formatToIST(signal.timestamp)}
                             </span>
                           </div>
                           <p className="text-[12px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                             {signal.url ? (
                               <a 
                                 href={signal.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="hover:underline decoration-blue-500/30 underline-offset-4 transition-all"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 {signal.summary}
                               </a>
                             ) : signal.summary}
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


      </div>
    </div>
  );
};

export default DashboardPage;
