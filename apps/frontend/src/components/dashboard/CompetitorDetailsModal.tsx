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
import { formatToIST, formatTimeToIST, formatShortDateToIST } from '@/utils/dateUtils';

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
          setFeatureSignals(featureData || []);
          const rawSignals = streamData?.signals || [];
          setSignals(rawSignals.filter((s: any) => 
            s.company_name?.toLowerCase() === competitor.name.toLowerCase() ||
            s.query_tag?.toLowerCase() === competitor.name.toLowerCase()
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

  const unifiedTimeline = useMemo(() => {
    // ---------------------------------------------------------------------------
    // Helper: Extract the IST local date string (YYYY-MM-DD) for any item.
    // ---------------------------------------------------------------------------
    const toISTDateString = (dateInput: any): string | null => {
      if (!dateInput) return null;
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
        return dateInput.trim();
      }
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      // Extract YYYY-MM-DD in Asia/Kolkata timezone
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(d);
      const y = parts.find(p => p.type === 'year')?.value ?? '';
      const mo = parts.find(p => p.type === 'month')?.value ?? '';
      const dy = parts.find(p => p.type === 'day')?.value ?? '';
      return y && mo && dy ? `${y}-${mo}-${dy}` : null;
    };

    // ---------------------------------------------------------------------------
    // Helper to calculate exact calendar day in IST with a given days offset
    // ---------------------------------------------------------------------------
    const getISTDateOffset = (offsetDays: number): string => {
      const d = new Date();
      // Shift UTC time by Asia/Kolkata offset (+5.5 hours)
      const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
      const istTime = utcTime + (5.5 * 3600000);
      const istDate = new Date(istTime);
      istDate.setDate(istDate.getDate() - offsetDays);
      const y = istDate.getFullYear();
      const m = String(istDate.getMonth() + 1).padStart(2, '0');
      const dy = String(istDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${dy}`;
    };

    // Build the 8-day grid (Today + 7 previous days)
    const days: string[] = [];
    for (let i = 0; i < 8; i++) {
      days.push(getISTDateOffset(i));
    }

    // Map ALL items — prioritizing the actual publication date
    const all = [
      ...featureSignals.map(s => ({
        id: s.hash_id,
        type: 'Technical Vector',
        publicationDate: s.release_date && s.release_date !== 'YYYY-MM-DD' && s.release_date !== 'UNKNOWN'
          ? s.release_date
          : s.created_at,
        timestamp: s.created_at,
        text: `${s.feature_name}: ${s.summary || ''}`,
        url: s.source_url,
        sentiment: 'Positive',
        category: s.category,
        citations: [] as string[]
      })),
      ...signals.map(s => ({
        id: s.id,
        type: s.signal_type || 'Market Signal',
        publicationDate: s.timestamp,
        timestamp: s.timestamp,
        text: s.article_summary || s.summary,
        url: s.url,
        sentiment: s.sentiment,
        category: s.sector || 'Market',
        citations: [] as string[]
      }))
    ];

    // Deduplicate and merge updates (by URL and Title matches)
    const merged: Record<string, any> = {};
    all.forEach(item => {
      const dayStr = toISTDateString(item.publicationDate);
      if (dayStr && days.includes(dayStr)) {
        const url = (item.url || '').trim();
        const text = (item.text || '').trim().toLowerCase();
        
        let matchKey = '';
        if (url) {
          const existingKey = Object.keys(merged).find(k => merged[k].url === url);
          if (existingKey) matchKey = existingKey;
        }
        if (!matchKey && text) {
          const existingKey = Object.keys(merged).find(k => merged[k].text.trim().toLowerCase() === text);
          if (existingKey) matchKey = existingKey;
        }
        
        if (matchKey) {
          const existing = merged[matchKey];
          // Keep earliest publication date
          const existingDate = new Date(existing.publicationDate).getTime();
          const itemDate = new Date(item.publicationDate).getTime();
          if (itemDate < existingDate) {
            existing.publicationDate = item.publicationDate;
            existing.timestamp = item.timestamp;
          }
          // Keep longest text
          if (item.text.length > existing.text.length) {
            existing.text = item.text;
          }
          // Merge citations
          if (url && !existing.citations.includes(url)) {
            existing.citations.push(url);
          }
          if (item.type !== 'none' && existing.type === 'none') {
            existing.type = item.type;
          }
        } else {
          item.citations = url ? [url] : [];
          const key = url ? url : `${item.type}|${text}`;
          merged[key] = item;
        }
      }
    });

    const groups: Record<string, any[]> = {};
    days.forEach(day => { groups[day] = []; });

    Object.values(merged).forEach(item => {
      const dayStr = toISTDateString(item.publicationDate);
      if (dayStr && groups[dayStr]) {
        groups[dayStr].push(item);
      }
    });

    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return { groups, days };
  }, [featureSignals, signals]);


  const trajectoryData = useMemo(() => {
    return unifiedTimeline.days.map(day => ({
      date: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' }).format(new Date(day)),
      count: unifiedTimeline.groups[day].length
    })).reverse(); // Reverse to show chronological left-to-right
  }, [unifiedTimeline]);

  if (!isOpen) return null;

  const compColor = getCompetitorColor(competitor.name);
  const innovationScore = competitor.innovation_score || 0;
  const riskLevel = competitor.risk_level || 'Low';
  const signalsCount = featureSignals.length || competitor.features_count || 0;

  const handleGenerateReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    // Grouping logic for PDF (reusing the same logic as the UI)
    const pdfDays = unifiedTimeline.days;
    const pdfGroups = unifiedTimeline.groups;

    const html = `
      <html>
        <head>
          <title>Strategic Intelligence Report - ${competitor.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1d1d1f; line-height: 1.6; background: #fff; }
            .header { border-bottom: 2px solid #0071e3; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo-placeholder { width: 80px; height: 80px; background: #f5f5f7; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 32px; color: #0071e3; margin-bottom: 10px; }
            h1 { margin: 0; font-size: 48px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; font-style: italic; }
            .meta { color: #86868b; font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; }
            .section { margin-bottom: 60px; }
            .section-title { font-size: 14px; font-weight: 900; color: #1d1d1f; text-transform: uppercase; letter-spacing: 3px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; font-style: italic; }
            .day-group { margin-bottom: 40px; page-break-inside: avoid; }
            .day-header { background: #0071e3; color: white; padding: 10px 20px; border-radius: 12px; font-weight: 900; font-size: 16px; text-transform: uppercase; margin-bottom: 20px; display: inline-block; font-style: italic; }
            .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { padding: 20px; background: #f5f5f7; border-radius: 20px; border: 1px solid #e5e5ea; }
            .card-val { font-size: 24px; font-weight: 900; font-style: italic; color: #0071e3; }
            .card-label { font-size: 10px; font-weight: 900; color: #86868b; text-transform: uppercase; letter-spacing: 1px; }
            .signal-row { padding: 20px; border-radius: 15px; border: 1px solid #f5f5f7; background: #fff; margin-bottom: 15px; }
            .signal-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .signal-date { font-size: 10px; font-weight: 900; color: #0071e3; text-transform: uppercase; }
            .signal-type { font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; background: #f5f5f7; color: #86868b; text-transform: uppercase; }
            .signal-summary { font-size: 14px; font-weight: 600; color: #1d1d1f; line-height: 1.5; font-style: italic; }
            .empty-state { padding: 30px; text-align: center; border: 2px dashed #f5f5f7; border-radius: 20px; color: #86868b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #0071e3; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 20px rgba(0,113,227,0.3);">Download PDF Briefing</button>
          </div>
          <div class="header">
            <div>
              <div class="logo-placeholder">${competitor.name[0]}</div>
              <h1>${competitor.name}</h1>
              <div class="meta">Network Surveillance Briefing | GEN-7 ARCHIVE</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Date: ${formatShortDateToIST(new Date())}</div>
              <div class="meta">Status: ${competitor.status || 'Active'}</div>
              <div class="meta">Security: RESTRICTED ACCESS</div>
            </div>
          </div>

          <div class="grid">
            <div class="card"><div class="card-label">Features</div><div class="card-val">${signalsCount}</div></div>
            <div class="card"><div class="card-label">Innovation</div><div class="card-val">${innovationScore}%</div></div>
            <div class="card"><div class="card-label">Risk</div><div class="card-val" style="color: ${riskLevel === 'High' ? '#ff3b30' : '#34c759'}">${riskLevel}</div></div>
            <div class="card"><div class="card-label">Velocity</div><div class="card-val">${competitor.velocity || 'Medium'}</div></div>
          </div>

          <div class="section">
            <div class="section-title">7-Day Innovation Trajectory (Chronological)</div>
            ${pdfDays.map(day => `
              <div class="day-group">
                <div class="day-header">${new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(day))}</div>
                ${pdfGroups[day].length > 0 ? pdfGroups[day].map(s => `
                  <div class="signal-row">
                    <div class="signal-meta">
                      <div class="signal-date">${formatTimeToIST(s.timestamp)} | ${s.category || 'Surveillance'}</div>
                      <div class="signal-type">${s.type}</div>
                    </div>
                    <div class="signal-summary">${s.text}</div>
                    ${s.url ? `<div style="font-size: 9px; color: #86868b; margin-top: 10px; font-family: monospace;">Source: ${s.url}</div>` : ''}
                  </div>
                `).join('') : `
                  <div class="empty-state">No innovation updates found for this date.</div>
                `}
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 100px; border-top: 1px solid #f5f5f7; padding-top: 20px; font-size: 10px; color: #86868b; text-align: center; font-family: monospace;">
            AUTOGENERATED BY SCOUTIQ INTELLIGENCE ENGINE | PROTOCOL: GEN-7
          </div>

          <script>window.onload = () => setTimeout(() => { window.print(); }, 800);</script>
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
          className="relative w-full max-w-7xl h-[92vh] bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-[48px] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 relative overflow-hidden shrink-0">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
             
             <div className="flex items-center gap-8 relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-5xl font-black text-[#0071E3] uppercase italic shadow-apple overflow-hidden shrink-0">
                  {competitor.name?.[0]}
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
                        href={competitor.url?.startsWith('http') ? competitor.url : `https://${competitor.url}`} 
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
                        <span className="opacity-60">Deployment: {formatShortDateToIST(competitor.created_at || Date.now())}</span>
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12 bg-white/30 dark:bg-transparent">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center py-40">
                <Loader2 size={48} className="text-[#0071E3] animate-spin mb-6" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing 7-Day Surveillance Data...</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-white/10 shadow-sm group">
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
                   
                   <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-white/10 shadow-sm group">
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

                   <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-white/10 shadow-sm group">
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

                   <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-white/10 shadow-sm group">
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


                {/* Unified Chronological Timeline */}
                <div className="space-y-12">
                   <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Innovation <span className="text-blue-600">Trajectory</span></h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Real-time chronometric signal analysis (7 Days)</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                          {featureSignals.length} Technical
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-black uppercase tracking-widest">
                          {signals.length} Market
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      {unifiedTimeline.days.map((day, dIdx) => (
                        <div key={day} className="flex gap-8 group/day">
                           {/* Left Date Panel */}
                           <div className="w-32 shrink-0">
                              <div className="sticky top-0 p-5 rounded-3xl bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 text-center shadow-apple transition-all group-hover/day:border-blue-500/30">
                                 <div className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest mb-1">
                                   {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(new Date(day))}
                                 </div>
                                 <div className="text-3xl font-black text-[#1D1D1F] dark:text-white italic leading-none">
                                   {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(new Date(day))}
                                 </div>
                                 <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                   {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short' }).format(new Date(day))}
                                 </div>
                              </div>
                           </div>

                           {/* Vertical Signal Line */}
                           <div className="relative flex flex-col items-center">
                              <div className="w-px h-full bg-[#E5E5EA] dark:bg-white/10 group-last:h-0" />
                              <div className="absolute top-8 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/10 group-hover/day:scale-125 transition-transform" />
                           </div>

                           {/* Updates Container */}
                           <div className="flex-1 pb-12">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {unifiedTimeline.groups[day].length > 0 ? (
                                  unifiedTimeline.groups[day].map((item, i) => (
                                    <motion.div 
                                      key={item.id || i}
                                      initial={{ opacity: 0, y: 10 }}
                                      whileInView={{ opacity: 1, y: 0 }}
                                      viewport={{ once: true }}
                                      transition={{ delay: i * 0.05 }}
                                      className="p-6 rounded-3xl bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/5 hover:border-blue-500/30 transition-all group shadow-sm relative overflow-hidden h-full flex flex-col"
                                    >
                                      <div className={cn(
                                        "absolute left-0 top-0 bottom-0 w-1",
                                        item.type === 'Technical Vector' ? "bg-emerald-500" : "bg-blue-500"
                                      )} />
                                      <div className="flex items-center justify-between mb-3">
                                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                            {formatTimeToIST(item.timestamp)}
                                         </span>
                                         {item.url && (
                                           <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-500/5 text-blue-500 hover:bg-blue-500/10 transition-all">
                                              <ExternalLink size={12} />
                                           </a>
                                         )}
                                      </div>
                                      <p className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-relaxed italic mb-4 flex-1">
                                         {item.text}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                         <span className={cn(
                                           "text-[8px] font-black uppercase px-2 py-1 rounded-md border",
                                           item.type === 'Technical Vector' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-blue-500/20 text-blue-500 bg-blue-500/5"
                                         )}>
                                            {item.type}
                                         </span>
                                         {item.category && (
                                            <span className="text-[8px] font-black uppercase px-2 py-1 rounded-md border border-slate-500/20 text-slate-500 bg-slate-500/5">
                                              {item.category}
                                            </span>
                                         )}
                                         {item.sentiment && (
                                            <span className={cn(
                                              "text-[8px] font-black uppercase px-2 py-1 rounded-md border",
                                              item.sentiment === 'Positive' ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-slate-500/20 text-slate-400 bg-slate-500/5"
                                            )}>
                                              {item.sentiment}
                                            </span>
                                         )}
                                      </div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="col-span-full h-32 flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 dark:border-white/5 bg-white/20 dark:bg-transparent group/empty">
                                     <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center mb-3 group-hover/empty:scale-110 transition-transform">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/10" />
                                     </div>
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No updates found for this date</p>
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* --- DEEP SCAN INTELLIGENCE MATRIX (100% DATA RENDERING) --- */}
                <div className="pt-12 border-t border-white/10 space-y-12">
                   <div>
                      <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter mb-1">Intelligence <span className="text-emerald-600">Matrix</span></h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Comprehensive data telemetry audit across all collected vectors</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Financial Intelligence */}
                      <div className="p-8 rounded-[40px] bg-white dark:bg-white/5 border border-white/10 shadow-apple space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                               <TrendingUp size={24} />
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-white">Financials</h4>
                         </div>
                         <div className="space-y-4">
                            {[
                               { label: 'Market Cap', value: competitor.financials?.market_cap || 'N/A' },
                               { label: 'Revenue (TTM)', value: competitor.financials?.revenue_ttm || 'N/A' },
                               { label: 'P/E Ratio', value: competitor.financials?.pe_ratio || 'N/A' },
                               { label: 'Current Price', value: competitor.financials?.current_price ? `$${competitor.financials.current_price}` : 'N/A' },
                            ].map((fin, i) => (
                               <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{fin.label}</span>
                                  <span className="text-sm font-black italic text-[#1D1D1F] dark:text-white">{fin.value}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Engineering Intelligence (GitHub) */}
                      <div className="p-8 rounded-[40px] bg-white dark:bg-white/5 border border-white/10 shadow-apple space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                               <Shield size={24} />
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-white">Engineering</h4>
                         </div>
                         <div className="space-y-4">
                            {[
                               { label: 'Active Repos', value: competitor.github_metrics?.repo_count || 0 },
                               { label: 'Signal Stars', value: competitor.github_metrics?.total_stars || 0 },
                               { label: 'Primary Tech', value: competitor.github_metrics?.primary_language || 'N/A' },
                               { label: 'Commits (7D)', value: 'Verifying...' },
                            ].map((eng, i) => (
                               <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{eng.label}</span>
                                  <span className="text-sm font-black italic text-[#1D1D1F] dark:text-white">{eng.value}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Visibility & Discovery */}
                      <div className="p-8 rounded-[40px] bg-white dark:bg-white/5 border border-white/10 shadow-apple space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                               <Globe size={24} />
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-white">Visibility</h4>
                         </div>
                         <div className="space-y-4">
                            {[
                               { label: 'Exa Discoveries', value: competitor.search_metrics?.discovery_count || 0 },
                               { label: 'Sources Scanned', value: competitor.search_metrics?.sources_scanned || 0 },
                               { label: 'Market Presence', value: competitor.firmographics?.industry || 'Technology' },
                               { label: 'Scale', value: competitor.firmographics?.employees || 'Scaling' },
                            ].map((vis, i) => (
                               <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{vis.label}</span>
                                  <span className="text-sm font-black italic text-[#1D1D1F] dark:text-white">{vis.value}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Strategic Visuals Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-white/10">
                   <div className="space-y-6">
                      <h4 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter">Volume <span className="text-purple-600">Analytics</span></h4>
                      <div className="p-8 rounded-[40px] bg-white dark:bg-white/5 border border-white/10 shadow-apple h-[300px]">
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
                                  backdropFilter: 'blur(10px)'
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
                              />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="space-y-6 flex flex-col justify-between">
                      <div 
                        onClick={handleGenerateReport}
                        className="p-10 rounded-[48px] bg-[#0071E3] text-white space-y-4 shadow-xl shadow-blue-500/20 group hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                            <Target size={120} />
                         </div>
                         <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">Mission Critical</span>
                            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                         </div>
                         <h4 className="text-3xl font-black italic tracking-tighter uppercase leading-none relative z-10">Generate Full Strategic Report</h4>
                         <p className="text-xs font-medium italic opacity-70 relative z-10">Synthesize all 7-day signals into a comprehensive PDF intelligence briefing.</p>
                      </div>
                   </div>
                </div>
              </>
            )}
          </div>
          
          {/* Footer Status */}
          <div className="px-12 py-8 bg-white/50 dark:bg-white/5 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest italic shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Live Surveillance Stream Active (Synchronized: 0.2s ago)
             </div>
             <div className="flex items-center gap-6">
                <div>Protocol: GEN-7 ARCHIVE SYNCHRONIZED</div>
                <div className="text-[#0071E3]">Node: {competitor.name?.toUpperCase()}_CORE</div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompetitorDetailsModal;
