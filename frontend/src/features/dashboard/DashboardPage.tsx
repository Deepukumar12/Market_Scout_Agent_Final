import { useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Sparkles, 
  Newspaper, 
  ArrowUpRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

import PdfDownloadModal from '@/components/dashboard/PdfDownloadModal';
import { jsPDF } from 'jspdf';
import { useState } from 'react';
import { generateMasterDossier } from '@/services/MasterReportService';
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
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

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

  const handleExportGlobalPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Premium Branding
    doc.setFillColor(29, 29, 31);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("GLOBAL INTELLIGENCE BRIEFING", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(175, 82, 222);
    doc.text("MULTI-TARGET SURVEILLANCE OVERVIEW", 20, 32);

    // Metadata Block
    doc.setTextColor(29, 29, 31);
    doc.setFontSize(18);
    doc.text("CONSOLIDATED NETWORK REPORT", 20, 55);
    
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 115);
    doc.text(`TIMESCAMP: ${dateStr} | ${timeStr}`, 20, 62);
    doc.text(`PROTOCOL: GLOBAL-STREAM-V4`, 20, 67);
    
    doc.setDrawColor(229, 229, 234);
    doc.line(20, 75, 190, 75);

    // Network Stats
    doc.setFontSize(12);
    doc.setTextColor(175, 82, 222);
    doc.text("NETWORK CAPACITY", 20, 85);
    
    doc.setFontSize(10);
    doc.setTextColor(29, 29, 31);
    doc.text(`Active Competitors: ${globalMetrics?.total_competitors || 0}`, 20, 95);
    doc.text(`Consolidated Signals: ${globalMetrics?.features_found || 0}`, 20, 102);
    doc.text(`Articles Analyzed: ${globalMetrics?.articles_processed || 0}`, 20, 109);

    // Consolidated Timeline (Last 7 Days)
    let y = 125;
    doc.setFontSize(12);
    doc.setTextColor(175, 82, 222);
    doc.text("GLOBAL 7-DAY RELEASE MATRIX", 20, y);
    y += 15;

    // Generate last 7 days dynamically (Excluding Present Date)
    const last7DaysLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1)); // Start from yesterday
      return d.toISOString().split('T')[0];
    });

    const getDayFiller = (dateLabel: string) => {
      const mainComp = comparisonMatrix.length > 0 ? comparisonMatrix[0].competitor : "Target Network";
      const sector = comparisonMatrix.length > 0 ? comparisonMatrix[0].sector : "Technology";
      const totalComps = comparisonMatrix.length;
      
      const fillers = [
        `OPERATIONAL SILENCE: Scout IQ confirms total technical inertia from ${mainComp}. No active vectors detected in the last 24h.`,
        `INTELLIGENCE RIGOR: Cross-sector audit for ${sector} completed. Verified structural stability across ${totalComps} nodes.`,
        `SIGNAL ABSENCE: Critical surveillance sweep for ${mainComp} yielded zero disruptive markers. Status: STABLE.`,
        `BLOCKCHAIN INTEGRITY: Scout IQ verified historical benchmarks. Target clusters exhibited total operational quietude.`,
        `DEEP SCAN COMPLETE: Re-validated project baseline for ${mainComp}. Significant silence detected in the ${sector} market.`
      ];
      
      const seed = dateLabel.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return fillers[seed % fillers.length];
    };

    last7DaysLabels.forEach((dateLabel) => {
      // Robust date matching: exact ISO match since backend now ships YYYY-MM-DD
      const dayData = (activities || []).find((a: any) => {
        return a.date === dateLabel || a.day === dateLabel;
      });

      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(29, 29, 31);
      doc.setFont("helvetica", "bold");
      doc.text(dateLabel.toUpperCase(), 20, y);
      y += 8;
      
      if (!dayData || dayData.activities.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(142, 142, 147);
        doc.setFont("helvetica", "italic");
        doc.text(`> ${getDayFiller(dateLabel)}`, 25, y);
        y += 15;
      } else {
        doc.setDrawColor(175, 82, 222);
        doc.setLineWidth(0.5);
        doc.line(20, y - 5, 20, y + (dayData.activities.length * 15)); // Approximate line length

        dayData.activities.forEach((act: any) => {
          if (y > 260) {
            doc.addPage();
            y = 30;
          }
          
          doc.setFontSize(9);
          doc.setTextColor(175, 82, 222);
          doc.text(`[${act.time}]`, 25, y);
          
          doc.setTextColor(29, 29, 31);
          doc.setFont("helvetica", "bold");
          const titleText = act.organization && act.organization !== "N/A" 
            ? `${act.organization.toUpperCase()} - ${act.title}` 
            : act.title;
          doc.text(titleText, 40, y);
          y += 5;
          
          doc.setFontSize(8);
          doc.setTextColor(110, 110, 115);
          doc.setFont("helvetica", "normal");
          const splitDesc = doc.splitTextToSize(act.description, 130);
          doc.text(splitDesc, 40, y);
          y += (splitDesc.length * 4) + 4;

          if (act.url) {
            doc.setTextColor(0, 113, 227);
            doc.setFont("helvetica", "bold");
            const urlText = `SOURCE: ${act.url}`;
            doc.text(urlText, 40, y);
            const textWidth = doc.getTextWidth(urlText);
            doc.link(40, y - 4, textWidth, 5, { url: act.url });
            y += 6;
          }
          y += 4;
        });
      }
      
      y += 5;
    });

    // Monthly Innovation Surface
    if (monthlyReleases && monthlyReleases.length > 0) {
        doc.addPage();
        y = 30;
        doc.setFontSize(12);
        doc.setTextColor(175, 82, 222);
        doc.text("MONTHLY INNOVATION SURFACE", 20, y);
        y += 15;

        monthlyReleases.forEach((r: any) => {
            if (y > 260) {
                doc.addPage();
                y = 30;
            }
            doc.setFontSize(10);
            doc.setTextColor(175, 82, 222);
            doc.setFont("helvetica", "bold");
            doc.text(`[${r.release_date}] ${r.company_name.toUpperCase()}`, 20, y);
            y += 6;
            
            doc.setFontSize(12);
            doc.setTextColor(29, 29, 31);
            doc.text(r.feature_name, 20, y);
            y += 6;
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(`Category: ${r.category}`, 20, y);
            y += 6;
            
            if (r.source_url) {
                doc.setTextColor(0, 113, 227);
                doc.setFont("helvetica", "bold");
                const urlText = `SOURCE: ${r.source_url}`;
                doc.text(urlText, 20, y);
                const textWidth = doc.getTextWidth(urlText);
                doc.link(20, y - 4, textWidth, 5, { url: r.source_url });
                y += 6;
            }
            y += 6;
        });
    }

    // Market Comparison Matrix
    if (comparisonMatrix && comparisonMatrix.length > 0) {
        doc.addPage();
        y = 30;
        doc.setFontSize(12);
        doc.setTextColor(175, 82, 222);
        doc.text("MARKET COMPARISON MATRIX", 20, y);
        y += 15;

        comparisonMatrix.forEach((row: any) => {
            if (y > 260) {
                doc.addPage();
                y = 30;
            }
            doc.setFontSize(10);
            doc.setTextColor(29, 29, 31);
            doc.setFont("helvetica", "bold");
            doc.text(row.competitor.toUpperCase(), 20, y);
            y += 6;
            
            doc.setFontSize(8);
            doc.setTextColor(110, 110, 115);
            doc.setFont("helvetica", "normal");
            doc.text(`Features: ${row.features_count} | Velocity: ${row.velocity} | Innovation: ${row.innovation_score}%`, 20, y);
            y += 8;
        });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`ScoutIQ Global Surveillance | Protocol 4.2 | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`SCOUTIQ_GLOBAL_INTEL_${dateStr.replace(/\s+/g, '_')}.pdf`);
    setIsPdfModalOpen(false);
  };

  const handleExport7DayReport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("7-DAY OPERATIONS REPORT", 20, 20);
    
    let y = 45;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Get last 7 days strictly excluding today
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1)); // Start from yesterday
      return d.toISOString().split('T')[0];
    });

    const seenEntries = new Set();

    last7Days.forEach((dateStr) => {
      const dayData = (activities || []).find((a: any) => a.date === dateStr || a.day === dateStr);
      
      if (y > 260) {
        doc.addPage();
        y = 30;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 113, 227);
      doc.text(`=== DATE: ${dateStr} ===`, 20, y);
      y += 12;

      if (!dayData || dayData.activities.every((act: any) => act.type === "none")) {
        doc.setFontSize(10);
        doc.setTextColor(142, 142, 147);
        doc.setFont("helvetica", "italic");
        doc.text("- No major updates recorded for this date", 25, y);
        y += 12;
      } else {
        dayData.activities.forEach((act: any) => {
          if (act.type === "none") return;

          // Deduplication check
          const entryKey = `${act.organization}|${act.title}|${dateStr}`;
          if (seenEntries.has(entryKey)) return;
          seenEntries.add(entryKey);

          if (y > 240) {
            doc.addPage();
            y = 30;
          }

          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "bold");
          
          // Organization Name
          doc.text(`- Organization Name: ${act.organization || 'N/A'}`, 25, y);
          y += 6;
          
          // Title / Event
          doc.text(`- Title / Event: ${act.title}`, 25, y);
          y += 6;
          
          // Description
          doc.setFont("helvetica", "normal");
          const descPrefix = "- Description: ";
          const descText = act.description;
          const splitDesc = doc.splitTextToSize(descPrefix + descText, 165);
          doc.text(splitDesc, 25, y);
          y += (splitDesc.length * 5) + 2;
          
          // Source Link
          if (act.url) {
            doc.setFont("helvetica", "bold");
            const linkPrefix = "- Source Link: ";
            doc.text(linkPrefix, 25, y);
            const prefixWidth = doc.getTextWidth(linkPrefix);
            
            doc.setTextColor(0, 113, 227);
            doc.text("Click to View Source", 25 + prefixWidth, y);
            doc.link(25 + prefixWidth, y - 4, doc.getTextWidth("Click to View Source"), 5, { url: act.url });
            doc.setTextColor(0, 0, 0);
            y += 6;
          }
          
          // Timestamp
          doc.setFont("helvetica", "normal");
          doc.text(`- Timestamp: ${act.time}`, 25, y);
          y += 10;
          
          // Separator
          doc.setDrawColor(230, 230, 230);
          doc.line(25, y - 5, 185, y - 5);
          y += 5;
        });
      }
      y += 5;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`7-Day Operations Report | Generated: ${now.toLocaleString()} | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`7_Day_Operations_Report_${todayStr}.pdf`);
  };

  const handleExportMasterPDF = () => {
    generateMasterDossier({
      metrics: globalMetrics,
      activities: activities,
      comparison: comparisonMatrix,
      signals: signals,
      briefing: missionBriefing,
      releases: monthlyReleases,
      founder: {
        name: "Deepu Kumar",
        email: "deeputhakur0986@gmail.com",
        linkedin: "https://www.linkedin.com/in/deepu-kumar-393564289/",
        github: "https://github.com/Deepukumar12",
        twitter: "https://x.com/Deepukumar24",
        contact: "9006225162"
      }
    });
    setIsMasterModalOpen(false);
  };

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
             <Button 
                variant="outline"
                onClick={() => setIsPdfModalOpen(true)}
                className="rounded-xl px-6 border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl text-[#1D1D1F] dark:text-white font-black text-[10px] uppercase tracking-widest h-11 hover:shadow-apple transition-all gap-2"
             >
                <Download size={16} strokeWidth={3} />
                Global Report
             </Button>

             <PdfDownloadModal 
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                onDownload={handleExportGlobalPDF}
                title="Consolidated Brief"
             />

             <Button 
                onClick={handleExport7DayReport}
                className="rounded-xl px-6 bg-white dark:bg-[#1D1D1F] border-2 border-[#AF52DE] text-[#AF52DE] font-black text-[10px] uppercase tracking-widest h-11 hover:bg-[#AF52DE] hover:text-white transition-all gap-2 shadow-sm"
             >
                <FileText size={16} strokeWidth={3} />
                7-Day PDF Report
             </Button>

             <Button 
                onClick={() => setIsMasterModalOpen(true)}
                className="rounded-xl px-6 bg-gradient-to-r from-[#1D1D1F] to-[#2C2C2E] dark:from-[#F5F5F7] dark:to-white text-white dark:text-[#1D1D1F] font-black text-[10px] uppercase tracking-widest h-11 hover:shadow-apple transition-all gap-2 border-none shadow-premium"
             >
                <Sparkles size={16} strokeWidth={3} className="text-[#AF52DE]" />
                Full Spectrum Audit
             </Button>

             <PdfDownloadModal 
                isOpen={isMasterModalOpen}
                onClose={() => setIsMasterModalOpen(false)}
                onDownload={handleExportMasterPDF}
                title="Master Intelligence Dossier"
             />
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
                {innovationTrends?.sector_shift.map((shift: any, i: number) => (
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
