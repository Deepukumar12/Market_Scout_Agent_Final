import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/utils';
import CircularGauge from './CircularGauge';

interface StatCardProps {
  title: string;
  value: string | number;
  trendValue: number;
  icon: React.ElementType;
  className?: string;
  loading?: boolean;
  sourceUrl?: string;
  showGauge?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  trendValue, 
  icon: Icon,
  className,
  loading,
  sourceUrl,
  showGauge
}) => {
  const isPositive = trendValue >= 0;
  const absTrend = Math.abs(trendValue);
  
  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={cn(
        "premium-card p-10 lg:p-12 h-full group relative overflow-hidden flex flex-col justify-between",
        className
      )}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

      <div className="flex items-start justify-between relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center text-[#1D1D1F] dark:text-white group-hover:scale-110 transition-transform shadow-apple-sm border border-[#E5E5EA] dark:border-white/10">
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border",
          isPositive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
        )}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {absTrend}% WoW
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-12 relative z-10">
        <div className="flex-1 pr-6">
          <p className="text-[#86868B] dark:text-[#A1A1A6] text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] mb-3 italic opacity-60 leading-none">{title}</p>
          <h3 className="text-4xl lg:text-6xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-[0.85]">{value}</h3>
        </div>
        {showGauge && (
          <div className="scale-110 flex-shrink-0 relative">
             <CircularGauge 
               value={(() => {
                 if (typeof value === 'number') return Math.min(100, value);
                 const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ''));
                 return isNaN(parsed) ? 75 : Math.min(100, parsed);
               })()} 
               size={90} 
               strokeWidth={10} 
               color={isPositive ? "#34C759" : "#FF3B30"} 
             />
          </div>
        )}
      </div>

      {sourceUrl && (
        <div className="pt-10 mt-10 border-t border-[#F0F0F3] dark:border-white/5 flex justify-between items-center relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#86868B] italic opacity-40">Intelligence Asset</span>
          <a 
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0071E3] bg-[#0071E3]/5 px-6 py-2.5 rounded-2xl border border-[#0071E3]/20 hover:bg-[#0071E3] hover:text-white transition-all flex items-center gap-2 backdrop-blur-sm italic shadow-apple-sm"
          >
            Verify <ExternalLink size={14} />
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(StatCard);
