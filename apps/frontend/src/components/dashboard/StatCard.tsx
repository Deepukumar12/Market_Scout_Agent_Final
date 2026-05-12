import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/utils';
import CircularGauge from './CircularGauge';

interface StatCardProps {
  title: string;
  value: string | number;
  trendValue?: number | string;
  icon: React.ElementType;
  className?: string;
  loading?: boolean;
  sourceUrl?: string;
  internalLink?: string;
  showGauge?: boolean;
  description?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  trendValue = 0, 
  icon: Icon,
  className,
  loading,
  sourceUrl,
  internalLink,
  showGauge,
  description,
  onClick
}) => {
  const navigate = useNavigate();
  const isPositive = typeof trendValue === 'number' ? trendValue >= 0 : !String(trendValue).startsWith('-');
  const absTrend = typeof trendValue === 'number' ? Math.abs(trendValue) : String(trendValue).replace(/[+\-%]/g, '');
  
  const content = (
    <>
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
          {absTrend}%
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-end relative z-10">
        <div className="mb-2">
          <p className="text-[#86868B] dark:text-[#A1A1A6] text-[10px] font-black uppercase tracking-[0.3em] italic opacity-60 leading-none truncate">{title}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <h3 className={cn(
            "text-3xl lg:text-4xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic leading-[0.9] break-all",
            (internalLink || sourceUrl || onClick) && "group-hover:text-blue-600 transition-colors"
          )}>
            {value}
          </h3>
          {showGauge && (
            <div className="flex-shrink-0">
               <CircularGauge 
                 value={(() => {
                   if (typeof value === 'number') return Math.min(100, value);
                   const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ''));
                   return isNaN(parsed) ? 75 : Math.min(100, parsed);
                 })()} 
                 size={60} 
                 strokeWidth={8} 
                 color={isPositive ? "#34C759" : "#FF3B30"} 
               />
            </div>
          )}
        </div>
        {description && (
          <p className="text-[#6E6E73] dark:text-[#86868B] text-xs mt-4 leading-relaxed italic line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {sourceUrl && (
        <div className="pt-6 mt-6 border-t border-[#F0F0F3] dark:border-white/5 flex justify-between items-center relative z-10">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#86868B] italic opacity-40">Asset Verified</span>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0071E3] bg-[#0071E3]/5 px-4 py-2 rounded-xl border border-[#0071E3]/20 hover:bg-[#0071E3] hover:text-white transition-all flex items-center gap-1.5 backdrop-blur-sm italic">
            Link <ExternalLink size={12} />
          </div>
        </div>
      )}
    </>
  );

  if (internalLink) {
    const isHash = internalLink.startsWith('#');
    return (
      <motion.div
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className={cn(
          "premium-card p-10 lg:p-12 h-full group relative overflow-hidden flex flex-col justify-between cursor-pointer block",
          className
        )}
        onClick={() => {
          if (isHash) {
            const el = document.querySelector(internalLink);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            navigate(internalLink);
          }
        }}
      >
        {content}
      </motion.div>
    );
  }

  if (sourceUrl) {
    return (
      <motion.a
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "premium-card p-10 lg:p-12 h-full group relative overflow-hidden flex flex-col justify-between cursor-pointer block",
          className
        )}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onClick={onClick}
      className={cn(
        "premium-card p-10 lg:p-12 h-full group relative overflow-hidden flex flex-col justify-between",
        onClick && "cursor-pointer",
        className
      )}
    >
      {content}
    </motion.div>
  );
};

export default React.memo(StatCard);
