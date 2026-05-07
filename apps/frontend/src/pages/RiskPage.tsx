import { useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';

interface RiskData {
  risk_score: number;
  threat_level: 'Low' | 'Medium' | 'High' | 'Critical';
  vulnerabilities: string[];
  competitive_threats: Array<{
    competitor: string;
    threat: string;
    impact: 'Low' | 'Medium' | 'High';
  }>;
  mitigation_strategies: string[];
}

const RiskPage = () => {
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<RiskData | null>(null);
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
        const res = await fetch(`${apiUrl}/api/v1/intelligence/risk-assessment?competitor_id=${selectedCompetitorId}`, {
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

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] uppercase italic tracking-tighter">Risk <span className="text-[#FF3B30]">Intelligence</span></h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] mt-2 font-medium italic">Strategic threat assessment and market vulnerability mapping.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedCompetitorId || ''} 
            onChange={(e) => setSelectedCompetitorId(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E5EA] bg-white text-sm font-bold text-[#1D1D1F] focus:outline-none shadow-apple-sm"
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
            <div className="lg:col-span-1 p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple flex flex-col items-center text-center shadow-sm">
               <div className={cn(
                 "w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-apple-sm",
                 data.threat_level === 'Low' ? "bg-emerald-50 text-[#34C759]" :
                 data.threat_level === 'Medium' ? "bg-yellow-50 text-[#FFD60A]" :
                 "bg-rose-50 text-[#FF3B30]"
               )}>
                 {data.threat_level === 'Low' ? <ShieldCheck size={48} /> : 
                  data.threat_level === 'Medium' ? <AlertTriangle size={48} /> : <ShieldAlert size={48} />}
               </div>
               
               <div className="space-y-2">
                 <h3 className="text-5xl font-black text-[#1D1D1F] tracking-tighter uppercase italic">
                   {data.risk_score}
                 </h3>
                 <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-[0.2em] italic">Risk Index</p>
               </div>

               <div className="w-full mt-10 p-6 rounded-3xl bg-[#F5F5F7]">
                  <p className="text-lg font-bold text-[#1D1D1F] mb-1">{data.threat_level} Priority</p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed italic">Strategic intervention recommended within 14 days.</p>
               </div>
            </div>

            {/* Potential Threats */}
            <div className="lg:col-span-2 space-y-10">
              <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                <h3 className="text-xl font-black text-[#1D1D1F] mb-8 flex items-center gap-2 uppercase italic tracking-tighter">
                  <Lock className="text-[#0071E3]" size={20} />
                  Market <span className="text-[#FF3B30]">Vulnerabilities</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.vulnerabilities.map((v, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center gap-4 group">
                       <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#FF3B30] shadow-apple-sm group-hover:scale-110 transition-transform">
                          <Zap size={18} />
                       </div>
                       <span className="text-sm font-bold text-[#1D1D1F]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                <h3 className="text-xl font-black text-[#1D1D1F] mb-8 flex items-center gap-2 uppercase italic tracking-tighter">
                   <Eye className="text-[#AF52DE]" size={20} />
                  Competitive <span className="text-[#AF52DE]">Threat Matrix</span>
                </h3>
                <div className="space-y-4">
                   {data.competitive_threats.map((t, i) => (
                     <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-[#F5F5F7] hover:bg-[#F5F5F7]/80 transition-all">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest mb-1">{t.competitor}</span>
                           <span className="text-sm font-bold text-[#1D1D1F]">{t.threat}</span>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          t.impact === 'High' ? "bg-rose-50 text-[#FF3B30]" :
                          t.impact === 'Medium' ? "bg-yellow-50 text-[#FFD60A]" : "bg-emerald-50 text-[#34C759]"
                        )}>
                          {t.impact} Impact
                        </div>
                     </div>
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
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Active <span className="text-[#0071E3]">Mitigation Strategies</span></h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {data.mitigation_strategies.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                     <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] shrink-0 mt-1">{i+1}</span>
                     <p className="text-white/80 font-medium leading-relaxed">{s}</p>
                  </div>
                ))}
             </div>

             <Button className="h-14 px-8 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-lg group">
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
