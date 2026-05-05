import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import { MonthlyRelease } from '@/store/intelStore';

interface MonthlyFeaturesProps {
  features: MonthlyRelease[];
  title?: string;
  subtitle?: string;
  emptyState?: string;
}

const MonthlyFeatures = ({ features, title = "Monthly Releases", subtitle = "Technical Innovation Surface (Last 30 Days)", emptyState }: MonthlyFeaturesProps) => {
  if (!features || features.length === 0) {
    if (emptyState) {
      return (
        <section className="mt-14">
          {title && (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
                  {title.split(' ').slice(0, -1).join(' ')} <span className="text-primary">{title.split(' ').slice(-1)}</span>
                </h1>
                {subtitle && <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 italic">{subtitle}</p>}
              </div>
            </div>
          )}
          <div className="bg-card/30 backdrop-blur-xl p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-dashed border-border text-center">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic mb-2">OPERATIONAL SILENCE DETECTED</p>
             <p className="text-xs font-medium text-muted-foreground italic">{emptyState}</p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mt-14">
      {title && (
         <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
              {title.split(' ').slice(0, -1).join(' ')} <span className="text-primary">{title.split(' ').slice(-1)}</span>
            </h1>
            {subtitle && <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 italic">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest cursor-pointer group italic bg-muted px-4 py-2 rounded-full border border-border shadow-apple-sm">
            View All Updates <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      <div className="max-h-[400px] sm:max-h-[500px] lg:max-h-[700px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-muted/50 scrollbar-track-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
             <motion.div
              key={feature.hash_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple flex flex-col group relative overflow-hidden"
            >
              {/* Gloss Highlight */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0071E3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 rounded-full bg-muted text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] italic">
                  {feature.category}
                </span>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase italic">
                  <Calendar size={12} /> {feature.release_date}
                </div>
              </div>

               <p className="text-[10px] font-black text-accent-foreground uppercase tracking-widest mb-1 italic">
                {feature.company_name}
              </p>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tighter italic leading-tight mb-4 group-hover:text-primary transition-colors">
                {feature.feature_name}
              </h3>

               <div className="mt-auto pt-6 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verified Signal</span>
                </div>
                
                {feature.source_url && (
                  <button 
                    onClick={() => window.open(feature.source_url, '_blank')}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-apple-sm"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {features.length === 0 && (
        <div className="p-10 md:p-20 rounded-[32px] md:rounded-[40px] border-2 border-dashed border-border  flex flex-col items-center justify-center text-muted-foreground italic">
          <p className="text-sm font-bold uppercase tracking-widest">No signals detected in the current cycle</p>
          <p className="text-[10px] mt-2">Intelligence gathering active...</p>
        </div>
      )}
    </section>
  );
};

export default MonthlyFeatures;
