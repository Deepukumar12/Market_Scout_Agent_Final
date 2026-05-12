import { motion } from 'framer-motion';
import { ShieldAlert, Lightbulb, Activity, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { MissionBriefingData } from '@/store/intelStore';
import CircularGauge from './CircularGauge';

interface MissionBriefingProps {
  data: MissionBriefingData | null;
}

const MissionBriefing = ({ data }: MissionBriefingProps) => {
  if (!data) return (
    <div className="w-full h-48 rounded-[32px] bg-white dark:bg-[#0A0A0C] border border-[#E5E5EA] dark:border-white/10 shadow-apple animate-pulse" />
  );

  return (
    <section className="space-y-6">

      {/* ── Row 1: Wide horizontal summary banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col lg:flex-row items-stretch gap-0 rounded-[36px] overflow-hidden border border-[#E5E5EA] dark:border-white/10 shadow-apple bg-white dark:bg-[#0A0A0C]"
      >
        {/* Left – summary text */}
        <div className="flex-1 px-10 py-8 flex flex-col justify-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />

          {/* header row */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.3em] italic">
              Operational Intelligence Stream
            </span>
            <div className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-[#0071E3]/20 border border-[#0071E3]/20">
              <Activity size={12} className="text-[#0071E3]" />
              <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest italic">{data.sentiment_pulse}</span>
            </div>
          </div>

          {/* executive summary */}
          <h2 className="text-xl lg:text-2xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tight italic leading-tight max-w-2xl relative z-10">
            {data.executive_summary}
          </h2>

          {/* tags */}
          <div className="flex flex-wrap gap-2 relative z-10">
            {(data.tags || []).map((tag, i) => (
              tag.url ? (
                <a 
                  key={i} 
                  href={tag.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[9px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-widest italic hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center gap-1 group/tag"
                >
                  {tag.name}
                  <ArrowUpRight size={8} className="opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                </a>
              ) : (
                <span key={i} className="px-4 py-1.5 rounded-xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[9px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-widest italic">
                  {tag.name}
                </span>
              )
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-[1px] bg-[#E5E5EA] dark:bg-white/10 self-stretch" />

        {/* Right – gauges panel (wide, short) */}
        <div className="flex items-center justify-center gap-12 px-14 py-8 bg-[#FAFAFA] dark:bg-[#111] shrink-0">
          <CircularGauge value={data.confidence_score} size={80} strokeWidth={9} color="#0071E3" label={data.confidence_score.toString()} sublabel="Confidence" />
          <div className="self-stretch w-[1px] bg-[#E5E5EA] dark:bg-white/10 rounded-full" />
          <CircularGauge value={data.integrity_score} size={80} strokeWidth={9} color="#34C759" label={data.integrity_score.toString()} sublabel="Integrity" />
        </div>
      </motion.div>

      {/* ── Row 2: Risks + Opportunities side-by-side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Technical Risks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[28px] border border-rose-500/20 bg-white dark:bg-[#0A0A0C] shadow-apple p-8 group hover:border-rose-500/40 transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-apple-sm">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.25em] italic">Intelligence Alert</p>
              <h4 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-tight leading-none mt-0.5">Technical Risks</h4>
            </div>
          </div>
          <ul className="space-y-3">
            {data.technical_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed italic group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-[6px] shrink-0 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                {risk.url ? (
                  <a href={risk.url} target="_blank" rel="noopener noreferrer" className="hover:text-rose-600 dark:hover:text-rose-400 hover:underline decoration-rose-500/30 underline-offset-4 transition-all">
                    {risk.text}
                  </a>
                ) : risk.text}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Market Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[28px] border border-[#0071E3]/20 bg-[#0071E3]/5 dark:bg-[#0071E3]/5 shadow-apple p-8 group hover:border-[#0071E3]/40 transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] border border-[#0071E3]/20 shadow-apple-sm">
              <Lightbulb size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-[#0071E3] uppercase tracking-[0.25em] italic">Strategic Vector</p>
              <h4 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-tight leading-none mt-0.5">Market Opportunities</h4>
            </div>
          </div>
          <ul className="space-y-3">
            {data.market_opportunities.map((opp, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed italic group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] mt-[6px] shrink-0 shadow-[0_0_6px_rgba(0,113,227,0.6)]" />
                {opp.url ? (
                  <a href={opp.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline decoration-blue-500/30 underline-offset-4 transition-all">
                    {opp.text}
                  </a>
                ) : opp.text}
              </li>
            ))}
          </ul>
        </motion.div>

      </div>
    </section>
  );
};

export default MissionBriefing;
