import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BrainCircuit, 
  Target, TrendingUp, ShieldAlert, Clock, CheckCircle2,
  Zap, Info, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useIntelStore } from '@/store/intelStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { EvidenceBadge } from '@/components/ui/EvidenceUI';

type FocusArea = 'Revenue' | 'Efficiency' | 'Innovation' | 'MarketShare';
type RiskLevel = 'Low' | 'Medium' | 'High';

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-6">
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 rounded-full border-t-2 border-b-2 border-blue-500/30"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 m-auto w-16 h-16 rounded-full border-l-2 border-r-2 border-blue-600"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 m-auto w-4 h-4 bg-primary/50 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
      />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-medium text-foreground">Consulting Agent Network</h3>
      <p className="text-muted-foreground max-w-xs mx-auto">Cross-referencing market signals and competitor vectors to synthesize high-impact initiatives...</p>
    </div>
  </div>
);

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) => (
  <div className="p-6 rounded-3xl bg-muted/50 border border-border/50 hover:border-primary/20 transition-colors">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-xl bg-white border border-border shadow-sm">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{label}</span>
    </div>
    <div className="text-xl font-black text-foreground italic">{value}</div>
    <div className="text-[10px] text-muted-foreground font-medium italic mt-1">{sub}</div>
  </div>
);

const AiSuggestionPage = () => {
  const { fetchStrategicPlan, strategicPlan: idea, loading, competitors, fetchCompetitors } = useIntelStore();
  
  // Config State
  const [focusArea, setFocusArea] = useState<FocusArea>('Innovation');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');
  const [selectedComp, setSelectedComp] = useState<string>('');

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const handleGenerate = async () => {
    const cid = selectedComp || (competitors.length > 0 ? competitors[0].name : 'Market');
    await fetchStrategicPlan(cid, focusArea, riskLevel);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <BrainCircuit size={14} className="text-primary" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">AI Strategy Synthesis</span>
          </div>
          <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Strategic <span className="text-primary">Initiatives</span></h1>
          <p className="text-muted-foreground font-medium italic">Synthesize product pivots and revenue strategies from live market signals.</p>
        </div>
        {!idea && !loading && (
          <Button 
            onClick={handleGenerate}
            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs italic shadow-xl shadow-primary/20 gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Synthesize Strategic Plan
          </Button>
        )}
      </div>

      {!idea && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-6">
          <div className="space-y-8 p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Target Competitor</h2>
              <select 
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                className="h-14 w-full px-6 rounded-2xl border border-border bg-card text-sm font-bold text-foreground focus:outline-none shadow-apple-sm"
              >
                <option value="">Market Analysis (General)</option>
                {competitors.map((c: any) => (
                  <option key={c._id || c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Focus Vector</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['Revenue', 'Efficiency', 'Innovation', 'MarketShare'] as FocusArea[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFocusArea(f)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border transition-all text-left",
                      focusArea === f 
                        ? "bg-primary border-primary text-white shadow-xl" 
                        : "bg-muted/50 border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="text-xs font-black uppercase tracking-widest italic">{f.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {focusArea === f && <Zap className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Execution Velocity</h2>
              <div className="flex gap-4">
                {(['Low', 'Medium', 'High'] as RiskLevel[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskLevel(r)}
                    className={cn(
                      "h-12 px-6 rounded-2xl border text-[10px] font-black uppercase tracking-widest italic transition-all",
                      riskLevel === r
                        ? "bg-foreground border-foreground text-background shadow-lg"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {r} Impact Velocity
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-[40px] -z-10 blur-3xl" />
            <div className="p-12 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple h-full flex flex-col justify-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-8">
                    <Sparkles size={40} className="animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter mb-4">Intelligence Synthesis</h3>
                <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">
                    Our strategic agents are ready to crawl live technical repositories and financial filings to generate your next market move.
                </p>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingState />}

      <AnimatePresence mode="wait">
        {idea && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Main Strategy Header */}
            <div className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple">
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shrink-0">
                        <TrendingUp size={40} />
                    </div>
                    <div className="space-y-6 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter leading-none">{idea.title}</h2>
                            <div className="flex items-center gap-4">
                                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                    {riskLevel} Velocity
                                </span>
                                <EvidenceBadge count={8} confidence={idea.confidence} status="Synthesized" />
                            </div>
                        </div>
                        <p className="text-lg font-medium italic text-muted-foreground leading-relaxed max-w-4xl">{idea.summary}</p>
                        <div className="flex flex-wrap gap-2">
                            {idea.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-xl bg-muted border border-border text-[9px] font-black uppercase tracking-widest italic text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-10 border-t border-border">
                    <MetricCard icon={Target} label="Strategic Impact" value={idea.impact} sub="Value Projection" />
                    <MetricCard icon={TrendingUp} label="Agent Confidence" value={`${idea.confidence}%`} sub="Data Integrity" />
                    <MetricCard icon={Clock} label="Market Window" value={idea.timeToMarket} sub="Agile Velocity" />
                    <MetricCard icon={BrainCircuit} label="Estimated ROI" value={idea.estimatedROI} sub="Annual Vector" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Roadmap & Risk */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="p-10 rounded-[40px] bg-card border border-border shadow-apple">
                        <div className="flex items-center gap-3 mb-8">
                            <CheckCircle2 className="text-primary" size={24} />
                            <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Execution <span className="text-primary">Roadmap</span></h3>
                        </div>
                        <div className="space-y-8">
                            {idea.implementation.map((step, i) => (
                                <div key={i} className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-xs font-black text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        {i !== idea.implementation.length - 1 && (
                                            <div className="w-0.5 h-full bg-border my-2" />
                                        )}
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="text-lg font-black text-foreground uppercase italic tracking-tight mb-2">{step.step}</h4>
                                        <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">{step.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 rounded-[40px] bg-card border border-border shadow-apple">
                        <div className="flex items-center gap-3 mb-8">
                            <ShieldAlert className="text-rose-500" size={24} />
                            <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Strategic <span className="text-rose-500">Risks</span></h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {idea.risks.map((risk, i) => (
                                <div key={i} className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                        <ShieldAlert size={12} />
                                    </div>
                                    <p className="text-xs font-bold text-rose-900 italic leading-relaxed">{risk}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Signals & Market Opportunity */}
                <div className="lg:col-span-1 space-y-10">
                    <div className="p-10 rounded-[40px] bg-foreground text-background shadow-apple relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target size={120} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 text-white">Market Analysis</h3>
                        <div className="space-y-8">
                            <div>
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">Primary Trigger</div>
                                <p className="text-sm font-medium italic leading-relaxed text-white/80">{idea.marketTrigger}</p>
                            </div>
                            <div className="pt-8 border-t border-white/10">
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">White Space Gap</div>
                                <p className="text-sm font-medium italic leading-relaxed text-white/80">{idea.marketGap}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[40px] bg-card border border-border shadow-apple">
                        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter mb-6">Core Capabilities</h3>
                        <div className="space-y-3">
                            {idea.coreCapabilities.map((cap, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-all group">
                                    <span className="text-xs font-black uppercase tracking-widest italic text-muted-foreground group-hover:text-primary">{cap}</span>
                                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button 
                        onClick={handleGenerate}
                        className="w-full h-16 rounded-[30px] bg-primary text-white font-black uppercase tracking-widest text-xs italic shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                    >
                        Regenerate Vector <Sparkles size={16} className="ml-2" />
                    </Button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiSuggestionPage;
