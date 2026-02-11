import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe2, History, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitorStore } from '@/store/competitorStore';

type TimelineItem = {
  date: string;
  summary: string;
  type: 'launch' | 'hiring' | 'press' | 'other';
};

const generateSevenDayTimeline = (company: string): TimelineItem[] => {
  const base = new Date();
  const labels = ['launch', 'hiring', 'press', 'other'] as const;
  const texts: Record<TimelineItem['type'], string[]> = {
    launch: [
      `Shipped an incremental update to their flagship product UI.`,
      `Rolled out a limited beta for a new AI-powered feature.`,
      `Announced deeper integrations with popular third‑party tools.`,
    ],
    hiring: [
      `Opened senior roles in applied research and platform engineering.`,
      `Expanded hiring in go-to-market and sales engineering.`,
      `Posted new roles focused on enterprise and compliance.`,
    ],
    press: [
      `Published a blog post outlining their near‑term roadmap.`,
      `Gave press interviews emphasizing focus on reliability and safety.`,
      `Announced a new strategic partnership with a cloud provider.`,
    ],
    other: [
      `Updated pricing/packaging language on their website.`,
      `Refined documentation and onboarding flows for new customers.`,
      `Quietly updated terms of service and usage policies.`,
    ],
  };

  const result: TimelineItem[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const date = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const type = labels[i % labels.length];
    const options = texts[type];
    const summary = options[i % options.length].replace('their', `${company}'s`);

    result.push({ date, summary, type });
  }

  return result;
};

const AddCompetitorPage = () => {
  const { addCompetitor } = useCompetitorStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[] | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await addCompetitor(name.trim(), url.trim());
      setTimeline(generateSevenDayTimeline(name.trim() || 'This company'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto space-y-10">
      <div className="pointer-events-none absolute -top-40 left-0 w-80 h-80 bg-cyan-500/10 blur-3xl" />

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            NEW COMPETITOR WATCH
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Add a company to monitor
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Enter a company and we&apos;ll generate a simulated change log for the last 7 days to
            illustrate how the intelligence console will look once wired to real signals.
          </p>
        </div>
        <Sparkles className="w-7 h-7 text-cyan-300 hidden md:block" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300 mb-1 block">Company name</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Building2 className="w-4 h-4" />
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. OpenAI"
                className="w-full bg-black/60 border border-white/15 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-300 mb-1 block">Website (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Globe2 className="w-4 h-4" />
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-black/60 border border-white/15 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-gray-500">
            For this demo, the activity below is{' '}
            <span className="text-cyan-300">synthetic</span> and for UI preview only.
          </p>
          <Button
            type="submit"
            variant="neon"
            className="gap-2"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating
              </>
            ) : (
              <>
                Add &amp; generate log
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-black/70 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Last 7 days (simulated)
          </span>
        </div>

        {!timeline && (
          <p className="text-xs text-gray-500">
            Submit a company above to see a 7‑day activity timeline. In a live system this would be
            driven by real signals from code, hiring, press, and product updates.
          </p>
        )}

        {timeline && (
          <div className="space-y-3">
            {timeline.map((item, idx) => (
              <motion.div
                key={`${item.date}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="flex items-start gap-3 text-sm"
              >
                <div className="w-20 text-[11px] text-gray-500 mt-0.5 font-mono">
                  {item.date}
                </div>
                <div className="flex-1 text-gray-200">{item.summary}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCompetitorPage;

