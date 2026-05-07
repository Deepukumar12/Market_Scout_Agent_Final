import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Radar, Globe2, Search, Target, ArrowUpRight, Loader2, Trash2, FileDown, Download, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useIntelStore } from '@/store/intelStore';
import { toast } from 'react-hot-toast';
import { useComponentLogger } from '@/hooks/useComponentLogger';

const CompetitorsPage = () => {
  useComponentLogger('CompetitorsPage');
  const { competitors, loading, error, fetchCompetitors, removeCompetitor, updateCompetitor } = useCompetitorStore();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const { globalMetrics, fetchGlobalMetrics } = useIntelStore();
  const [localFilter, setLocalFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitors();
    fetchGlobalMetrics();
    const interval = setInterval(() => {
      fetchCompetitors();
      fetchGlobalMetrics();
    }, 15000); // 15s sync for master grid
    return () => clearInterval(interval);
  }, [fetchCompetitors, fetchGlobalMetrics]);

  const filteredCompetitors = useMemo(() => {
    const combinedQuery = (searchQuery || '' + localFilter || '').toLowerCase().trim();
    if (!combinedQuery) return competitors;
    return competitors.filter(c => 
      c.name.toLowerCase().includes(combinedQuery) || 
      (c.url && c.url.toLowerCase().includes(combinedQuery))
    );
  }, [competitors, searchQuery, localFilter]);

  const handleExportPDF = async (competitorIds: string[] = []) => {
    setIsExporting(true);
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('scoutiq_token');
      
      const response = await fetch(`${apiUrl}/api/v1/intelligence/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ competitor_ids: competitorIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Market_Scout_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Intelligence Archive Exported Successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'PDF Generation Protocol Failure');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20">
      <div className="pointer-events-none absolute -top-40 -left-10 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Network Live</span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-mono text-muted-foreground uppercase">
                NODES: {competitors.length}
             </div>
          </div>
          <div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter mb-2 uppercase italic leading-tight">
               Competitor <span className="text-primary">Universe</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed italic">
               Master surveillance grid of all identified entities. 
               Autonomous agents are currently verifying <span className="text-foreground">global footprints</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH UNIVERSE..."
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
              className="bg-muted border border-border rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-foreground uppercase tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-full backdrop-blur-xl"
            />
          </div>
          <Button
            onClick={() => handleExportPDF()}
            variant="outline"
            disabled={isExporting}
            className="border-primary/30 text-primary hover:bg-primary/5 font-black h-12 px-6 rounded-2xl transition-all group uppercase tracking-widest text-[10px]"
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            {isExporting ? 'Generating...' : 'Download All Competitors PDF'}
          </Button>
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
          value={globalMetrics?.features_found || 0}
          description="Global activity updates"
          color="text-primary"
          border="border-primary/20"
        />
        <SummaryCard
          idx={1}
          icon={<Globe2 className="w-6 h-6 text-emerald-400" />}
          title="Reports Available"
          value={globalMetrics?.total_reports || 0}
          description="Continuous surveillance"
          color="text-green-500"
          border="border-green-500/20"
        />
        <SummaryCard
          idx={2}
          icon={<Target className="w-6 h-6 text-purple-400" />}
          title="Verified Nodes"
          value={competitors.length || 0}
          description="High-confidence entities"
          color="text-accent-foreground"
          border="border-accent-foreground/20"
        />
      </div>

      <div className="rounded-[40px] border border-border bg-card/70 backdrop-blur-xl overflow-hidden relative z-10 shadow-apple">
        <div className="grid grid-cols-[1fr_100px_130px_160px] items-center px-8 py-5 border-b border-border text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
          <span>ENTITY IDENTIFIER</span>
          <span className="text-center">STATUS</span>
          <span className="text-center">RISK LEVEL</span>
          <span className="text-right">TELEMETRY</span>
        </div>

        <div className="divide-y divide-border/5">
          {filteredCompetitors.map((c: any, idx: number) => (
            <CompetitorRow 
              key={c._id || c.id || idx}
              competitor={c}
              idx={idx}
              navigate={navigate}
              updateCompetitor={updateCompetitor}
              removeCompetitor={removeCompetitor}
              handleExportPDF={handleExportPDF}
            />
          ))}

          {!loading && filteredCompetitors.length === 0 && (
            <div className="px-8 py-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/[0.02] via-transparent to-transparent" />
              <div className="relative z-10 space-y-4">
                  <Radar className="w-12 h-12 text-primary mx-auto animate-pulse" />
                  <div>
                    <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Surveillance Grid Active</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 font-medium italic leading-relaxed">
                       {searchQuery || localFilter ? `Telemetry mismatch for "${searchQuery || localFilter}".` : "No competitors found in your surveillance network."}
                    </p>
                    <Button
                      onClick={() => navigate('/dashboard/add-competitor')}
                      variant="outline"
                      className="mt-6 border-primary/30 text-primary uppercase text-[10px] font-black tracking-widest py-4 px-8 rounded-2xl"
                    >
                      Deploy Custom Agent
                    </Button>
                 </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="px-8 py-20 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] animate-pulse">Syncing Universe Telemetry...</p>
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

      <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono uppercase tracking-[0.2em] font-black pt-4">
          <div>Verified Secure Interface</div>
          <div>Last Global Refresh: 1.2s Ago</div>
      </div>
    </div>
  );
};

const CompetitorRow = ({ 
  competitor: c, 
  idx, 
  navigate, 
  updateCompetitor, 
  removeCompetitor, 
  handleExportPDF 
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(c.name);
  const [editUrl, setEditUrl] = useState(c.url || '');
  const [editPriority, setEditPriority] = useState(c.priority || 'Medium');

  const handleSave = async () => {
    await updateCompetitor(c._id || c.id, { 
      name: editName, 
      url: editUrl,
      priority: editPriority
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05 }}
      className={cn(
        "grid grid-cols-[1fr_100px_130px_160px] items-center px-8 py-6 text-sm text-foreground hover:bg-muted/40 transition-colors cursor-pointer group",
        isEditing && "bg-muted/60"
      )}
      onClick={() => !isEditing && navigate(`/dashboard/competitors/${c._id || c.id}/report`)}
    >
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-lg font-black text-primary border border-border group-hover:border-primary/30 transition-all group-hover:bg-primary/5 uppercase italic overflow-hidden">
          {c.logo_url ? (
            <img 
              src={c.logo_url} 
              alt={c.name} 
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as any).parentElement.innerText = c.name?.[0] || '?';
              }}
            />
          ) : (
            c.name?.[0] || '?'
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2 flex-1" onClick={e => e.stopPropagation()}>
            <input 
              className="bg-background border border-border rounded-md px-2 py-1 text-xs w-full font-bold uppercase italic"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <input 
              className="bg-background border border-border rounded-md px-2 py-1 text-[10px] w-full font-mono"
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <div className="font-black uppercase italic tracking-tight text-foreground group-hover:text-primary transition-colors">{c.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase mt-1 break-all">{c.url}</div>
          </div>
        )}
      </div>
      <div className="text-center">
        <span className={cn(
          "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
          c.status === 'Scanning' ? "border-amber-500/20 text-amber-400 bg-amber-500/5 animate-pulse" : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
        )}>
          {c.status || 'Active'}
        </span>
      </div>
      <div className="text-center" onClick={e => isEditing && e.stopPropagation()}>
         {isEditing ? (
           <select 
              className="bg-background border border-border rounded-md px-2 py-1 text-[9px] font-black uppercase"
              value={editPriority}
              onChange={e => setEditPriority(e.target.value)}
           >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
           </select>
         ) : (
          <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
              c.priority === 'High' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' : 
              c.priority === 'Low' ? 'border-primary/20 text-blue-400 bg-primary/50/5' :
              'border-amber-500/20 text-amber-400 bg-amber-500/5'
           )}>
              {c.priority || 'Medium'}
           </span>
         )}
      </div>
      <div className="text-right flex flex-col items-end gap-1">
          {isEditing ? (
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <Button 
                onClick={handleSave}
                className="h-8 px-3 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-500"
              >
                Save
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="h-8 px-3 text-[10px] font-black uppercase"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-black text-foreground uppercase italic tracking-tighter flex items-center gap-1 group/link hover:text-primary transition-colors">
                OPEN REPORT <ArrowUpRight className="w-3 h-3 text-primary group-hover/link:translate-x-1 transition-transform" />
              </div>
              <div className="flex gap-2 mt-1 relative z-20">
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    const { runCompetitorScan } = await import('@/services/api');
                    try {
                      toast.promise(runCompetitorScan(c._id || c.id), {
                        loading: `Agent deploying for ${c.name}...`,
                        success: `Intelligence sync complete for ${c.name}`,
                        error: `Surveillance failure for ${c.name}`
                      });
                    } catch(err) {}
                  }}
                  className={cn(
                    "p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all",
                    c.status === 'Scanning' && "animate-spin opacity-50 pointer-events-none"
                  )}
                  title="Trigger Fresh Scan"
                >
                  <RefreshCcw size={12} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                  title="Edit Telemetry"
                >
                  <PlusCircle size={12} className="rotate-45" />
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportPDF([c._id || c.id]);
                  }}
                  className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                  title="Download Competitor PDF"
                >
                  <Download size={12} />
                </button>
              </div>
            </>
          )}
      </div>
    </motion.div>
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
        "p-10 rounded-[40px] bg-card/70 border border-border flex items-start gap-6 backdrop-blur-xl group hover:scale-[1.02] transition-all shadow-apple",
        border
    )}
  >
    <div className={cn("p-4 rounded-2xl bg-muted border border-border transition-transform group-hover:rotate-6", border)}>{icon}</div>
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{title}</p>
      <div className={cn("text-3xl font-black italic tracking-tighter uppercase", color)}>{value}</div>
      <p className="text-[10px] text-muted-foreground font-medium italic">{description}</p>
    </div>
  </motion.div>
);

export default CompetitorsPage;
