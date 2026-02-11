import { motion } from 'framer-motion';
import { ShieldAlert, Flame, AlertTriangle, ArrowRight } from 'lucide-react';

const RiskPage = () => {
  const risks = [
    {
      label: 'Model commoditization',
      level: 'High',
      color: 'from-red-500/70 to-orange-500/80',
      description: 'Price compression as frontier models become API commodities.',
    },
    {
      label: 'Feature parity race',
      level: 'Medium',
      color: 'from-yellow-400/70 to-amber-500/80',
      description: 'Fast-follower behavior from incumbents catching up on roadmap.',
    },
    {
      label: 'Talent concentration',
      level: 'Medium',
      color: 'from-emerald-400/70 to-teal-500/80',
      description: 'Key researchers clustering around a small set of labs.',
    },
  ];

  return (
    <div className="relative max-w-5xl mx-auto space-y-8">
      <div className="pointer-events-none absolute -top-40 right-0 w-80 h-80 bg-red-500/10 blur-3xl" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Risk Radar</h1>
          <p className="text-sm text-gray-400">
            A stylized view of macro risks your agent is monitoring. Data here is illustrative.
          </p>
        </div>
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {risks.map((r, idx) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/70 p-5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${r.color} opacity-20`} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-gray-300">{r.label}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/60 border border-white/30">
                  {r.level} risk
                </span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">{r.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-900/40 via-black to-black p-6 flex items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <Flame className="w-6 h-6 text-red-400 mt-0.5" />
          <div>
            <p className="text-xs text-red-300 font-mono mb-1">RISK ENGINE</p>
            <h3 className="text-lg font-semibold mb-1">Hot zone watchlist</h3>
            <p className="text-xs text-gray-300 max-w-xl">
              In a full product this section would adapt in real-time based on signals. For now it
              communicates the feeling of a dedicated risk console.
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 text-xs text-red-200 border border-red-500/40 rounded-full px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 transition-colors">
          View scenario analysis <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>
    </div>
  );
};

export default RiskPage;

