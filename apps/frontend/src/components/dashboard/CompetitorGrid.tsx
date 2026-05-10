import { motion } from 'framer-motion';
import { Shield, Sparkles, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { MarketComparisonMetric } from '@/store/intelStore';
import { cn } from '@/utils/utils';

interface CompetitorGridProps {
  data: MarketComparisonMetric[];
  loading?: boolean;
}

const CompetitorGrid = ({ data, loading }: CompetitorGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-[40px] bg-white/50 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((comp, idx) => (
        <motion.div
          key={comp.competitor}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="group p-8 rounded-[40px] bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple hover:shadow-apple-lg transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Shield size={120} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[9px] font-black uppercase tracking-widest italic border border-[#0071E3]/20">
                {comp.sector}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                comp.velocity === 'High' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}>
                {comp.velocity} Velocity
              </div>
            </div>

            <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter mb-8 group-hover:text-[#0071E3] transition-colors">
              {comp.competitor}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-1">
                <div className="text-[9px] font-black text-[#86868B] uppercase tracking-widest opacity-60 italic">Innovation Score</div>
                <div className="text-xl font-black text-[#1D1D1F] dark:text-white italic">{comp.innovation_score}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] font-black text-[#86868B] uppercase tracking-widest opacity-60 italic">Features Discovered</div>
                <div className="text-xl font-black text-[#1D1D1F] dark:text-white italic">{comp.features_count}</div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E5EA] dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className={cn(
                  comp.sentiment === 'Positive' ? "text-emerald-500" : "text-blue-500"
                )} />
                <span className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest italic">
                  Sentiment: <span className={comp.sentiment === 'Positive' ? "text-emerald-500" : "text-blue-500"}>{comp.sentiment}</span>
                </span>
              </div>
              <button className="w-8 h-8 rounded-full bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center group-hover:bg-[#0071E3] group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CompetitorGrid;
