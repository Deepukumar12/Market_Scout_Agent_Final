import { motion } from 'framer-motion';
import { FileText, Clock, Star, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReportsPage = () => {
  const reports = [
    {
      title: 'Weekly Competitive Briefing',
      tag: 'Executive',
      description: 'Summarized movements across your top competitors for this week.',
      age: 'Generated 2h ago',
    },
    {
      title: 'Feature Launch Radar',
      tag: 'Product',
      description: 'Predicted launches and roadmap shifts based on code, hiring, and press.',
      age: 'Generated 6h ago',
    },
    {
      title: 'Risk Impact Digest',
      tag: 'Risk',
      description: 'Prioritized list of external threats that could affect your roadmap.',
      age: 'Generated yesterday',
    },
  ];

  return (
    <div className="relative max-w-6xl mx-auto space-y-8">
      <div className="pointer-events-none absolute -top-36 right-0 w-80 h-80 bg-purple-500/10 blur-3xl" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Intelligence Reports</h1>
          <p className="text-sm text-gray-400">
            Curated, agent-written summaries you can drop directly into leadership decks.
          </p>
        </div>
        <Button variant="neon" className="gap-2">
          <FileText className="w-4 h-4" /> Generate New Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r, idx) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 group cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/15 via-transparent to-purple-500/15 transition-opacity duration-300" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-white/20 text-gray-300 bg-black/40">
                  {r.tag}
                </span>
                <Star className="w-4 h-4 text-yellow-400 opacity-60 group-hover:opacity-100" />
              </div>
              <h2 className="text-lg font-semibold leading-tight">{r.title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">{r.description}</p>
              <div className="flex items-center justify-between pt-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.age}
                </span>
                <span className="inline-flex items-center gap-1 text-cyan-300 group-hover:text-cyan-200">
                  Open summary <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-cyan-300 font-mono mb-1">EXPORT PIPELINE</p>
          <h3 className="text-lg font-semibold mb-1">Sync reports into your tools</h3>
          <p className="text-xs text-gray-400 max-w-xl">
            In a real deployment, this section would connect to Slack, Notion, or your BI stack. For
            now it acts as a visual placeholder for integrations.
          </p>
        </div>
        <Button variant="outline" className="gap-2 border-cyan-500/40 text-cyan-300">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>
    </div>
  );
};

export default ReportsPage;

