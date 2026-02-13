import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useIntelStore } from '@/store/intelStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowLeft, 
  Shield, 
  ExternalLink, 
  Calendar, 
  Zap, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Code,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const getCategoryStyles = (category: string) => {
  switch (category.toUpperCase()) {
    case 'API': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Code className="w-3.5 h-3.5" /> };
    case 'UI': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Layers className="w-3.5 h-3.5" /> };
    case 'AI': return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: <Zap className="w-3.5 h-3.5" /> };
    case 'INFRASTRUCTURE': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <Cpu className="w-3.5 h-3.5" /> };
    case 'SECURITY': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <ShieldCheck className="w-3.5 h-3.5" /> };
    case 'PLATFORM': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <Globe className="w-3.5 h-3.5" /> };
    case 'SDK': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Zap className="w-3.5 h-3.5" /> };
    default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: <LineChart className="w-3.5 h-3.5" /> };
  }
};

const IntelligenceReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { scanReport, loading, error, runScan, clear } = useIntelStore();
  const { competitors, fetchCompetitors } = useCompetitorStore();

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

  const displayName = scanReport?.competitor || competitor?.name || 'Competitor';

  return (
    <div className="relative max-w-6xl mx-auto space-y-8">
      <div className="pointer-events-none absolute -top-40 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="hover:bg-white/10 text-gray-400"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-[10px] text-cyan-500 uppercase font-mono tracking-widest">Market Scout Agent v2.5</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                {displayName}
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Targeted autonomous intelligence extraction. Our agent scans documentation, PR logs, and technical changelogs from the last 7 days.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 pr-2">
           {scanReport?.scan_date && (
                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Last Scan: {new Date(scanReport.scan_date).toLocaleString()}
                </div>
            )}
            <div className="text-[10px] text-gray-600 font-mono tracking-tighter">
                LATENCY: 420ms // NODE: US-WEST-1
            </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
      {loading && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-20 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm text-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-base text-white font-medium">Analyzing competitive terrain...</p>
            <p className="text-xs text-gray-500 font-mono italic">Step: Cross-referencing technical changelogs (7-day window)</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-red-400 border border-red-500/30 bg-red-950/20 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-lg"
        >
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Analysis Failed</p>
            <p className="text-red-400/80">{error}</p>
          </div>
        </motion.div>
      )}

      {scanReport && !loading && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
          {/* Executive Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/60 p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                <p className="text-[10px] text-cyan-400 font-mono tracking-widest mb-4 uppercase">Executive Intelligence Digest</p>
                <p className="text-lg text-gray-100 leading-relaxed font-medium mb-6">
                {scanReport.total_valid_updates === 0
                    ? `No high-impact technical shifts detected for ${displayName} in the past 168 hours.`
                    : `${scanReport.total_valid_updates} critical technical milestone${scanReport.total_valid_updates === 1 ? '' : 's'} identified across audited technical channels.`}
                </p>
                <div className="flex items-center gap-6">
                    <div className="space-y-0.5">
                        <div className="text-[10px] text-gray-500 uppercase font-mono">Sources Audited</div>
                        <div className="text-xl font-bold text-white">{scanReport.total_sources_scanned}</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="space-y-0.5">
                        <div className="text-[10px] text-gray-500 uppercase font-mono">Verified Signals</div>
                        <div className="text-xl font-bold text-cyan-400">{scanReport.total_valid_updates}</div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-black p-6 flex flex-col justify-center items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Impact Velocity</div>
                    <div className="text-3xl font-bold text-white">
                        {scanReport.total_valid_updates > 3 ? 'High' : scanReport.total_valid_updates > 1 ? 'Stable' : 'Quiet'}
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Shield className="w-5 h-5 text-cyan-500" />
                  Primary Technical Signals
                </h2>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-mono">
                    FILTER: LAST_7_DAYS
                </div>
              </div>

              {scanReport.features.length === 0 ? (
                <div className="p-16 rounded-2xl border border-dashed border-white/15 bg-white/5 text-center space-y-2">
                  <p className="text-gray-300 font-semibold">Clear Horizon</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">No significant deployment signals caught in current surveillance window.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scanReport.features.map((f, idx) => {
                        const styles = getCategoryStyles(f.category);
                        return (
                            <motion.div
                                key={f.feature_title + f.source_url + idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="group rounded-2xl border border-white/10 bg-black/40 hover:bg-white/5 p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_10px_40px_-15px_rgba(6,182,212,0.2)]"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${styles.bg} ${styles.border} ${styles.color} text-[10px] font-bold uppercase tracking-wider`}>
                                            {styles.icon}
                                            {f.category}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">Confidence</div>
                                            <div className="text-sm font-bold text-gray-300 font-mono">{f.confidence_score}%</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                                            {f.feature_title}
                                        </h3>
                                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                            {f.technical_summary}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(f.publish_date).toLocaleDateString(undefined, {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </div>
                                    <a
                                        href={f.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-white transition-colors uppercase font-bold tracking-widest"
                                    >
                                        Documentation <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
              )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default IntelligenceReportPage;
