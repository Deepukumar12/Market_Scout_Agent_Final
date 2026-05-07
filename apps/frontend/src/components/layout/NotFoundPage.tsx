
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 blur-[60px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 blur-[80px] rounded-full animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-12 relative z-10"
      >
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-apple-large group cursor-pointer" onClick={() => navigate('/')}>
            <Zap className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <div className="space-y-4">
          <motion.h1 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-[120px] font-black tracking-tighter leading-none uppercase italic text-foreground opacity-10 select-none"
          >
            404
          </motion.h1>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic leading-none text-foreground">
            Signal <span className="text-primary">Lost.</span>
          </h2>
          <p className="text-lg text-muted-foreground font-medium italic max-w-md mx-auto leading-relaxed pt-4">
            The coordinates you requested are outside the monitored technical universe. Our autonomous agents could not locate this data node.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-14 px-8 rounded-full border-border text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted shadow-apple-sm w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Base
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="h-14 px-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-apple-large w-full sm:w-auto"
          >
            <Home className="mr-2 w-4 h-4" />
            Command Center
          </Button>
        </div>

        <div className="pt-20">
          <div className="flex items-center justify-center gap-4 text-muted-foreground opacity-40">
            <div className="h-px w-12 bg-border" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Scout IQ Surveillance Network</span>
            <div className="h-px w-12 bg-border" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
