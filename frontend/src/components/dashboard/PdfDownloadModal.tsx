import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, X, Layers, 
  Target, Zap, Shield, TrendingUp,
  Activity, Clock, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useIntelStore } from '@/store/intelStore';

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  title: string;
}

const PdfDownloadModal = ({ isOpen, onClose, onDownload, title }: PdfDownloadModalProps) => {
  const { globalMetrics, activities } = useIntelStore();
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setPreparing(true);
        const timer = setTimeout(() => setPreparing(false), 800);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#1C1C1E] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-auto md:max-h-[85vh]"
        >
          {/* Preview Sidebar (Left) */}
          <div className="w-full md:w-1/2 bg-[#F5F5F7] dark:bg-[#2C2C2E] p-10 flex flex-col items-center justify-center border-r border-[#E5E5EA] dark:border-white/10">
             <div className="relative group perspective-1000 transform-gpu">
                <motion.div 
                    initial={{ rotateX: 20, rotateY: -10 }}
                    animate={{ rotateX: 5, rotateY: -5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-64 h-80 bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl border border-[#E5E5EA] dark:border-white/10 p-8 flex flex-col justify-between group-hover:rotateX-0 group-hover:rotateY-0 transition-transform duration-500"
                >
                    <div className="space-y-4">
                        <div className="w-12 h-1 bg-[#0071E3] rounded-full" />
                        <h4 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Intelligence <br/> <span className="text-[#0071E3]">Briefing</span></h4>
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-[#F5F5F7] dark:bg-white/5 rounded" />
                            <div className="h-2 w-5/6 bg-[#F5F5F7] dark:bg-white/5 rounded" />
                            <div className="h-2 w-4/6 bg-[#F5F5F7] dark:bg-white/5 rounded" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] dark:bg-white/5" />
                            <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] dark:bg-white/5" />
                            <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] dark:bg-white/5" />
                        </div>
                        <div className="text-[8px] font-black text-[#86868B] uppercase tracking-widest text-center italic">© 2026 SCOUTIQ INTEL NETWORK</div>
                    </div>
                </motion.div>
                <div className="absolute -inset-4 bg-[#0071E3]/20 blur-[60px] -z-10 rounded-full opacity-50" />
             </div>
             
             <div className="mt-12 text-center space-y-2">
                <p className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase italic">Protocol Version 4.2-A</p>
                <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono tracking-widest">ENCRYPTED PDF PAYLOAD</p>
             </div>
          </div>

          {/* Controls Side (Right) */}
          <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-between">
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>

            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-black text-[#0071E3] uppercase tracking-[0.2em] italic mb-2">Protocol Confirmation</h2>
                <h3 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Initialize <span className="text-[#AF52DE]">Export</span></h3>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 space-y-4">
                    <h4 className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest italic flex items-center gap-2">
                        <Target className="w-3 h-3" /> Report Metadata
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-[#86868B] uppercase">Scope</span>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase">{title}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[9px] font-black text-[#86868B] uppercase">Window</span>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase">Last 7 Days</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-[#86868B] uppercase">Units Tracked</span>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase">{globalMetrics?.total_competitors || 0} Targets</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[9px] font-black text-[#86868B] uppercase">Signals</span>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase">{globalMetrics?.features_found || 0} Points</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-emerald-500">
                      <Shield className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">All datasets verified with original sources</span>
                   </div>
                   <div className="flex items-center gap-3 text-cyan-500">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Day-wise activity matrix included</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-10">
                <Button 
                   onClick={onDownload}
                   disabled={preparing}
                   className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white py-8 rounded-[20px] shadow-2xl shadow-[#0071E3]/20 font-black uppercase tracking-[0.2em] text-sm italic gap-3 transition-all active:scale-98"
                >
                   {preparing ? (
                       <>
                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        PREPARING PAYLOAD...
                       </>
                   ) : (
                       <>
                        <Download className="w-5 h-5" strokeWidth={3} />
                        Download Briefing PDF
                       </>
                   )}
                </Button>
                <p className="text-center text-[9px] text-[#86868B] font-mono italic uppercase">Transmission requires active authentication token</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PdfDownloadModal;
