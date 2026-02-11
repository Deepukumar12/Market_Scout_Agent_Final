import { useCompetitorStore } from '@/store/competitorStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Radar, Globe2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CompetitorsPage = () => {
  const { competitors, loading, error, fetchCompetitors } = useCompetitorStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  return (
    <div className="relative max-w-7xl mx-auto space-y-8">
      <div className="pointer-events-none absolute -top-40 -left-10 w-72 h-72 bg-emerald-500/10 blur-3xl" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Competitor Grid</h1>
          <p className="text-sm text-gray-400">
            A focused view of every player the agent is monitoring across your market.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/10 text-gray-300 gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
          <Button
            variant="neon"
            className="gap-2"
            type="button"
            onClick={() => navigate('/dashboard/add-competitor')}
          >
            <PlusCircle className="w-4 h-4" /> New Competitor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          icon={<Radar className="w-6 h-6 text-cyan-400" />}
          title="Signals Today"
          value="24"
          description="Fresh activity detected in the last 24 hours."
        />
        <SummaryCard
          icon={<Globe2 className="w-6 h-6 text-emerald-400" />}
          title="Regions Covered"
          value="12"
          description="Markets under continuous surveillance."
        />
        <SummaryCard
          icon={<PlusCircle className="w-6 h-6 text-purple-400" />}
          title="Tracked Entities"
          value={competitors.length || 0}
          description="Organizations in your competitive universe."
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 text-xs text-gray-400 font-mono">
          <span>NAME</span>
          <span className="w-24 text-center">STATUS</span>
          <span className="w-32 text-center">RISK</span>
          <span className="w-40 text-right">LAST SIGNAL</span>
        </div>

        <div className="divide-y divide-white/5">
          {competitors.map((c: any, idx: number) => (
            <motion.div
              key={c._id || c.name || idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              className="grid grid-cols-[minmax(0,1fr)_96px_128px_160px] items-center px-6 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-mono text-cyan-300 border border-white/10">
                  {c.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-[11px] text-gray-500 break-all">{c.url || '—'}</div>
                </div>
              </div>
              <div className="w-24 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-emerald-400/40 text-emerald-300 bg-emerald-500/10">
                  {c.status || 'Active'}
                </span>
              </div>
              <div className="w-32 text-center text-xs text-yellow-300">
                {c.priority || 'Medium'}
              </div>
              <div className="w-40 text-right text-xs text-gray-400">Just now</div>
            </motion.div>
          ))}

          {!loading && competitors.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No competitors yet. Seed your universe with the{" "}
              <span className="text-cyan-400 font-medium">“New Competitor”</span> action above.
            </div>
          )}
          {loading && (
            <div className="px-6 py-6 text-center text-xs text-gray-400 font-mono animate-pulse">
              Loading competitor signals...
            </div>
          )}
          {error && (
            <div className="px-6 py-4 text-center text-xs text-red-400 font-mono">
              Failed to sync competitors: {String(error)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon,
  title,
  value,
  description,
}: {
  icon: JSX.Element;
  title: string;
  value: string | number;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4"
  >
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">{icon}</div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </motion.div>
);

export default CompetitorsPage;

