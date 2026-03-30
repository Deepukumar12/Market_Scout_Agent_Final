import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface InsightPanelProps {
  insight: string;
  focusAreas: string[];
}

const InsightPanel: React.FC<InsightPanelProps> = ({ insight, focusAreas }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-[40px] bg-[#1D1D1F] text-white shadow-apple relative overflow-hidden h-full border border-white/10"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071E3]/20 blur-3xl rounded-full -mr-16 -mt-16" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-[#0071E3] flex items-center justify-center shadow-lg">
          <Zap size={20} className="fill-current" />
        </div>
        <h3 className="text-lg font-black uppercase italic tracking-tighter">AI Stratagem</h3>
      </div>
        
      <p className="text-white text-lg leading-relaxed font-medium mb-8 relative z-10">
        {insight}
      </p>
      
      <div className="space-y-3 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B]">Priority Vectors</p>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map((area, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest italic">
              {area}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default InsightPanel;
