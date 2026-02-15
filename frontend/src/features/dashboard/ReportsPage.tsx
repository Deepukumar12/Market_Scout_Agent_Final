
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Star, ArrowRight, Download, Zap, Database, Share2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitorStore } from '@/store/competitorStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";

// --- Types ---
interface MissionReport {
  id: string;
  title: string;
  report_type: 'EXECUTIVE' | 'PRODUCT' | 'RISK' | 'TACTICAL';
  description: string;
  generated_at: string;
  content_summary: string;
  full_content: string;
  status: string;
}

const ReportsPage = () => {
  const { competitors } = useCompetitorStore();
  const { token } = useAuthStore();
  
  // State
  const [reports, setReports] = useState<MissionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MissionReport | null>(null);

  // Fetch Reports
  const fetchReports = async () => {
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/reports/history?limit=6`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if(res.ok) {
              const data = await res.json();
              setReports(data.reports);
          }
      } catch(e) {
          console.error("Failed to fetch reports", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchReports();
  }, [token]);

  // Generate New Report
  const handleGenerate = async () => {
      setGenerating(true);
      try {
          // Simulate "Processing" time for realism
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/reports/generate?report_type=TACTICAL`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if(res.ok) {
              await fetchReports(); // Refresh list
          }
      } catch(e) {
          console.error(e);
      } finally {
          setGenerating(false);
      }
  };

  // PDF Generation Logic
  const generatePDF = (report: MissionReport | null = null) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Header Helper
      const addHeader = () => {
          doc.setFillColor(10, 15, 30); // Dark Blue/Black
          doc.rect(0, 0, pageWidth, 15, 'F');
          doc.setTextColor(0, 255, 255); // Cyan
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("MARKET SCOUT INTELLIGENCE OS // TACTICAL BRIEFING", margin, 10);
          doc.setTextColor(0, 0, 0); // Reset to black for body
      };

      // Content Helper
      const addReportContent = (r: MissionReport) => {
          if (yPos > 250) { doc.addPage(); yPos = 20; addHeader(); }
          
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(40, 40, 40);
          doc.text(r.title, margin, yPos);
          yPos += 8;

          doc.setFontSize(10);
          doc.setFont("courier", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(`TYPE: ${r.report_type}  |  DATE: ${r.generated_at}  |  ID: ${r.id.split('-')[0]}`, margin, yPos);
          yPos += 15;

          doc.setFontSize(11);
          doc.setFont("times", "normal");
          doc.setTextColor(20, 20, 20);
          
          // clean markdown
          const cleanText = r.full_content.replace(/[*#]/g, '');
          const splitText = doc.splitTextToSize(cleanText, pageWidth - (margin * 2));
          doc.text(splitText, margin, yPos);
          
          yPos += (splitText.length * 5) + 20;
      };

      addHeader();

      if (report) {
          // Single Report
          addReportContent(report);
          doc.save(`marketscout_report_${report.report_type}_${report.generated_at}.pdf`);
      } else {
          // Master Export (All Reports)
          doc.setFontSize(22);
          doc.text("MASTER INTELLIGENCE EXPORT", margin, 40);
          doc.setFontSize(12);
          doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 50);
          doc.text(`Total Briefings: ${reports.length}`, margin, 58);
          yPos = 80;

          reports.forEach((r) => {
              addReportContent(r);
              // Divider
              doc.setDrawColor(200, 200, 200);
              doc.line(margin, yPos - 10, pageWidth - margin, yPos - 10);
          });
          doc.save(`marketscout_master_export_${new Date().toISOString().split('T')[0]}.pdf`);
      }
  };

  // Helper Styles
  const getStyles = (type: string) => {
      switch(type) {
          case 'EXECUTIVE': return { color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: FileText };
          case 'PRODUCT': return { color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5', icon: Zap };
          case 'RISK': return { color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', icon: Database };
          default: return { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: Star };
      }
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -top-40 right-10 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse-slow" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                    {loading ? 'Initializing...' : `System Ready • ${reports.length} Archives`}
                </span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                CYCLE: GEN-7
             </div>
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2 uppercase italic">
               Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Reports</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed italic">
               Autonomous summaries synthesized from <span className="text-slate-200">{competitors.length} active pipelines</span>. 
               Generated for strategic baseline alignment.
            </p>
          </div>
        </div>
        
        <Button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black h-14 px-8 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 group uppercase tracking-widest text-[10px]"
        >
          {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
              <Zap className="mr-2 h-4 w-4 fill-current transition-transform group-hover:scale-110" />
          )}
          {generating ? 'Compiling Intelligence...' : 'Generate New Briefing'}
        </Button>
      </div>

      {/* Reports Grid */}
      {loading ? (
          <div className="h-40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence>
        {reports.map((r, idx) => {
            const style = getStyles(r.report_type);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => setSelectedReport(r)}
                className={cn(
                    "relative p-8 rounded-3xl bg-[#020617]/60 border border-white/5 hover:border-cyan-500/30 group cursor-pointer overflow-hidden backdrop-blur-xl transition-all hover:scale-[1.02]",
                    style.border
                )}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-cyan-500 via-transparent to-blue-500" />
                
                <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                  {/* Top Row: Tag & Icon */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest",
                        style.color, style.border, style.bg
                    )}>
                      {r.report_type}
                    </span>
                    <style.icon className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>

                  {/* Content */}
                  <div>
                    <h2 className="text-lg font-black text-white leading-tight uppercase italic tracking-tighter mb-3 line-clamp-2">
                        {r.title}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">
                        {r.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="inline-flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase font-black">
                      <Clock className="w-3 h-3" /> {r.generated_at}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      View <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
        })}
        </AnimatePresence>
      </div>
      )}

      {/* Export Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl p-10 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
           <Database className="w-48 h-48 rotate-12" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
          <div className="flex items-start gap-6 max-w-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <Share2 className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2">Export Infrastructure</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Multi-Channel Distribution</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                Synchronize autonomous briefings directly into Slack, Notion, or Enterprise BI stacks. 
                Data integrity verified via <span className="text-cyan-400 font-bold">SHA-256</span> encryption.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" className="h-14 px-8 border-white/10 bg-white/5 text-slate-300 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
               Configure Webhooks
             </Button>
             <Button 
                onClick={() => generatePDF(null)}
                className="h-14 px-8 bg-white/5 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
             >
               <Download className="mr-2 h-4 w-4" /> Export Master PDF
             </Button>
          </div>
        </div>
      </motion.div>

       {/* REPORT MODAL */}
       <AnimatePresence>
       {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0b101e] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/10 relative"
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStyles(selectedReport.report_type).color} ${getStyles(selectedReport.report_type).border} bg-opacity-10`}>
                                 {selectedReport.report_type}
                             </span>
                             <span className="text-[10px] text-slate-500 font-mono uppercase">{selectedReport.generated_at}</span>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                            {selectedReport.title}
                        </h2>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/50">
                    <div className="space-y-4 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                        {selectedReport.full_content}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">
                        ID: {selectedReport.id.split('-')[0]} • SECURE CONNECTION
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white hover:bg-white/5">
                            Close Preview
                        </Button>
                        <Button 
                            onClick={() => generatePDF(selectedReport)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download Brief
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
       )}
       </AnimatePresence>

    </div>
  );
};

export default ReportsPage;
