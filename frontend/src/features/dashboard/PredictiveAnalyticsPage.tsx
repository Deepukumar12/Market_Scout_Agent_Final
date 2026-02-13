
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, CartesianGrid } from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PredictiveAnalyticsPage = () => {
  // Static Data
  const trendData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 67 },
    { month: 'Jul', value: 72 },
  ];

  const radarData = [
    { subject: 'Price', A: 120, fullMark: 150 },
    { subject: 'Product', A: 98, fullMark: 150 },
    { subject: 'Marketing', A: 86, fullMark: 150 },
    { subject: 'Tech', A: 99, fullMark: 150 },
    { subject: 'Support', A: 85, fullMark: 150 },
    { subject: 'Global', A: 65, fullMark: 150 },
  ];

  const revData = [
    { name: 'Q1', gap: 1.2 },
    { name: 'Q2', gap: 2.1 },
    { name: 'Q3', gap: 0.8 },
    { name: 'Q4', gap: 4.2 }, // The highlight
  ];

  return (
    <div className="relative max-w-7xl mx-auto space-y-8 pb-10">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 bg-purple-500/10 blur-[100px] animate-pulse-slow" />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400"
          >
            Forecast Future Moves
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 mt-2 max-w-lg"
          >
            AI-driven predictive modeling to anticipate competitor shifts and market trends before they happen.
          </motion.p>
        </div>
        
        {/* Animated 3D-ish Graphic Simulation */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-48 h-32 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl border border-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden"
        >
            <div className="absolute inset-0 bg-grid-white/5" />
            <motion.div 
                animate={{ rotateX: [0, 10, 0], rotateY: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center"
            >
                <TrendingUp size={48} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            </motion.div>
        </motion.div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Market Trend Forecast */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm relative group hover:border-purple-500/50 transition-colors"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" /> Market Trend
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    +23% Predicted
                </span>
            </div>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#c084fc" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#111', stroke: '#c084fc', strokeWidth: 2 }}
                            activeDot={{ r: 6 }} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Projected growth curve based on last 6 months of competitor activity.
            </p>
        </motion.div>

        {/* Card 2: Competitor Pivot Risk */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm relative group hover:border-yellow-500/50 transition-colors"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" /> Pivot Risk
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Medium Risk
                </span>
            </div>
            <div className="h-40 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Competition"
                            dataKey="A"
                            stroke="#eab308"
                            strokeWidth={2}
                            fill="#eab308"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
             <p className="text-xs text-gray-500 mt-2">
                Strategic shift detected in pricing & support sectors.
            </p>
        </motion.div>

        {/* Card 3: Revenue Shift Alert */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm relative group hover:border-cyan-500/50 transition-colors"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> Opportunity Gap
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    $4.2M Est.
                </span>
            </div>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                        />
                        <Bar dataKey="gap" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
             <p className="text-xs text-gray-500 mt-2">
                Q4 opportunity gap identified due to competitor supply chain constraints.
            </p>
        </motion.div>

      </div>

      {/* Footer CTA */}
      <div className="flex justify-center mt-12">
        <Button 
            variant="neon" 
            size="lg"
            className="relative group overflow-hidden px-8 py-6 text-lg"
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <Zap className="w-5 h-5 mr-2 fill-current" />
            Run Full Prediction Pipeline
        </Button>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;
