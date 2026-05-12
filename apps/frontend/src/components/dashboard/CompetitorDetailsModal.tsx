import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Zap, 
  Globe, 
  Building2, 
  Users, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Loader2,
  ExternalLink,
  Target,
  ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getLastSevenDays, getIntelligenceStream } from '@/services/api';
import { cn, getCompetitorColor } from '@/utils/utils';

interface CompetitorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitor: any;
}

const CompetitorDetailsModal: React.FC<CompetitorDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  competitor 
}) => {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<any[]>([]);
  const [featureSignals, setFeatureSignals] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && competitor) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [featureData, streamData] = await Promise.all([
            getLastSevenDays(competitor.name),
            getIntelligenceStream(50, competitor.name)
          ]);
          setFeatureSignals(featureData);
          setSignals(streamData.filter((s: any) => 
            s.query_tag?.toLowerCase() === competitor.name.toLowerCase() ||
            s.company_name?.toLowerCase() === competitor.name.toLowerCase()
          ));
        } catch (err) {
          console.error('Failed to fetch details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, competitor]);

  const trajectoryData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const count = featureSignals.filter(s => 
        (s.release_date === date) || 
        (s.created_at && s.created_at.startsWith(date))
      ).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: count,
        innovation: Math.min(100, count * 20 + 20) // Base innovation + activity
      };
    });
  }, [featureSignals]);

  if (!isOpen) return null;

  const compColor = getCompetitorColor(competitor.name);
  // Metrics should be consistent with the main grid
  const innovationScore = competitor.innovation_score || 0;
  const riskLevel = competitor.risk_level || 'Low';
  const signalsCount = featureSignals.length || competitor.features_count || 0;

  const handleGenerateReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const html = `
      <html>
        <head>
          <title>Strategic Intelligence Report - ${competitor.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1d1d1f; line-height: 1.6; }
            .header { border-bottom: 2px solid #0071e3; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo-placeholder { width: 80px; height: 80px; background: #f5f5f7; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 32px; color: #0071e3; margin-bottom: 10px; }
            h1 { margin: 0; font-size: 48px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; }
            .meta { color: #86868b; font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; }
            .section { margin-bottom: 40px; page-break-inside: avoid; }
            .section-title { font-size: 10px; font-weight: 900; color: #86868b; text-transform: uppercase; letter-spacing: 3px; border-bottom: 1px solid #e5e5ea; padding-bottom: 10px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { padding: 20px; background: #f5f5f7; border-radius: 20px; }
            .card-val { font-size: 24px; font-weight: 900; font-style: italic; }
            .card-label { font-size: 10px; font-weight: 900; color: #86868b; text-transform: uppercase; }
            .signal-row { padding: 15px 0; border-bottom: 1px solid #f5f5f7; }
            .signal-date { font-size: 10px; font-weight: 900; color: #0071e3; }
            .signal-summary { font-size: 14px; font-weight: 500; margin-top: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #0071e3; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">Download PDF</button>
          </div>
          <div class="header">
            <div>
              <div class="logo-placeholder">${competitor.name[0]}</div>
              <h1>${competitor.name}</h1>
              <div class="meta">Network Surveillance Briefing | GEN-7 ARCHIVE</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Date: ${new Date().toLocaleDateString()}</div>
              <div class="meta">Status: ${competitor.status || 'Active'}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card"><div class="card-label">Features</div><div class="card-val">${signalsCount}</div></div>
            <div class="card"><div class="card-label">Innovation</div><div class="card-val">${innovationScore}%</div></div>
            <div class="card"><div class="card-label">Risk</div><div class="card-val" style="color: ${riskLevel === 'High' ? '#ff3b30' : '#34c759'}">${riskLevel}</div></div>
            <div class="card"><div class="card-label">Velocity</div><div class="card-val">${competitor.velocity || 'Medium'}</div></div>
          </div>

          <div class="section">
            <div class="section-title">Technical Signal Timeline (7 Days)</div>
            ${featureSignals.map(s => `
              <div class="signal-row">
                <div class="signal-date">${s.release_date} | ${s.category}</div>
                <div class="signal-summary">${s.feature_name}: ${s.summary || 'Technical implementation detected.'}</div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">Market Intelligence Stream</div>
            ${signals.map(s => `
              <div class="signal-row">
                <div class="signal-date">${new Date(s.created_at).toLocaleString()} | ${s.sentiment}</div>
                <div class="signal-summary">${s.article_summary}</div>
              </div>
            `).join('')}
          </div>

          <script>window.onload = () => setTimeout(() => { window.print(); }, 500);</script>
        </body>
      </html>
    `;
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-6xl h-[90vh] bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-[48px] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 relative overflow-hidden shrink-0">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
             
             <div className="flex items-center gap-8 relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 p-1 shadow-apple overflow-hidden shrink-0">
                   {competitor.firmographics?.logo ? (
                     <img src={competitor.firmographics.logo} alt={competitor.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#0071E3] uppercase italic">
                        {competitor.name?.[0]}
                     </div>
                   )}
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-4xl md:text-5xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">
                        {competitor.name}
                      </h2>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                        competitor.status === 'Active' ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-blue-500/20 text-blue-400 bg-blue-500/5"
                      )}>
                        {competitor.status || 'Active'}
                      </span>
                   </div>
                   <div className="flex items-center gap-4 text-xs font-mono text-[#86868B] uppercase tracking-widest">
                      <a 
                        href={competitor.url.startsWith('http') ? competitor.url : `https://${competitor.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[#0071E3] transition-all group/url"
                      >
                        <Globe size={14} className="text-[#0071E3]" />
                        <span className="opacity-60">{competitor.url}</span>
                        <ArrowUpRight size={10} className="opacity-0 group-hover/url:opacity-100 transition-opacity" />
                      </a>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#0071E3]" />
                        <span className="opacity-60">Deployment: {new Date(competitor.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4 relative z-10">
                <button 
                  onClick={onClose}
                  className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/10 hover:bg-white dark:hover:bg-white/10 text-[#1D1D1F] dark:text-white transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
             </div>
          </div>

          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center py-40">
                <Loader2 size={48} className="text-[#0071E3] animate-spin mb-6" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing 7-Day Surveillance Data...</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="p-8 rounded-[32px] bg-white/50 dark:bg-white/5 border border-white/10 shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                            <Target size={20} />
                         </div>
                         <TrendingUp size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Features</p>
                      <div className="text-3xl font-black text-[#1D1D1F] dark:text-white italic">{signalsCount}</div>
                      <p className="text-[9px] text-[#34C759] font-bold uppercase mt-2 italic">+100% Signal Velocity</p>
                   </div>
                   
                   <div className="p-8 rounded-[32px] bg-white/50 dark:bg-white/5 border border-white/10 shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                            <Zap size={20} />
                         </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Innovation Index</p>
                      <div className="text-3xl font-black text-purple-500 italic">{innovationScore}%</div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${innovationScore}%` }}
                           className="h-full bg-purple-500"
                         />
                      </div>
                   </div>

                   <div className="p-8 rounded-[32px] bg-white/50 dark:bg-white/5 border border-white/10 shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                            <Shield size={20} />
                         </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Profile</p>
                      <div className={cn(
                        "text-3xl font-black italic",
                        riskLevel === 'High' ? "text-rose-500" : riskLevel === 'Medium' ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {riskLevel}
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 italic">Based on {featureSignals.length} critical vectors</p>
                   </div>

                   <div className="p-8 rounded-[32px] bg-white/50 dark:bg-white/5 border border-white/10 shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Building2 size={20} />
                         </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Firmographics</p>
                      <div className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase italic truncate">
                         {competitor.firmographics?.industry || 'Technology'}
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 italic">
                         {competitor.firmographics?.location || 'Global Operations'}
                      </p>
                   </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   {/* Left: Signals Feed */}
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Live <span className="text-blue-600">Surveillance</span></h3>
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{signals.length} Updates Found</div>
                      </div>
                      
                      <div className="space-y-4">
                         {signals.length > 0 ? signals.map((signal, i) => (
                           <motion.div 
                             key={i}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.05 }}
                             className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group"
                           >
                              <div className="flex items-start gap-4">
                                 <div className={cn(
                                   "w-1 h-12 rounded-full mt-1",
                                   signal.sentiment === 'Positive' ? "bg-emerald-500" : "bg-blue-500"
                                 )} />
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                          {new Date(signal.created_at || signal.scraped_at).toLocaleDateString()}
                                       </span>
                                       <a 
                                         href={signal.url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-blue-500 hover:text-blue-600 transition-colors"
                                       >
                                          <ExternalLink size={12} />
                                       </a>
                                    </div>
                                    <p className="text-sm font-medium text-[#1D1D1F] dark:text-white/90 leading-relaxed italic line-clamp-3">
                                       {signal.article_summary || signal.technical_summary}
                                    </p>
                                    <div className="flex items-center gap-3 mt-4">
                                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                          {signal.sentiment}
                                       </span>
                                       <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">
                                          {signal.type || 'Signal'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                         )) : (
                           <div className="p-12 text-center rounded-[32px] border border-dashed border-white/10 opacity-40">
                              <Loader2 className="w-8 h-8 mx-auto mb-4" />
                              <p className="text-xs font-black uppercase italic">No recent signals detected</p>
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Right: Detailed Metrics & Feature History */}
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Feature <span className="text-purple-600">Intelligence</span></h3>
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last 7 Days</div>
                      </div>

                      <div className="p-8 rounded-[40px] bg-white dark:bg-white/5 border border-white/10 shadow-apple space-y-8">
                         {/* Innovation Pulse */}
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Innovation Trajectory</span>
                               <span className="text-lg font-black italic text-purple-500">{innovationScore}%</span>
                            </div>
                            <div className="h-48 w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={trajectoryData}>
                                    <defs>
                                      <linearGradient id="colorInnovation" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#AF52DE" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#AF52DE" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                                    <XAxis 
                                      dataKey="date" 
                                      axisLine={false} 
                                      tickLine={false} 
                                      tick={{ fill: '#86868B', fontSize: 8, fontWeight: 900 }}
                                      dy={10}
                                      interval={0}
                                    />
                                    <YAxis 
                                      axisLine={false} 
                                      tickLine={false} 
                                      tick={{ fill: '#86868B', fontSize: 8, fontWeight: 900 }}
                                      allowDecimals={false}
                                      domain={[0, 'auto']}
                                    />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: 'rgba(28, 28, 30, 0.9)', 
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '16px',
                                        fontSize: '10px',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                      }}
                                      itemStyle={{ color: '#AF52DE', fontWeight: 'bold' }}
                                      labelStyle={{ color: '#86868B', marginBottom: '4px', fontWeight: '900' }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="count" 
                                      stroke="#AF52DE" 
                                      strokeWidth={4}
                                      fillOpacity={1} 
                                      fill="url(#colorInnovation)" 
                                      animationDuration={2000}
                                      animationEasing="ease-in-out"
                                      activeDot={{ r: 6, stroke: '#AF52DE', strokeWidth: 2, fill: '#fff' }}
                                    />
                                  </AreaChart>
                               </ResponsiveContainer>
                            </div>
                         </div>

                         <div className="border-t border-white/10 pt-8 space-y-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                  <Shield size={24} />
                               </div>
                               <div>
                                  <h4 className="text-sm font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-white">Threat Assessment</h4>
                                  <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">Automated risk matrix synchronization complete.</p>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/10">
                                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Velocity</div>
                                  <div className="text-sm font-black italic text-[#1D1D1F] dark:text-white">{competitor.velocity || 'Medium'}</div>
                               </div>
                               <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/10">
                                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Sentiment</div>
                                  <div className="text-sm font-black italic text-emerald-500">{competitor.sentiment || 'Neutral'}</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div 
                        onClick={handleGenerateReport}
                        className="p-8 rounded-[40px] bg-[#0071E3] text-white space-y-4 shadow-xl shadow-blue-500/20 group hover:scale-[1.02] transition-all cursor-pointer"
                      >
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">Mission Critical</span>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                         </div>
                         <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Generate Full Strategic Report</h4>
                         <p className="text-xs font-medium italic opacity-70">Synthesize all 7-day signals into a comprehensive PDF intelligence briefing.</p>
                      </div>
                   </div>
                </div>
              </>
            )}
          </div>
          
          {/* Footer Status */}
          <div className="px-12 py-6 bg-white/50 dark:bg-white/5 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest italic shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Surveillance Stream Active
             </div>
             <div>Protocol: GEN-7 ARCHIVE SYNCHRONIZED</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompetitorDetailsModal;
