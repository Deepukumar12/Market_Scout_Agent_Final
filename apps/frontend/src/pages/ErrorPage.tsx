import { useRouteError, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const ErrorPage = () => {
  const error: any = useRouteError();
  const navigate = useNavigate();

  console.error('Application Crash Details:', error);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F7] dark:bg-[#050505] p-6 selection:bg-[#0071E3]/20">
      <div className="pointer-events-none absolute -top-60 left-0 w-[600px] h-[600px] bg-[#0071E3]/10 dark:bg-[#0071E3]/15 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#AF52DE]/10 dark:bg-[#AF52DE]/15 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-2xl w-full p-12 md:p-16 rounded-[60px] border border-[#E5E5EA] dark:border-white/10 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-3xl shadow-apple text-center space-y-10"
      >
        <div className="mx-auto w-24 h-24 rounded-[32px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
           <ShieldAlert className="w-12 h-12 animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic">
            Protocol <span className="text-rose-500">Anomaly.</span>
          </h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] text-lg font-medium italic">
            A critical disruption occurred in the intelligence mesh. System diagnostics recorded an unexpected runtime exception.
          </p>
        </div>

        <div className="p-8 rounded-[36px] bg-[#F5F5F7] dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-left">
           <div className="flex items-center gap-3 mb-3 text-rose-500 font-black uppercase tracking-widest text-[10px] italic">
              <AlertTriangle className="w-4 h-4" /> Diagnostic Trace
           </div>
           <code className="text-xs font-mono text-[#1D1D1F] dark:text-white/80 break-all">
             {error?.statusText || error?.message || "Unknown Core Exception"}
           </code>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto h-14 px-10 rounded-full bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalibrate Console
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto h-14 px-10 rounded-full border-[#E5E5EA] dark:border-white/10 font-black uppercase tracking-widest text-[11px] hover:bg-white dark:hover:bg-white/5"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to HQ
          </Button>
        </div>

        <div className="pt-6">
           <p className="text-[9px] font-black text-[#86868B] uppercase tracking-[0.3em] italic">
             Sentinel Protection Active • error_code: {error?.status || '500_INTEL_DISRUPT'}
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
