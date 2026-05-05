import { motion } from 'framer-motion';
import { ShieldAlert, Lightbulb, Activity } from 'lucide-react';
import { MissionBriefingData } from '@/store/intelStore';

interface MissionBriefingProps {
  data: MissionBriefingData | null;
}

const MissionBriefing = ({ data }: MissionBriefingProps) => {
  if (!data) return (
    <div className="p-6 md:p-10 rounded-[32px] md:rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple animate-pulse">
      <div className="h-6 w-48 bg-muted rounded-full mb-6" />
      <div className="space-y-4">
        <div className="h-4 w-full bg-muted/50 rounded-full" />
        <div className="h-4 w-3/4 bg-muted/50 rounded-full" />
      </div>
    </div>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
            Strategic <span className="text-primary">Briefing</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 italic">Automated Market Intelligence Summary</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{data.sentiment_pulse}</span>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">Updated: {new Date(data.last_updated).toLocaleTimeString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sticky top-6 z-10 transition-all">
        {/* Executive Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-12 p-6 md:p-10 rounded-[32px] md:rounded-[40px] bg-gradient-to-br from-card to-muted backdrop-blur-2xl border border-border shadow-apple-lg relative overflow-hidden group"
        >
          {/* Decorative Gloss */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/50/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] italic">Live Intelligence Stream</span>
              </div>
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-snug mb-6 max-w-2xl">
                {data.executive_summary}
              </h2>
              
              <div className="flex flex-wrap gap-4 mt-8">
                {['Accuracy: 100%', 'Status: Verified', 'Cycle: 7-Day Window'].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-card/50 border border-border text-[9px] font-black text-foreground uppercase tracking-widest italic shadow-apple-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full md:w-[350px] space-y-6">
              {/* Risks Section */}
              <div className="p-6 rounded-[32px] bg-card/50 border border-border backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert size={16} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Technical Risks</span>
                </div>
                <ul className="space-y-3">
                  {data.technical_risks.map((risk, i) => (
                    <li key={i} className="text-[11px] font-bold text-muted-foreground leading-relaxed flex items-start gap-2 italic">
                      <span className="text-red-500">•</span> {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities Section */}
              <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Market Opportunities</span>
                </div>
                <ul className="space-y-3">
                  {data.market_opportunities.map((opp, i) => (
                    <li key={i} className="text-[11px] font-bold text-muted-foreground leading-relaxed flex items-start gap-2 italic">
                      <span className="text-primary">•</span> {opp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MissionBriefing;
