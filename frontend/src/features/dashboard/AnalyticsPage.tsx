import { motion } from 'framer-motion';
import { BarChart3, Activity, LineChart, Cpu } from 'lucide-react';

const AnalyticsPage = () => {
  return (
    <div className="relative max-w-7xl mx-auto space-y-8">
      <div className="pointer-events-none absolute -top-40 left-10 w-80 h-80 bg-blue-500/10 blur-3xl" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Signal Analytics</h1>
          <p className="text-sm text-gray-400">
            High-level telemetry of how your competitors are moving over time.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
          <span>Last refreshed: 30s ago</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/70"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Launch Velocity</p>
              <p className="text-sm text-gray-500">
                Mocked time-series showing relative release frequency.
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <FakeBarChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Agent Utilization
            </span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-semibold mb-1">82%</div>
          <p className="text-xs text-gray-500 mb-4">
            Share of total agent capacity currently monitoring competitive signals.
          </p>
          <FakeRadial />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="p-6 rounded-2xl border border-white/10 bg-black/70 flex flex-col md:flex-row gap-6"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Signal Breakdown (Mock)
            </span>
          </div>
          <FakeStackedBars />
        </div>
        <div className="w-full md:w-64">
          <div className="flex items-center gap-2 mb-2">
            <LineChart className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Interpretation
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            In a production system this panel would contain natural-language analytics explaining
            spikes and anomalies the agent has observed. Here it serves as a styled placeholder.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const FakeBarChart = () => {
  const heights = [40, 60, 35, 72, 55, 90, 65, 80];
  return (
    <div className="mt-4 h-40 flex items-end gap-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-500/20 via-cyan-400/50 to-white"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};

const FakeRadial = () => (
  <div className="relative w-40 h-40 mx-auto">
    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
    <div className="absolute inset-2 rounded-full border-4 border-cyan-500/60 border-t-transparent border-l-transparent rotate-45" />
    <div className="absolute inset-6 rounded-full bg-black flex items-center justify-center">
      <span className="text-lg font-semibold text-cyan-300">82%</span>
    </div>
  </div>
);

const FakeStackedBars = () => {
  const rows = [
    { label: 'Product launches', values: [50, 20, 10] },
    { label: 'Hiring signals', values: [30, 40, 15] },
    { label: 'Press & PR', values: [20, 30, 25] },
  ];
  const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-emerald-500'];

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={row.label}>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>{row.label}</span>
            <span>relative intensity</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
            {row.values.map((v, i) => (
              <div key={i} className={`${colors[i]} ${i === 0 ? 'rounded-l-full' : ''}`} style={{ width: `${v}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsPage;

