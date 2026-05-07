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
      className="bg-white dark:bg-[#1D1D1F] p-5 rounded-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#6E6E73] dark:text-[#A1A1A6] text-[10px] font-bold uppercase tracking-wider">
            {source}
          </span>
        </div>
        <h4 className="text-base font-bold text-[#1D1D1F] dark:text-white line-clamp-2 leading-tight mb-3">
          {title}
        </h4>
      </div>
      
      <div className="pt-4 mt-auto border-t border-[#E5E5EA] dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#6E6E73] dark:text-[#A1A1A6] text-xs">
          <Calendar size={14} />
          {date}
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0071E3] hover:bg-[#0071E3]/10 p-2 rounded-full transition-colors"
        >
          <ExternalLink size={18} />
        </a>
      </div>
    </motion.div>
  );
};

export default SourceCard;
