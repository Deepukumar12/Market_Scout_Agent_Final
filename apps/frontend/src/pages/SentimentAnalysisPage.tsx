import { useEffect, useState } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Star,
  Zap,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { getSentimentAnalysis } from '@/services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface SentimentData {
  overall_score: number;
  sentiment_label: 'Positive' | 'Neutral' | 'Negative';
  total_mentions: number;
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  key_drivers: Array<{ name: string; url?: string }>;
  trending_mentions: Array<{
    text: string;
    sentiment: number;
    source: string;
    url?: string;
  }>;
}

const SentimentAnalysisPage = () => {
  const navigate = useNavigate();
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (competitors.length > 0 && !selectedCompetitorId) {
      setSelectedCompetitorId(competitors[0].id || null);
    }
  }, [competitors, selectedCompetitorId, setSelectedCompetitorId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompetitorId) return;
      setLoading(true);
      try {
        const json = await getSentimentAnalysis(selectedCompetitorId);
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Listen for manual refreshes from the modal completion or websocket
    window.addEventListener('intelligence-refresh', fetchData);
    
    const interval = setInterval(fetchData, 30000);
    return () => {
      window.removeEventListener('intelligence-refresh', fetchData);
      clearInterval(interval);
    };
  }, [selectedCompetitorId]);

  const pieData = data ? [
    { name: 'Positive', value: data.breakdown.positive, color: '#34C759' },
    { name: 'Neutral', value: data.breakdown.neutral, color: '#FFD60A' },
    { name: 'Negative', value: data.breakdown.negative, color: '#FF3B30' },
  ] : [];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Market <span className="text-[#AF52DE]">Sentiment</span></h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] mt-2 font-medium italic">Customer perception and emotional response tracking.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-10 px-6 rounded-full border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white focus:outline-none shadow-apple-sm transition-all italic"
          >
            {competitors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button variant="outline" className="rounded-full border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-white/5 shadow-apple-sm h-10 px-6 text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white italic">
            <Filter size={14} className="mr-2 text-[#0071E3]" />
            Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-[#0071E3]/10 border-t-[#0071E3] rounded-full animate-spin" />
            <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.3em] animate-pulse">Analyzing Signal Frequencies...</p>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Overview Card */}
            <div className="lg:col-span-1 p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large flex flex-col items-center text-center shadow-sm transition-all duration-500">
               <div className={cn(
                 "w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-apple-sm transition-transform hover:rotate-6",
                 data.sentiment_label === 'Positive' ? "bg-emerald-500/10 text-emerald-500" :
                 data.sentiment_label === 'Negative' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
               )}>
                 {data.sentiment_label === 'Positive' ? <Smile size={56} /> : 
                  data.sentiment_label === 'Negative' ? <Frown size={56} /> : <Meh size={56} />}
               </div>
               <h3 className="text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tighter mb-2 uppercase italic leading-none">
                 {data.overall_score}%
               </h3>
               <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] mb-10 uppercase tracking-[0.2em] italic">{data.sentiment_label} Reception</p>
               
               <div className="w-full h-[220px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       innerRadius={65}
                       outerRadius={85}
                       paddingAngle={10}
                       dataKey="value"
                       animationDuration={1500}
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px', fontWeight: 'bold' }}
                       itemStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-[10px] font-black text-[#86868B] uppercase tracking-widest italic">Core Breakdown</div>
                 </div>
               </div>
            </div>

            {/* Drivers & Mentions */}
            <div className="lg:col-span-2 space-y-10">
              <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large shadow-sm transition-all duration-500">
                <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white mb-10 flex items-center gap-4 uppercase italic tracking-tighter">
                  <Star className="text-[#0071E3] fill-current" size={24} />
                  Narrative Drivers
                </h3>
                <div className="flex flex-wrap gap-4">
                  {data.key_drivers.map((driver, i) => (
                    driver.url ? (
                      <a 
                        key={i} 
                        href={driver.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-8 py-4 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[11px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white flex items-center gap-4 hover:border-[#0071E3]/40 transition-all shadow-sm italic hover:bg-white/10 group"
                      >
                         <Zap size={16} className="text-[#0071E3] fill-current" />
                         {driver.name}
                         <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <a 
                        key={i} 
                        href={`https://www.google.com/search?q=${encodeURIComponent(driver.name)}+${encodeURIComponent(competitors.find(c => c.id === selectedCompetitorId)?.name || '')}+market+signal`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[11px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white flex items-center gap-4 hover:border-[#0071E3]/40 transition-all shadow-sm italic hover:bg-white/10 group"
                      >
                         <Zap size={16} className="text-[#0071E3] fill-current" />
                         {driver.name}
                         <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )
                  ))}
                </div>
              </div>

              <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large shadow-sm transition-all duration-500">
                <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white mb-10 flex items-center gap-4 uppercase italic tracking-tighter">
                  <MessageSquare className="text-[#AF52DE] fill-current" size={24} />
                  Voice of Market
                </h3>
                <div className="space-y-6">
                  {data.trending_mentions.map((mention, i) => (
                    <div key={i} className="p-8 rounded-[32px] bg-[#F5F5F7]/50 dark:bg-white/5 border border-transparent hover:border-[#E5E5EA] dark:hover:border-white/10 transition-all group shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">{mention.source}</span>
                         {mention.sentiment > 0.5 ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
                      </div>
                      <a 
                        href={mention.url || `https://www.google.com/search?q=${encodeURIComponent(mention.text)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-[#1D1D1F] dark:text-white font-medium leading-relaxed italic pr-12 group-hover:text-[#0071E3] transition-colors flex items-start gap-2"
                      >
                        "{mention.text}"
                        <ArrowUpRight className="w-4 h-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlight */}
          <div className="p-12 rounded-[48px] bg-[#1D1D1F] dark:bg-[#1C1C1E] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-apple-large relative overflow-hidden transition-all duration-500">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071E3]/20 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse-slow" />
             <div className="relative z-10">
                <h3 className="text-3xl font-black mb-3 uppercase italic tracking-tighter">Elevate your brand perception</h3>
                <p className="text-[#86868B] font-medium text-lg italic">Use AI-driven insights to pivot your product strategy and outpace competitors.</p>
             </div>
             <Button 
                onClick={() => {
                  const comp = competitors.find(c => c.id === selectedCompetitorId);
                  if (comp) {
                    navigate('/dashboard/ai-suggestions', { state: { competitor: comp.name } });
                  }
                }}
                className="h-16 px-10 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 group relative z-10 transition-all hover:scale-105 active:scale-95 italic"
              >
                Generate Strategy Report
                <ArrowUpRight className="ml-3 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </Button>
          </div>
        </>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 flex items-center justify-center shadow-apple-sm">
             <Filter size={24} className="text-[#86868B]" />
          </div>
          <p className="text-sm text-[#6E6E73] dark:text-[#86868B] font-black uppercase tracking-[0.2em] italic">
            Select a competitor to analyze sentiment.
          </p>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisPage;
