import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Zap,
  Lock,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { getRiskAssessment } from '@/services/api';

interface RiskData {
  risk_score: number;
  threat_level: 'Low' | 'Medium' | 'High' | 'Critical';
  vulnerabilities: Array<{ title: string; url: string }>;
  competitive_threats: Array<{
    competitor: string;
    threat: string;
    impact: 'Low' | 'Medium' | 'High';
    url: string;
  }>;
  mitigation_strategies: Array<{ title: string; url: string }>;
}

const RiskPage = () => {
  const navigate = useNavigate();
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (competitors.length > 0 && !selectedCompetitorId) {
      setSelectedCompetitorId(competitors[0].id);
    }
  }, [competitors, selectedCompetitorId, setSelectedCompetitorId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompetitorId) return;
      setLoading(true);
      try {
        const json = await getRiskAssessment(selectedCompetitorId);
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

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tight pr-8">Risk <span className="text-[#FF3B30]">Intelligence</span></h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] mt-2 font-medium italic">Strategic threat assessment and market vulnerability mapping.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1D1D1F] text-sm font-bold text-[#1D1D1F] dark:text-white focus:outline-none shadow-apple-sm"
          >
            <option value="" disabled>Select a competitor</option>
            {competitors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && selectedCompetitorId ? (
        <div className="h-96 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#0071E3]/20 border-t-[#0071E3] rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Risk Meter Card */}
            <div className="lg:col-span-1 p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple flex flex-col items-center text-center shadow-sm">
               <div className={cn(
                 "w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-apple-sm",
                 data.threat_level === 'Low' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                 data.threat_level === 'Medium' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                 "bg-rose-500/10 text-rose-600 dark:text-rose-400"
               )}>
                 {data.threat_level === 'Low' ? <ShieldCheck size={48} /> : 
                  data.threat_level === 'Medium' ? <AlertTriangle size={48} /> : <ShieldAlert size={48} />}
               </div>
               
               <div className="space-y-2">
                 <h3 className="text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tight uppercase italic pr-8">
                   {data.risk_score}
                 </h3>
                 <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Risk Index</p>
               </div>

               <div className="w-full mt-10 p-8 rounded-3xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10">
                  <p className="text-xl font-black text-[#1D1D1F] dark:text-white mb-2 uppercase italic tracking-tight pr-4">{data.threat_level} Priority</p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed italic">Strategic intervention recommended within 7 days.</p>
               </div>
            </div>

            {/* Potential Threats */}
            <div className="lg:col-span-2 space-y-10">
              <div className="p-10 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple shadow-sm">
                <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white mb-8 flex items-center gap-2 uppercase italic tracking-tight pr-4">
                  <Lock className="text-[#0071E3]" size={20} />
                  Market <span className="text-[#FF3B30]">Vulnerabilities</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.vulnerabilities.map((v, i) => (
                    <a 
                      key={i} 
                      href={v.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-6 rounded-3xl bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 flex items-center gap-4 group hover:border-[#FF3B30]/30 hover:bg-white dark:hover:bg-white/10 transition-all shadow-apple-sm active:scale-95"
                    >
                       <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1D1D1F] flex items-center justify-center text-[#FF3B30] shadow-apple-sm group-hover:scale-110 transition-transform">
                          <Zap size={18} />
                       </div>
                       <span className="text-sm font-bold text-[#1D1D1F] dark:text-white group-hover:text-[#FF3B30] transition-colors">{v.title}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="p-10 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple shadow-sm">
                <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white mb-8 flex items-center gap-2 uppercase italic tracking-tight pr-4">
                   <Eye className="text-[#AF52DE]" size={20} />
                  Competitive <span className="text-[#AF52DE]">Threat Matrix</span>
                </h3>
                <div className="space-y-4">
                   {data.competitive_threats.map((t, i) => (
                     <a 
                       key={i} 
                       href={t.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center justify-between p-6 rounded-3xl bg-[#F5F5F7] dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-[#AF52DE]/30 transition-all active:scale-[0.99] group/threat"
                     >
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest mb-1">{t.competitor}</span>
                           <span className="text-sm font-bold text-[#1D1D1F] dark:text-white group-hover/threat:text-[#AF52DE] transition-colors flex items-center gap-2">
                             {t.threat}
                             <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/threat:opacity-100 transition-opacity" />
                           </span>
                        </div>
                          <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            t.impact === 'High' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                            t.impact === 'Medium' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : 
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          )}>
                            {t.impact} Impact
                          </div>
                     </a>
                   ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mitigation Section */}
          <div className="p-10 rounded-[40px] bg-[#1D1D1F] text-white">
             <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-[#0071E3] flex items-center justify-center">
                   <ShieldCheck size={20} />
                </div>
                 <h3 className="text-2xl font-black tracking-tight uppercase italic pr-8">Active <span className="text-[#0071E3]">Mitigation Strategies</span></h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 {data.mitigation_strategies.map((s, i) => (
                   <a 
                     key={i} 
                     href={s.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex gap-4 items-start group/strategy hover:bg-white/5 p-4 rounded-2xl transition-all border border-transparent hover:border-blue-500/30"
                   >
                      <span className="w-6 h-6 rounded-full bg-[#0071E3]/20 flex items-center justify-center text-xs font-bold text-[#0071E3] shrink-0 mt-1 group-hover/strategy:bg-[#0071E3] group-hover/strategy:text-white transition-all">{i+1}</span>
                      <p className="text-white/80 font-medium leading-relaxed group-hover/strategy:text-white transition-colors">
                        {s.title}
                        <ArrowUpRight className="inline-block w-3 h-3 ml-2 opacity-0 group-hover/strategy:opacity-100 transition-opacity" />
                      </p>
                   </a>
                 ))}
             </div>

              <Button 
                onClick={() => {
                  const comp = competitors.find(c => c.id === selectedCompetitorId);
                  navigate('/dashboard/ai-suggestions', { state: { competitor: comp?.name } });
                }}
                className="h-14 px-8 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-lg group"
              >
                 Deploy Defensive Roadmap
                 <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
          </div>
        </>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-[#6E6E73] dark:text-[#86868B] font-medium border-2 border-dashed border-[#E5E5EA] rounded-[40px]">
          <ShieldAlert size={48} className="mb-4 text-[#E5E5EA]" />
          <p>Select a competitor to assess strategic risks.</p>
        </div>
      )}
    </div>
  );
};

export default RiskPage;
