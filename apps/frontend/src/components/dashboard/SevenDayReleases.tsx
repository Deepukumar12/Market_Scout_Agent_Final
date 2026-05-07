import { motion } from 'framer-motion';
import { Zap, ExternalLink, Calendar, Tag } from 'lucide-react';
import { SevenDaySignal } from '@/store/intelStore';

interface SevenDayReleasesProps {
  features: SevenDaySignal[];
  title?: string;
  subtitle?: string;
}

const SevenDayReleases = ({ 
  features, 
  title = "7-Day Innovation Pulse", 
  subtitle = "Week-over-week technical releases and signals." 
}: SevenDayReleasesProps) => {
  if (!features || features.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">
            {title.split(' ')[0]} <span className="text-[#AF52DE]">{title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mt-1 italic">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#AF52DE] animate-pulse" />
            <span className="text-[10px] font-black text-[#AF52DE] uppercase tracking-widest italic">Live Signals</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.hash_id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative p-6 rounded-[32px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple hover:shadow-apple-lg transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#AF52DE]/10 flex items-center justify-center text-[#AF52DE]">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest leading-none">
                    {feature.company_name}
                  </h3>
                  <div className="text-[9px] font-bold text-[#AF52DE] uppercase mt-1">{feature.source_type || 'Signal'}</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-[#86868B] bg-[#F5F5F7] dark:bg-white/5 px-2 py-1 rounded">
                {feature.release_date}
              </span>
            </div>

            <h4 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tight mb-3 group-hover:text-[#AF52DE] transition-colors line-clamp-2">
              {feature.feature_name}
            </h4>

            <p className="text-[11px] text-[#6E6E73] dark:text-[#86868B] font-medium italic leading-relaxed mb-6 line-clamp-3">
              {feature.summary || "Technical innovation detected within the surveillance window. Analyzing impact on market trajectory."}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5EA] dark:border-white/5">
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-[#AF52DE]" />
                <span className="text-[9px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest italic">{feature.category}</span>
              </div>
              
              {feature.source_url && (
                <a 
                  href={feature.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#F5F5F7] dark:bg-white/5 text-[#86868B] hover:text-[#AF52DE] hover:bg-[#AF52DE]/10 transition-all"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SevenDayReleases;
