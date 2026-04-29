import { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Sparkles, 
  Newspaper, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCompetitorStore } from '@/store/competitorStore';
import { useIntelStore } from '@/store/intelStore';

import StatCard from '@/components/dashboard/StatCard';
import FeatureChart from '@/components/dashboard/FeatureChart';
import ReportTable from '@/components/dashboard/ReportTable';
import SourceCard from '@/components/dashboard/SourceCard';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import MarketComparison from '@/components/dashboard/MarketComparison';
import MonthlyFeatures from '@/components/dashboard/MonthlyFeatures';
import MissionBriefing from '@/components/dashboard/MissionBriefing';

import { useOutletContext } from 'react-router-dom';

const DashboardPage = () => {
  const { fetchCompetitors } = useCompetitorStore();
  const { 
    history, 
    signals, 
    activities, 
    innovationTrends, 
    globalMetrics,
    comparisonMatrix,
    monthlyReleases,
    missionBriefing,
    fetchHistory, 
    fetchSignals, 
    fetchActivityTimeline, 
    fetchInnovationTrends,
    fetchGlobalMetrics,
    fetchMarketComparison,
    fetchMonthlyReleases,
    fetchMissionBriefing
  } = useIntelStore();
  const navigate = useNavigate();
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  useEffect(() => {
    fetchCompetitors(searchQuery);
    fetchHistory(searchQuery);
    fetchSignals(); // Signals stream is global
    fetchActivityTimeline(searchQuery);
    fetchInnovationTrends();
    fetchGlobalMetrics();
    fetchMarketComparison();
    fetchMonthlyReleases();
    fetchMissionBriefing();
  }, [fetchCompetitors, fetchHistory, fetchSignals, fetchActivityTimeline, fetchInnovationTrends, fetchGlobalMetrics, fetchMarketComparison, fetchMonthlyReleases, fetchMissionBriefing, searchQuery]);

  // Polling for real-time updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivityTimeline(searchQuery);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchActivityTimeline, searchQuery]);

  const chartData = innovationTrends?.timeline || [];
  const chartCompetitors = chartData.length > 0 ? Object.keys(chartData[0].releases) : [];
  const formattedChartData = chartData.map((d: any) => ({
    name: d.date,
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
      {/* Strategic Mission Briefing Section */}
      <MissionBriefing data={missionBriefing} />

      {/* Platform Statistics */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-sm font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic mb-2">7-Days Operations Pulse</h2>
            <div className="flex items-center gap-2 text-[#0071E3] text-[10px] font-black uppercase tracking-widest cursor-pointer group italic">
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
          />
          <StatCard 
            title="Reports Generated" 
            value={globalMetrics?.total_reports || 0} 
            change="Total" 
            trend="up" 
            icon={FileText} 
          />
          <StatCard 
            title="Features Discovered" 
            value={globalMetrics?.features_found || 0} 
            change="Insights" 
            trend="up" 
            icon={Sparkles} 
          />
          <StatCard 
            title="Articles Processed" 
            value={globalMetrics?.articles_processed || 0} 
            change="Database" 
            trend="up" 
            icon={Newspaper} 
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
          <div className="p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple h-full flex flex-col">
            <p className="text-[#86868B] dark:text-[#A1A1A6] text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Innovation Surface</p>
            <div className="space-y-6 flex-1">
                {innovationTrends?.sector_shift?.map((shift: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div>
                            <div className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">{shift.sector}</div>
                            <div className="text-[10px] font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest">{shift.velocity} Velocity</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-[#34C759]">+{shift.delta}%</div>
                            <div className="w-12 h-1 bg-[#F5F5F7] dark:bg-[#3A3A3C] rounded-full overflow-hidden mt-1">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${shift.delta}%` }}
                                    className="h-full bg-[#34C759] rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#E5E5EA] dark:border-white/10">
                <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest mb-3 italic">Top Disruptor</div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#0071E3]/20 flex items-center justify-center text-[#0071E3]">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase italic">{innovationTrends?.top_innovators[0]?.name}</div>
                        <div className="text-[10px] font-bold text-[#86868B] uppercase">{innovationTrends?.top_innovators[0]?.top_feature}</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Features Releases Section */}
      <MonthlyFeatures 
        features={monthlyReleases} 
        title="Monthly Innovation Surface" 
        subtitle="Last 30 Days Technical Updates"
      />

      {/* 7-Day Operations Pulse Unified Section */}
      <section className="mt-14 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">
              7-Day Operations Pulse <span className="text-[#0071E3]">– Activity Timeline</span>
            </h1>
            <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mt-1 italic">
              Real-Time Surveillance Data
            </p>
          </div>
        </div>
        
        <div className="w-full relative">
          <ActivityTimeline days={activities} />
        </div>
      </section>

      {/* Market Comparison Matrix Section */}
      <MarketComparison data={comparisonMatrix} />

      {/* Intelligence Observation Reports */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">
            Intelligence <span className="text-[#0071E3]">Reports</span>
          </h1>
          <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">
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
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Source <span className="text-[#AF52DE]">Explorer</span></h1>
          <h4 className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest italic">View All Sources</h4>
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
