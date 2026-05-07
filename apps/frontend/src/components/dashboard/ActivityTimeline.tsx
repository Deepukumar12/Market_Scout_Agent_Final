import { motion } from 'framer-motion';
import { Layers, Zap, Shield, TrendingUp, Circle, Youtube } from 'lucide-react';
import { cn, getCompetitorColor } from '@/lib/utils';

interface TimelineActivity {
  id: string;
  day: string;
  title: string;
  description: string;
  type: 'feature' | 'price' | 'sentiment' | 'risk' | 'none';
  time: string;
  url?: string;
  organization?: string;
}

interface DayActivity {
  date: string;
  activities: TimelineActivity[];
}

interface ActivityTimelineProps {
  days: DayActivity[];
}

const ActivityTimeline = ({ days }: ActivityTimelineProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Layers className="text-blue-500" size={16} />;
      case 'price': return <Zap className="text-amber-500" size={16} />;
      case 'risk': return <Shield className="text-rose-500" size={16} />;
      case 'sentiment': return <TrendingUp className="text-purple-500" size={16} />;
      default: return <Circle className="text-slate-400" size={16} />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'feature': return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20";
      case 'price': return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20";
      case 'risk': return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20";
      case 'sentiment': return "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20";
      default: return "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-500/20";
    }
  };

  if (!days || days.length === 0) {
    return (
      <div className="bg-white/30 dark:bg-[#1D1D1F]/30 backdrop-blur-xl p-8 rounded-[40px] border border-dashed border-[#E5E5EA] dark:border-white/10 text-center">
         <p className="text-[10px] font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest italic mb-2">OPERATIONAL SILENCE DETECTED</p>
         <p className="text-xs font-medium text-[#6E6E73] dark:text-[#86868B] italic">No activity found in the last 7 days</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl rounded-[40px] p-10 border border-[#E5E5EA] dark:border-white/10 shadow-sm font-inter">

      <div className="space-y-8">
        {days.map((day, dayIdx) => {
          const validUpdatesCount = day.activities.filter(a => a.type !== 'none').length;
          
          return (
            <div key={day.date} className="bg-white/50 dark:bg-[#1D1D1F]/50 rounded-[32px] p-6 sm:p-8 border border-[#E5E5EA] dark:border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#E5E5EA] dark:bg-white/10 group-hover:bg-[#0071E3] transition-colors" />
              
              {/* Day Header */}
              <div className="mb-6 flex items-center justify-between pl-2">
                <h4 className="text-xl font-black text-[#1D1D1F] dark:text-white tracking-tight">{day.date}</h4>
                <span className="text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider">
                  {validUpdatesCount} {validUpdatesCount === 1 ? 'Update' : 'Updates'}
                </span>
              </div>

              {/* Activities for the day */}
              <div className="space-y-4">
                {day.activities.map((activity, actIdx) => (
                  <motion.div 
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (dayIdx * 0.1) + (actIdx * 0.05) }}
                    className={cn(
                      "relative rounded-2xl p-5 border shadow-sm transition-all",
                      activity.type === 'none' 
                        ? "bg-transparent border-dashed border-[#E5E5EA] dark:border-white/10" 
                        : "bg-[#F5F5F7]/50 dark:bg-[#2C2C2E]/50 hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] border-[#E5E5EA] dark:border-white/5"
                    )}
                  >
                    {activity.type === 'none' ? (
                      <div className="text-center py-4 flex flex-col items-center justify-center opacity-60">
                         <Circle className="text-[#86868B] dark:text-[#A1A1A6] mb-3" size={24} />
                         <p className="text-sm font-bold text-[#86868B] dark:text-[#A1A1A6]">{activity.title}</p>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 rounded-xl bg-white dark:bg-[#1D1D1F] shadow-sm border border-[#E5E5EA] dark:border-white/10 flex-shrink-0">
                            {getIcon(activity.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                getBadgeColor(activity.type)
                              )}>
                                {activity.type}
                              </span>
                              <span className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] font-semibold tracking-wide">
                                {activity.time}
                              </span>
                            </div>
                            
                            {activity.organization && (
                              <h5 
                                className="text-sm font-black uppercase tracking-wider mb-2 px-2 py-0.5 rounded-md inline-block"
                                style={{ 
                                  color: getCompetitorColor(activity.organization), 
                                  backgroundColor: `${getCompetitorColor(activity.organization)}10` // 10% opacity via hex
                                }}
                              >
                                {activity.organization}
                              </h5>
                            )}
                            
                            <h6 className="text-base font-bold text-[#1D1D1F] dark:text-white tracking-tight mb-2">
                              {activity.title}
                            </h6>
                            
                            <p className="text-[13px] text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed max-w-2xl">
                              {activity.description}
                            </p>
                            
                            {activity.url && (
                              <a 
                                href={activity.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={cn(
                                  "inline-flex items-center gap-1.5 mt-4 text-[11px] font-black uppercase tracking-widest hover:underline group/link",
                                  (activity.url.includes("youtube.com") || activity.url.includes("youtu.be"))
                                    ? "text-[#FF0000]"
                                    : "text-[#0071E3]"
                                )}
                              >
                                {(activity.url.includes("youtube.com") || activity.url.includes("youtu.be")) && (
                                  <Youtube size={14} className="mr-0.5" />
                                )}
                                {(activity.url.includes("youtube.com") || activity.url.includes("youtu.be")) ? "Watch Video" : "View Source"}
                                <svg className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
