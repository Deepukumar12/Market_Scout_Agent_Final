import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar } from 'lucide-react';

interface SourceCardProps {
  title: string;
  source: string;
  date: string;
  url: string;
}

const SourceCard: React.FC<SourceCardProps> = ({ title, source, date, url }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-card p-5 rounded-3xl border border-border shadow-apple flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            {source}
          </span>
        </div>
        <h4 className="text-base font-bold text-foreground line-clamp-2 leading-tight mb-3">
          {title}
        </h4>
      </div>
      
      <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Calendar size={14} />
          {date}
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
        >
          <ExternalLink size={18} />
        </a>
      </div>
    </motion.div>
  );
};

export default SourceCard;
