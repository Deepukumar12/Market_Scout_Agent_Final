import { motion } from 'framer-motion';
import { Shield, Zap, BarChart3 } from 'lucide-react';
import { MarketComparisonMetric } from '@/store/intelStore';
import { getCompetitorColor } from '@/lib/utils';

interface MarketComparisonProps {
  data: MarketComparisonMetric[];
}

const MarketComparison = ({ data }: MarketComparisonProps) => {
  if (!data || data.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] italic mb-2">Market Comparison Matrix</h2>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest italic">
          Live Analysis
        </div>
      </div>
      
      <div className="overflow-hidden rounded-[40px] border border-border bg-card/70 backdrop-blur-xl shadow-apple">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Competitor</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-center">Features Found</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-center">Innovation Score</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-center">Risk Level</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-center">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <motion.tr 
                  key={row.competitor}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  <td className="px-8 py-6">
                    <div 
                      className="font-black uppercase tracking-tighter italic"
                      style={{ color: getCompetitorColor(row.competitor) }}
                    >
                      {row.competitor}
                    </div>
                    <div className="text-[10px] font-bold text-green-500 uppercase">{row.sentiment} Sentiment</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black text-foreground">{row.features_count}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-black italic" style={{ color: getCompetitorColor(row.competitor) }}>
                        {row.innovation_score}/100
                      </span>
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
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
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic flex items-center gap-1.5 ${
                        row.risk_level === 'Low' ? 'bg-green-500/10 text-green-500' :
                        row.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        <Shield size={10} /> {row.risk_level}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center">
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest italic ${
                        row.velocity === 'High' ? 'text-accent-foreground' : 'text-muted-foreground'
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
