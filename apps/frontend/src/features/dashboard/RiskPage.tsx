import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Target, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { EvidenceBadge, EvidenceCatalog } from '@/components/ui/EvidenceUI';

interface CompetitiveThreat {
    competitor: string;
    threat: string;
    impact: string;
}

interface Vulnerability {
    name: string;
    description: string;
    impact: string;
    source: string;
}

interface RiskData {
  risk_score: number;
  threat_level: string;
  vulnerabilities: Vulnerability[];
  competitive_threats: CompetitiveThreat[];
  mitigation_strategies: string[];
  evidence_catalog: any[];
  confidence_score: number;
}

const RiskPage = () => {
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [data, setData] = useState<RiskData | null>(null);
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

  useEffect(() => {
    fetchData();
  }, [selectedCompetitorId, token]);

  const getThreatColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  };

  const getImpactBg = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <ShieldCheck size={14} className="text-primary" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Enterprise Risk Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Strategic <span className="text-primary">Risk Audit</span></h1>
          <p className="text-muted-foreground font-medium italic">High-fidelity threat detection and competitive vulnerability mapping.</p>
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
            {data && <EvidenceBadge count={data.evidence_catalog.length} confidence={data.confidence_score} status="Audited" />}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Risk Pulse */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple flex flex-col items-center text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldAlert size={120} />
               </div>
               
               <div className={cn("w-24 h-24 rounded-3xl flex items-center justify-center mb-6 bg-muted/50 border border-border", getThreatColor(data.threat_level))}>
                  <ShieldAlert size={56} className="animate-pulse" />
               </div>
               
               <div className="text-5xl font-black text-foreground tracking-tighter mb-1 uppercase italic">{data.risk_score}<span className="text-muted-foreground/30">/100</span></div>
               <div className={cn("text-xs font-black uppercase tracking-widest italic mb-8", getThreatColor(data.threat_level))}>
                 {data.threat_level} Threat Vector
               </div>

               <div className="w-full space-y-4 pt-8 border-t border-border">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                     <span>Confidence</span>
                     <span className="text-foreground">{data.confidence_score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.confidence_score}%` }}
                        className="h-full bg-primary"
                     />
                  </div>
               </div>

               <Button 
                onClick={() => setShowEvidence(!showEvidence)}
                className="mt-10 w-full rounded-2xl h-14 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] italic"
               >
                 {showEvidence ? 'Hide Audit Trail' : 'View Full Audit Trail'}
               </Button>
            </div>

            <div className="p-8 rounded-[40px] bg-primary text-white shadow-apple relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Activity size={48} />
                </div>
                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4">Strategic Mitigation</h3>
                <div className="space-y-4">
                    {data.mitigation_strategies.map((s, i) => (
                        <div key={i} className="flex gap-3 text-sm font-medium italic text-white/80">
                            <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-black">{i+1}</div>
                            {s}
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Right Column: Vulnerabilities & Threats */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Market Vulnerabilities */}
            <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" size={24} />
                        <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Market <span className="text-amber-500">Vulnerabilities</span></h2>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{data.vulnerabilities.length} Nodes Detected</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.vulnerabilities.map((v, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-muted/50 border border-border hover:bg-muted transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest", getImpactBg(v.impact))}>
                                    {v.impact} Impact
                                </span>
                                <a href={v.source} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white text-muted-foreground hover:text-primary transition-colors">
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                            <h4 className="font-black text-foreground uppercase italic tracking-tight mb-2 leading-tight">{v.name}</h4>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed italic line-clamp-3">{v.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Competitive Threats */}
            <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple">
                <div className="flex items-center gap-3 mb-8">
                    <Target className="text-primary" size={24} />
                    <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Competitive <span className="text-primary">Disruption</span></h2>
                </div>

                <div className="space-y-4">
                    {data.competitive_threats.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-muted/50 border border-border hover:bg-muted transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-primary font-black text-xl shadow-sm italic">
                                    {t.competitor.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-foreground uppercase italic tracking-tight leading-none mb-1">{t.threat}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">{t.competitor} • High Probability</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest italic", getImpactBg(t.impact))}>
                                    {t.impact} Impact
                                </span>
                                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
                        className="p-10 rounded-[40px] bg-foreground text-background shadow-2xl border border-white/10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Info className="text-primary" size={24} />
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Audit <span className="text-primary">Catalog</span></h2>
                            </div>
                            <Button variant="ghost" onClick={() => setShowEvidence(false)} className="text-white/50 hover:text-white hover:bg-white/10">Close</Button>
                        </div>
                        <EvidenceCatalog sources={data.evidence_catalog} />
                    </motion.div>
                )}
            </AnimatePresence>

          </div>

        </div>
      ) : (
        <div className="h-96 flex items-center justify-center text-muted-foreground font-medium italic">
          Select a competitor to perform risk audit.
        </div>
      )}
    </div>
  );
};

export default RiskPage;
