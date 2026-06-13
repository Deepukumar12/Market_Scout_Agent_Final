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
import SevenDayReleases from '@/components/dashboard/SevenDayReleases';
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
  const { competitors, fetchCompetitors } = useCompetitorStore();
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
  const [isSending, setIsSending] = useState(false);
  const [selected7DayComp, setSelected7DayComp] = useState<string>('');

  const { user } = useAuthStore();

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  useEffect(() => {
    if (competitors.length > 0 && !selected7DayComp) {
      setSelected7DayComp(competitors[0].name);
    }
  }, [competitors, selected7DayComp]);

  const refreshAllData = useCallback(() => {
    fetchCompetitors(searchQuery);
    fetchHistory(searchQuery);
    fetchSignals(searchQuery);
    fetchActivityTimeline(searchQuery);
    fetchInnovationTrends();
    fetchGlobalMetrics();
    fetchSystemStats();
    fetchMarketComparison();
    fetchLastSevenDays(selected7DayComp || undefined);
    fetchMissionBriefing();
    fetchLatestReport();
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [fetchCompetitors, fetchHistory, fetchSignals, fetchActivityTimeline, fetchInnovationTrends, fetchGlobalMetrics, fetchMarketComparison, fetchLastSevenDays, fetchMissionBriefing, fetchLatestReport, searchQuery, selected7DayComp]);

  const handleExportIntel = () => {
    // Generate a comprehensive strategic briefing PDF report
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const html = `
      <html>
        <head>
          <title>Global Market Intelligence Briefing - ${new Date().toLocaleDateString()}</title>
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
            <div class="meta">Generated: ${new Date().toLocaleString()} | Source: ScoutForge AI Node</div>
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
                <div class="item-meta">${new Date(s.timestamp).toLocaleDateString()} | ${s.source || 'Open Web'} | ${s.sentiment || 'Neutral'}</div>
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
    date: new Date(s.timestamp).toLocaleDateString('en-IN'),
    url: s.url || "#"
  })), [signals]);

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

        {/* Latest Scan Dossier - Renders the latest live scan report */}
        {scanReport && (
           <section className="mb-12 glass-card rounded-[40px] border border-blue-500/20 bg-white dark:bg-[#0A0A0C] p-6 md:p-10 lg:p-12 shadow-apple-large space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#F0F0F3] dark:border-white/5 pb-8 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-3xl font-black text-blue-600 uppercase italic">
                       {scanReport.competitor ? scanReport.competitor[0] : '?'}
                    </div>
                    <div>
                       <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.25em] italic">Latest Scan Dossier</span>
                       <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none mt-1">
                          {scanReport.competitor}
                       </h2>
                    </div>
                 </div>
                 <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#86868B]">
                    <div className="px-4 py-2 rounded-xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white">
                       Date: {new Date(scanReport.scan_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white">
                       Scanned: {scanReport.total_sources_scanned || 0} Sources
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759]">
                       Verified: {scanReport.total_valid_updates || 0} Signals
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 {/* Financial Summary */}
                 <div className="p-6 rounded-3xl bg-[#F5F5F7]/50 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#86868B] mb-4">Financial Dossier</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Price</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.financials?.current_price ? `$${scanReport.financials.current_price}` : 'N/A'}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Change</span>
                          <span className={cn("font-bold", (scanReport.financials?.percent_change ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                             {scanReport.financials?.percent_change ? `${scanReport.financials.percent_change >= 0 ? '+' : ''}${scanReport.financials.percent_change}%` : 'N/A'}
                          </span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Revenue</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.financials?.revenue_ttm || 'N/A'}</span>
                       </div>
                    </div>
                 </div>

                 {/* GitHub Summary */}
                 <div className="p-6 rounded-3xl bg-[#F5F5F7]/50 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#86868B] mb-4">Engineering Dossier</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Active Repos</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.github?.repos?.length || 0}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Total Stars</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.github?.repos?.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0) || 0}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Primary Tech</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.github?.repos?.[0]?.language || 'N/A'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Search Visibility Summary */}
                 <div className="p-6 rounded-3xl bg-[#F5F5F7]/50 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#86868B] mb-4">Surveillance Dossier</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Search Hits</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.search_visibility?.total_results || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Exa Discoveries</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.search_visibility?.exa_discovery?.length || 0}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#86868B]">Firmography Scale</span>
                          <span className="font-bold text-[#1D1D1F] dark:text-white">{scanReport.company?.employees || 'Scaling'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter border-b border-[#F0F0F3] dark:border-white/5 pb-2">Extracted Technical Features</h3>
                 {scanReport.features && scanReport.features.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {scanReport.features.map((feature: any, i: number) => (
                          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#151518] border border-[#E5E5EA] dark:border-white/5 relative overflow-hidden flex flex-col justify-between">
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                             <div>
                                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-[#86868B] mb-2">
                                   <span>{feature.category || 'Feature'}</span>
                                   <span className="text-blue-600">Conf: {feature.confidence_score || feature.confidence || 80}%</span>
                                </div>
                                <h5 className="text-sm font-bold text-[#1D1D1F] dark:text-white mb-2 line-clamp-1">{feature.feature_title || feature.title}</h5>
                                <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed mb-4 line-clamp-3">{feature.technical_summary || feature.description}</p>
                             </div>
                             {(feature.source_url || feature.source_urls?.[0]) && (
                                <a 
                                   href={feature.source_url || feature.source_urls[0]} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                   View Source <ExternalLink size={10} />
                                </a>
                             )}
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-xs text-[#86868B] italic">No new technical features verified during this scan.</div>
                 )}
              </div>
           </section>
        )}

        {/* Global Telemetry - Real-Time Performance Gauges */}
        <section className="mb-16">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Global <span className="text-[#0071E3]">Intelligence</span></h2>
                <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em] mt-1 italic">Real-time surveillance across 50+ technical endpoints</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard 
                title="Entities Monitored" 
                value={globalMetrics?.total_competitors || 0}
                icon={Users}
                trendValue={globalMetrics?.competitors_trend || 0}
                internalLink="/dashboard/competitors"
                className="border-blue-500/10"
              />
              <StatCard 
                title="Signals Processed" 
                value={globalMetrics?.features_found || 0}
                icon={Zap}
                trendValue={globalMetrics?.features_trend || 0}
                internalLink="#live-surveillance"
                className="border-emerald-500/10"
              />
           </div>
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

           {/* Innovation Surface - Right Panel */}
           <div className="col-span-12">
              <div className="premium-card p-6 md:p-10 lg:p-12 h-full flex flex-col">
                 <div className="mb-10">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Sector <span className="text-purple-600">Pulse.</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B] mt-2 italic">Real-time Velocity Shifts</p>
                 </div>
                 
                 <div className="flex-1 space-y-10">
                    {innovationTrends?.sector_shift.slice(0, 5).map((shift: any, i: number) => (
                       <div key={shift.sector || i} className="group relative">
                          <div className="flex items-center justify-between mb-4">
                             {shift.url ? (
                                <a 
                                   href={shift.url} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-sm font-black uppercase tracking-tighter hover:text-blue-600 transition-colors italic flex items-center gap-2 group/link"
                                >
                                   {shift.sector}
                                   <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                </a>
                             ) : (
                                <div className="text-sm font-black uppercase tracking-tighter group-hover:text-blue-600 transition-colors italic">{shift.sector}</div>
                             )}
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
                    {innovationTrends?.top_innovators[0]?.url ? (
                       <a 
                          href={innovationTrends.top_innovators[0].url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-8 rounded-[32px] bg-blue-600 text-white shadow-2xl shadow-blue-600/30 group hover:scale-[1.02] transition-all"
                       >
                          <div className="space-y-1">
                             <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-70 italic">Lead Disruptor</div>
                             <div className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                {innovationTrends.top_innovators[0].name}
                                <ExternalLink className="w-4 h-4 opacity-50" />
                             </div>
                          </div>
                          <TrendingUp size={32} />
                       </a>
                    ) : (
                       <div className="flex items-center justify-between p-8 rounded-[32px] bg-blue-600 text-white shadow-2xl shadow-blue-600/30">
                          <div className="space-y-1">
                             <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-70 italic">Lead Disruptor</div>
                             <div className="text-2xl font-black uppercase italic tracking-tighter">{innovationTrends?.top_innovators[0]?.name || "ANALYZING..."}</div>
                          </div>
                          <TrendingUp size={32} />
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Last 7 Days Surveillance - Specific Competitor Pulse */}
        <section className="glass-card rounded-[40px] border border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-[#0A0A0C] p-6 md:p-10 lg:p-12 shadow-apple space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#F0F0F3] dark:border-white/5 pb-8">
              <div>
                 <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">
                   7-Day <span className="text-[#AF52DE]">Surveillance</span>
                 </h2>
                 <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em] mt-1 italic">
                   Historical telemetry scan for the selected target node
                 </p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic">Select Target:</span>
                 <select
                   value={selected7DayComp}
                   onChange={(e) => setSelected7DayComp(e.target.value)}
                   className="h-10 px-6 rounded-full border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white focus:outline-none shadow-apple-sm transition-all italic"
                 >
                   <option value="">ALL TARGETS</option>
                   {competitors.map((c: any) => (
                     <option key={c.id || c._id} value={c.name}>{c.name.toUpperCase()}</option>
                   ))}
                 </select>
              </div>
           </div>

           <SevenDayReleases 
             features={lastSevenDays} 
             title="Innovation Releases" 
             subtitle={`Technical developments logged in the last 7 days for ${selected7DayComp || 'monitored entities'}`} 
           />
        </section>

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
                               {new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
