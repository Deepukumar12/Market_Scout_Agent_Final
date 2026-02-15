
import { Button } from '@/components/ui/button';
import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect } from 'react';
import { 
  Plus, Rocket, AlertTriangle, TrendingUp, TrendingDown,
  Zap, Shield, Clock, ArrowUpRight, CalendarRange, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ThreeHero from './ThreeHero';

const CompetitorCard = ({ id, name, status, last_scan, idx, onNavigate }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: idx * 0.1 }}
    whileHover={{ y: -5 }}
    className="relative group h-full cursor-pointer bg-[#0B0F19] rounded-2xl border border-[#1E293B] hover:border-blue-500/50 transition-all duration-300"
    onClick={() => onNavigate(id)}
  >
    <div className="relative p-6 flex flex-col h-full">
      


      <div className="flex justify-between items-start mb-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <span className="text-xl font-bold text-blue-500 uppercase">
              {name?.[0] || '?'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0B0F19] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0B0F19]" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg border",
            status === 'Active' 
              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
              : "text-amber-400 border-amber-500/20 bg-amber-500/5"
          )}>
            {status}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <Clock className="w-3 h-3" />
            {last_scan}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
      <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-2 leading-relaxed">
        Monitoring digital footprint and technical signals for real-time intelligence.
      </p>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400/80" />
            <span className="text-xs text-slate-400 font-medium tracking-tight">Data Confidence</span>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">85%</span>
        </div>
        
        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '85%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(id);
          }}
          className="w-full bg-white/5 border-white/10 hover:bg-blue-600 hover:border-blue-500 text-slate-300 hover:text-white transition-all rounded-xl py-5 group/btn font-bold uppercase tracking-widest text-[10px]"
        >
          View Analysis
          <ArrowUpRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
        </Button>
      </div>
    </div>
  </motion.div>
);

const StatCard = ({ title, value, change, trend = 'up', icon: Icon, colorClass, idx }: any) => {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: idx * 0.1 }}
      className="relative group p-6 rounded-2xl bg-[#0B0F19] border border-[#1E293B]"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}>
         <Icon className="w-20 h-20" />
      </div>
      
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono",
          isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
          isNegative ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
          "bg-slate-500/10 border-slate-500/20 text-slate-400"
        )}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : 
           isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : 
           <div className="w-3.5 h-0.5 bg-slate-400 rounded-full" />}
          <span className="text-[11px] font-bold">{change}</span>
        </div>
      </div>
  
      <div>
        <h4 className="text-3xl font-bold text-white tracking-tight mb-1">{value}</h4>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const { competitors, loading, fetchCompetitors } = useCompetitorStore();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  // Simulate historical comparison data based on time range
  const getStats = () => {
    const baseEntities = competitors.length || 0;
    
    // Default (30d)
    let entitiesData = { value: baseEntities, change: "+12.5%", trend: "up" };
    let anomaliesData = { value: Math.floor(baseEntities * 0.4) + 3, change: "-5 vs last month", trend: "down" };
    let pipelinesData = { value: (baseEntities * 124).toLocaleString(), change: "+24% Activity", trend: "up" };

    if (timeRange === '7d') {
      entitiesData = { value: baseEntities, change: "+2.1%", trend: "neutral" };
      anomaliesData = { value: Math.floor(baseEntities * 0.2) + 1, change: "-2 vs last week", trend: "down" };
      pipelinesData = { value: (baseEntities * 42).toLocaleString(), change: "+5.4% Activity", trend: "up" };
    } else if (timeRange === '90d') {
      entitiesData = { value: baseEntities, change: "+45.2%", trend: "up" };
      anomaliesData = { value: Math.floor(baseEntities * 0.8) + 8, change: "+12 vs last qtr", trend: "up" }; // "up" here acts as a warning indicator color-wise if we want, but logic handles color mapping
      pipelinesData = { value: (baseEntities * 386).toLocaleString(), change: "+86% Activity", trend: "up" };
    }

    return { entities: entitiesData, anomalies: anomaliesData, pipelines: pipelinesData };
  };

  const stats = getStats();

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
             {/* Time Range Selector */}
             <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-lg border border-[#1E293B]">
               <div className="px-2 py-1.5 text-xs font-medium text-slate-500 border-r border-[#1E293B] mr-1 flex items-center gap-1.5">
                  <CalendarRange className="w-3.5 h-3.5" />
                  <span>Period</span>
               </div>
               {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      timeRange === range 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                  >
                    {range === '7d' ? '7D' : range === '30d' ? '30D' : '3M'}
                  </button>
               ))}
             </div>

             <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 hidden sm:block">
                SID: {Math.random().toString(16).slice(2, 10).toUpperCase()}
             </div>
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
               Dashboard <span className="text-blue-500">Overview</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed">
               Real-time market insights and competitor analysis. 
               Comparing data vs previous <span className="text-slate-200 font-semibold">{timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : 'quarter'}</span>.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            onClick={() => navigate('/dashboard/add-competitor')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 group"
          >
            <Plus className="mr-2 h-5 w-5" />
            Initialize New Competitor
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>
      </div>
      
      {/* 3D Visualizer Section */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl opacity-10 group-hover:opacity-20 blur-2xl transition-all" />
         <ThreeHero />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          idx={0}
          title="Competitors Tracked"
          value={stats.entities.value}
          change={stats.entities.change}
          trend={stats.entities.trend}
          icon={Rocket}
          colorClass="text-blue-500"
        />
        <StatCard
          idx={1}
          title="Market Anomalies"
          value={stats.anomalies.value}
          change={stats.anomalies.change}
          trend={stats.anomalies.trend}
          icon={AlertTriangle}
          colorClass="text-amber-500"
        />
        <StatCard
          idx={2}
          title="Data Pipelines"
          value={stats.pipelines.value}
          change={stats.pipelines.change}
          trend={stats.pipelines.trend}
          icon={Zap}
          colorClass="text-indigo-500"
        />
      </div>

      {/* Primary Content Area */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2 uppercase italic">
                 Active Competitors
                 <div className="flex gap-1 items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Active</span>
                 </div>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1">MONITORING {competitors.length} COMPETITORS...</p>
           </div>
           
           <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard/competitors')}
                className="text-slate-400 hover:text-white rounded-lg uppercase text-[10px] font-bold tracking-widest"
              >
                 View All Competitors
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {competitors.map((c: any, idx: number) => (
              <CompetitorCard
                key={c._id || c.name || idx}
                id={c._id || c.id}
                idx={idx}
                name={c.name}
                status={c.status || 'Active'}
                risk={c.priority || 'Medium'}
                last_scan="12m ago"
                onNavigate={(id: string) => navigate(`/dashboard/competitors/${id}/report`)}
              />
            ))}
          </AnimatePresence>

          {!loading && competitors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full py-20 px-10 rounded-3xl border-2 border-dashed border-white/5 bg-white/5 backdrop-blur-sm text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                 <Plus className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Competitors Tracked</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                 Add a competitor to start monitoring market signals.
              </p>
              <Button 
                onClick={() => navigate('/dashboard/add-competitor')}
                className="mt-8 bg-white/10 hover:bg-white/20 text-white rounded-xl px-10 border border-white/10"
              >
                 Add Competitor
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
