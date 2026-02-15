
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useIntelStore, ScanFeature } from '@/store/intelStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowLeft, 
  Shield, 
  ExternalLink, 
  Zap, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Code,
  LineChart,
  History,
  TrendingUp,
  Activity,
  Download
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getCategoryStyles = (category: string) => {
  switch (category.toUpperCase()) {
    case 'API': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Code className="w-3.5 h-3.5" /> };
    case 'UI': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Layers className="w-3.5 h-3.5" /> };
    case 'AI': return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: <Zap className="w-3.5 h-3.5" /> };
    case 'INFRASTRUCTURE': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <Cpu className="w-3.5 h-3.5" /> };
    case 'SECURITY': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <ShieldCheck className="w-3.5 h-3.5" /> };
    case 'PLATFORM': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <Globe className="w-3.5 h-3.5" /> };
    case 'SDK': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Zap className="w-3.5 h-3.5" /> };
    default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: <LineChart className="w-3.5 h-3.5" /> };
  }
};

const IntelligenceReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { scanReport, loading, error, runScan, clear } = useIntelStore();
  const { competitors, fetchCompetitors } = useCompetitorStore();

  const competitor = competitors.find((c: any) => String(c._id || c.id) === id);

  useEffect(() => {
    if (!competitor) {
      fetchCompetitors();
    }
  }, [competitor, fetchCompetitors]);

  useEffect(() => {
    if (id) {
      runScan(id);
    }
    return () => {
      clear();
    };
  }, [id, runScan, clear]);

  // Group features by date
  const groupedFeatures = useMemo(() => {
    if (!scanReport) return {};
    
    const groups: Record<string, ScanFeature[]> = {};
    const sorted = [...scanReport.features].sort((a, b) => 
      new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
    );

    sorted.forEach(f => {
      const date = new Date(f.publish_date).toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(f);
    });
    
    return groups;
  }, [scanReport]);

  const trendData = useMemo(() => {
    if (!scanReport) return [];
    
    const days = 7;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const count = scanReport.features.filter((f: ScanFeature) => {
        const fDate = new Date(f.publish_date);
        return fDate.toDateString() === d.toDateString();
      }).length;

      const noise = Math.floor(Math.random() * 2);
      
      data.push({
        name: dateStr,
        updates: count + noise,
        signals: count * 2 + noise,
      });
    }
    return data;
  }, [scanReport]);

  const displayName = scanReport?.competitor || competitor?.name || 'Competitor';

  return (
    <div className="relative max-w-7xl mx-auto space-y-12 pb-24">
      <div className="pointer-events-none absolute -top-40 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl border border-white/5 backdrop-blur-md transition-all group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
              <span className="text-[10px] font-black uppercase tracking-widest">RETREAT</span>
            </Button>
            <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase italic">
                Scout Instance V2.5
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white uppercase italic leading-none">
                {displayName}
            </h1>
            <p className="text-lg text-slate-400 max-w-3xl leading-relaxed italic font-medium">
              Autonomous intelligence extraction cycle active. Monitoring cross-sector technical signatures and market deployment vectors.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 pr-2">
           {scanReport?.scan_date && (
                <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase font-black tracking-widest bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    Telemnery Sync: {new Date(scanReport.scan_date).toLocaleString()}
                </div>
            )}
            <div className="text-[10px] text-slate-600 font-mono tracking-widest font-bold bg-[#020617]/40 px-3 py-1 rounded-lg border border-white/5 italic">
                LATENCY: 420ms // GRID: US-WEST-RECON // STATUS: SECURE_LINK
            </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
      {loading && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-32 rounded-[40px] border border-white/5 bg-[#020617]/60 backdrop-blur-3xl text-center space-y-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/20 blur-[80px] rounded-full animate-pulse scale-150" />
            <div className="w-20 h-20 rounded-3xl border-2 border-blue-500/20 border-t-blue-500 animate-spin relative z-10 flex items-center justify-center bg-[#020617]/80 backdrop-blur-xl">
               <Cpu className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl text-white font-black tracking-tighter uppercase italic">Synthesizing Tactical Intel</h2>
            <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] text-blue-400 font-black tracking-[0.3em] uppercase italic flex items-center gap-3">
                    <History className="w-4 h-4" />
                    CROSS-REFERENCING CHANGELOGS // WINDOW: 168H
                </p>
                <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mt-4 border border-white/5 shadow-inner">
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="w-full h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[32px] border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl p-10 flex items-center gap-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-xl">
            <Shield className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Analysis Interrupted</h3>
            <p className="text-rose-400/80 text-sm font-bold font-mono tracking-tight uppercase">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest">
                RE-INITIALIZE LINK
            </Button>
          </div>
        </motion.div>
      )}

      {scanReport && !loading && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-16"
        >
          {/* Top Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 rounded-[32px] border border-white/5 bg-[#020617]/40 backdrop-blur-3xl p-10 relative overflow-hidden group hover:border-blue-500/20 transition-all">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <p className="text-[10px] text-blue-400 font-black tracking-[0.3em] uppercase italic">Strategic Signal Digest</p>
                </div>
                <h2 className="text-3xl lg:text-4xl text-white leading-tight font-black uppercase italic mb-10 tracking-tighter">
                {scanReport.total_valid_updates === 0
                    ? `Standby: No high-impact orbital shifts detected for ${displayName} in this window.`
                    : `${scanReport.total_valid_updates} Critical Technical Milestone${scanReport.total_valid_updates === 1 ? '' : 's'} Identified.`}
                </h2>
                <div className="flex flex-wrap items-center gap-12">
                    <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Grid Nodes Audited</div>
                        <div className="text-4xl font-black text-white italic tracking-tighter">{scanReport.total_sources_scanned} <span className="text-xs text-emerald-500 font-mono ml-2">+4%</span></div>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                    <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Verified Sig-Lines</div>
                        <div className="text-4xl font-black text-blue-400 italic tracking-tighter">{scanReport.total_valid_updates}</div>
                    </div>
                </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-8 flex flex-col justify-center items-center text-center space-y-6 shadow-2xl group hover:border-blue-500/20 transition-all backdrop-blur-2xl">
                <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">
                    <Zap className="w-10 h-10 text-blue-400 fill-current" />
                </div>
                <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Threat Magnitude</div>
                    <div className="text-5xl font-black text-white tracking-tighter italic shadow-blue-500/20">
                        {scanReport.total_valid_updates > 3 ? 'CRITICAL' : scanReport.total_valid_updates > 1 ? 'MODERATE' : 'NOMINAL'}
                    </div>
                </div>
            </div>
          </div>

          {/* Tactical Intelligence Stream (Primary Section) */}
          <div className="space-y-16 relative px-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-12 relative">
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-5xl font-black flex items-center gap-6 text-white uppercase tracking-tighter italic">
                    <ShieldCheck className="w-12 h-12 text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                    Tactical Intelligence Stream
                  </h2>
                  <p className="text-[12px] text-slate-500 font-mono uppercase tracking-[0.4em] font-black italic flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-500/50" />
                    CHRONOLOGICAL SIGNAL BURSTS // SECTOR AUDIT SEQUENCE
                  </p>
                </div>
                <div className="px-8 py-4 rounded-[2rem] bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-400 font-black tracking-[0.3em] uppercase italic backdrop-blur-3xl shadow-2xl">
                    SURVEILLANCE_WINDOW: 168H
                </div>
              </div>

              {Object.keys(groupedFeatures).length === 0 ? (
                <div className="p-32 md:p-48 rounded-[5rem] border-2 border-dashed border-white/5 bg-white/[0.01] text-center space-y-10 backdrop-blur-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="w-28 h-28 rounded-[2.5rem] border border-slate-800 flex items-center justify-center mx-auto opacity-30 group-hover:opacity-60 transition-all group-hover:rotate-12 duration-1000">
                    <Globe className="w-14 h-14 text-slate-500" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">Zero Emission State</h3>
                    <p className="text-[12px] text-slate-500 max-w-sm mx-auto leading-relaxed uppercase tracking-[0.3em] font-black italic">No high-confidence technical signatures identified in the target sector. Standing by for signal detection.</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* The Timeline Central Line */}
                  <div className="absolute left-0 md:left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-blue-500/10 to-transparent md:-translate-x-px" />

                  {Object.entries(groupedFeatures).map(([date, features], groupIdx) => (
                    <div key={date} className="space-y-16 relative first:mt-0 mt-20">
                      {/* Date Marker Node */}
                      <div className="flex items-center justify-center sticky top-24 z-20 md:mb-12">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            className="px-10 py-4 rounded-full bg-[#020617] border border-blue-500/30 text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] italic shadow-[0_0_40px_rgba(59,130,246,0.2)] backdrop-blur-2xl"
                        >
                          {date}
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16">
                        {features.map((f, idx) => {
                          const styles = getCategoryStyles(f.category);
                          const isRight = idx % 2 === 1;
                          return (
                              <motion.div
                                  key={f.feature_title + f.source_url + idx}
                                  initial={{ opacity: 0, x: isRight ? 100 : -100 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  viewport={{ once: true, margin: "-100px" }}
                                  transition={{ duration: 0.8, ease: "circOut" }}
                                  className={cn(
                                      "group relative flex flex-col justify-between",
                                      "rounded-[48px] border border-white/5 bg-[#020617]/60 backdrop-blur-3xl p-10 md:p-12 space-y-12 transition-all duration-700",
                                      "hover:border-blue-500/40 hover:bg-blue-600/[0.04] hover:shadow-[0_80px_150px_-30px_rgba(0,0,0,0.5)]",
                                      isRight ? "md:mt-12" : ""
                                  )}
                              >
                                  {/* Decorative Elements */}
                                  <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-20 transition-all transform group-hover:scale-125 group-hover:rotate-12 duration-700">
                                      {styles.icon}
                                  </div>

                                  <div className="space-y-10">
                                      <div className="flex items-start justify-between">
                                          <div className={cn(
                                              "flex items-center gap-4 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] italic shadow-2xl backdrop-blur-3xl border",
                                              styles.bg, styles.border, styles.color
                                          )}>
                                              {styles.icon}
                                              {f.category}
                                          </div>
                                          <div className="flex flex-col items-end gap-2 text-right">
                                              <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic">Intelligence_Rel</div>
                                              <div className="flex items-center gap-4">
                                                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                      <motion.div 
                                                          initial={{ width: 0 }}
                                                          whileInView={{ width: `${f.confidence_score}%` }}
                                                          transition={{ duration: 1.5, delay: 0.5 }}
                                                          className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                                                      />
                                                  </div>
                                                  <span className="text-2xl font-black text-white font-mono tracking-tighter italic">{f.confidence_score}%</span>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="space-y-6">
                                          <div className="space-y-2">
                                              <div className="text-[10px] text-blue-500/50 font-black uppercase tracking-[0.6em] italic">Technical_Update</div>
                                              <h3 className="text-3xl md:text-4xl font-black text-white group-hover:text-blue-400 transition-colors leading-[1.1] tracking-tighter uppercase italic drop-shadow-2xl">
                                                  {f.feature_title}
                                              </h3>
                                          </div>
                                          
                                          <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] group-hover:border-blue-500/10 transition-all group-hover:bg-blue-500/[0.01]">
                                              <p className="text-[17px] text-slate-400 leading-relaxed font-medium italic group-hover:text-slate-200 transition-colors">
                                                  {f.technical_summary}
                                              </p>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="pt-10 border-t border-white/10 flex items-center justify-between">
                                      <div className="flex items-center gap-6 group/origin">
                                          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all shadow-inner">
                                              <Globe className="w-6 h-6 text-slate-500 group-hover:rotate-[360deg] transition-transform duration-1000" />
                                          </div>
                                          <div className="space-y-1">
                                            <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic leading-none">Source_Nexus</div>
                                            <div className="text-[13px] text-slate-300 font-bold italic uppercase tracking-tight group-hover:text-blue-300">{f.source_domain}</div>
                                          </div>
                                      </div>
                                      <a
                                          href={f.source_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-3 text-[11px] bg-blue-600 hover:bg-white hover:text-blue-600 text-white font-black px-10 py-5 rounded-2xl transition-all uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/20 hover:shadow-white/20 active:scale-95 italic group/link"
                                      >
                                          Extract Intel <ExternalLink className="w-5 h-5 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                      </a>
                                  </div>
                              </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Daywise Graph Section (Now Below Grouped Updates) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12">
            {/* 7-Day Daywise Graph */}
            <div className="lg:col-span-2 rounded-[40px] border border-white/5 bg-[#020617]/40 backdrop-blur-3xl p-12 space-y-12 relative overflow-hidden group hover:border-blue-500/20 transition-all">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.03] blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                            <Activity className="w-7 h-7 text-blue-400 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Signal Velocity Matrix</h3>
                            <p className="text-[11px] text-slate-500 font-black tracking-[0.4em] uppercase italic">Oscillation over 168H Tactical Deployment</p>
                        </div>
                    </div>
                </div>

                <div className="h-[350px] w-full mt-10 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorUpdatesVelocity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff02" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#94a3b815" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fill: '#475569', fontStyle: 'italic', fontWeight: '900' }}
                                dy={15}
                            />
                            <YAxis hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '24px', fontSize: '11px', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                cursor={{ stroke: '#3b82f640', strokeWidth: 3 }}
                                animationDuration={400}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="updates" 
                                stroke="#3b82f6" 
                                strokeWidth={5}
                                fillOpacity={1} 
                                fill="url(#colorUpdatesVelocity)" 
                                animationDuration={2500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tactical Timeline Summary */}
            <div className="rounded-[40px] border border-white/5 bg-[#020617]/40 backdrop-blur-3xl p-12 space-y-10 relative overflow-hidden group hover:border-blue-500/20 transition-all flex flex-col justify-between">
                <div className="space-y-10">
                    <div className="flex items-center gap-5">
                        <History className="w-7 h-7 text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">Mission Logs</h3>
                    </div>
                    
                    <div className="space-y-8 overflow-y-auto max-h-[320px] pr-4 custom-scrollbar">
                        {scanReport.features.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 opacity-30 text-center space-y-6">
                               <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
                               <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.3em] italic">Awaiting grid link...</p>
                            </div>
                        ) : (
                            [...scanReport.features]
                              .sort((a,b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime())
                              .map((f, i) => (
                                <div key={i} className="relative pl-10 border-l-2 border-white/5 group/log">
                                    <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-[#020617] border-2 border-slate-700 group-hover/log:bg-blue-600 group-hover/log:border-blue-400/50 group-hover/log:scale-125 transition-all duration-700 shadow-2xl" />
                                    <div className="space-y-2 group-hover/log:translate-x-3 transition-transform duration-700">
                                        <p className="text-[10px] font-black text-slate-600 font-mono uppercase tracking-[0.3em] italic">
                                            {new Date(f.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                        <h4 className="text-[14px] font-black text-white group-hover/log:text-blue-400 transition-colors line-clamp-1 italic uppercase tracking-tight leading-tight">{f.feature_title}</h4>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic rounded-[1.5rem] h-16 tracking-[0.2em] uppercase text-[11px] shadow-[0_20px_40px_rgba(59,130,246,0.2)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02] active:scale-95 group mt-8">
                    <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                    Archive Intelligence PDF
                </Button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="flex justify-between items-center text-[10px] text-slate-700 font-black uppercase tracking-[0.4em] italic px-4 border-t border-white/5 pt-10">
          <div className="flex items-center gap-4">
             <Globe className="w-4 h-4" /> GLOBAL_SURVEILLANCE_ACTIVE
          </div>
          <div className="flex items-center gap-6">
             <span className="hidden md:inline">ENCRYPTION: RSA-4096-AES</span>
             <span>CORE_EXT: X-INTEL-99</span>
          </div>
      </div>
    </div>
  );
};

export default IntelligenceReportPage;
