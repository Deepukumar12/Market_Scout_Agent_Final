import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntelStore, ScanFeature } from '@/store/intelStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ShieldCheck, 
  ExternalLink, 
  Zap, 
  Layers, 
  Cpu, 
  Globe, 
  Code,
  LineChart,
  TrendingUp,
  Activity,
  Download,
  Calendar,
  Search
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { jsPDF } from 'jspdf';

const getCategoryStyles = (category: string) => {
  switch (category.toUpperCase()) {
    case 'API': return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20', icon: <Code size={14} /> };
    case 'UI': return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', icon: <Layers size={14} /> };
    case 'AI': return { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-100 dark:border-cyan-500/20', icon: <Zap size={14} /> };
    case 'INFRASTRUCTURE': return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20', icon: <Cpu size={14} /> };
    case 'PLATFORM': return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', icon: <Globe size={14} /> };
    default: return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10', border: 'border-gray-100 dark:border-gray-500/20', icon: <LineChart size={14} /> };
  }
};

import ActivityTimeline from '@/components/dashboard/ActivityTimeline';

import PdfDownloadModal from '@/components/dashboard/PdfDownloadModal';
import { useState } from 'react';

const IntelligenceReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { scanReport, activities, loading, error, runScan, fetchActivityTimeline, clear } = useIntelStore();
  const { competitors, fetchCompetitors } = useCompetitorStore();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const competitor = competitors.find((c: any) => String(c._id || c.id) === id);

  useEffect(() => {
    if (!competitor) {
      fetchCompetitors();
    }
  }, [competitor, fetchCompetitors]);

  useEffect(() => {
    if (id) {
      runScan(id);
    }
    return () => {
      clear();
    };
  }, [id, runScan, clear]);

  useEffect(() => {
    if (competitor && competitor.name) {
      fetchActivityTimeline(competitor.name);
    }
  }, [competitor, fetchActivityTimeline]);

  const handleExportPDF = () => {
    if (!scanReport) return;

    const doc = new jsPDF();
    const displayName = scanReport?.competitor || competitor?.name || 'Competitor';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Premium Branding
    doc.setFillColor(29, 29, 31);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("INTELLIGENCE BRIEFING", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 113, 227);
    doc.text("CONFIDENTIAL SECTOR SURVEILLANCE", 20, 32);

    // Metadata Block
    doc.setTextColor(29, 29, 31);
    doc.setFontSize(18);
    doc.text(displayName.toUpperCase(), 20, 55);
    
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 115);
    doc.text(`TIMESCAMP: ${dateStr} | ${timeStr}`, 20, 62);
    doc.text(`PROTOCOL: NEURAL-STREAM-V4`, 20, 67);
    
    doc.setDrawColor(229, 229, 234);
    doc.line(20, 75, 190, 75);

    // Summary Matrix
    doc.setFontSize(12);
    doc.setTextColor(0, 113, 227);
    doc.text("EXECUTIVE SUMMARY", 20, 85);
    
    doc.setFontSize(10);
    doc.setTextColor(29, 29, 31);
    doc.text(`Total Critical Signals: ${scanReport.total_valid_updates}`, 20, 95);
    doc.text(`Network Nodes Scanned: ${scanReport.total_sources_scanned}`, 20, 102);
    doc.text(`Threat Level: ${scanReport.total_valid_updates > 3 ? 'ELEVATED' : 'STABLE'}`, 20, 109);

    // Detailed Activity Loop (Day-wise)
    let y = 125;
    doc.setFontSize(12);
    doc.setTextColor(0, 113, 227);
    doc.text("7-DAY OPERATIONS CHRONOLOGY", 20, y);
    y += 15;

    // Grouping activities by date for the PDF structure
    const dailyActivities = activities || [];
    
    dailyActivities.forEach((day: any) => {
      if (day.activities.length === 0) return;
      
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(29, 29, 31);
      doc.setFont("helvetica", "bold");
      doc.text(day.date.toUpperCase(), 20, y);
      y += 8;
      
      doc.setDrawColor(0, 113, 227);
      doc.setLineWidth(0.5);
      doc.line(20, y - 5, 20, y + (day.activities.length * 20)); // Timeline line

      day.activities.forEach((act: any) => {
        if (y > 260) {
          doc.addPage();
          y = 30;
        }
        
        doc.setFontSize(9);
        doc.setTextColor(0, 113, 227);
        doc.text(`[${act.time}]`, 25, y);
        
        doc.setTextColor(29, 29, 31);
        doc.setFont("helvetica", "bold");
        doc.text(act.title, 40, y);
        y += 5;
        
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 115);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(act.description, 140);
        doc.text(splitDesc, 40, y);
        y += (splitDesc.length * 4) + 6;
      });
      
      y += 5;
    });

    // Technical Signatures (Features)
    doc.addPage();
    y = 30;
    doc.setFontSize(12);
    doc.setTextColor(0, 113, 227);
    doc.text("TECHNICAL SIGNAL ARCHIVE", 20, y);
    y += 15;

    scanReport.features.forEach((f) => {
      if (y > 240) {
        doc.addPage();
        y = 30;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(29, 29, 31);
      doc.setFont("helvetica", "bold");
      doc.text(f.feature_title.toUpperCase(), 20, y);
      y += 6;
      
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 115);
      doc.setFont("helvetica", "normal");
      const fDate = new Date(f.publish_date);
      const fDateStr = fDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const fTimeStr = fDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      
      doc.text(`CATEGORY: ${f.category} | SYNC: ${fDateStr} ${fTimeStr}`, 20, y);
      y += 5;
      
      doc.setTextColor(0, 113, 227);
      doc.text(`SOURCE: ${f.source_url}`, 20, y);
      y += 5;

      doc.setTextColor(110, 110, 115);
      const splitText = doc.splitTextToSize(f.technical_summary, 170);
      doc.text(splitText, 20, y);
      y += (splitText.length * 5) + 12;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Market Scout Intelligence Network | Protocol 4.2 | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`${displayName.replace(/\s+/g, '_')}_INTEL_v4.pdf`);
    setIsPdfModalOpen(false);
  };

  const groupedFeatures = useMemo(() => {
    // 1. Initialize the 7 calendar days (yesterday back to -7) for the operational pulse
    const groups: Record<string, ScanFeature[]> = {};
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() - (i + 1));
        const dateKey = d.toLocaleDateString('en-IN', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
        groups[dateKey] = [];
    }

    if (!scanReport) return groups;

    // 2. Add all actual features found in the scan
    scanReport.features.forEach(f => {
      const date = new Date(f.publish_date).toLocaleDateString('en-IN', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      if (!groups[date]) {
          groups[date] = [];
      }
      groups[date].push(f);
    });

    // 3. Sort all keys (calendar pulse + release events) descending
    const sortedEntries = Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );

    return Object.fromEntries(sortedEntries);
  }, [scanReport]);

  const totalFeaturesToShow = useMemo(() => {
    return scanReport?.features?.length || 0;
  }, [scanReport]);

  const trendData = useMemo(() => {
    if (!scanReport) return [];
    const days = 7;
    const data = [];
    const now = new Date();
    for (let i = days; i >= 1; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const count = scanReport.features.filter((f: ScanFeature) => {
        const fDate = new Date(f.publish_date);
        return fDate.toDateString() === d.toDateString();
      }).length;
      data.push({ name: dateStr, updates: count });
    }
    return data;
  }, [scanReport]);

  const displayName = scanReport?.competitor || competitor?.name || 'Competitor';

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl rounded-full border border-[#E5E5EA] dark:border-white/10 text-[#6E6E73] dark:text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:shadow-apple transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">{displayName} <span className="text-[#0071E3]">Intelligence</span></h1>
            <p className="text-[#6E6E73] dark:text-[#A1A1A6] mt-1 font-medium italic">Full competitive analysis and feature release tracking.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-full px-6 border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] font-black text-[10px] uppercase tracking-widest h-10 shadow-sm"
            onClick={() => setIsPdfModalOpen(true)}
          >
            <Download size={16} className="mr-2" /> EXPORT PDF
          </Button>

          <PdfDownloadModal 
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            onDownload={handleExportPDF}
            title={displayName}
          />
          <Button className="rounded-full px-6 bg-[#0071E3] text-white hover:bg-[#0077ED] font-black text-[10px] uppercase tracking-widest h-10 shadow-lg shadow-[#0071E3]/20">
            <Activity size={16} className="mr-2" /> LIVE MONITOR
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading || (!scanReport && !error) ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#0071E3]/20 border-t-[#0071E3] rounded-full animate-spin" />
              <Search className="absolute inset-0 m-auto text-[#0071E3]" size={24} />
            </div>
            <p className="text-lg font-medium text-[#1D1D1F] dark:text-white animate-pulse italic">Analyzing tech signatures...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-10 rounded-3xl border border-red-100 text-center">
            <h3 className="text-xl font-bold text-red-600 mb-2">Analysis Failed</h3>
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-red-600 text-white">Retry Analysis</Button>
          </div>
        ) : scanReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl p-8 rounded-[40px] border border-[#E5E5EA] dark:border-white/10 shadow-apple flex flex-col justify-between">
                <div className="flex items-center gap-2 text-[#0071E3] font-black text-[10px] uppercase tracking-widest mb-6 italic">
                  <TrendingUp size={14} strokeWidth={3} /> Signal Insight
                </div>
                <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white max-w-2xl leading-snug uppercase italic tracking-tighter">
                  {totalFeaturesToShow > 0 
                    ? `Identified ${totalFeaturesToShow} critical technical updates.`
                    : "No significant feature releases detected in the current monitoring window."}
                </h2>
                <div className="flex items-center gap-10 mt-8">
                  <div>
                    <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">Sources Audited</div>
                    <div className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">
                      {scanReport.total_sources_scanned || competitor?.total_sources_scanned_cumulative || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-1 italic">Conf. Score</div>
                    <div className="text-3xl font-black text-[#34C759] uppercase italic tracking-tighter">
                      {totalFeaturesToShow > 0 
                        ? `${Math.floor(scanReport.features.filter(f => {
                            const date = new Date(f.publish_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                            return groupedFeatures[date] !== undefined;
                          }).reduce((acc, f) => acc + (f.confidence_score || 0), 0) / totalFeaturesToShow)}%`
                        : '---'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1D1D1F] dark:bg-[#1D1D1F]/80 p-8 rounded-[40px] text-white flex flex-col items-center justify-center text-center shadow-apple border border-white/10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/20">
                  <ShieldCheck size={32} className="text-[#34C759]" />
                </div>
                <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-2 italic">Threat Level</div>
                <div className="text-4xl font-black italic tracking-tighter uppercase">
                  {totalFeaturesToShow > 10 ? 'CRITICAL' : totalFeaturesToShow > 5 ? 'HIGH' : totalFeaturesToShow > 0 ? 'MODERATE' : 'STABLE'}
                </div>
              </div>
            </div>

            {/* Feature Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <ActivityTimeline days={activities} />
              </div>

              {/* Sidebar Analytics */}
              <div className="space-y-8">
                <div className="bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl p-8 rounded-[40px] border border-[#E5E5EA] dark:border-white/10 shadow-apple">
                  <h3 className="font-black text-[#1D1D1F] dark:text-white mb-6 flex items-center gap-2 uppercase italic tracking-tighter">
                    <Activity size={18} strokeWidth={3} className="text-[#0071E3]" /> Velocity <span className="text-[#0071E3]">Waves</span>
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0071E3" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip />
                        <Area type="monotone" dataKey="updates" stroke="#0071E3" strokeWidth={3} fillOpacity={1} fill="url(#colorUpdates)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl p-8 rounded-[40px] border border-[#E5E5EA] dark:border-white/10 shadow-apple">
                  <h3 className="font-black text-[#1D1D1F] dark:text-white mb-6 uppercase text-[10px] tracking-[0.2em] italic">Key Repositories</h3>
                  <div className="space-y-4">
                    {['Technical Docs', 'NPM Registry', 'GitHub Activity', 'Product Blog'].map((src, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#F5F5F7] dark:bg-[#1D1D1F]/50 rounded-xl text-sm border border-[#E5E5EA] dark:border-white/5">
                        <span className="font-medium text-[#1D1D1F] dark:text-white">{src}</span>
                        <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntelligenceReportPage;
