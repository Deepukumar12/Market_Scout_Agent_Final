
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Flame, AlertTriangle, ArrowRight, Zap, Target, Activity, ShieldCheck, Lock, Eye, Server, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// --- Types ---
interface RiskFactor {
  id: string;
  category: string;
  risk_name: string;
  description: string;
  impact_score: number;
  probability_score: number;
  status: string;
  mitigation_strategy: string;
}

interface RiskMatrixResponse {
  global_threat_level: number;
  active_risks: RiskFactor[];
  recent_alerts: string[];
  compliance_score: number;
}

const RiskPage = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState<RiskMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<RiskFactor | null>(null);

  const fetchData = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/risk-matrix`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if(res.ok) {
              const json = await res.json();
              setData(json);
              if(json.active_risks.length > 0) setSelectedRisk(json.active_risks[0]);
          }
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRiskColor = (level: string) => {
      switch(level) {
          case 'Critical': return 'text-rose-500 border-rose-500/50 bg-rose-500/10';
          case 'Active': return 'text-amber-500 border-amber-500/50 bg-amber-500/10';
          default: return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
      }
  };

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* Background FX */}
      <div className="pointer-events-none absolute -top-40 right-0 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full animate-pulse-slow" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Threat Matrix Active</span>
             </div>
             <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500">
                ZONE: SECTOR-7G
             </div>
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2 uppercase italic">
               Risk <span className="text-rose-500">Radar</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed">
               Synthetic assessment of macro-level threats and competitive vectors. 
               Scanning <span className="text-slate-200">{data?.active_risks.length || 0} active vectors</span>.
            </p>
          </div>
        </div>
        
        {/* Global Threat Gauge */}
        <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Global Threat Level</p>
                <div className="flex items-baseline justify-end gap-1">
                    <span className={cn("text-3xl font-black italic tracking-tighter", 
                        (data?.global_threat_level || 0) > 70 ? "text-rose-500" : "text-amber-500"
                    )}>
                        {data?.global_threat_level || 0}/100
                    </span>
                </div>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                 <div 
                    className={cn("absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent", 
                        (data?.global_threat_level || 0) > 70 ? "border-rose-500" : "border-amber-500"
                    )}
                    style={{ transform: `rotate(${(data?.global_threat_level || 0) * 3.6}deg)`, transition: 'transform 1s ease-out' }}
                 />
                 <ShieldAlert className={cn("w-6 h-6", (data?.global_threat_level || 0) > 70 ? "text-rose-500" : "text-amber-500")} />
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: Risk List */}
        <div className="lg:col-span-1 space-y-4">
             <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detected Vectors</h3>
                 <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 font-mono">{data?.active_risks.length}</span>
             </div>
             <div className="space-y-3">
                 {data?.active_risks.map((risk) => (
                     <motion.div
                        key={risk.id}
                        onClick={() => setSelectedRisk(risk)}
                        className={cn(
                            "p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden",
                            selectedRisk?.id === risk.id ? "border-rose-500/50 bg-rose-500/5" : "border-white/5 bg-[#020617]/40"
                        )}
                     >
                         <div className="flex items-start justify-between relative z-10">
                             <div>
                                 <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mb-2 inline-block", getRiskColor(risk.status))}>
                                     {risk.status}
                                 </span>
                                 <h4 className={cn("text-sm font-bold uppercase italic", selectedRisk?.id === risk.id ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>
                                     {risk.risk_name}
                                 </h4>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/10 text-xs font-mono text-slate-500">
                                 {risk.impact_score}
                             </div>
                         </div>
                         {selectedRisk?.id === risk.id && (
                             <motion.div layoutId="glow" className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none" />
                         )}
                     </motion.div>
                 ))}
             </div>
        </div>

        {/* MIDDLE/RIGHT COL: Detail View */}
        <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
                {selectedRisk ? (
                    <motion.div
                        key={selectedRisk.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full flex flex-col gap-6"
                    >
                        {/* Detail Card */}
                        <div className="p-8 rounded-3xl border border-white/10 bg-[#0b1221] backdrop-blur-xl relative overflow-hidden flex-1 min-h-[500px] flex flex-col">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                                <Target className="w-64 h-64 rotate-12" />
                            </div>
                            
                            {/* Card Header */}
                            <div className="relative z-10 mb-8 border-b border-white/5 pb-6 shrink-0">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                        <FileWarning className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest">
                                        {selectedRisk.category} Vector
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter max-w-xl">
                                    {selectedRisk.risk_name}
                                </h2>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10 shrink-0">
                                <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Impact</div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-mono font-bold text-white">{selectedRisk.impact_score}/10</span>
                                        <div className="h-1.5 flex-1 bg-white/10 rounded-full mb-1.5 overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${selectedRisk.impact_score * 10}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Probability</div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-mono font-bold text-white">{selectedRisk.probability_score}/10</span>
                                        <div className="h-1.5 flex-1 bg-white/10 rounded-full mb-1.5 overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedRisk.probability_score * 10}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description & Mitigation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Activity className="w-3 h-3 text-blue-400" /> Context
                                    </h4>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {selectedRisk.description}
                                    </p>
                                </div>
                                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> Recommended Protocol
                                    </h4>
                                    <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
                                        {selectedRisk.mitigation_strategy}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white hover:bg-emerald-500/20 p-0 w-full justify-between">
                                            Execute Auto-Fix <ArrowRight className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Alerts Feed associated with this view */}
                        <div className="p-6 rounded-3xl border border-white/5 bg-[#020617]/40 backdrop-blur-xl">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Live Intercepts
                            </h3>
                            <div className="space-y-2">
                                {data?.recent_alerts.slice(0, 3).map((alert, i) => (
                                    <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                                        <span className="text-xs text-slate-300 font-mono leading-relaxed">{alert}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="h-full flex items-center justify-center border border-white/5 rounded-3xl bg-[#020617]/20 border-dashed">
                        <div className="text-center space-y-2">
                            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
                            <p className="text-slate-500 font-medium">Select a risk vector to analyze</p>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>
      
      {/* Footer / Compliance Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400"><Server className="w-5 h-5"/></div>
              <div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Infra Health</div>
                  <div className="text-lg font-bold text-white">99.98% Uptime</div>
              </div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><Lock className="w-5 h-5"/></div>
              <div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Compliance Score</div>
                  <div className="text-lg font-bold text-white">{data?.compliance_score}% ISO-27001</div>
              </div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400"><Flame className="w-5 h-5"/></div>
              <div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active Incidents</div>
                  <div className="text-lg font-bold text-white">0 Critical</div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default RiskPage;
