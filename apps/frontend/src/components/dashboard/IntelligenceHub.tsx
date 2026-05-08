import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  TrendingUp, 
  Newspaper, 
  MessageSquare, 
  Youtube, 
  Search, 
  DollarSign, 
  Users,
  ExternalLink,
  Globe,
  PieChart
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { ScanReport } from '@/store/intelStore';

interface HubProps {
  report: ScanReport | null;
}

const IntelligenceHub: React.FC<HubProps> = ({ report }) => {
  if (!report) return null;

  return (
    <div className="space-y-10">
      {/* 1. Header: Enterprise Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-8 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 border border-[#E5E5EA] dark:border-white/10 backdrop-blur-xl flex gap-8 items-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            {report.company?.logo ? (
              <img src={report.company.logo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <Building2 className="w-12 h-12 text-blue-500" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">
              {report.company?.name || report.competitor}
            </h2>
            <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] font-medium leading-relaxed max-w-xl italic">
              {report.company?.description || "Technical profile analysis in progress..."}
            </p>
            <div className="flex gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full border border-[#0071E3]/20">
                <Globe className="w-3 h-3" /> {report.company?.industry || "Tech Sector"}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Users className="w-3 h-3" /> {report.company?.metrics?.employees || "---"} Employees
              </span>
            </div>
          </div>
        </motion.div>

        {/* Financial Snapshot */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[40px] bg-[#0071E3] text-white flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <DollarSign className="w-8 h-8 opacity-50" />
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 italic">Ticker</div>
              <div className="text-2xl font-black uppercase">{report.financials?.symbol || "N/A"}</div>
            </div>
          </div>
          <div>
            <div className="text-5xl font-black tracking-tighter italic">
              ${report.financials?.current_price?.toFixed(2) || "---"}
            </div>
            <div className={cn(
              "text-xs font-black uppercase flex items-center gap-1 mt-1",
              (report.financials?.percent_change || 0) >= 0 ? "text-emerald-300" : "text-rose-300"
            )}>
              <TrendingUp className="w-3 h-3" /> {report.financials?.percent_change?.toFixed(2) || "0.00"}% 24h
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Middle Row: News and Social Sentiment */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* News Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Newspaper className="w-5 h-5 text-[#0071E3]" /> Latest <span className="text-[#0071E3]">Intelligence</span>
            </h3>
            <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">Live API Feed</span>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {report.news && report.news.length > 0 ? report.news.map((item, i) => (
              <motion.a 
                key={i}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 hover:border-[#0071E3]/30 hover:shadow-apple-sm transition-all group"
              >
                <div className="text-[9px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 italic">
                  {item.source} • {new Date(item.published_at).toLocaleDateString('en-IN')}
                </div>
                <h4 className="text-sm font-black text-[#1D1D1F] dark:text-white group-hover:text-[#0071E3] transition-colors line-clamp-2 uppercase italic tracking-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-[#6E6E73] dark:text-[#86868B] mt-3 line-clamp-2 leading-relaxed font-medium italic">
                  {item.description}
                </p>
              </motion.a>
            )) : (
              <div className="py-20 text-center text-[#86868B] dark:text-[#A1A1A6] font-black uppercase tracking-widest italic">No real-time news articles detected.</div>
            )}
          </div>
        </div>

        {/* Social & Community Hub */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#AF52DE]" /> Community <span className="text-[#AF52DE]">Resonance</span>
            </h3>
            <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">Reddit & YouTube</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Social Metrics */}
             <div className="p-8 rounded-[40px] bg-white border border-[#E5E5EA] dark:bg-[#1D1D1F] dark:border-white/10 shadow-apple-sm">
                <PieChart className="w-6 h-6 text-[#AF52DE] mb-4" />
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-[#86868B] uppercase italic tracking-widest">Visibility Index</span>
                    <span className="text-2xl font-black text-[#1D1D1F] dark:text-white">{report.search_visibility?.ad_count > 0 ? 'HIGH' : 'STABLE'}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#AF52DE] w-[75%]" />
                  </div>
                  <p className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] font-medium italic">
                    Detected {report.social.length} active community threads in the last 30 days.
                  </p>
                </div>
             </div>

             {/* Search Performance */}
             <div className="p-8 rounded-[40px] bg-white border border-[#E5E5EA] dark:bg-[#1D1D1F] dark:border-white/10 shadow-apple-sm">
                <Search className="w-6 h-6 text-[#0071E3] mb-4" />
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-[#86868B] uppercase italic tracking-widest">Total Visibility</div>
                  <div className="text-2xl font-black text-[#1D1D1F] dark:text-white">
                    {report.search_visibility?.total_results ? (parseInt(report.search_visibility.total_results.toString().replace(/,/g, '')) / 1000000).toFixed(1) + 'M' : '---'}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {report.search_visibility?.related_queries?.slice(0, 3).map((q: string, i: number) => (
                      <span key={i} className="text-[8px] font-bold bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-100 dark:border-white/10 uppercase">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-3">
             {report.social.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10">
                   {s.video_id ? <Youtube className="text-rose-500 w-5 h-5 flex-shrink-0" /> : <MessageSquare className="text-orange-500 w-5 h-5 flex-shrink-0" />}
                   <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-[#1D1D1F] dark:text-white truncate uppercase italic">{s.title}</div>
                      <div className="text-[9px] text-[#86868B] uppercase tracking-widest">{s.subreddit || s.channel || 'Social'} • {s.score || s.published_at?.split('T')[0]}</div>
                   </div>
                   <ExternalLink className="w-3 h-3 text-[#86868B]" />
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceHub;
