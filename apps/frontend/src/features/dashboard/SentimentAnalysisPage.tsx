import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, 
  Meh, 
  Frown, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Star,
  Zap,
  Info,
  ChevronRight,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { EvidenceBadge, EvidenceCatalog } from '@/components/ui/EvidenceUI';

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
  evidence_catalog: any[];
  last_verified: string;
}

const SentimentAnalysisPage = () => {
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (!selectedCompetitorId && competitors.length > 0) {
      setSelectedCompetitorId(competitors[0].id || competitors[0]._id || null);
    }
  }, [competitors, selectedCompetitorId, setSelectedCompetitorId]);

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

  useEffect(() => {
    fetchData();
  }, [selectedCompetitorId, token]);

  const pieData = data ? [
    { name: 'Positive', value: data.breakdown.positive, color: '#34C759' },
    { name: 'Neutral', value: data.breakdown.neutral, color: '#FFD60A' },
    { name: 'Negative', value: data.breakdown.negative, color: '#FF3B30' },
  ] : [];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <Star size={14} className="text-[#AF52DE]" />
             <span className="text-[10px] font-black text-[#AF52DE] uppercase tracking-[0.2em] italic">Market Sentiment Analysis</span>
          </div>
          <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Voice of <span className="text-[#AF52DE]">Market</span></h1>
          <p className="text-muted-foreground font-medium italic">High-fidelity customer perception and emotional resonance tracking.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <select 
              value={selectedCompetitorId || ''} 
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="h-12 px-6 rounded-2xl border border-border bg-card text-sm font-bold text-foreground focus:outline-none shadow-apple-sm min-w-[200px]"
            >
              <option value="" disabled>Select Target</option>
              {competitors.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
            {data && <EvidenceBadge count={data.evidence_catalog.length} confidence={90} status="Verified" />}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#AF52DE]/10 border-t-[#AF52DE] rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Sentiment Pulse */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple flex flex-col items-center text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Smile size={120} />
               </div>
               
               <div className={cn(
                 "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 border border-border",
                 data.sentiment_label === 'Positive' ? "bg-emerald-500/10 text-emerald-500" :
                 data.sentiment_label === 'Negative' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
               )}>
                  {data.sentiment_label === 'Positive' ? <Smile size={56} className="animate-pulse" /> : 
                   data.sentiment_label === 'Negative' ? <Frown size={56} className="animate-pulse" /> : <Meh size={56} className="animate-pulse" />}
               </div>
               
               <div className="text-5xl font-black text-foreground tracking-tighter mb-1 uppercase italic">{data.overall_score}<span className="text-muted-foreground/30">%</span></div>
               <div className={cn(
                 "text-xs font-black uppercase tracking-widest italic mb-8",
                 data.sentiment_label === 'Positive' ? "text-emerald-500" :
                 data.sentiment_label === 'Negative' ? "text-rose-500" : "text-amber-500"
               )}>
                 {data.sentiment_label} Market Resonance
               </div>

               <div className="w-full h-[200px] mb-8">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       innerRadius={65}
                       outerRadius={85}
                       paddingAngle={8}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', background: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>

               <Button 
                onClick={() => setShowEvidence(!showEvidence)}
                className="w-full rounded-2xl h-14 bg-[#AF52DE] text-white hover:bg-[#AF52DE]/90 font-black uppercase tracking-widest text-[10px] italic"
               >
                 {showEvidence ? 'Hide Source Catalog' : 'View Source Catalog'}
               </Button>
            </div>

            <div className="p-8 rounded-[40px] bg-foreground text-background shadow-apple relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Target size={48} className="text-primary" />
                </div>
                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-white">Sentiment Drivers</h3>
                <div className="flex flex-wrap gap-2">
                    {data.key_drivers.map((driver, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-xl bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest italic border border-white/5">
                            {driver}
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Right Column: Trending Mentions & Sources */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Top Narrative Drivers (Dynamic Source Linking) */}
            <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-primary" size={24} />
                        <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Market <span className="text-primary">Narrative</span></h2>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{data.total_mentions} Signals Aggregated</span>
                </div>

                <div className="space-y-4">
                    {data.trending_mentions.map((mention, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-muted/50 border border-border hover:bg-muted transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full", mention.sentiment > 0.6 ? "bg-emerald-500" : mention.sentiment < 0.4 ? "bg-rose-500" : "bg-amber-500")} />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{mention.source}</span>
                                </div>
                                {mention.sentiment > 0.5 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                            </div>
                            <p className="text-sm font-medium italic text-foreground leading-relaxed pr-8">"{mention.text}"</p>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={16} className="text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Evidence Catalog Overlay */}
            <AnimatePresence>
                {showEvidence && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="p-10 rounded-[40px] bg-[#1c1c1e] text-white shadow-2xl border border-white/10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Info className="text-[#AF52DE]" size={24} />
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Evidence <span className="text-[#AF52DE]">Catalog</span></h2>
                            </div>
                            <Button variant="ghost" onClick={() => setShowEvidence(false)} className="text-white/50 hover:text-white hover:bg-white/10">Close</Button>
                        </div>
                        <EvidenceCatalog sources={data.evidence_catalog} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-10 rounded-[40px] bg-primary text-white flex items-center justify-between shadow-apple">
                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Actionable Intelligence</h3>
                    <p className="text-xs text-white/70 font-medium italic">Detected {data.key_drivers.length} growth signals that match your core product roadmap.</p>
                </div>
                <Button className="rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-[10px] h-12 px-6 shadow-xl">
                    Generate Report
                </Button>
            </div>

          </div>

        </div>
      ) : (
        <div className="h-96 flex items-center justify-center text-muted-foreground font-medium italic border-2 border-dashed border-border rounded-[40px]">
          Select a competitor to perform sentiment audit.
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisPage;
