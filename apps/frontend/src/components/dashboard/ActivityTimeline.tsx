
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Zap, 
  Shield, 
  TrendingUp, 
  Circle, 
  Youtube, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  MessageSquare, 
  AlertCircle,
  Activity,
  ArrowUpRight,
  Filter,
  Search,
  Clock,
  ExternalLink,
  ChevronRight,
  Link2
} from 'lucide-react';
import { cn, getCompetitorColor } from '@/lib/utils';
import { EvidenceBadge, EvidencePanel, Source } from '@/components/ui/EvidenceUI';

interface TimelineActivity {
  id: string;
  day: string;
  title: string;
  description: string;
  type: string;
  time: string;
  url?: string;
  organization?: string;
  impact: string;
  platform: string;
  timestamp: string;
  evidence?: Source[];
}

interface DayActivity {
  date: string;
  label: string;
  activities: TimelineActivity[];
}

interface SilenceAnalysis {
  is_silent: boolean;
  last_activity_at: string;
  silence_duration: string;
  activity_frequency: number;
  momentum_score: number;
  alert_level: string;
  insight: string;
}

interface ActivityTimelineProps {
  days: DayActivity[];
  silence_analysis?: SilenceAnalysis;
}

const ActivityTimeline = ({ days, silence_analysis }: ActivityTimelineProps) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('feature')) return <Layers className="text-blue-500" size={16} />;
    if (t.includes('pricing')) return <Zap className="text-amber-500" size={16} />;
    if (t.includes('risk') || t.includes('security')) return <Shield className="text-rose-500" size={16} />;
    if (t.includes('social')) return <MessageSquare className="text-purple-500" size={16} />;
    if (t.includes('funding')) return <TrendingUp className="text-emerald-500" size={16} />;
    if (t.includes('hiring')) return <Activity className="text-cyan-500" size={16} />;
    return <Circle className="text-muted-foreground/70" size={16} />;
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('github')) return <Github size={12} />;
    if (p.includes('linkedin')) return <Linkedin size={12} />;
    if (p.includes('twitter') || p.includes('x.com')) return <Twitter size={12} />;
    if (p.includes('youtube')) return <Youtube size={12} />;
    if (p.includes('reddit')) return <MessageSquare size={12} />;
    return <Globe size={12} />;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case 'High': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 'Medium': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'Low': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const filteredDays = useMemo(() => {
    return days.map(day => ({
      ...day,
      activities: day.activities.filter(act => {
        const matchesType = filterType === 'all' || act.type.toLowerCase().includes(filterType.toLowerCase());
        const matchesSearch = searchQuery === '' || 
          act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.organization?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
      })
    }));
  }, [days, filterType, searchQuery]);

  if (!days || days.length === 0 || (days.every(d => d.activities.length === 0) && !silence_analysis)) {
    return (
      <div className="bg-card/30 backdrop-blur-xl p-16 rounded-[40px] border-2 border-dashed border-border text-center">
         <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
         >
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-6">
                <AlertCircle size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter mb-2">OPERATIONAL SILENCE DETECTED</h3>
            <p className="text-sm font-medium text-muted-foreground italic max-w-sm">No verified technical vectors or market signals identified in the 7-day monitoring window.</p>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* Operational Pulse Section */}
      {silence_analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-foreground rounded-[48px] p-10 border border-border/10 shadow-2xl overflow-hidden relative group"
        >
          {/* Abstract Pulse Visualization */}
          <div className="absolute top-0 right-0 bottom-0 w-1/2 overflow-hidden opacity-10 pointer-events-none">
             <svg viewBox="0 0 200 200" className="w-full h-full text-background">
                <path d="M 0 100 Q 50 20 100 100 T 200 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse" />
                <path d="M 0 110 Q 50 30 100 110 T 200 110" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse [animation-delay:200ms]" />
             </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "px-4 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2",
                        silence_analysis.alert_level === 'Critical' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
                        silence_analysis.alert_level === 'Warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : 
                        "bg-green-500/10 border-green-500/20 text-green-500"
                    )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Live Intelligence Pulse</span>
                    </div>
                    <div className="border border-background/20 text-background/60 font-black text-[9px] uppercase tracking-widest italic px-2 py-0.5 rounded-full">
                        {silence_analysis.alert_level} Status
                    </div>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-black text-background uppercase tracking-tighter italic leading-[0.9]">
                    {silence_analysis.insight}
                </h3>
                
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-background/40 uppercase tracking-widest italic">Last Activity Node</p>
                        <p className="text-sm font-black text-background italic">{silence_analysis.last_activity_at}</p>
                    </div>
                    <div className="w-px h-8 bg-background/10" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-background/40 uppercase tracking-widest italic">Silence Duration</p>
                        <p className="text-sm font-black text-background italic">{silence_analysis.silence_duration}</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                <div className="p-8 rounded-[32px] bg-background/5 border border-background/10 backdrop-blur-md text-center">
                    <p className="text-[9px] font-black text-background/40 uppercase tracking-widest mb-2 italic">Momentum</p>
                    <p className="text-4xl font-black text-primary tracking-tighter italic leading-none">{silence_analysis.momentum_score}%</p>
                </div>
                <div className="p-8 rounded-[32px] bg-background/5 border border-background/10 backdrop-blur-md text-center">
                    <p className="text-[9px] font-black text-background/40 uppercase tracking-widest mb-2 italic">Density</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <p className="text-4xl font-black text-background tracking-tighter italic leading-none">{silence_analysis.activity_frequency}</p>
                        <span className="text-[10px] font-bold text-background/40 uppercase italic">/d</span>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                    type="text" 
                    placeholder="Search intelligence..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-full bg-card/70 border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all italic"
                />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
                {['all', 'feature', 'pricing', 'social'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            filterType === t ? "bg-card text-foreground shadow-apple-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-card/70 border border-border shadow-apple-sm">
            <Clock size={14} className="text-primary" />
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">Sync: Real-Time</span>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="space-y-12">
        <AnimatePresence mode='popLayout'>
            {filteredDays.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center"
                >
                    <p className="text-sm text-muted-foreground font-medium italic">No matches found for the current filters.</p>
                </motion.div>
            ) : (
                filteredDays.map((day, dayIdx) => (
                    <div key={day.date} className="relative">
                        {/* Day Marker */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                            <h4 className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em] italic">{day.label}</h4>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {day.activities.length > 0 ? (
                                day.activities.map((activity, actIdx) => (
                                <motion.div 
                                    key={activity.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: actIdx * 0.05 }}
                                    className="group relative bg-card/70 backdrop-blur-xl rounded-[32px] p-8 border border-border hover:border-primary/30 transition-all hover:shadow-apple-lg"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                                        {/* Icon & Metadata */}
                                        <div className="flex lg:flex-col items-center gap-4 flex-shrink-0">
                                            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-apple-sm group-hover:scale-110 transition-transform duration-500">
                                                {getIcon(activity.type)}
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                                    getImpactColor(activity.impact)
                                                )}>
                                                    {activity.impact}
                                                </div>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{activity.time.split(' - ')[1] || activity.time}</span>
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex items-center gap-3">
                                                    <h5 
                                                        className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-apple-sm"
                                                        style={{ 
                                                            color: getCompetitorColor(activity.organization || ''), 
                                                            backgroundColor: `${getCompetitorColor(activity.organization || '')}10`,
                                                            borderColor: `${getCompetitorColor(activity.organization || '')}20`
                                                        }}
                                                    >
                                                        {activity.organization}
                                                    </h5>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
                                                        {getPlatformIcon(activity.platform)}
                                                        {activity.platform}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <EvidenceBadge 
                                                        count={activity.evidence?.length || 1} 
                                                        confidence={95}
                                                        onClick={() => setActiveEvidence(activeEvidence === activity.id ? null : activity.id)}
                                                    />
                                                    {activity.url && (
                                                        <a 
                                                            href={activity.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-transform italic"
                                                        >
                                                            Source Archive <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <h4 className="text-xl font-black text-foreground uppercase tracking-tighter italic leading-tight group-hover:text-primary transition-colors">
                                                    {activity.title}
                                                </h4>
                                                
                                                <EvidencePanel 
                                                    sources={activity.evidence || (activity.url ? [{ title: activity.title, url: activity.url, platform: activity.platform }] : [])}
                                                    isOpen={activeEvidence === activity.id}
                                                    onClose={() => setActiveEvidence(null)}
                                                />
                                            </div>
                                            
                                            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed italic max-w-4xl">
                                                {activity.description}
                                            </p>

                                            <div className="pt-4 flex items-center gap-2">
                                                <div className="h-px flex-1 bg-border/50" />
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                                                        <Link2 size={10} /> Data Point Verified
                                                    </span>
                                                    <button className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-1 hover:text-primary transition-colors">
                                                        Deep Insight <ChevronRight size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-10 rounded-[32px] border border-dashed border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                                        <Circle size={16} className="text-muted-foreground/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                                            Verified Intelligence Gap
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground/60 italic max-w-xs">
                                            No competitive movement detected on this date across monitored intelligence channels.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityTimeline;
