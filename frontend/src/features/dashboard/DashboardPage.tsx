import { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Sparkles, 
  Newspaper, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCompetitorStore } from '@/store/competitorStore';
import { useIntelStore } from '@/store/intelStore';
import { useComponentLogger } from '@/hooks/useComponentLogger';

import StatCard from '@/components/dashboard/StatCard';
import FeatureChart from '@/components/dashboard/FeatureChart';
import ReportTable from '@/components/dashboard/ReportTable';
import SourceCard from '@/components/dashboard/SourceCard';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import MarketComparison from '@/components/dashboard/MarketComparison';

import MissionBriefing from '@/components/dashboard/MissionBriefing';

import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const DashboardPage = () => {
  useComponentLogger('DashboardPage');
  const { fetchCompetitors } = useCompetitorStore();
  const { 
    history, 
    signals, 
    activities, 
    silenceAnalysis,
    innovationTrends, 
    globalMetrics,
    comparisonMatrix,

    missionBriefing,
    fetchHistory, 
    fetchSignals, 
    fetchActivityTimeline, 
    fetchInnovationTrends,
    fetchGlobalMetrics,
    fetchMarketComparison,
    fetchMissionBriefing,
    fetchDashboardOverview
  } = useIntelStore();
  const navigate = useNavigate();
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  useEffect(() => {
    fetchDashboardOverview(searchQuery);
    fetchCompetitors(); // Still need to fetch competitors list for the sidebar/management
  }, [fetchDashboardOverview, fetchCompetitors, searchQuery]);

  // Global polling is now handled by DashboardLayout refreshAllData

  const chartData = innovationTrends?.timeline || [];
  const chartCompetitors = chartData.length > 0 && chartData[0]?.releases ? Object.keys(chartData[0].releases) : [];
  const formattedChartData = chartData.map((d: any) => ({
    date: d.date,
    ...d.releases
  }));


  const dashboardReports = history.slice(0, 7).map(r => ({
    id: r.id || r._id,
    company: r.company || r.competitor || 'Unknown',
    featuresFound: r.features?.length || 0,
    sources: r.total_sources_scanned || 1,
    time: r.generated_at || r.scan_date,
    status: 'Completed' as const
  }));

  const dashboardSources = signals.slice(0, 3).map(s => ({
    title: s.summary,
    source: s.source,
    date: new Date(s.timestamp).toLocaleDateString('en-IN'),
    url: s.url || "#"
  }));

  return (
    <div className="space-y-14 pb-20">
      {/* Premium Dashboard Hero */}
      <section className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-foreground p-6 md:p-12 text-background shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="px-4 py-1.5 rounded-full bg-background/10 backdrop-blur-xl border border-background/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Global Surveillance Active</span>
            </div>
            <span className="text-[10px] font-black text-background/70 uppercase tracking-widest italic">System v1.0.4 Stable</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
             className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] md:leading-[0.8] mb-6"
          >
            Welcome back, <br />
            <span className="text-primary">Commander.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80 font-medium italic max-w-lg mb-10"
          >
            Your autonomous intelligence network has processed {globalMetrics?.articles_processed || '0'} signals in the last 24 hours. No critical threats detected in your primary sector.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
             className="flex items-center gap-4"
          >
            <Button className="bg-background text-foreground hover:bg-background/90 rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest italic">
              View Detailed Audit
            </Button>
            <Button variant="outline" className="border-background/20 text-background hover:bg-background/10 rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest italic">
              Sector Analysis
            </Button>
          </motion.div>
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-50">
           <svg viewBox="0 0 400 400" className="w-full h-full text-primary/20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>
        </div>
      </section>

      {/* Strategic Mission Briefing Section */}
      <MissionBriefing data={missionBriefing} />

      {/* Platform Statistics */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] italic mb-2">7-Days Operations Pulse</h2>
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest cursor-pointer group italic">
                Detailed Analytics <ArrowUpRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Competitors Tracked" 
            value={globalMetrics?.total_competitors || 0} 
            change="Real-time" 
            trend="up" 
            icon={Users} 
            isLoading={!globalMetrics}
          />
          <StatCard 
            title="Reports Generated" 
            value={globalMetrics?.total_reports || 0} 
            change="Total" 
            trend="up" 
            icon={FileText} 
            isLoading={!globalMetrics}
          />
          <StatCard 
            title="Features Discovered" 
            value={globalMetrics?.features_found || 0} 
            change="Insights" 
            trend="up" 
            icon={Sparkles} 
            isLoading={!globalMetrics}
          />
          <StatCard 
            title="Articles Processed" 
            value={globalMetrics?.articles_processed || 0} 
            change="Database" 
            trend="up" 
            icon={Newspaper} 
            isLoading={!globalMetrics}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Feature Timeline */}
        <div className="lg:col-span-2">
          <FeatureChart data={formattedChartData} competitors={chartCompetitors} />
        </div>
        
        {/* Innovation Trends / Sector Shift */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple h-full flex flex-col">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Innovation Surface</p>
            <div className="space-y-6 flex-1">
                {innovationTrends?.sector_shift?.map((shift: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div>
                            <div className="text-xs font-black text-foreground uppercase tracking-tighter italic">{shift.sector}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{shift.velocity} Velocity</div>
                        </div>
                         <div className="text-right">
                            <div className="text-sm font-black text-green-500">+{shift.delta}%</div>
                            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden mt-1">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${shift.delta}%` }}
                                    className="h-full bg-green-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 italic">Top Disruptor</div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-black text-foreground uppercase italic">{innovationTrends?.top_innovators?.[0]?.name || 'No Disruptor Detected'}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{innovationTrends?.top_innovators?.[0]?.top_feature || 'Awaiting Technical Signals'}</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>



      {/* 7-Day Operations Pulse Unified Section */}
      <section className="mt-14 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
              7-Day Operations Pulse <span className="text-primary">– Activity Timeline</span>
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 italic">
              Real-Time Surveillance Data
            </p>
          </div>
        </div>
        
        <div className="w-full relative">
          <ActivityTimeline days={activities} silence_analysis={silenceAnalysis || undefined} />
        </div>
      </section>

      {/* Market Comparison Matrix Section */}
      <MarketComparison data={comparisonMatrix} />

      {/* Intelligence Observation Reports */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
            Intelligence <span className="text-primary">Reports</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 italic">
            {searchQuery ? `Historical surveillance records for ${searchQuery}` : "Past 7 Days Operations"}
          </p>
        </div>
        <div className="lg:col-span-3">
          <ReportTable 
            reports={dashboardReports} 
            onRowClick={(id) => navigate(`/dashboard/competitors/${id}/report`)} 
          />
        </div>
      </section>

      {/* Source Explorer */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">Source <span className="text-accent-foreground">Explorer</span></h1>
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">View All Sources</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardSources.map((source, i) => (
            <SourceCard key={i} {...source} />
          ))}
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;
