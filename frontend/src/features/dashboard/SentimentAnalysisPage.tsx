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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
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
  key_drivers: string[];
  trending_mentions: Array<{
    text: string;
    sentiment: number;
    source: string;
  }>;
}

const SentimentAnalysisPage = () => {
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompetitorId) return;
      setLoading(true);
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/sentiment-analysis?competitor_id=${selectedCompetitorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCompetitorId, token]);

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
          <h1 className="text-3xl font-black text-[#1D1D1F] uppercase italic tracking-tighter">Market <span className="text-[#AF52DE]">Sentiment</span></h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] mt-2 font-medium italic">Customer perception and emotional response tracking.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E5EA] bg-white text-sm font-bold text-[#1D1D1F] focus:outline-none shadow-apple-sm"
          >
            {competitors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button variant="outline" className="rounded-full border-[#E5E5EA] bg-white shadow-apple-sm">
            <Filter size={16} className="mr-2 text-[#0071E3]" />
            Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#0071E3]/20 border-t-[#0071E3] rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Overview Card */}
            <div className="lg:col-span-1 p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple flex flex-col items-center text-center shadow-sm">
               <div className={cn(
                 "w-20 h-20 rounded-3xl flex items-center justify-center mb-6",
                 data.sentiment_label === 'Positive' ? "bg-emerald-50 text-[#34C759]" :
                 data.sentiment_label === 'Negative' ? "bg-rose-50 text-[#FF3B30]" : "bg-yellow-50 text-[#FFD60A]"
               )}>
                 {data.sentiment_label === 'Positive' ? <Smile size={48} /> : 
                  data.sentiment_label === 'Negative' ? <Frown size={48} /> : <Meh size={48} />}
               </div>
               <h3 className="text-4xl font-black text-[#1D1D1F] tracking-tighter mb-1 uppercase italic leading-none">
                 {data.overall_score}%
               </h3>
               <p className="text-sm font-black text-[#86868B] dark:text-[#A1A1A6] mb-6 uppercase tracking-widest italic">{data.sentiment_label} Reception</p>
               
               <div className="w-full h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={8}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Drivers & Mentions */}
            <div className="lg:col-span-2 space-y-10">
              <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                <h3 className="text-xl font-black text-[#1D1D1F] mb-8 flex items-center gap-2 uppercase italic tracking-tighter">
                  <Star className="text-[#0071E3]" size={20} />
                  Narrative Drivers
                </h3>
                <div className="flex flex-wrap gap-4">
                  {data.key_drivers.map((driver, i) => (
                    <div key={i} className="px-6 py-3 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-sm font-bold text-[#1D1D1F] flex items-center gap-3">
                       <Zap size={14} className="text-[#0071E3]" />
                       {driver}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                <h3 className="text-xl font-black text-[#1D1D1F] mb-8 flex items-center gap-2 uppercase italic tracking-tighter">
                  <MessageSquare className="text-[#AF52DE]" size={20} />
                  Voice of Market
                </h3>
                <div className="space-y-6">
                  {data.trending_mentions.map((mention, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-[#F5F5F7]/50 hover:bg-[#F5F5F7] transition-all group">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">{mention.source}</span>
                         {mention.sentiment > 0.5 ? <TrendingUp size={16} className="text-[#34C759]" /> : <TrendingDown size={16} className="text-[#FF3B30]" />}
                      </div>
                      <p className="text-[#1D1D1F] font-medium leading-relaxed italic">"{mention.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlight */}
          <div className="p-10 rounded-[40px] bg-[#1D1D1F] text-white flex flex-col md:flex-row items-center justify-between gap-8">
             <div>
                <h3 className="text-2xl font-bold mb-2">Elevate your brand perception</h3>
                <p className="text-[#86868B] font-medium">Use AI-driven insights to pivot your product strategy and outpace competitors.</p>
             </div>
             <Button className="h-14 px-8 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-lg group">
                Generate Strategy Report
                <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </Button>
          </div>
        </>
      ) : (
        <div className="h-96 flex items-center justify-center text-[#6E6E73] font-medium">
          Select a competitor to analyze sentiment.
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisPage;
