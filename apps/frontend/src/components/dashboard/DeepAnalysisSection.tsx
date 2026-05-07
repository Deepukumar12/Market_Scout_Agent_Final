import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Users, 
  Building2,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeepAnalysisSectionProps {
  report: any;
}

const DeepAnalysisSection: React.FC<DeepAnalysisSectionProps> = ({ report }) => {
  if (!report || (!report.profile && !report.discovered_competitors?.length)) {
    return null;
  }

  const { profile, discovered_competitors } = report;

  return (
    <div className="space-y-12 mt-12">
      {/* Strategic Profile */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card/70 backdrop-blur-xl p-10 rounded-[40px] border border-border shadow-apple"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Strategic <span className="text-primary">Profile</span></h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Business Model & Market DNA</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Business Model</label>
                <p className="text-foreground font-medium italic leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/50">{profile.business_model}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Market Position</label>
                <p className="text-foreground font-medium italic leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/50">{profile.market_position}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Target Audience</label>
                    <p className="text-sm text-foreground font-bold italic">{profile.target_audience}</p>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Core Products</label>
                    <div className="flex flex-wrap gap-2">
                        {profile.core_products?.map((p: string, i: number) => (
                            <span key={i} className="px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-black text-primary uppercase">{p}</span>
                        ))}
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* SWOT Analysis */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <SwotCard title="Strengths" items={profile.swot?.strengths} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/20" icon={<TrendingUp size={16} />} />
            <SwotCard title="Weaknesses" items={profile.swot?.weaknesses} color="text-rose-400" bg="bg-rose-500/5" border="border-rose-500/20" icon={<AlertTriangle size={16} />} />
            <SwotCard title="Opportunities" items={profile.swot?.opportunities} color="text-cyan-400" bg="bg-cyan-500/5" border="border-cyan-500/20" icon={<Zap size={16} />} />
            <SwotCard title="Threats" items={profile.swot?.threats} color="text-amber-400" bg="bg-amber-500/5" border="border-amber-500/20" icon={<ShieldAlert size={16} />} />
          </motion.div>
        </div>
      )}

      {/* Performance Signals */}
      {(report.github || report.talent_intelligence || report.financial_data) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {report.talent_intelligence && (
            <div className="bg-card/70 backdrop-blur-xl p-8 rounded-[40px] border border-border shadow-apple">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Users size={20} />
                 </div>
                 <h4 className="text-sm font-black text-foreground uppercase italic tracking-tighter">Human <span className="text-blue-400">Capital</span></h4>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Headcount</span>
                    <span className="text-lg font-black text-foreground italic">{report.talent_intelligence.employee_count || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hiring Activity</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded-md">
                      {report.talent_intelligence.hiring_status || 'Stable'}
                    </span>
                  </div>
               </div>
            </div>
          )}

          {report.github && (
            <div className="bg-card/70 backdrop-blur-xl p-8 rounded-[40px] border border-border shadow-apple col-span-1 md:col-span-2">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Zap size={20} />
                 </div>
                 <h4 className="text-sm font-black text-foreground uppercase italic tracking-tighter">Technical <span className="text-emerald-400">Velocity</span></h4>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Public Repos</span>
                    <span className="text-xl font-black text-foreground italic">{report.github.total_count || report.github.repos?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Active Devs</span>
                    <span className="text-xl font-black text-foreground italic">{report.github.active_contributors || '12+'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Primary Stack</span>
                    <div className="flex flex-wrap gap-1">
                      {['TypeScript', 'React', 'Go', 'Python'].map((l, i) => (
                        <span key={i} className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-1.5 py-0.5 rounded-md">{l}</span>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Discovered Competitors */}
      {discovered_competitors?.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/70 backdrop-blur-xl rounded-[40px] border border-border shadow-apple overflow-hidden"
        >
          <div className="px-10 py-8 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Market <span className="text-rose-400">Rivals</span></h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Dynamically Identified Competitors</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border/10">
            {discovered_competitors.map((comp: any, i: number) => (
              <div key={i} className="p-8 hover:bg-primary/5 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-black text-foreground uppercase italic tracking-tighter group-hover:text-primary transition-colors">{comp.name}</h4>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">{comp.industry}</span>
                  </div>
                  {comp.url && (
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed mb-4">{comp.difference}</p>
                <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all">
                  ANALYZE RIVAL <ArrowUpRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const SwotCard = ({ title, items, color, bg, border, icon }: any) => (
  <div className={cn("p-6 rounded-[32px] border backdrop-blur-xl flex flex-col", bg, border)}>
    <div className={cn("flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-4", color)}>
      {icon} {title}
    </div>
    <ul className="space-y-3 flex-1">
      {items?.map((item: string, i: number) => (
        <li key={i} className="text-[11px] font-bold text-foreground/80 italic leading-snug flex items-start gap-2">
          <span className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", color.replace('text-', 'bg-'))} />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default DeepAnalysisSection;
