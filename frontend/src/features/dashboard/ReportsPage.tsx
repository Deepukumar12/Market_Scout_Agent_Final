import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowRight, Zap, Loader2, X, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useIntelStore } from '@/store/intelStore';
import { useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  source_url?: string;
}

const ReportsPage = () => {
  const { token } = useAuthStore();
  const { deleteReport } = useIntelStore();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  
  // State
  const [reports, setReports] = useState<MissionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MissionReport | null>(null);
  const [filter, setFilter] = useState('ALL');

  // Fetch Reports
  const fetchReports = async () => {
      try {
          const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
          const queryParam = searchQuery ? `&competitor=${encodeURIComponent(searchQuery)}` : '';
          const res = await fetch(`${apiUrl}/api/v1/reports/history?limit=12${queryParam}`, {
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
      const interval = setInterval(fetchReports, 20000); // 20s refresh for intelligence briefings
      return () => clearInterval(interval);
  }, [token, searchQuery]);

  // Generate New Report
  const handleGenerate = async () => {
      setGenerating(true);
      try {
          // Simulate "Processing" time for realism
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiUrl}/api/v1/reports/generate?report_type=TACTICAL`, {
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

  // @ts-ignore
const getSourceDisplay = (url?: string) => {
    if (!url) return 'Unknown Origin';
    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    } catch {
      return 'Direct Feed';
    }
  };

  const filteredReports = filter === 'ALL' ? reports : reports.filter(r => r.report_type === filter);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Intelligence <span className="text-[#AF52DE]">Reports</span></h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] dark:text-[#86868B] dark:text-[#A1A1A6] mt-2 font-medium italic">Access all generated market intelligence and autonomous scout briefings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-full px-6 bg-[#0071E3] text-white hover:bg-[#0077ED] font-black text-[10px] uppercase tracking-widest h-10 shadow-lg shadow-[#0071E3]/20"
          >
            {generating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
            {generating ? 'GENERATING...' : 'NEW BRIEFING'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter size={16} className="text-[#6E6E73] dark:text-[#86868B] mr-2 shrink-0" />
        {['ALL', 'EXECUTIVE', 'PRODUCT', 'RISK', 'TACTICAL'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 italic",
              filter === type 
                ? "bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] shadow-md shadow-black/10" 
                : "bg-white dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#A1A1A6] border border-[#E5E5EA] dark:border-white/10 hover:border-[#D2D2D7] hover:text-[#1D1D1F] dark:hover:text-white"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-[#1D1D1F] rounded-3xl border border-[#E5E5EA] dark:border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredReports.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedReport(report)}
                className="group bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl rounded-[40px] p-8 border border-[#E5E5EA] dark:border-white/10 hover:shadow-apple transition-all cursor-pointer flex flex-col h-full shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    report.report_type === 'EXECUTIVE' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    report.report_type === 'PRODUCT' ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                    report.report_type === 'RISK' ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" :
                    "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                  )}>
                    {report.report_type}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Purge this intelligence brief from archives?')) {
                          deleteReport(report.id).then(() => fetchReports());
                        }
                      }}
                      className="p-2 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Clock size={14} className="text-[#6E6E73] dark:text-[#86868B]" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-[#1D1D1F] dark:text-white mb-2 line-clamp-2 group-hover:text-[#0071E3] transition-colors uppercase italic tracking-tighter">{report.title}</h3>
                <p className="text-[#6E6E73] dark:text-[#86868B] dark:text-[#86868B] dark:text-[#A1A1A6] text-sm line-clamp-3 mb-6 flex-1 font-medium italic">"{report.description}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F7] dark:border-white/5">
                  <span className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] font-medium">{report.generated_at}</span>
                 <div className="flex items-center gap-1 text-[#0071E3] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity italic">
                    View Report <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 dark:bg-[#1D1D1F]/95 backdrop-blur-2xl rounded-[40px] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-apple border border-white/40 dark:border-white/10"
            >
              <div className="p-8 border-b border-[#F5F5F7] dark:border-white/5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#6E6E73] dark:text-[#86868B] dark:text-[#86868B] dark:text-[#A1A1A6] text-[10px] font-bold uppercase tracking-wider">
                      {selectedReport.report_type}
                    </span>
                    <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6]">{selectedReport.generated_at}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">{selectedReport.title}</h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors text-[#6E6E73] dark:text-[#86868B]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6 text-[#1D1D1F] dark:text-white leading-relaxed">
                  <p className="text-lg font-medium text-[#6E6E73] dark:text-[#86868B] dark:text-[#86868B] dark:text-[#A1A1A6] italic">"{selectedReport.description}"</p>
                  <div className="whitespace-pre-wrap text-[#1D1D1F] dark:text-white text-base">
                    {selectedReport.full_content}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#F5F5F7] dark:border-white/5 bg-[#F5F5F7]/30 dark:bg-[#1D1D1F]/30 flex justify-between items-center px-10">
                <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">ID: {selectedReport.id.split('-')[0]} • System Generated</p>
                <div className="flex gap-3">
                  {selectedReport.source_url && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(selectedReport.source_url, '_blank')}
                      className="rounded-full border-[#E5E5EA] dark:border-white/10 text-[#6E6E73] dark:text-[#86868B] hover:bg-[#F5F5F7] dark:hover:bg-white/5"
                    >
                      <ArrowRight size={16} className="mr-2 rotate-[-45deg]" /> Original Source
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedReport(null)} className="rounded-full text-[#6E6E73] dark:text-[#86868B]">Close</Button>
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
