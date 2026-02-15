
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, BarChart3, MessageCircle, Heart, Loader2, Trophy, 
    Star, TrendingUp, TrendingDown, Twitter, Linkedin, Github, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitorStore } from '@/store/competitorStore';
import { useAuthStore } from '@/store/authStore';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* --- Data Interface --- */
interface FeatureSentiment {
    feature_name: string;
    popularity_score: number;
    sentiment_score: number;
    mention_count: number;
    trend_direction: string;
}

interface CustomerVoice {
    source: string;
    text: string;
    sentiment: string;
    timestamp: string;
}

interface CompanySentimentProfile {
    competitor_id: string;
    name: string;
    overall_sentiment_score: number;
    sentiment_trend: string;
    top_features: FeatureSentiment[];
    sentiment_history: number[];
    platform_breakdown: Record<string, number>;
    recent_mentions: CustomerVoice[];
}

interface SentimentMatrixResponse {
    profiles: CompanySentimentProfile[];
    market_average: number;
}

const SentimentAnalysisPage = () => {
    const { fetchCompetitors } = useCompetitorStore();
    const { token } = useAuthStore();
    
    // State
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<CompanySentimentProfile[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanySentimentProfile | null>(null);
    const [marketAvg, setMarketAvg] = useState(0);

    useEffect(() => {
        fetchCompetitors();
        // Fetch Live Sentiment Data
        const fetchSentiment = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/intelligence/sentiment-matrix`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if(res.ok) {
                    const data: SentimentMatrixResponse = await res.json();
                    setProfiles(data.profiles);
                    setMarketAvg(data.market_average);
                    if (data.profiles.length > 0) setSelectedCompany(data.profiles[0]);
                    setLoading(false);
                }
            } catch(e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchSentiment();
    }, [fetchCompetitors, token]);


  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Calibrating Sentiment Matrix...</p>
      </div>
    );
  }

  // Helper for charts
  const historyData = selectedCompany?.sentiment_history.map((val, i) => ({ day: `Day ${i+1}`, value: val })) || [];

  return (
    <div className="relative max-w-7xl mx-auto space-y-8 pb-12 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                Brand <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Resonance</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-2 max-w-xl">
                Advanced telemetry analyzing voice-of-customer across social, technical, and news vectors.
            </p>
          </div>
          <div className="text-right hidden md:block">
              <div className="flex items-center gap-2 justify-end text-emerald-400 font-mono text-xs font-bold mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE FEED ACTIVE
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                  PROCESSED {profiles.reduce((acc, p) => acc + p.recent_mentions.length * 124, 0).toLocaleString()} SIGNALS
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px]">
        
        {/* LEFT COLUMN: Ranked List */}
        <div className="lg:col-span-4 bg-[#020617]/60 border border-white/5 rounded-3xl p-1 backdrop-blur-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard
                </h3>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
                {profiles.map((profile, idx) => (
                    <motion.button 
                        key={profile.competitor_id}
                        layoutId={profile.competitor_id}
                        onClick={() => setSelectedCompany(profile)}
                        className={`
                            test-left w-full flex items-center justify-between p-3 rounded-xl transition-all group relative overflow-hidden
                            ${selectedCompany?.competitor_id === profile.competitor_id 
                                ? 'bg-gradient-to-r from-pink-500/10 to-transparent border border-pink-500/20' 
                                : 'hover:bg-white/5 border border-transparent'}
                        `}
                    >   
                        {/* Rank Badge */}
                        <div className="flex items-center gap-3 relative z-10">
                             <div className={`
                                w-6 h-6 rounded flex items-center justify-center font-black text-[10px] border
                                ${idx === 0 ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' : 
                                  'bg-white/5 text-slate-500 border-white/10'}
                             `}>
                                 {idx + 1}
                             </div>
                             <div className="text-left">
                                 <div className={`font-bold uppercase tracking-tight text-xs ${selectedCompany?.competitor_id === profile.competitor_id ? 'text-pink-400' : 'text-slate-300 group-hover:text-white'}`}>
                                     {profile.name}
                                 </div>
                                 <div className="text-[9px] font-mono text-slate-600">
                                     Score: {profile.overall_sentiment_score}
                                 </div>
                             </div>
                        </div>

                        {/* Trend Indicator */}
                        <div className={`flex items-center gap-1 font-mono text-[9px] font-bold ${profile.sentiment_trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {profile.sentiment_trend}
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>

        {/* RIGHT COLUMN: Detailed Dashboard */}
        <div className="lg:col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-2">
            
            {selectedCompany ? (
                <>
                {/* 1. Main Stats Logic */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Heart className="w-20 h-20" /></div>
                        <div className="text-4xl font-black text-pink-500 mb-1">{selectedCompany.overall_sentiment_score}</div>
                        <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Global Sentiment</div>
                    </div>
                    <div className="md:col-span-2 bg-[#020617]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                         <div className="flex justify-between mb-4">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">7-Day Trend</span>
                             <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${selectedCompany.sentiment_trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {selectedCompany.sentiment_trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                 {selectedCompany.sentiment_trend} Growth
                             </div>
                         </div>
                         <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#333' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>

                {/* 2. Platform Breakdown */}
                <div className="bg-[#020617]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" /> Platform Intelligence
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(selectedCompany.platform_breakdown).map(([platform, score]) => (
                            <div key={platform} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    {platform.includes('Twitter') ? <Twitter className="w-3 h-3" /> : 
                                     platform.includes('GitHub') ? <Github className="w-3 h-3" /> :
                                     platform.includes('News') ? <Globe className="w-3 h-3" /> :
                                     <Linkedin className="w-3 h-3" />}
                                    <span className="text-[10px] font-bold uppercase">{platform}</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-1">
                                    <div className={`h-full rounded-full ${score > 70 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${score}%` }} />
                                </div>
                                <div className="text-right text-[10px] font-mono font-bold text-slate-300">{score}% Pos</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Feature Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-[#020617]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" /> Key Topics
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 font-mono">
                                AI CLASSIFIED
                            </span>
                        </div>
                        <div className="space-y-3">
                            {selectedCompany.top_features.map((feat, i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-default ${feat.trend_direction === 'Breakout' ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold ${feat.trend_direction === 'Breakout' ? 'text-purple-300' : 'text-slate-300'}`}>{feat.feature_name}</span>
                                            {feat.trend_direction === 'Breakout' && (
                                                <span className="flex h-1.5 w-1.5 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        {feat.trend_direction === 'Breakout' && (
                                            <span className="text-[8px] text-purple-400 font-mono uppercase tracking-wider mt-0.5">🚀 Just Released</span>
                                        )}
                                    </div>
                                    <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold flex items-center gap-1
                                        ${feat.trend_direction === 'Rising' ? 'bg-emerald-500/20 text-emerald-400' : 
                                          feat.trend_direction === 'Falling' ? 'bg-rose-500/20 text-rose-400' :
                                          feat.trend_direction === 'Breakout' ? 'bg-purple-500/20 text-purple-300' :
                                          'bg-white/5 text-slate-500'}
                                    `}>
                                        {feat.trend_direction === 'Breakout' ? <TrendingUp className="w-3 h-3" /> : null}
                                        {feat.trend_direction}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* 4. Voice of Customer / Live Feed */}
                     <div className="bg-[#020617]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl flex flex-col">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-purple-400" /> Recent Signals
                        </h3>
                        <div className="space-y-4 flex-1">
                            {selectedCompany.recent_mentions.map((msg, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <div className={`w-1 h-full min-h-[40px] rounded-full ${msg.sentiment === 'Positive' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <div>
                                        <p className="text-xs text-slate-300 italic leading-relaxed">"{msg.text}"</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">{msg.source}</span>
                                            <span className="text-[9px] text-slate-600 font-mono">• {msg.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm tracking-widest uppercase">
                    Select a Company to Analyze
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysisPage;
