import { Zap, ExternalLink, Calendar, Tag, ChevronRight } from 'lucide-react';
import { SevenDaySignal } from '@/store/intelStore';

interface SevenDayReleasesProps {
  features: SevenDaySignal[];
  title?: string;
  subtitle?: string;
}

const SevenDayReleases = ({ 
  features = [], 
  title = "7-Day Innovation Pulse", 
  subtitle = "Week-over-week technical releases and signals." 
}: SevenDayReleasesProps) => {
  const safeFeatures = Array.isArray(features) ? features : [];
  
  const groupedFeatures = safeFeatures.reduce((acc, feature) => {
    const key = feature.company_name || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(feature);
    return acc;
  }, {} as Record<string, SevenDaySignal[]>);

  if (safeFeatures.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter mb-4">
          {title.split(' ')[0]} <span className="text-[#AF52DE]">{title.split(' ').slice(1).join(' ')}</span>
        </h2>
        <div className="p-10 rounded-3xl bg-[#F5F5F7] dark:bg-white/5 border border-dashed border-[#E5E5EA] dark:border-white/10">
          <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic mb-2">No innovation signals detected</p>
          <p className="text-xs font-medium text-[#6E6E73] italic">Technical releases within the 7-day window will appear here automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-12">
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

      <div className="space-y-16">
        {Object.entries(groupedFeatures).map(([company, companyFeatures], cIdx) => (
          <div key={company} className="space-y-6">
            <div className="flex items-center gap-4 px-8">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#E5E5EA] dark:via-white/10 to-transparent" />
              <h3 className="text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.3em] italic opacity-60">
                {company} <span className="text-[#AF52DE] ml-2">[{companyFeatures.length} Releases]</span>
              </h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#E5E5EA] dark:via-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {companyFeatures.map((feature, idx) => (
                <div
                  key={feature.hash_id || idx}
                  className="h-full"
                >
                  <div className="group relative p-8 rounded-[32px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple hover:shadow-apple-lg transition-all h-full flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#AF52DE]/10 flex items-center justify-center text-[#AF52DE] border border-[#AF52DE]/20">
                          <Zap size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-[#AF52DE] uppercase tracking-widest">{feature.source_type || 'Signal'}</div>
                          <div className="text-[11px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.1em] leading-none mt-1">
                            {feature.category}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-[#86868B] bg-[#F5F5F7] dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest border border-[#E5E5EA] dark:border-white/10">
                        {feature.release_date && feature.release_date !== 'YYYY-MM-DD' ? feature.release_date : new Date().toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tight mb-4 group-hover:text-[#AF52DE] transition-colors leading-tight">
                      {feature.feature_name}
                    </h4>

                    <div className="max-h-[160px] overflow-y-auto custom-scrollbar pr-2 mb-8 flex-1">
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#86868B] font-medium italic leading-relaxed">
                        {feature.summary 
                          ? feature.summary.replace(/Google Cloud Logo News|Skip to content|Home Search|Contact Sales|Try for free/gi, '').trim() 
                          : "Technical innovation detected within the surveillance window. Analyzing impact on market trajectory."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-[#E5E5EA] dark:border-white/5 mt-auto">
                      <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic opacity-60">Verified Signal</span>
                      {feature.source_url && (
                        <a 
                          href={feature.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#AF52DE]/10 text-[#AF52DE] text-[10px] font-black uppercase tracking-widest hover:bg-[#AF52DE] hover:text-white transition-all italic border border-[#AF52DE]/20"
                        >
                          View Source <ChevronRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SevenDayReleases;
