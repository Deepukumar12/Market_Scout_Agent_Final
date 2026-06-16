import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Shield, Target, ArrowUpRight, Loader2, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/utils';
import CompetitorDetailsModal from '@/components/dashboard/CompetitorDetailsModal';
import { useIntelStore } from '@/store/intelStore';

const CompetitorsPage = () => {
  const { searchQuery: globalSearchQuery, setSearchQuery } = useOutletContext<{ searchQuery: string, setSearchQuery: (q: string) => void }>();
  const { competitors, loading, error, fetchCompetitors, removeCompetitor, setSelectedCompetitorId } = useCompetitorStore();
  
  const navigate = useNavigate();
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      fetchCompetitors(globalSearchQuery);
    };

    refresh();
    window.addEventListener('intelligence-refresh', refresh);
    
    const interval = setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('intelligence-refresh', refresh);
      clearInterval(interval);
    };
  }, [fetchCompetitors, globalSearchQuery]);

  const filteredCompetitors = useMemo(() => {
    if (!globalSearchQuery.trim()) return competitors;
    return competitors.filter(c => 
      c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      (c.url && c.url.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    );
  }, [competitors, globalSearchQuery]);

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
      <div className="pointer-events-none absolute -top-40 -left-10 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-slow" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Network Live</span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                 NODES: {competitors.length}
             </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1D1D1F] dark:text-white tracking-tighter mb-2 uppercase italic leading-tight">
               Competitor <span className="text-[#0071E3]">Universe</span>
            </h1>
            <p className="text-lg text-[#6E6E73] dark:text-[#86868B] max-w-2xl font-medium leading-relaxed italic">
               Master surveillance grid of all identified entities. 
               Toggle mission-critical data streams or execute deep-level technical scans.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] group-focus-within:text-[#0071E3] transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH UNIVERSE..."
              value={globalSearchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.2em] placeholder:text-[#86868B] dark:placeholder:text-[#A1A1A6] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]/30 transition-all w-full backdrop-blur-3xl italic"
            />
          </div>
          <Button
            onClick={() => navigate('/dashboard/add-competitor')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 px-8 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group uppercase tracking-widest text-[10px]"
          >
            <PlusCircle className="mr-2 h-4 w-4 fill-current" />
            Deploy New Agent
          </Button>
        </div>
      </div>

      <div className="rounded-[40px] border border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl overflow-hidden relative z-10 shadow-apple">
        <div className="grid grid-cols-[1fr_150px_120px] items-center px-8 py-5 border-b border-[#E5E5EA] dark:border-white/10 text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-black uppercase tracking-[0.2em]">
          <span>ENTITY IDENTIFIER</span>
          <span className="text-center">STATUS</span>
          <span className="text-right">ACTIONS</span>
        </div>

        <div className="divide-y divide-white/5">
          {filteredCompetitors.map((c: any, idx: number) => (
            <motion.div
              key={c._id || c.id || c.name || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => {
                setSelectedCompetitorId(c._id || c.id);
                setSelectedCompetitor(c);
                setIsDetailsOpen(true);
              }}
              className="grid grid-cols-[1fr_150px_120px] items-center px-8 py-6 text-sm text-[#1D1D1F] dark:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center text-lg font-black text-[#0071E3] border border-[#E5E5EA] dark:border-white/10 group-hover:border-[#0071E3]/30 transition-all group-hover:bg-[#0071E3]/5 uppercase italic overflow-hidden">
                  {c.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-white transition-colors">{c.name}</div>
                  <a 
                    href={c.url.startsWith('http') ? c.url : `https://${c.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#6E6E73] dark:text-[#86868B] font-mono tracking-widest uppercase mt-1 break-all hover:text-[#0071E3] transition-all flex items-center gap-1 group/url"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.url}
                    <ArrowUpRight size={8} className="opacity-0 group-hover/url:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
              <div className="text-center">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                  c.status === 'Scanning' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5 animate-pulse' : 
                  c.status === 'Failed' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' :
                  'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                )}>
                  {c.status || 'Active'}
                </span>
              </div>
              <div className="text-right flex justify-end">
                  <div className="flex gap-2 relative z-20">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await useIntelStore.getState().runScan(c._id || c.id);
                        } catch (err) {
                          console.error("Manual scan failed", err);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all group/zap"
                      title="Initiate Deep Scan"
                    >
                      <Zap size={12} className="group-hover/zap:fill-emerald-400 transition-all" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Target ${c.name} for termination?`)) {
                          removeCompetitor(c._id || c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                      title="Terminate Node"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
              </div>
            </motion.div>
          ))}

          {!loading && filteredCompetitors.length === 0 && (
            <div className="px-8 py-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent" />
              <div className="relative z-10 space-y-4">
                  <Shield className="w-12 h-12 text-[#E5E5EA] mx-auto" />
                  <div>
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">No Entities Detected</h3>
                    <p className="text-sm text-[#6E6E73] dark:text-[#86868B] max-w-xs mx-auto mt-2 font-medium italic">
                       {globalSearchQuery ? `Filter "${globalSearchQuery}" returned zero signal nodes.` : "The competition universe is currently empty. Deploy an agent to begin surveillance."}
                    </p>
                 </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="px-8 py-20 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Syncing Universe Telemetry...</p>
            </div>
          )}

          {error && (
            <div className="px-8 py-10 text-center">
               <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 inline-flex flex-col items-center gap-2">
                  <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Protocol Sync Failure</div>
                  <div className="text-xs text-rose-300 font-mono font-bold uppercase">{String(error)}</div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em] font-black pt-4">
          <div>Verified Secure Interface</div>
          <div>Last Global Refresh: Just Now</div>
      </div>

      <CompetitorDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        competitor={selectedCompetitor}
      />
    </div>
  );
};

export default CompetitorsPage;
