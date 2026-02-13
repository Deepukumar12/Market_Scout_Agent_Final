
import { Button } from '@/components/ui/button';
import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect } from 'react';
import { Plus, Rocket, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThreeHero from './ThreeHero';

const CompetitorCard = ({ name, status, risk, last_scan }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/60 transition-all duration-300 group overflow-hidden shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_24px_80px_rgba(6,182,212,0.25)]"
  >
    <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-white/10 flex items-center justify-center text-xl font-bold font-mono shadow-[0_0_18px_rgba(6,182,212,0.4)]">
        {name?.[0] || '?'}
      </div>
      <div
        className={`text-xs px-2 py-1 rounded-full border backdrop-blur-sm ${
          status === 'Active'
            ? 'border-green-500/30 text-green-300 bg-green-500/10'
            : 'border-red-500/30 text-red-300 bg-red-500/10'
        }`}
      >
        {status}
      </div>
    </div>
    <h3 className="text-lg font-semibold mb-1 tracking-tight relative z-10">{name}</h3>
    <p className="text-xs text-gray-400 mb-4 relative z-10">
      Last scanned: <span className="text-gray-300">{last_scan}</span>
    </p>

    <div className="space-y-3 relative z-10">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Risk Level</span>
        <span className="text-yellow-300 font-medium">{risk}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
        />
      </div>
    </div>
  </motion.div>
);

const StatCard = ({ title, value, change, icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 via-white/0 to-cyan-500/10 border border-white/10 flex items-center justify-between overflow-hidden group"
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_55%)]" />
    <div className="relative z-10">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{title}</p>
      <h4 className="text-3xl font-semibold tracking-tight">{value}</h4>
      <span className="inline-flex items-center text-[11px] mt-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
        <TrendingUp className="w-3 h-3 mr-1" /> {change}
      </span>
    </div>
    <div className="relative z-10 w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(15,23,42,0.9)] group-hover:shadow-[0_0_32px_rgba(34,211,238,0.55)] transition-shadow duration-300">
      <Icon className="w-6 h-6 text-cyan-400" />
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const { competitors, loading, error, fetchCompetitors } = useCompetitorStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  return (
    <div className="relative max-w-7xl mx-auto space-y-10">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 -left-20 w-80 h-80 bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-10 w-96 h-96 bg-blue-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AGENT NETWORK LIVE // DASHBOARD
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Intelligence Overview
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Real-time market surveillance across your competitive landscape, continuously scanning for
            product launches, talent moves, and risk signals.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Button
            variant="neon"
            className="gap-2"
            type="button"
            onClick={() => navigate('/dashboard/add-competitor')}
          >
            <Plus className="w-4 h-4" /> Add Competitor
          </Button>
        </motion.div>
      </div>
      
      {/* 3D Hero Section */}
      <ThreeHero />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Competitors Tracked"
          value={competitors.length || 0}
          change="+2 this week"
          icon={Rocket}
        />
        <StatCard
          title="Critical Risk Signals"
          value="5"
          change="+1 today"
          icon={AlertTriangle}
        />
        <StatCard
          title="Intelligence Reports"
          value="142"
          change="+12 new"
          icon={TrendingUp}
        />
      </div>

      {/* Competitors Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            Live Monitoring Stream
          </h2>
          {loading && (
            <span className="text-xs text-gray-400 font-mono animate-pulse">
              Scanning competitors...
            </span>
          )}
          {error && (
            <span className="text-xs text-red-400 font-mono">
              Failed to load competitors: {String(error)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.map((c: any, idx: number) => (
            <CompetitorCard
              key={c._id || c.name || idx}
              name={c.name}
              status={c.status || 'Active'}
              risk={c.priority || 'Medium'}
              last_scan="Just now"
            />
          ))}

          {!loading && competitors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full p-8 rounded-2xl border border-dashed border-white/15 bg-black/40 text-center text-sm text-gray-400"
            >
              No competitors added yet. Use{' '}
              <span className="text-cyan-400 font-medium">“Add Competitor”</span> to start
              monitoring your market.
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
