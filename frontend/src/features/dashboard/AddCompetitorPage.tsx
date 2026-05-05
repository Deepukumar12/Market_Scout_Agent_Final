import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { runScan } from '@/services/api';
import { useCompetitorStore } from '@/store/competitorStore';

const AddCompetitorPage = () => {
  const { addCompetitor, fetchCompetitors } = useCompetitorStore();
  
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let companyName = url.trim();
      let companyUrl = "";

      // Check if it's a URL
      const isUrl = url.includes('.') && !url.includes(' ');
      if (isUrl) {
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http')) {
          formattedUrl = `https://${formattedUrl}`;
        }
        companyUrl = formattedUrl;
        companyName = formattedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      }

      // 1. First, add the competitor to the database
      // If no URL is provided, we still create it with just the name
      const newComp = await addCompetitor(companyName, companyUrl);
      
      if (!newComp) {
        throw new Error('Failed to initialize competitor in surveillance network.');
      }

      // 2. Then, run the deep intelligence scan
      const data = await runScan({
        company_name: companyName,
        website: companyUrl || undefined,
        time_window_days: 30, // Broader window for first-time deep analysis
        deep_analysis: true
      });

      if (data && !data.error) {
        setSuccess(true);
        setUrl('');
        // No need to fetchCompetitors() here as addCompetitor already updates the store,
        // but we can do it to be sure of server state
        fetchCompetitors();
      } else {
        setError(data?.error || 'Intelligence scan returned internal error.');
      }
    } catch (e: any) {
      console.error('Add competitor error:', e);
      const message = e.response?.data?.error || e.message || 'Connection error. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-foreground tracking-tighter mb-4 uppercase italic">Add <span className="text-primary">Competitor</span></h1>
        <p className="text-lg text-muted-foreground font-medium italic">ScoutIQ will analyze the digital footprint and extract strategic signals.</p>
      </div>

      <div className="bg-card/70 backdrop-blur-xl rounded-[48px] p-12 shadow-apple border border-border shadow-sm">
        <form onSubmit={handleAdd} className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Building2 size={24} />
            </div>
            <Input 
              type="text"
              placeholder="Enter Company Name or URL (e.g. OpenAI or openai.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-20 pl-16 pr-8 rounded-3xl bg-muted border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 text-xl font-medium transition-all"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-20 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl uppercase tracking-widest shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" size={24} />
                Analyzing Intelligence...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Begin Analysis
                <ArrowRight size={24} />
              </div>
            )}
          </Button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-8 rounded-[32px] bg-green-500/10 border border-green-500/20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Analysis Complete</h3>
              <p className="text-green-500 font-bold uppercase tracking-widest text-xs">Competitor added to watchlist</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Building2, title: "Deep Profile", desc: "Extracts mission, values, and core strategy vectors." },
          { icon: Zap, title: "Real-time Signals", desc: "Monitors product launches and market movements." },
          { icon: Shield, title: "Risk Assessment", desc: "Evaluates competitive threats and market positioning." }
        ].map((item, i) => (
          <div key={i} className="p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary mx-auto mb-6">
              <item.icon size={24} />
            </div>
            <h4 className="text-lg font-black text-foreground mb-2 uppercase italic tracking-tighter">{item.title}</h4>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddCompetitorPage;
