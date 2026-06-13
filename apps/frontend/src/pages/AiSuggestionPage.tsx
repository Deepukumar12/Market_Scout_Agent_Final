import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BrainCircuit, RotateCw,
  Target, TrendingUp, ShieldAlert, Clock, CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useIntelStore } from '@/store/intelStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/utils/utils';

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
      <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">Consulting Agent Network</h3>
      <p className="text-[#6E6E73] dark:text-[#86868B] max-w-xs mx-auto font-medium italic">Cross-referencing market signals and competitor vectors to synthesize high-impact initiatives...</p>
    </div>
  </div>
);

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) => (
  <div className="p-5 lg:p-6 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 shadow-sm group hover:scale-[1.02] transition-all flex flex-col h-full min-w-0">
    <div className="flex items-center gap-2 mb-3 min-w-0">
      <div className="p-2 rounded-xl bg-white dark:bg-[#1D1D1F] border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <span className="text-[9px] lg:text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest truncate">{label}</span>
    </div>
    <div className="text-xl lg:text-2xl font-black text-[#1D1D1F] dark:text-white italic tracking-tighter leading-none break-words mb-auto">{value}</div>
    <div className="text-[8px] lg:text-[9px] text-[#6E6E73] dark:text-[#86868B] mt-2 uppercase font-bold italic tracking-wide opacity-80">{sub}</div>
  </div>
);

const AiSuggestionPage = () => {
  const location = useLocation();
  const { fetchStrategicPlan, strategicPlan: idea, loading, competitors, fetchCompetitors } = useIntelStore();
  
  // Config State
  const [focusArea, setFocusArea] = useState<FocusArea>('Innovation');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');
  const [selectedComp, setSelectedComp] = useState<string>(location.state?.competitor || '');

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (competitors.length > 0 && !selectedComp) {
      setSelectedComp(competitors[0].name);
    }
  }, [competitors, selectedComp]);

  useEffect(() => {
    // Automatically trigger generation if coming from RiskPage with a specific competitor
    if (location.state?.competitor && competitors.length > 0) {
      handleGenerate();
      // Clear state to prevent re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [competitors]);

  useEffect(() => {
    const onRefresh = () => { handleGenerate(); };
    // Listen for manual refreshes from the modal completion or websocket
    window.addEventListener('intelligence-refresh', onRefresh);
    
    return () => {
      window.removeEventListener('intelligence-refresh', onRefresh);
    };
  }, [selectedComp, focusArea, riskLevel]);

  const handleGenerate = async () => {
    const cid = selectedComp || (competitors.length > 0 ? competitors[0].name : 'Market');
    await fetchStrategicPlan(cid, focusArea, riskLevel);
  };


  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">Strategic <span className="text-[#0071E3]">Initiatives</span></h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] text-base md:text-lg font-medium italic mt-2">Synthesize product pivots and revenue strategies from live market signals.</p>
        </div>
        <div className="flex items-center gap-4">
          {idea && (
            <Button 
              onClick={handleGenerate}
              disabled={loading}
              variant="outline"
              className="h-14 px-6 rounded-2xl border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1D1D1F] text-[#1D1D1F] dark:text-white font-black uppercase tracking-widest text-[10px] italic flex items-center gap-2 group shadow-apple-sm transition-all hover:scale-105"
            >
               <RotateCw className={cn("w-3.5 h-3.5 text-blue-600 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
               Recalibrate
            </Button>
          )}
          {!idea && !loading && (
            <Button 
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-16 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 gap-3 group transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5 fill-current group-hover:animate-pulse" />
              Synthesize Strategic Plan
            </Button>
          )}
          {idea && (
            <Button 
              onClick={() => {
                const reportWindow = window.open('', '_blank');
                if (!reportWindow) return;
                const html = `
                  <html>
                    <head>
                      <title>Strategic Intelligence Report - ${selectedComp}</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1d1d1f; line-height: 1.6; }
                        .header { border-bottom: 2px solid #0071e3; padding-bottom: 20px; margin-bottom: 40px; }
                        h1 { margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; font-style: italic; color: #0071e3; }
                        .meta { color: #86868b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; }
                        .section { margin-bottom: 40px; }
                        .section-title { font-size: 12px; font-weight: 900; color: #86868b; text-transform: uppercase; letter-spacing: 3px; border-bottom: 1px solid #e5e5ea; padding-bottom: 10px; margin-bottom: 20px; }
                        .card { padding: 25px; background: #f5f5f7; border-radius: 20px; margin-bottom: 20px; }
                        .card-title { font-size: 20px; font-weight: 900; font-style: italic; margin-bottom: 10px; }
                        .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; }
                        .stat { padding: 15px; background: white; border-radius: 15px; }
                        .stat-label { font-size: 9px; font-weight: 900; color: #86868b; text-transform: uppercase; }
                        .stat-val { font-size: 18px; font-weight: 900; font-style: italic; }
                        @media print { .no-print { display: none; } }
                      </style>
                    </head>
                    <body>
                      <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #0071e3; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">Download PDF</button>
                      </div>
                      <div class="header">
                        <h1>STRATEGIC INITIATIVE REPORT</h1>
                        <div class="meta">Target: ${selectedComp} | Confidence: ${idea.confidence}% | Generated: ${new Date().toLocaleString()}</div>
                      </div>
                      <div class="section">
                        <div class="section-title">Initiative Overview</div>
                        <div class="card">
                          <div class="card-title">${idea.title}</div>
                          <div>${idea.summary}</div>
                        </div>
                        <div class="grid">
                          <div class="stat"><div class="stat-label">Impact</div><div class="stat-val">${idea.impact}</div></div>
                          <div class="stat"><div class="stat-label">Time to Market</div><div class="stat-val">${idea.timeToMarket}</div></div>
                          <div class="stat"><div class="stat-label">Est. ROI</div><div class="stat-val">${idea.estimatedROI}</div></div>
                          <div class="stat"><div class="stat-label">Focus</div><div class="stat-val">${focusArea}</div></div>
                        </div>
                      </div>
                      <div class="section">
                        <div class="section-title">Market Context</div>
                        <p><strong>Trigger:</strong> ${idea.marketTrigger}</p>
                        <p><strong>Opportunity Gap:</strong> ${idea.marketGap}</p>
                        <p><strong>Target Audience:</strong> ${idea.targetAudience}</p>
                      </div>
                      <div class="section">
                        <div class="section-title">Implementation Roadmap</div>
                        ${idea.implementation.map(step => `<p><strong>${step.step}:</strong> ${step.detail}</p>`).join('')}
                      </div>
                      <script>window.onload = () => setTimeout(() => { window.print(); }, 500);</script>
                    </body>
                  </html>
                `;
                reportWindow.document.write(html);
                reportWindow.document.close();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 h-16 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 gap-3 group transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              Download Strategy Report
            </Button>
          )}
        </div>
      </div>

      {!idea && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">Target Competitor</h2>
              <select 
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                className="w-full p-5 rounded-[24px] border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1C1C1E] font-bold text-[#1D1D1F] dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-apple uppercase tracking-widest text-xs italic"
              >
                <option value="">Select Competitor (Default: Market)</option>
                {competitors.map((c: any) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">Target Focus Area</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['Revenue', 'Efficiency', 'Innovation', 'MarketShare'] as FocusArea[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFocusArea(f)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-[24px] border transition-all text-left group",
                      focusArea === f 
                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 ring-4 ring-blue-500/10 shadow-apple" 
                        : "bg-white dark:bg-[#1C1C1E] border-[#E5E5EA] dark:border-white/10 hover:border-blue-500/30 shadow-sm"
                    )}
                  >
                    <span className={cn(
                      "font-black uppercase tracking-widest text-[11px] italic",
                      focusArea === f ? "text-blue-700 dark:text-blue-400" : "text-[#6E6E73] dark:text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white"
                    )}>{f.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {focusArea === f && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">Execution Velocity</h2>
              <div className="flex flex-wrap gap-4">
                {(['Low', 'Medium', 'High'] as RiskLevel[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskLevel(r)}
                    className={cn(
                      "px-8 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all italic",
                      riskLevel === r
                        ? "bg-[#1D1D1F] dark:bg-white border-[#1D1D1F] dark:border-white text-white dark:text-black shadow-lg shadow-black/20"
                        : "bg-white dark:bg-[#1C1C1E] border-[#E5E5EA] dark:border-white/10 text-[#6E6E73] dark:text-[#86868B] hover:border-[#1D1D1F] dark:hover:border-white"
                    )}
                  >
                    {r} Impact
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] font-medium italic leading-relaxed">Higher execution velocity prioritizes long-term transformational changes over 2-3 month incremental updates.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0071E3]/10 to-[#AF52DE]/10 rounded-[40px] -z-10 blur-[100px] animate-pulse-slow" />
            <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large overflow-hidden transition-all duration-500">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-gradient" />
              <div className="flex gap-4 mb-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-1.5 w-full rounded-full bg-[#F5F5F7] dark:bg-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#0071E3]"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, delay: i * 0.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <BrainCircuit className="w-7 h-7 text-blue-600 animate-pulse" />
                  </div>
                  <div>
                    <div className="h-5 w-40 bg-[#F5F5F7] dark:bg-white/5 rounded-full animate-pulse mb-2" />
                    <div className="h-3 w-56 bg-[#F5F5F7] dark:bg-white/5 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3 pt-6 border-t border-[#F5F5F7] dark:border-white/5">
                  <div className="h-4 w-full bg-[#F5F5F7] dark:bg-white/5 rounded-lg animate-pulse" />
                  <div className="h-4 w-[90%] bg-[#F5F5F7] dark:bg-white/5 rounded-lg animate-pulse" />
                  <div className="h-4 w-[75%] bg-[#F5F5F7] dark:bg-white/5 rounded-lg animate-pulse" />
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
              <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large transition-all duration-500 group/hero">
                <div className="flex items-start gap-8">
                  <div 
                    className="w-20 h-20 rounded-[24px] bg-[#0071E3] flex items-center justify-center shadow-xl shadow-blue-500/30 flex-shrink-0 transition-transform hover:rotate-6 cursor-pointer"
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+technical+feasibility+analysis`, '_blank')}
                  >
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-6 w-full">
                    <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6">
                        <h2 
                          className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1D1D1F] dark:text-white leading-tight flex-1 pr-4 uppercase italic tracking-tighter cursor-pointer hover:text-[#0071E3] transition-colors"
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+strategic+alignment+market+trends`, '_blank')}
                        >
                          {idea.title}
                        </h2>
                        <span className="px-5 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20 shadow-apple-sm shrink-0 whitespace-nowrap italic self-start">
                            {riskLevel} Risk Strategy
                        </span>
                    </div>
                    <p className="text-xl text-[#6E6E73] dark:text-[#86868B] leading-relaxed max-w-2xl font-medium italic">{idea.summary}</p>
                    <div className="flex flex-wrap gap-3">
                      {idea.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-5 py-2 rounded-full bg-[#F5F5F7] dark:bg-white/5 text-[#86868B] dark:text-[#A1A1A6] text-[10px] font-black uppercase tracking-widest border border-[#E5E5EA] dark:border-white/10 italic hover:border-blue-500/30 cursor-pointer transition-all"
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(tag)}+market+trends+2024`, '_blank')}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mt-16 pt-12 border-t border-[#F5F5F7] dark:border-white/5">
                  <div className="cursor-pointer" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+market+impact+analysis`, '_blank')}>
                    <MetricCard icon={Target} label="Impact" value={idea.impact} sub="Core Business Value" />
                  </div>
                  <div className="cursor-pointer" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+technical+data+availability+signals`, '_blank')}>
                    <MetricCard icon={TrendingUp} label="Confidence" value={`${idea.confidence}%`} sub="Data Availability" />
                  </div>
                  <div className="cursor-pointer" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+development+timeline+benchmarks`, '_blank')}>
                    <MetricCard icon={Clock} label="Time to Market" value={idea.timeToMarket} sub="Agile Delivery" />
                  </div>
                  <div className="cursor-pointer" onClick={() => document.getElementById('intensity-waves')?.scrollIntoView({ behavior: 'smooth' })}>
                    <MetricCard icon={BrainCircuit} label="Est. ROI" value={idea.estimatedROI} sub="12 Month Proj." />
                  </div>
                </div>
              </div>

              {/* Financial Projection Area */}
               <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large group/matrix hover:border-[#0071E3]/30 transition-all duration-500">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center border border-[#0071E3]/20 shadow-sm">
                      <TrendingUp className="w-7 h-7 text-[#0071E3]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Revenue Growth Matrix</h3>
                      <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-mono mt-1 uppercase tracking-[0.2em] italic font-bold">12-month predictive revenue vs capture cost</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+market+ROI+financial+model+analysis`, '_blank')}
                      variant="outline"
                      className="h-10 px-5 rounded-2xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-[9px] font-black uppercase tracking-widest italic opacity-0 group-hover/matrix:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-white"
                    >
                       Verify Model <ExternalLink size={12} className="ml-2" />
                    </Button>
                    <div className="px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-apple-sm italic whitespace-nowrap">
                       ROI GAP: {idea.estimatedROI}
                    </div>
                  </div>
                </div>
                <div className="h-[380px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={idea.financialProjections} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#E5E5EA" opacity={0.3} />
                      <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#86868B', fontSize: 10, fontWeight: 900 }} 
                          dy={15} 
                      />
                      <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#86868B', fontSize: 10, fontWeight: 900 }} 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                          dx={-15}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid #E5E5EA', borderRadius: '24px', fontWeight: 'bold', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
                        itemStyle={{ color: '#0071E3', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Projected Revenue']}
                        labelStyle={{ color: '#86868B', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: '900' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0071E3" 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        activeDot={{ r: 8, stroke: '#0071E3', strokeWidth: 4, fill: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large transition-all duration-500 group/roadmap">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      Execution Roadmap
                    </h3>
                    <Button 
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+implementation+roadmap+phases`, '_blank')}
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-[8px] font-black uppercase tracking-widest italic opacity-0 group-hover/roadmap:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-white"
                    >
                       Verify Phases <ExternalLink size={10} className="ml-1.5" />
                    </Button>
                  </div>
                  <div className="space-y-8">
                    {idea.implementation.map((step, i) => (
                      <div 
                        key={i} 
                        className="flex gap-6 group cursor-pointer"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(step.step)}+technical+execution+details`, '_blank')}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-[#0071E3] flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            {i + 1}
                          </div>
                          {i !== idea.implementation.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-blue-500/50 to-transparent my-2" />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="font-black text-[#1D1D1F] dark:text-white mb-2 uppercase italic tracking-tight group-hover:text-[#0071E3] transition-colors">{step.step}</div>
                          <div className="text-sm text-[#6E6E73] dark:text-[#86868B] leading-relaxed font-medium italic">{step.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large transition-all duration-500 group/risks">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6 text-amber-500" />
                      Strategic Risk Matrix
                    </h3>
                    <Button 
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.title)}+competitive+risks+threats`, '_blank')}
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-amber-500/20 bg-amber-500/5 text-amber-600 text-[8px] font-black uppercase tracking-widest italic opacity-0 group-hover/risks:opacity-100 transition-opacity hover:bg-amber-500 hover:text-white"
                    >
                       Verify Threats <ExternalLink size={10} className="ml-1.5" />
                    </Button>
                  </div>
                  <div className="space-y-5">
                    {idea.risks.map((risk, i) => (
                      <div 
                        key={i} 
                        className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 flex gap-4 italic text-sm font-medium text-[#6E6E73] dark:text-[#86868B] hover:border-amber-500/30 transition-all group cursor-pointer"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(risk)}+market+impact`, '_blank')}
                      >
                        <span className="text-amber-500 font-black">•</span>
                        {risk}
                      </div>
                    ))}
                  </div>
                  <div 
                    className="mt-10 p-8 rounded-[32px] bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
                    onClick={() => window.open(`https://www.google.com/search?q=strategic+risk+mitigation+for+${encodeURIComponent(idea.title)}`, '_blank')}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
                    <div className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-[0.2em] mb-3 italic">Mitigation Strategy</div>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed font-medium italic">
                      Deploy in staged cohorts to US-East region first. Monitor user churn and API performance latency before global rollout in Q4.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Details Area */}
            <div className="space-y-10">
              <div className="p-10 rounded-[48px] bg-[#1D1D1F] dark:bg-[#1C1C1E] text-white shadow-apple-large relative overflow-hidden transition-all duration-500 group/signal">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#0071E3]/20 blur-[80px] rounded-full -mr-20 -mt-20 animate-pulse-slow" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Market Signal Analysis</h3>
                  <Button 
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.marketTrigger)}+${encodeURIComponent(idea.marketGap)}`, '_blank')}
                    variant="outline"
                    className="h-8 px-3 rounded-lg border-blue-500/30 text-blue-400 text-[8px] font-black uppercase tracking-widest italic opacity-0 group-hover/signal:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white"
                  >
                    Verify Signals <ExternalLink size={10} className="ml-1.5" />
                  </Button>
                </div>
                <div className="space-y-8">
                  <div className="group">
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Market Trigger</div>
                    <p className="text-sm leading-relaxed text-slate-300 font-medium italic group-hover:text-white transition-colors">
                      <a 
                        href={idea.source_urls?.[0] || `https://www.google.com/search?q=${encodeURIComponent(idea.marketTrigger)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0071E3] hover:text-blue-400 underline decoration-[#0071E3]/30 underline-offset-4 transition-all inline-flex items-center gap-2 group/link"
                      >
                        {idea.marketTrigger}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <div className="group">
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 italic">White Space Opportunity</div>
                    <p className="text-sm leading-relaxed text-slate-300 font-medium italic group-hover:text-white transition-colors">
                      <a 
                        href={idea.source_urls?.[1] || `https://www.google.com/search?q=${encodeURIComponent(idea.marketGap)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0071E3] hover:text-blue-400 underline decoration-[#0071E3]/30 underline-offset-4 transition-all inline-flex items-center gap-2 group/link"
                      >
                        {idea.marketGap}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <div className="group">
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Primary User Persona</div>
                    <p className="text-sm leading-relaxed text-slate-300 font-medium italic group-hover:text-white transition-colors">
                      <a 
                        href={idea.source_urls?.[2] || `https://www.google.com/search?q=${encodeURIComponent(idea.targetAudience)}+market+needs`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0071E3] hover:text-blue-400 underline decoration-[#0071E3]/30 underline-offset-4 transition-all inline-flex items-center gap-2 group/link"
                      >
                        {idea.targetAudience}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-10 rounded-[48px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple-large transition-all duration-500 group/caps">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Core Functions</h3>
                  <Button 
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(idea.coreCapabilities.join(' + '))}+technical+implementation`, '_blank')}
                    variant="outline"
                    className="h-8 px-3 rounded-lg border-blue-500/20 text-blue-600 text-[8px] font-black uppercase tracking-widest italic opacity-0 group-hover/caps:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white"
                  >
                    Audit Specs <ExternalLink size={10} className="ml-1.5" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {idea.coreCapabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#F5F5F7] dark:hover:bg-white/5 transition-all group cursor-default border border-transparent hover:border-[#0071E3]/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0071E3] shadow-[0_0_8px_rgba(0,113,227,0.4)] group-hover:scale-125 transition-transform" />
                      <span className="text-[#6E6E73] dark:text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white font-bold italic text-sm">
                        <a 
                          href={idea.source_urls?.[i + 3] || `https://www.google.com/search?q=${encodeURIComponent(cap)}+technical+architecture`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#0071E3] hover:text-blue-600 dark:hover:text-blue-400 underline decoration-[#0071E3]/20 underline-offset-4 transition-all inline-flex items-center gap-2 group/link"
                        >
                          {cap}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  onClick={handleGenerate}
                  className="w-full h-16 bg-[#F5F5F7] dark:bg-white/5 hover:bg-[#E5E5EA] dark:hover:bg-white/10 text-[#1D1D1F] dark:text-white rounded-[24px] gap-3 border border-[#E5E5EA] dark:border-white/10 font-black uppercase tracking-widest text-[10px] italic shadow-apple-sm transition-all hover:scale-[1.02]"
                >
                  <RotateCw className="w-4 h-4" />
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
