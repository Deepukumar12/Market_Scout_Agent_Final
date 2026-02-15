import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Radar, Globe2, Filter, Search, Shield, Target, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CompetitorsPage = () => {
  const { competitors, loading, error, fetchCompetitors } = useCompetitorStore();
  const [filterQuery, setFilterQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const filteredCompetitors = useMemo(() => {
    if (!filterQuery.trim()) return competitors;
    return competitors.filter(c => 
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      (c.url && c.url.toLowerCase().includes(filterQuery.toLowerCase()))
    );
  }, [competitors, filterQuery]);

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
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2 uppercase italic leading-tight">
               Competitor <span className="text-emerald-500">Universe</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed italic">
               Master surveillance grid of all identified entities. 
               Autonomous agents are currently verifying <span className="text-slate-200">global footprints</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH UNIVERSE..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-[#020617]/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all w-full backdrop-blur-xl"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <SummaryCard
          idx={0}
          icon={<Radar className="w-6 h-6 text-cyan-400" />}
          title="Signals Today"
          value="24"
          description="Global activity updates"
          color="text-cyan-400"
          border="border-cyan-500/20"
        />
        <SummaryCard
          idx={1}
          icon={<Globe2 className="w-6 h-6 text-emerald-400" />}
          title="Regions Covered"
          value="12"
          description="Continuous surveillance"
          color="text-emerald-400"
          border="border-emerald-500/20"
        />
        <SummaryCard
          idx={2}
          icon={<Target className="w-6 h-6 text-purple-400" />}
          title="Verified Nodes"
          value={competitors.length || 0}
          description="High-confidence entities"
          color="text-purple-400"
          border="border-purple-500/20"
        />
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl overflow-hidden relative z-10">
        <div className="grid grid-cols-[1fr_100px_130px_160px] items-center px-8 py-5 border-b border-white/5 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
          <span>ENTITY IDENTIFIER</span>
          <span className="text-center">STATUS</span>
          <span className="text-center">RISK LEVEL</span>
          <span className="text-right">TELEMETRY</span>
        </div>

        <div className="divide-y divide-white/5">
          {filteredCompetitors.map((c: any, idx: number) => (
            <motion.div
              key={c._id || c.id || c.name || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="grid grid-cols-[1fr_100px_130px_160px] items-center px-8 py-6 text-sm text-slate-200 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => navigate(`/dashboard/competitors/${c._id || c.id}/report`)}
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-lg font-black text-cyan-400 border border-white/5 group-hover:border-emerald-500/30 transition-all group-hover:bg-emerald-500/5 uppercase italic">
                  {c.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-black uppercase italic tracking-tight text-white group-hover:text-emerald-400 transition-colors">{c.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1 break-all">{c.url || 'NO_URL_SIGNAL'}</div>
                </div>
              </div>
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                  {c.status || 'Active'}
                </span>
              </div>
              <div className="text-center">
                 <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    c.priority === 'High' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' : 
                    c.priority === 'Low' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                    'border-amber-500/20 text-amber-400 bg-amber-500/5'
                 )}>
                    {c.priority || 'Medium'}
                 </span>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                 <div className="text-[10px] font-black text-white uppercase italic tracking-tighter flex items-center gap-1 group/link">
                   OPEN REPORT <ArrowUpRight className="w-3 h-3 text-emerald-500 group-hover/link:translate-x-1 transition-transform" />
                 </div>
                 <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">GEN-7 ARCHIVE</div>
              </div>
            </motion.div>
          ))}

          {!loading && filteredCompetitors.length === 0 && (
            <div className="px-8 py-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent" />
              <div className="relative z-10 space-y-4">
                 <Shield className="w-12 h-12 text-slate-700 mx-auto" />
                 <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">No Entities Detected</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2 font-medium italic">
                       {filterQuery ? `Filter "${filterQuery}" returned zero signal nodes.` : "The competition universe is currently empty. Deploy an agent to begin surveillance."}
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
          <div>Last Global Refresh: 1.2s Ago</div>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon,
  title,
  value,
  description,
  idx,
  color,
  border
}: {
  icon: JSX.Element;
  title: string;
  value: string | number;
  description: string;
  idx: number;
  color: string;
  border: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: idx * 0.1 }}
    className={cn(
        "p-8 rounded-3xl bg-[#020617]/40 border border-white/5 flex items-start gap-6 backdrop-blur-xl group hover:scale-[1.02] transition-all",
        border
    )}
  >
    <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/5 transition-transform group-hover:rotate-6", border)}>{icon}</div>
    <div className="space-y-1">
      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{title}</p>
      <div className={cn("text-3xl font-black italic tracking-tighter uppercase", color)}>{value}</div>
      <p className="text-[10px] text-slate-600 font-medium italic">{description}</p>
    </div>
  </motion.div>
);

export default CompetitorsPage;

