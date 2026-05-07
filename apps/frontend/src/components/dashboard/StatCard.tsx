
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvidenceBadge, EvidencePanel, Source } from '@/components/ui/EvidenceUI';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  className?: string;
  isLoading?: boolean;
  sources?: Source[];
  confidence?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  className,
  isLoading = false,
  sources = [],
  confidence = 92
}) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const isPositive = trend === 'up';
  
  if (isLoading) {
    return (
      <div className={cn(
        "bg-card/70 backdrop-blur-xl p-8 rounded-[40px] border border-border shadow-apple animate-pulse",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-muted" />
          <div className="w-16 h-6 rounded-full bg-muted/50" />
        </div>
        <div className="mt-8">
          <div className="w-24 h-3 rounded bg-muted/50 mb-2" />
          <div className="w-32 h-10 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "bg-card/70 backdrop-blur-xl p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-border shadow-apple flex flex-col justify-between h-full relative",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-muted text-foreground">
          <Icon size={22} strokeWidth={2} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
            isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {change}
          </div>
          <EvidenceBadge 
            count={sources.length || 3} 
            confidence={confidence} 
            onClick={() => setShowEvidence(!showEvidence)}
          />
        </div>
      </div>
      
      <div className="mt-4 relative">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">{title}</p>
        <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">{value}</h3>
        
        <EvidencePanel 
          sources={sources.length > 0 ? sources : [
            { title: `${title} - Sector Analysis`, url: "#", platform: "Open Web Intelligence", date: "Real-time" }
          ]}
          isOpen={showEvidence}
          onClose={() => setShowEvidence(false)}
        />
      </div>
    </motion.div>
  );
};

export default StatCard;
