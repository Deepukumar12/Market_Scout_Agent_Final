import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BrainCircuit, 
  Target, TrendingUp, ShieldAlert, Clock, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useIntelStore } from '@/store/intelStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

type FocusArea = 'Revenue' | 'Efficiency' | 'Innovation' | 'MarketShare';
type RiskLevel = 'Low' | 'Medium' | 'High';

// StrategicPlan interface is imported from the store

// Obsolete mock logic removed

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
        className="absolute inset-0 m-auto w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
      />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-medium text-slate-900">Consulting Agent Network</h3>
      <p className="text-slate-500 max-w-xs mx-auto">Cross-referencing market signals and competitor vectors to synthesize high-impact initiatives...</p>
    </div>
  </div>
);

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) => (
  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <span className="text-sm font-medium text-slate-500">{label}</span>
    </div>
    <div className="text-2xl font-semibold text-slate-900">{value}</div>
    <div className="text-xs text-slate-400 mt-1">{sub}</div>
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1D1D1F] uppercase tracking-tighter italic">Strategic <span className="text-[#0071E3]">Initiatives</span></h1>
          <p className="text-[#6E6E73] text-lg font-medium italic mt-2">Synthesize product pivots and revenue strategies from live market signals.</p>
        </div>
        {!idea && !loading && (
          <Button 
            onClick={handleGenerate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-blue-500/20 gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Synthesize Strategic Plan
          </Button>
        )}
      </div>

      {!idea && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-medium text-slate-800">Target Competitor</h2>
              <select 
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="">Select Competitor (Default: Market)</option>
                {competitors.map((c: any) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-medium text-slate-800">Target Focus Area</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['Revenue', 'Efficiency', 'Innovation', 'MarketShare'] as FocusArea[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFocusArea(f)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      focusArea === f 
                        ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span className={cn(
                      "font-medium",
                      focusArea === f ? "text-blue-700" : "text-slate-600"
                    )}>{f.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {focusArea === f && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-medium text-slate-800">Execution Velocity</h2>
              <div className="flex gap-4">
                {(['Low', 'Medium', 'High'] as RiskLevel[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskLevel(r)}
                    className={cn(
                      "px-6 py-2 rounded-full border text-sm font-medium transition-all",
                      riskLevel === r
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {r} Impact
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-400">Higher execution velocity prioritizes long-term transformational changes over 2-3 month incremental updates.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0071E3]/10 to-transparent rounded-[40px] -z-10 blur-3xl" />
            <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
              <div className="flex gap-3 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse mb-1" />
                    <div className="h-3 w-48 bg-slate-50 rounded-lg animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-4 w-full bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-4 w-4/6 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingState />}

      <AnimatePresence>
        {idea && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-10">
              <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm overflow-hidden">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-4 w-full">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight flex-1 pr-4">{idea.title}</h2>
                        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 shadow-sm shrink-0 whitespace-nowrap sm:mt-1 w-fit">
                            {riskLevel} Risk Strategy
                        </span>
                    </div>
                    <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">{idea.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map(tag => (
                        <span key={tag} className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-100">
                  <MetricCard icon={Target} label="Impact" value={idea.impact} sub="Core Business Value" />
                  <MetricCard icon={TrendingUp} label="Confidence" value={`${idea.confidence}%`} sub="Data Availability" />
                  <MetricCard icon={Clock} label="Time to Market" value={idea.timeToMarket} sub="Agile Delivery" />
                  <MetricCard icon={BrainCircuit} label="Est. ROI" value={idea.estimatedROI} sub="12 Month Proj." />
                </div>
              </div>

              {/* Financial Projection Area */}
              <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm group hover:border-[#0071E3]/30 transition-all">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center border border-[#0071E3]/20">
                      <TrendingUp className="w-6 h-6 text-[#0071E3]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1D1D1F] uppercase italic tracking-tighter">Revenue Growth Matrix</h3>
                      <p className="text-[10px] text-[#86868B] font-mono mt-0.5 uppercase tracking-widest">12-month predictive revenue vs capture cost</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                     ROI GAP: {idea.estimatedROI}
                  </div>
                </div>
                <div className="h-[320px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={idea.financialProjections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E5EA" />
                      <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#86868B', fontSize: 10, fontWeight: 'bold' }} 
                          dy={10} 
                      />
                      <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#86868B', fontSize: 10, fontWeight: 'bold' }} 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                          dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #E5E5EA', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#0071E3', fontWeight: '900' }}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Projected Revenue']}
                        labelStyle={{ color: '#86868B', textTransform: 'uppercase', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0071E3" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        activeDot={{ r: 6, stroke: '#0071E3', strokeWidth: 3, fill: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Step by Step Implementation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    Execution Roadmap
                  </h3>
                  <div className="space-y-6">
                    {idea.implementation.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                            {i + 1}
                          </div>
                          {i !== idea.implementation.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-100 my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="font-semibold text-slate-800 mb-1">{step.step}</div>
                          <div className="text-sm text-slate-500 leading-relaxed">{step.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Strategic Risk Matrix
                  </h3>
                  <div className="space-y-4">
                    {idea.risks.map((risk, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3 italic text-slate-600">
                        <span>•</span>
                        {risk}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-6 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="text-sm font-semibold text-amber-900 mb-2">Mitigation Strategy</div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Deploy in staged cohorts to US-East region first. Monitor user churn and API performance latency before global rollout in Q4.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Details Area */}
            <div className="space-y-10">
              <div className="p-10 rounded-[40px] bg-[#1D1D1F] text-white shadow-apple shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                <h3 className="text-xl font-semibold mb-6">Market Signal Analysis</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Market Trigger</div>
                    <p className="text-sm leading-relaxed text-slate-300">{idea.marketTrigger}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">White Space Opportunity</div>
                    <p className="text-sm leading-relaxed text-slate-300">{idea.marketGap}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Primary User Persona</div>
                    <p className="text-sm leading-relaxed text-slate-300">{idea.targetAudience}</p>
                  </div>
                </div>
              </div>

                <div className="p-10 rounded-[40px] bg-white/70 backdrop-blur-xl border border-[#E5E5EA] shadow-apple shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Core Functions</h3>
                <div className="space-y-3">
                  {idea.coreCapabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
                      <span className="text-slate-600 font-medium">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleGenerate}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl py-6 gap-2 border border-slate-200 font-medium"
                >
                  <TrendingUp className="w-5 h-5" />
                  Regenerate Strategy
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
