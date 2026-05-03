import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  className?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  className,
  isLoading = false
}) => {
  const isPositive = trend === 'up';
  
  if (isLoading) {
    return (
      <div className={cn(
        "bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl p-8 rounded-[40px] border border-[#E5E5EA] dark:border-white/10 shadow-apple animate-pulse",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="w-16 h-6 rounded-full bg-gray-100 dark:bg-gray-900" />
        </div>
        <div className="mt-8">
          <div className="w-24 h-3 rounded bg-gray-100 dark:bg-gray-900 mb-2" />
          <div className="w-32 h-10 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-[#E5E5EA] dark:border-white/10 shadow-apple flex flex-col justify-between h-full",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white">
          <Icon size={22} strokeWidth={2} />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
          isPositive ? "bg-[#34C759]/10 text-[#34C759]" : "bg-red-500/10 text-red-500"
        )}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-[#636366] dark:text-[#A1A1A6] text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">{title}</p>
        <h3 className="text-4xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase italic">{value}</h3>
      </div>
    </motion.div>
  );
};

export default StatCard;
