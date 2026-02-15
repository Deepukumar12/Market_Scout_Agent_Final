
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, Sparkles, Download, BrainCircuit, Wand2, 
  Target, TrendingUp, ShieldAlert, Clock, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

// --- Types ---

type FocusArea = 'Revenue' | 'Efficiency' | 'Innovation' | 'MarketShare';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface AiIdea {
  id: string;
  title: string;
  summary: string;
  impact: string;
  confidence: number;
  timeToMarket: string;
  marketGap: string;
  marketTrigger: string; // New: What market event caused this?
  targetAudience: string; // New: Who is this for?
  coreCapabilities: string[]; // New: What does the feature actually do?
  implementation: { step: string; detail: string }[];
  risks: string[];
  estimatedROI: string;
  financialProjections: { month: string; value: number; cost: number }[];
  tags: string[];
}

// --- Mock Data Generator ---

const generateMockIdea = (focus: FocusArea, risk: RiskLevel): AiIdea => {
  const features: Record<string, Partial<AiIdea>[]> = {
    Revenue: [
      {
        title: "Smart-Pricing Autopilot",
        marketTrigger: "Analysis detected a 15% price volatility in the mid-market segment over the last 30 days.",
        summary: "A dynamic pricing module that automatically adjusts your visible pricing tiers based on real-time competitor scraping. Capture higher margins during competitor stock-outs.",
        targetAudience: "Enterprise Sales & RevOps Teams",
        coreCapabilities: [
          "Real-time competitor price parsing",
          "Automated variance alerts (+/- 5%)",
          "A/B testing framework for pricing pages",
          "Margin protection guardrails"
        ],
        marketGap: "Competitors only update prices weekly. Sub-hourly adjustments give a first-mover advantage.",
        tags: ["Monetization", "AI", "Revenue"],
        confidence: 89,
      },
      {
        title: "Partner Ecosystem Hub",
        marketTrigger: "Competitor 'SectorLeader' recently integrated with 3 major CRM platforms, increasing their stickiness.",
        summary: "Launch a centralized integration marketplace within the dashboard, allowing users to one-click connect their existing toolstack (Salesforce, HubSpot, Slack).",
        targetAudience: "Product Managers & Integration Specialists",
        coreCapabilities: [
          "No-code API connector builder",
          "White-labeled partner directory",
          "Usage-based revenue sharing model",
          "Unified authentication layer (SSO)"
        ],
        marketGap: "Users currently rely on Zapier for integrations, which adds friction. Native integrations reduce churn by 40%.",
        tags: ["Ecosystem", "Retention", "B2B"],
        confidence: 76,
      }
    ],
    Efficiency: [
      {
        title: "Auto-Compliance Shield",
        marketTrigger: "New GDPR regulations in EU region have increased manual compliance audit times by 200%.",
        summary: "An integrated AI agent that scans all outgoing reports and scraped data for PII (Personally Identifiable Information) and automatically redacts it before storage.",
        targetAudience: "Data Compliance Officers & Legal",
        coreCapabilities: [
          "PII/PHI detection pattern matching",
          "Auto-redaction of sensitive fields",
          "Audit log generation for legal review",
          "Real-time compliance dashboard"
        ],
        marketGap: "Manual review is the current standard. Automating this eliminates the primary bottleneck in data delivery.",
        tags: ["Compliance", "Ops", "Security"],
        confidence: 94,
      }
    ],
    Innovation: [
      {
        title: "Predictive Supply Chain Oracle",
        marketTrigger: "Global logistics index shows a 12% increase in delay risks for the upcoming quarter.",
        summary: "A predictive analytics feature that overlays weather data, news sentiment, and shipping manifests to forecast stock-outs for tracked competitors.",
        targetAudience: "Supply Chain Directors & Procurement",
        coreCapabilities: [
          "Satellite imagery analysis for port congestion",
          "News sentiment correlation engine",
          "Inventory depletion forecasting",
          "Early warning notification system"
        ],
        marketGap: "Competitors only show current stock. Predicting future availability is a 'Blue Ocean' capability.",
        tags: ["Deep Tech", "Predictive", "AI"],
        confidence: 82,
      }
    ],
    MarketShare: [
      {
        title: "Freemium 'Lite' Benchmarker",
        marketTrigger: "Data shows 60% of site visitors churn because the main product is 'too complex' for small teams.",
        summary: "Release a standalone, free-to-use benchmarking tool that provides a single 'Competitor Health Score' to capture top-of-funnel leads.",
        targetAudience: "SME Founders & Growth Hackers",
        coreCapabilities: [
          "One-click URL analysis",
          "Basic SEO & Social score generation",
          "PDF report export (watermarked)",
          "Seamless upgrade path to Pro"
        ],
        marketGap: "The low-end market is underserved. capturing these users early builds a defensible moat.",
        tags: ["PLG", "Growth", "Marketing"],
        confidence: 88,
      }
    ]
  };

  const pool = features[focus] || features['Revenue'];
  const base = pool[Math.floor(Math.random() * pool.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    title: base.title || "Feature Initiative",
    summary: base.summary || "Feature summary...",
    impact: risk === 'High' ? "Transformational" : "Incremental",
    confidence: (base.confidence || 80) + (risk === 'Low' ? 10 : -10),
    timeToMarket: risk === 'High' ? "6-9 Months" : "2-3 Months",
    marketGap: base.marketGap || "Gap analysis...",
    marketTrigger: base.marketTrigger || "Market trend analysis...",
    targetAudience: base.targetAudience || "General Users",
    coreCapabilities: base.coreCapabilities || ["Core function 1", "Core function 2", "Core function 3"],
    estimatedROI: risk === 'High' ? "300%+" : "140%",
    implementation: [
      { step: "Phase 1: Specs & Design", detail: "Finalize PRD and high-fidelity mockups based on user flows." },
      { step: "Phase 2: Core Development", detail: "Backend API implementation and frontend component architecture." },
      { step: "Phase 3: QA & Security", detail: "End-to-end testing and pen-testing for security vulnerabilities." },
      { step: "Phase 4: GTM Launch", detail: "Marketing campaign and staged rollout to user base." }
    ],
    risks: [
      "Technical complexity in data integration",
      "Potential overlap with existing roadmap items",
      "User adoption training required"
    ],
    tags: base.tags || ["Feature"],
    financialProjections: Array.from({ length: 12 }, (_, i) => ({
      month: `M${i + 1}`,
      value: Math.floor(100 + (i * i * (risk === 'High' ? 15 : 8)) + Math.random() * 50),
      cost: Math.floor(50 + (i * 10))
    }))
  };
};


// --- Components ---

const LoadingState = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "Connecting to Neural Engine...",
        "Scanning Competitor Landscape...",
        "Analyzing Market Gaps...",
        "Synthesizing Strategic Proposal..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(s => (s < steps.length - 1 ? s + 1 : s));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" />
                <div className="absolute inset-2 border-4 border-purple-500/30 rounded-full animate-spin duration-3000" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit className="w-10 h-10 text-white animate-pulse" />
                </div>
            </div>
            <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-white tracking-tight">{steps[step]}</h3>
                <p className="text-slate-500 text-sm">Processing 4.2TB of market data parameters</p>
            </div>
            <div className="flex gap-2">
                {steps.map((_, i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300", 
                            i <= step ? "bg-blue-500 scale-110" : "bg-slate-700"
                        )} 
                    />
                ))}
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, trend, icon: Icon, color }: any) => (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
        <div className={cn("absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity", color)}>
            <Icon className="w-12 h-12" />
        </div>
        <div className="relative z-10">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold text-white tracking-tight mb-1">{value}</div>
            {trend && (
                <div className={cn("text-xs font-medium flex items-center gap-1", color)}>
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                </div>
            )}
        </div>
    </div>
);

const AiSuggestionPage = () => {
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState<AiIdea | null>(null);
  
  // Config State
  const [focusArea, setFocusArea] = useState<FocusArea>('Revenue');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');

  const handleGenerate = async () => {
    setIdea(null);
    setLoading(true);
    // Simulate varying delay
    await new Promise(resolve => setTimeout(resolve, 3500));
    const newIdea = generateMockIdea(focusArea, riskLevel);
    setIdea(newIdea);
    setLoading(false);
  };

  const downloadPdf = () => {
    if (!idea) return;
    const doc = new jsPDF();
    
    // Modern Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ScoutIQ Feature Proposal", 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Generated: ${new Date().toLocaleDateString()} | ID: ${idea.id}`, 15, 30);

    // Title Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(idea.title, 15, 60);

    // Context Badges
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Target: ${idea.targetAudience} | Risk: ${riskLevel} | Confidence: ${idea.confidence}%`, 15, 70);

    // Market Trigger
    doc.setFillColor(240, 249, 255); // Light blue
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(15, 75, 180, 20, 3, 3, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 132, 199); // Sky 600
    doc.text("Market Signal:", 20, 88);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text(idea.marketTrigger, 55, 88);

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Feature Summary", 15, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(idea.summary, 180);
    doc.text(summaryLines, 15, 120);

    let y = 120 + (summaryLines.length * 5) + 10;

    // Core Capabilities
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Core Capabilities", 15, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    idea.coreCapabilities.forEach((cap) => {
        doc.text(`• ${cap}`, 20, y);
        y += 7;
    });

    y += 10;

    // Financials
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Projected ROI: ${idea.estimatedROI}`, 15, y);
    
    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This document was generated by an AI model based on market signal analysis.", 15, 280);

    doc.save(`ScoutIQ_Feature_${idea.id}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-6 md:p-8">
       {/* Page Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20 backdrop-blur-md">
                   <BrainCircuit className="w-8 h-8 text-indigo-400" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">AI Feature Lab</h1>
             </div>
             <p className="text-slate-400 text-lg max-w-2xl font-medium">
                Generating competitive feature specs based on real-time market signal analysis.
             </p>
          </div>
          <div className="flex items-center gap-3 bg-[#0B0F19] p-2 rounded-xl border border-[#1E293B]">
             <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Credits Available</span>
                <div className="text-xl font-black text-white">850</div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-4 space-y-6">
             <div className="p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B] shadow-2xl shadow-black/20 sticky top-8">
                <div className="mb-8">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      Analysis Parameters
                   </h3>
                   <p className="text-sm text-slate-500 font-medium">
                      Configure the neural parameters for your feature proposal.
                   </p>
                </div>
                
                <div className="space-y-8">
                   {/* Focus Area Selection */}
                   <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Target className="w-4 h-4" /> Strategic Goal
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                         {(['Revenue', 'Efficiency', 'Innovation', 'MarketShare'] as FocusArea[]).map((area) => (
                            <button
                               key={area}
                               onClick={() => setFocusArea(area)}
                               className={cn(
                                  "px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                                  focusArea === area 
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" 
                                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200"
                               )}
                            >
                               {area}
                            </button>
                         ))}
                      </div>
                   </div>

                   {/* Risk Appetite */}
                   <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4" /> Risk Profile
                      </label>
                      <div className="flex bg-[#020617] p-1.5 rounded-xl border border-white/10">
                         {(['Low', 'Medium', 'High'] as RiskLevel[]).map((level) => (
                            <button
                               key={level}
                               onClick={() => setRiskLevel(level)}
                               className={cn(
                                  "flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                  riskLevel === level 
                                    ? "bg-slate-800 text-white shadow-sm" 
                                    : "text-slate-500 hover:text-slate-300"
                               )}
                            >
                               {level}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <Button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center gap-3">
                            <Wand2 className={cn("w-5 h-5", loading ? "animate-spin" : "")} />
                            {loading ? "INITIALIZING..." : "GENERATE PROPOSAL"}
                        </span>
                    </Button>
                    <p className="text-center text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-widest">
                        Cost: 50 Credits per proposal
                    </p>
                </div>
             </div>
          </div>

          {/* Right Panel: Data Output */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="h-full rounded-3xl bg-[#0B0F19] border border-[#1E293B] shadow-2xl flex items-center justify-center"
                    >
                        <LoadingState />
                    </motion.div>
                ) : !idea ? (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full rounded-3xl border-2 border-dashed border-[#1E293B] bg-white/5 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center mb-6 shadow-xl">
                            <Lightbulb className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Feature Lab Ready</h2>
                        <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Configure your analysis parameters on the left to generate comprehensive feature requirements.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full space-y-6"
                    >
                        {/* Result Header Card */}
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#0B0F19] border border-[#1E293B] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                             
                             <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                            {idea.targetAudience}
                                        </div>
                                        {idea.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={downloadPdf} variant="outline" className="bg-white/5 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 font-bold rounded-xl gap-2">
                                            <Download className="w-4 h-4" />
                                            Export Spec
                                        </Button>
                                    </div>
                                </div>

                                {/* Market Signal Banner */}
                                <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm">
                                    <TrendingUp className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <span className="block font-bold text-blue-400 mb-1 uppercase text-xs tracking-wider">Based on Market Signal</span>
                                        <span className="text-blue-100/90 font-medium italic">"{idea.marketTrigger}"</span>
                                    </div>
                                </div>
                                
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 max-w-2xl">
                                    {idea.title}
                                </h2>
                                
                                <p className="text-lg text-slate-300 leading-relaxed font-medium max-w-3xl mb-8">
                                    {idea.summary}
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MetricCard label="Confidence" value={`${idea.confidence}%`} trend="High" icon={Target} color="text-emerald-400" />
                                    <MetricCard label="Est. ROI" value={idea.estimatedROI} icon={TrendingUp} color="text-indigo-400" />
                                    <MetricCard label="Time" value={idea.timeToMarket} icon={Clock} color="text-amber-400" />
                                    <MetricCard label="Impact" value={idea.impact} icon={ShieldAlert} color="text-purple-400" />
                                </div>
                             </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Deep Dive & Implementation */}
                            <div className="space-y-6">
                                 {/* Core Capabilities */}
                                 <div className="p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B]">
                                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                         <BrainCircuit className="w-5 h-5 text-indigo-400" />
                                         Core Capabilities
                                     </h3>
                                     <ul className="space-y-3">
                                        {idea.coreCapabilities.map((cap, i) => (
                                            <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                                <span className="text-sm text-slate-200 font-medium">{cap}</span>
                                            </li>
                                        ))}
                                     </ul>
                                 </div>

                                 <div className="p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B]">
                                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                         <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                         Implementation Roadmap
                                     </h3>
                                     <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-white/5">
                                         {idea.implementation.map((step, i) => (
                                             <div key={i} className="relative pl-10">
                                                 <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#020617] border border-[#1E293B] flex items-center justify-center text-xs font-bold text-indigo-400 z-10">
                                                     {i + 1}
                                                 </div>
                                                 <div>
                                                     <h4 className="text-sm font-bold text-white mb-1">{step.step}</h4>
                                                     <p className="text-sm text-slate-400 leading-relaxed">{step.detail}</p>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                            </div>

                            {/* Chart & Market Gap */}
                            <div className="space-y-6">
                                <div className="p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B]">
                                    <h3 className="text-lg font-bold text-white mb-4">Financial Projection (12M)</h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={idea.financialProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="month" tick={{fill: '#475569', fontSize: 10}} tickLine={false} axisLine={false} />
                                                <YAxis tick={{fill: '#475569', fontSize: 10}} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#e2e8f0' }}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                                <Area type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500" /> Revenue
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <div className="w-3 h-3 rounded-full bg-rose-500" /> Cost
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-indigo-900/10 border border-indigo-500/20">
                                    <h3 className="text-lg font-bold text-indigo-400 mb-2">Market Gap Opportunity</h3>
                                    <p className="text-indigo-100/80 leading-relaxed font-medium">
                                        {idea.marketGap}
                                    </p>
                                </div>

                                <div className="p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B]">
                                     <h3 className="text-lg font-bold text-white mb-4">Risk Analysis</h3>
                                     <ul className="space-y-3">
                                         {idea.risks.map((risk, i) => (
                                             <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                 <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                                                 <span className="text-sm text-slate-300 font-medium">{risk}</span>
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
       </div>
    </div>
  );
};

export default AiSuggestionPage;
