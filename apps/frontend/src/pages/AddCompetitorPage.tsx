import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { runScan } from '@/services/api';
import { useCompetitorStore } from '@/store/competitorStore';
import { useExecutionStore } from '@/store/executionStore';
import { cn } from '@/utils/utils';

const AddCompetitorPage = () => {
  const { addCompetitor, fetchCompetitors } = useCompetitorStore();
  const { currentStep: realStep, setStep, startExecution, stopExecution } = useExecutionStore();
  
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressSteps = [
    'Initializing AI Scout agents...',
    'Searching technical repositories...',
    'Scraping latest feature releases...',
    'Analyzing competitive edge...',
    'Generating intelligence report...'
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    startExecution(progressSteps.length);

    try {
      let companyName = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      if (!companyName) companyName = url;

      const newComp = await addCompetitor(companyName, url);
      
      if (!newComp) {
        throw new Error('Failed to initialize competitor in surveillance network.');
      }

      const data = await runScan({
        company_name: companyName,
        website: url,
        time_window_days: 7
      });

      if (data && !data.error) {
        setStep(progressSteps.length - 1);
        setSuccess(true);
        setUrl('');
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
      stopExecution();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tighter mb-4 uppercase italic">Add <span className="text-[#0071E3]">Competitor</span></h1>
        <p className="text-lg text-[#6E6E73] dark:text-[#86868B] font-medium italic">ScoutIQ will analyze the digital footprint and extract strategic signals.</p>
      </div>

      <div className="bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl rounded-[48px] p-12 shadow-apple border border-[#E5E5EA] dark:border-white/10 shadow-sm transition-colors duration-500">
        {!loading && !success ? (
          <form onSubmit={handleAdd} className="space-y-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-[#86868B] dark:text-[#A1A1A6] group-focus-within:text-[#0071E3] transition-colors">
                <Globe size={24} />
              </div>
              <Input 
                type="url"
                placeholder="https://competitor.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-20 pl-16 pr-8 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-transparent dark:text-white focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 text-xl font-medium transition-all"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-20 rounded-3xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-xl uppercase tracking-widest shadow-xl shadow-[#0071E3]/20 transition-all"
            >
              <div className="flex items-center gap-2">
                Begin Analysis
                <ArrowRight size={24} />
              </div>
            </Button>
          </form>
        ) : loading ? (
          <div className="space-y-10 py-4">
             <div className="relative h-3 w-full bg-[#F5F5F7] dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-[#0071E3] shadow-[0_0_15px_rgba(0,113,227,0.5)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((realStep + 1) / progressSteps.length) * 100}%` }}
                />
              </div>

              <div className="grid gap-6">
                {progressSteps.map((step, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center gap-6 transition-all duration-500",
                      index > realStep ? "opacity-20 grayscale" : "opacity-100"
                    )}
                  >
                    {index < realStep ? (
                      <div className="w-8 h-8 rounded-full bg-[#34C759] flex items-center justify-center text-white">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : index === realStep ? (
                      <div className="w-8 h-8 rounded-full bg-[#0071E3] flex items-center justify-center text-white shadow-lg shadow-[#0071E3]/30">
                        <Loader2 size={20} className="animate-spin" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-[#E5E5EA] dark:border-white/10" />
                    )}
                    <span className={cn(
                      "text-lg font-black italic tracking-tight uppercase",
                      index === realStep ? "text-[#1D1D1F] dark:text-white" : "text-[#86868B]"
                    )}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
          </div>
        ) : null}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-center italic uppercase text-xs tracking-widest"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-8 rounded-[32px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white mb-1 uppercase tracking-tighter italic">Analysis Complete</h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] italic">Competitor added to watchlist</p>
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
          <div key={i} className="p-10 rounded-[40px] bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border border-[#E5E5EA] dark:border-white/10 shadow-apple shadow-sm text-center transition-all hover:scale-105">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-white/10 flex items-center justify-center text-[#0071E3] mx-auto mb-6 shadow-sm">
              <item.icon size={24} />
            </div>
            <h4 className="text-lg font-black text-[#1D1D1F] dark:text-white mb-2 uppercase italic tracking-tighter">{item.title}</h4>
            <p className="text-sm text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed italic">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddCompetitorPage;
