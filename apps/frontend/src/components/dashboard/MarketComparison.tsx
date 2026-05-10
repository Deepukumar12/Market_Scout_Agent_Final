import { motion } from 'framer-motion';
import { Shield, Zap, BarChart3 } from 'lucide-react';
import { MarketComparisonMetric } from '@/store/intelStore';
import { cn, getCompetitorColor } from '@/utils/utils';

interface MarketComparisonProps {
  data: MarketComparisonMetric[];
}

const MarketComparison = ({ data }: MarketComparisonProps) => {
  if (!data || data.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Market <span className="text-blue-600">Comparison</span></h2>
          <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mt-2 italic opacity-60">Comparative Data Points Matrix</p>
        </div>
        <div className="flex items-center gap-4">
           <a 
            href="/api/v1/intelligence/market-comparison" 
            target="_blank"
            className="text-[10px] font-black uppercase tracking-widest text-[#0071E3] bg-[#0071E3]/10 px-4 py-2 rounded-full border border-[#0071E3]/20 hover:scale-105 transition-all italic"
           >
             Verify Matrix Data
           </a>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-[40px] border border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl shadow-apple">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F5F5F7] dark:border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-[#86868B] uppercase tracking-widest italic">Competitor</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#86868B] uppercase tracking-widest italic text-center">Features Found</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#86868B] uppercase tracking-widest italic text-center">Innovation Score</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#86868B] uppercase tracking-widest italic text-center">Risk Level</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#86868B] uppercase tracking-widest italic text-center">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <motion.tr 
                  key={row.competitor}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group hover:bg-[#F5F5F7]/50 dark:hover:bg-white/5 transition-colors border-b border-[#F5F5F7] dark:border-white/5 last:border-0"
                >
                  <td className="px-8 py-6">
                    <div 
                      className="font-black uppercase tracking-tighter italic"
                      style={{ color: getCompetitorColor(row.competitor) }}
                    >
                      {row.competitor}
                    </div>
                    <div className="text-[10px] font-bold text-[#34C759] uppercase">{row.sentiment} Sentiment</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black text-[#1D1D1F] dark:text-white">{row.features_count}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-black italic" style={{ color: getCompetitorColor(row.competitor) }}>
                        {row.innovation_score}/100
                      </span>
                      <div className="w-24 h-1.5 bg-[#F5F5F7] dark:bg-[#3A3A3C] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${row.innovation_score}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getCompetitorColor(row.competitor) }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2 border",
                        row.risk_level === 'Low' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : row.risk_level === 'Medium' 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      )}>
                        <Shield size={10} className="fill-current" /> {row.risk_level}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center">
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest italic ${
                        row.velocity === 'High' ? 'text-[#AF52DE]' : 'text-[#86868B]'
                      }`}>
                        {row.velocity === 'High' ? <Zap size={12} fill="currentColor" /> : <BarChart3 size={12} />}
                        {row.velocity}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default MarketComparison;
