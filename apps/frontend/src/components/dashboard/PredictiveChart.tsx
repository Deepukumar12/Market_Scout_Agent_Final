import React, { useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Cell,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  BrainCircuit, 
  Zap, 
  Info, 
  Target, 
  ExternalLink,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ForecastPoint {
  date: string;
  actual?: number;
  predicted?: number;
  confidence_low?: number;
  confidence_high?: number;
  momentum: number;
  signal_density: number;
}

interface ForecastEvent {
  date: string;
  title: string;
  type: string;
  impact: string;
  evidence: any;
}

interface PredictiveChartProps {
  historicalData: ForecastPoint[];
  forecastData: ForecastPoint[];
  events: ForecastEvent[];
  companyName: string;
  confidence: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isForecast = data.predicted !== undefined;

    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border p-5 rounded-3xl shadow-2xl min-w-[200px]">
        <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{label}</p>
            {isForecast ? (
                <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">AI Forecast</span>
            ) : (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Audited</span>
            )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground italic">Momentum</span>
            <span className="text-sm font-black text-foreground italic">{data.momentum.toFixed(1)}</span>
          </div>
          
          {!isForecast && (
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground italic">Signals</span>
                <span className="text-xs font-black text-emerald-500 italic">{data.signal_density} Nodes</span>
            </div>
          )}

          {isForecast && (
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground italic">Conf. High</span>
                    <span className="text-[10px] font-bold text-foreground/50">{data.confidence_high.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground italic">Conf. Low</span>
                    <span className="text-[10px] font-bold text-foreground/50">{data.confidence_low.toFixed(1)}</span>
                </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const PredictiveChart: React.FC<PredictiveChartProps> = ({ 
  historicalData, 
  forecastData, 
  events, 
  companyName,
  confidence 
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ForecastEvent | null>(null);

  // Combine data for the timeline
  const combinedData = [...historicalData, ...forecastData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Map events to chart coordinates
  const scatterData = events.map(ev => ({
      date: ev.date,
      momentum: combinedData.find(d => d.date === ev.date)?.momentum || 50,
      ...ev
  }));

  const now = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-apple-sm">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Predictive <span className="text-primary">Vector</span></h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic">{companyName} • Historical + AI Forecast</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-foreground tracking-tighter italic">{confidence}%</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Model Confidence</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-emerald-500 tracking-tighter italic">{events.length}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Growth Triggers</span>
            </div>
        </div>
      </div>

      {/* Chart Main Container */}
      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 900, fill: '#8E8E93', letterSpacing: '0.1em' }}
              tickFormatter={(val) => {
                  const d = new Date(val);
                  return d.toLocaleString('default', { month: 'short' });
              }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              domain={[0, 'dataMax + 20']}
              tick={{ fontSize: 10, fontWeight: 900, fill: '#8E8E93', letterSpacing: '0.1em' }}
              tickFormatter={(val) => `${val}`}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* Confidence Band */}
            <Area 
              type="monotone" 
              dataKey="confidence_high" 
              data={forecastData}
              stroke="none"
              fill="var(--primary)" 
              fillOpacity={0.05} 
            />
            <Area 
              type="monotone" 
              dataKey="confidence_low" 
              data={forecastData}
              stroke="none"
              fill="var(--card)" 
              fillOpacity={1} 
            />

            {/* AI Forecast Gradient Fill */}
            <Area 
                type="monotone" 
                dataKey="predicted" 
                data={forecastData}
                stroke="none" 
                fill="url(#colorForecast)"
            />

            {/* Historical Line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#10b981" 
              strokeWidth={4}
              dot={false}
              animationDuration={2000}
            />

            {/* Forecast Line */}
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="var(--primary)" 
              strokeWidth={4}
              strokeDasharray="8 8"
              dot={false}
              animationDuration={3000}
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
                        fill={entry.impact === 'High' ? '#ef4444' : '#f59e0b'} 
                        className="hover:scale-150 transition-transform"
                    />
                ))}
            </Scatter>

            <ReferenceLine x={now} stroke="#8E8E93" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#8E8E93', fontSize: 10, fontWeight: 'bold' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
          <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Historical Momentum</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-primary rounded-full border-dashed border-2" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">AI Forecast Path</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/10 border border-primary/20 rounded" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Confidence Range</span>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Live Engine Stream Enabled</p>
          </div>
      </div>

      {/* Event Details Overlay */}
      <AnimatePresence>
          {selectedEvent && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-0 right-0 w-80 h-full bg-card/95 backdrop-blur-2xl border-l border-border p-8 shadow-2xl z-20 flex flex-col"
              >
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                          <Target size={18} className="text-primary" />
                          <h4 className="text-sm font-black uppercase italic tracking-tighter">Event <span className="text-primary">Audit</span></h4>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)} className="h-8 w-8 p-0 rounded-full">×</Button>
                  </div>

                  <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                      <div className="space-y-1">
                          <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{selectedEvent.date}</span>
                              <span className={cn(
                                  "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                  selectedEvent.impact === 'High' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                              )}>{selectedEvent.impact} Impact</span>
                          </div>
                          <h5 className="text-lg font-black text-foreground italic leading-tight">{selectedEvent.title}</h5>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                          <p className="text-xs text-muted-foreground italic leading-relaxed">
                              "{selectedEvent.evidence.snippet}"
                          </p>
                      </div>

                      <div className="space-y-4">
                          <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest italic">Verified Evidence Source</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-foreground text-background">
                              <p className="text-[10px] font-black uppercase tracking-widest italic mb-2 text-primary">Source Link</p>
                              <a 
                                href={selectedEvent.evidence.url} 
                                target="_blank" 
                                className="text-[10px] font-bold italic flex items-center justify-between hover:text-primary transition-colors"
                              >
                                {selectedEvent.evidence.platform} <ExternalLink size={12} />
                              </a>
                          </div>
                      </div>
                  </div>

                  <div className="pt-8 mt-auto">
                      <Button className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] italic">
                          Explore Event Cluster
                      </Button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};
