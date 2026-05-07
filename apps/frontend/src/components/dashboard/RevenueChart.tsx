import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign, Info, Target, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface RevenuePoint {
  period: string;
  revenue: number;
  growth: number;
  net_income: number;
}

interface FinancialEvent {
    date: string;
    label: string;
    type: string;
    url: string;
}

interface RevenueChartProps {
  data: RevenuePoint[];
  events: FinancialEvent[];
  companyName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-2xl border border-border p-6 rounded-3xl shadow-2xl min-w-[220px]">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{label}</p>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Audited</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-bold text-foreground italic">Revenue</span>
            </div>
            <span className="text-sm font-black text-foreground italic">${payload[0].value.toLocaleString()}M</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-foreground italic">Net Income</span>
            </div>
            <span className="text-sm font-black text-blue-500 italic">${payload[1].value.toLocaleString()}M</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-xs font-bold text-muted-foreground italic">YoY Growth</span>
            </div>
            <span className="text-sm font-black text-emerald-500 italic">+{payload[0].payload.growth}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, events, companyName }) => {
  const [selectedEvent, setSelectedEvent] = useState<FinancialEvent | null>(null);

  const sortedData = [...data].sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  
  // Format scatter data for events
  const scatterData = events.map(ev => ({
      period: ev.date,
      revenue: sortedData.find(d => d.period === ev.date)?.revenue || 0,
      ...ev
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col relative"
    >
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-apple-sm">
            <DollarSign size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Fiscal <span className="text-emerald-500">Trajectory</span></h3>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest italic">{companyName} • Financial Alpha Stream</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-foreground tracking-tighter italic">+{sortedData[sortedData.length-1]?.growth || 0}%</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-1">
                    <TrendingUp size={12} /> Velocity
                </span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-blue-500 tracking-tighter italic">${sortedData[sortedData.length-1]?.net_income || 0}M</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Net Income</span>
            </div>
        </div>
      </div>

      {/* Chart Main */}
      <div className="flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sortedData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            
            <XAxis 
              dataKey="period" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 900, fill: '#8E8E93', letterSpacing: '0.1em' }}
              tickFormatter={(val) => new Date(val).getFullYear().toString()}
              dy={15}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 900, fill: '#8E8E93', letterSpacing: '0.1em' }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(1)}B`}
            />
            
            <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(0,113,227,0.05)' }} 
            />
            
            {/* Revenue Bars */}
            <Bar 
              dataKey="revenue" 
              fill="url(#colorRev)" 
              radius={[12, 12, 0, 0]} 
              barSize={60}
              animationDuration={1500}
            />
            
            {/* Net Income Line */}
            <Line 
              type="monotone" 
              dataKey="net_income" 
              stroke="#007AFF" 
              strokeWidth={4}
              dot={{ r: 4, fill: '#007AFF', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              animationDuration={2000}
            />

            {/* Event Markers */}
            <Scatter 
                data={scatterData} 
                onClick={(data) => setSelectedEvent(data)}
                className="cursor-pointer"
            >
                {scatterData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill="#AF52DE" 
                        className="hover:scale-125 transition-transform"
                    />
                ))}
            </Scatter>

            <ReferenceLine y={0} stroke="#8E8E93" opacity={0.2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Evidence Footer */}
      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border pt-8">
          <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20 border border-primary/40" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Total Revenue (M)</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Net Income Trend</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#AF52DE]" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Audit Milestones</span>
              </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted/50 border border-border group cursor-default">
              <ShieldCheck size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic leading-none">
                Telemetric Verification Active: <span className="text-foreground">Live Fiscal Data Stream</span>
              </p>
          </div>
      </div>

      {/* Event Details Popup */}
      <AnimatePresence>
          {selectedEvent && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-20 flex items-center justify-center p-10 bg-background/40 backdrop-blur-sm"
              >
                  <div className="w-full max-w-md bg-card border border-border p-10 rounded-[40px] shadow-apple-large relative">
                      <button 
                        onClick={() => setSelectedEvent(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-border transition-colors font-bold"
                      >
                        ×
                      </button>
                      
                      <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                              <Target className="text-primary" size={24} />
                              <h4 className="text-xl font-black uppercase italic tracking-tighter">Event <span className="text-primary">Audit</span></h4>
                          </div>

                          <div className="p-6 rounded-3xl bg-muted/50 border border-border">
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest italic mb-2">Verified Label</div>
                                <div className="text-lg font-black text-foreground italic">{selectedEvent.label}</div>
                                <div className="text-[10px] font-bold text-muted-foreground mt-4 italic">Period Ending: {selectedEvent.date}</div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                  <Info size={14} className="text-primary" />
                                  <span className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground">Source Evidence</span>
                              </div>
                              <div className="p-4 rounded-2xl bg-foreground text-background flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                          <ExternalLink size={14} />
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-widest italic">View SEC Filing</span>
                                  </div>
                                  <a href={selectedEvent.url} target="_blank" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                                      Open Edgar
                                  </a>
                              </div>
                          </div>

                          <Button onClick={() => setSelectedEvent(null)} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] italic mt-4 shadow-xl">
                              Close Audit Detail
                          </Button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
};
