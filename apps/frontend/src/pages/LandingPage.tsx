import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  IntelligenceGlobe, 
  CompetitorPins 
} from '@/components/animations/IntelligenceGlobe';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  Activity,
  Lock,
  Cpu,
  LayoutGrid,
  Moon,
  Sun,
  Database,
  Search,
  TrendingUp,
  BarChart3,
  Server,
  Cloud,
  ChevronRight,
  Monitor,
  Network,
  AlertCircle,
  Eye,
  Radar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/layouts/Footer';
import { cn } from '@/utils/utils';
import { useIntelStore } from '@/store/intelStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/context/ThemeContext';

// --- Sub-components ---

const LiveSignalFeed = ({ signals }: { signals: any[] }) => (
  <div className="w-full overflow-hidden relative py-12 border-y border-[#F0F0F3] dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md">
    <div className="absolute top-0 left-0 px-8 py-2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest z-10 rounded-br-2xl">
      Live Intelligence Stream
    </div>
    <div className="flex animate-marquee whitespace-nowrap gap-12">
      {signals.concat(signals).map((signal, i) => (
        <div key={i} className="flex items-center gap-4 group cursor-default">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] group-hover:text-blue-600 transition-colors">
            {signal.source}: <span className="text-[#1D1D1F] dark:text-white normal-case font-bold">{signal.summary}</span>
          </span>
          <div className="w-1 h-1 rounded-full bg-[#E5E5EA] dark:bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

const BentoCard = ({ 
  children, 
  className, 
  title, 
  description, 
  icon: Icon,
  color = "blue",
  isDark = false
}: any) => {
  const colorMap: any = {
    blue: "bg-blue-600/10 text-blue-600 border-blue-600/20",
    purple: "bg-purple-600/10 text-purple-600 border-purple-600/20",
    emerald: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
    amber: "bg-amber-600/10 text-amber-600 border-amber-600/20",
    rose: "bg-rose-600/10 text-rose-600 border-rose-600/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className={cn(
        "relative overflow-hidden rounded-[32px] border p-10 flex flex-col justify-between group transition-all duration-500",
        isDark 
          ? "bg-[#0A0A0C] border-white/5 text-white shadow-2xl" 
          : "bg-white border-[#F0F0F3] dark:bg-[#0A0A0C] dark:border-white/5 shadow-xl hover:shadow-2xl dark:shadow-none",
        className
      )}
    >
      <div className="relative z-10">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner border",
          colorMap[color]
        )}>
          <Icon size={28} />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight leading-tight break-words">{title}</h3>
        <p className="text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed italic text-sm md:text-base break-words">
          {description}
        </p>
      </div>
      <div className="relative z-10 mt-12 w-full">
        {children}
      </div>
      
      {/* Background Micro-patterns */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon size={120} strokeWidth={1} />
      </div>
    </motion.div>
  );
};

const MetricBadge = ({ label, value, trend }: any) => (
  <div className="glass-card px-6 py-4 rounded-2xl flex flex-col gap-1 border border-white/10 backdrop-blur-3xl bg-white/10">
    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold">{value}</span>
      {trend && <span className="text-[10px] text-emerald-400 font-bold">{trend}</span>}
    </div>
  </div>
);

const FeatureLabel = ({ children, color = "#0071E3" }: any) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 shadow-sm mb-6">
    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider">{children}</span>
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { globalMetrics, signals, fetchGlobalMetrics, fetchSignals } = useIntelStore();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // 100% Dynamic Data Initialization & Polling
  useEffect(() => {
    const refresh = () => {
      fetchGlobalMetrics();
      fetchSignals();
    };

    refresh();
    window.addEventListener('intelligence-refresh', refresh);
    
    // Polling for 100% Real-Time Feel
    const interval = setInterval(refresh, 30000); // Sync every 30 seconds
    
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('intelligence-refresh', refresh);
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [fetchGlobalMetrics, fetchSignals]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FBFBFE] dark:bg-[#050505] text-[#1D1D1F] dark:text-[#F5F5F7] selection:bg-blue-600 selection:text-white transition-colors duration-700 overflow-x-hidden font-sans">
      
      {/* Navigation Layer */}
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 px-6 py-4",
        isScrolled ? "translate-y-0" : "translate-y-2"
      )}>
        <div className={cn(
          "max-w-7xl mx-auto h-20 px-8 flex items-center justify-between rounded-[24px] transition-all duration-500",
          isScrolled 
            ? "bg-white/70 dark:bg-black/70 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl" 
            : "bg-transparent"
        )}>
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30 overflow-hidden text-white">
                <Zap size={24} className="fill-current" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase italic text-[#1D1D1F] dark:text-white">SCOUTFORGE<span className="text-blue-600">AI</span></span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-8">
              {['Infrastructure', 'Intelligence', 'Security', 'Enterprise'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-bold text-[#6E6E73] dark:text-[#86868B] hover:text-blue-600 dark:hover:text-white transition-colors uppercase tracking-[0.2em]">{item}</a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-blue-600 transition-colors hidden sm:block">Login</Link>
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest h-10 sm:h-12 px-4 sm:px-8 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-[10px] sm:text-xs">
                <span className="hidden sm:inline">Initialize System</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - The Google/Microsoft impact */}
      <section className="relative pt-60 pb-32 px-6 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 dark:bg-blue-600/5 blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 dark:bg-indigo-600/5 blur-[160px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-600/5 border border-blue-600/10 text-blue-600 text-xs font-bold uppercase tracking-[0.2em]"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Live Node Network Active
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-7xl md:text-[90px] font-black tracking-tight leading-[0.95] dark:text-white"
              >
                Global Intel. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Dynamic Signal.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed max-w-2xl"
              >
                Deploying autonomous agents to monitor <span className="text-[#1D1D1F] dark:text-white font-bold">{globalMetrics?.total_competitors || '...'} global leaders</span> in real-time. 
                Synthesizing <span className="text-[#1D1D1F] dark:text-white font-bold">{globalMetrics?.features_found || '...'} verified signals</span> across all sectors.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-6 pt-6"
              >
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-16 px-10 rounded-[20px] bg-[#1D1D1F] dark:bg-white text-white dark:text-black text-lg font-bold shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                    Start Real-Time Scan
                    <Radar size={20} className="animate-pulse" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 text-xs font-bold text-[#86868B] uppercase tracking-widest px-6 py-4 border border-[#E5E5EA] dark:border-white/10 rounded-[20px] bg-white/50 dark:bg-transparent backdrop-blur-xl">
                  <Activity className="text-emerald-500" size={18} />
                  Intelligence Protocol Active
                </div>
              </motion.div>
            </div>

            {/* Real-Time Intelligence Globe Visualization */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative aspect-square rounded-[60px] bg-white dark:bg-[#0A0A0C] border border-[#F0F0F3] dark:border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-none p-1 overflow-hidden"
            >
              <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
                    <IntelligenceGlobe />
                  </Float>
                  <CompetitorPins />
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
              </div>

              {/* Dynamic Metrics Overlay */}
              <div className="absolute top-12 right-12 z-10 animate-float">
                <MetricBadge label="Active Surveillance" value={globalMetrics?.total_competitors || '0'} trend="+Live" />
              </div>
              <div className="absolute bottom-12 left-12 z-10 animate-float" style={{ animationDelay: '1s' }}>
                <MetricBadge label="Processing Latency" value={globalMetrics?.system_latency ? `${globalMetrics.system_latency}ms` : '12ms'} />
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-48 h-48 rounded-full border border-blue-600/20 animate-ping opacity-20" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 100% Dynamic Signal Feed */}
      {signals.length > 0 && <LiveSignalFeed signals={signals} />}

      {/* Trusted By Section - Corporate Integrity */}
      <section id="enterprise" className="py-24 border-y border-[#F0F0F3] dark:border-white/5 bg-white/50 dark:bg-transparent overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#86868B] mb-12">Surveillance Infrastructure Backbone</p>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-30 dark:opacity-20 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="flex items-center gap-2 text-2xl font-black tracking-tighter"><Server size={28} /> CLOUD</div>
             <div className="flex items-center gap-2 text-2xl font-black tracking-tighter"><Network size={28} /> EDGE</div>
             <div className="flex items-center gap-2 text-2xl font-black tracking-tighter"><Globe size={28} /> GLOBAL</div>
             <div className="flex items-center gap-2 text-2xl font-black tracking-tighter"><Shield size={28} /> SECURE</div>
             <div className="flex items-center gap-2 text-2xl font-black tracking-tighter"><Activity size={28} /> ACTIVE</div>
          </div>
        </div>
      </section>

      {/* Bento Infrastructure Grid - Big Tech Architecture */}
      <section id="infrastructure" className="py-40 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
            <FeatureLabel color="#0071E3">Technical Authority</FeatureLabel>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none dark:text-white">
              Built for <span className="text-blue-600">Enterprise Scale.</span>
            </h2>
            <p className="text-xl text-[#6E6E73] dark:text-[#86868B] font-medium max-w-2xl mx-auto">
              Our distributed node network leverages global compute to synthesize market technicals with sub-second latency and 100% evidentiary integrity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BentoCard 
              icon={Network}
              title="Intelligence Mesh"
              description="A global network of autonomous nodes continuously mapping technical landscapes across verified endpoints."
              color="blue"
              className="md:col-span-2"
            >
              <div className="h-64 w-full bg-blue-600/5 rounded-3xl border border-blue-600/10 overflow-hidden relative group">
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 gap-2 p-4">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0.05 }}
                      whileInView={{ opacity: [0.05, 0.2, 0.05] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.05 }}
                      className="bg-blue-600 rounded-lg shadow-lg shadow-blue-600/10"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="px-6 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                     Global Sync Active
                   </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard 
              icon={Zap}
              title="Real-Time Synthesis"
              description="Proprietary streaming RAG architecture for instantaneous intelligence propagation."
              color="purple"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#86868B]">
                   <span>Latency</span>
                   <span className="text-purple-600">{globalMetrics?.system_latency ? `${globalMetrics.system_latency}ms` : '12ms'}</span>
                </div>
                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "94%" }}
                    className="h-full bg-purple-600 shadow-lg shadow-purple-600/30"
                  />
                </div>
                <div className="text-[10px] font-bold text-center text-[#86868B]">Architecture Integrity Verified</div>
              </div>
            </BentoCard>

            <BentoCard 
              icon={Database}
              title="Immutable Evidence"
              description="Every insight is linked to a verified source URL with a timestamped cryptographic hash."
              color="emerald"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 flex items-center justify-center">
                   <Shield className="text-emerald-600 opacity-20" size={40} />
                </div>
                <div className="h-32 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 flex items-center justify-center">
                   <Lock className="text-emerald-600 opacity-20" size={40} />
                </div>
              </div>
            </BentoCard>

            <BentoCard 
              icon={Cpu}
              title="Agentic Surveillance"
              description="High-frequency scraping and AI analysis agents operating in parallel across global regions."
              color="amber"
              className="md:col-span-2"
            >
              <div className="flex items-center justify-around gap-4 p-8 bg-amber-600/5 rounded-3xl border border-amber-600/10">
                 <div className="flex flex-col items-center gap-2">
                    <div className="p-5 bg-white dark:bg-black rounded-2xl shadow-xl"><Search className="text-amber-600" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#86868B]">Scraper</span>
                 </div>
                 <ChevronRight className="text-amber-600/30" />
                 <div className="flex flex-col items-center gap-2">
                    <div className="p-5 bg-white dark:bg-black rounded-2xl shadow-xl"><Cpu className="text-amber-600" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#86868B]">AI Synthesis</span>
                 </div>
                 <ChevronRight className="text-amber-600/30" />
                 <div className="flex flex-col items-center gap-2">
                    <div className="p-5 bg-white dark:bg-black rounded-2xl shadow-xl"><BarChart3 className="text-amber-600" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#86868B]">Analytic</span>
                 </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* System Deep Dive - Visualizing the Intelligence Pipeline */}
      <section className="py-40 bg-[#0A0A0C] text-white overflow-hidden" id="intelligence">
        <div className="max-w-7xl mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <FeatureLabel color="#5856D6">Operational Depth</FeatureLabel>
            <h2 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]">
              The Signal <br /><span className="text-blue-500">Decoded.</span>
            </h2>
            <p className="text-xl md:text-2xl text-[#86868B] font-medium leading-relaxed max-w-xl">
              ScoutForge AI doesn't just collect data; it decodes technical momentum. Our RAG-driven pipeline identifies shifts that traditional monitoring systems miss.
            </p>
            <div className="space-y-8 pt-8">
               {[
                 { label: "Tracked Entities", val: globalMetrics?.total_competitors || '...' },
                 { label: "Technical Signals", val: globalMetrics?.features_found || '...' }
               ].map(item => (
                 <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-4 group cursor-default">
                    <span className="text-sm font-bold text-[#86868B] uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</span>
                    <span className="text-3xl font-black tracking-tighter text-blue-500">{item.val}</span>
                 </div>
               ))}
            </div>
            <Link to="/register">
              <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 text-white font-bold hover:scale-105 transition-all shadow-2xl shadow-blue-600/40 mt-8">
                 Enter the Dashboard
              </Button>
            </Link>
          </div>

          <div className="relative aspect-square bg-[#111114] rounded-[80px] border border-white/5 shadow-2xl overflow-hidden group">
             <div className="absolute inset-0 p-12">
                <div className="h-full w-full rounded-[60px] border border-blue-600/10 bg-blue-600/5 relative overflow-hidden">
                   {/* Visualizing a scan in progress */}
                   <motion.div 
                     animate={{ y: ["-100%", "100%"] }} 
                     transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                     className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_20px_#3b82f6] z-10"
                   />
                   <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-1 p-4 opacity-20">
                      {Array.from({ length: 100 }).map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.1, 0.5, 0.1] }}
                          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
                          className="bg-blue-600 rounded-sm"
                        />
                      ))}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-6">
                         <Radar className="text-blue-500 w-24 h-24 animate-spin-slow" strokeWidth={1} />
                         <div className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse">Scanning Global Sector: AI & CLOUD</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Security & Infrastructure - Amazon AWS Style */}
      <section className="py-40 px-6 bg-white dark:bg-[#050505]" id="security">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative order-2 lg:order-1">
               <div className="w-full aspect-video bg-[#FBFBFE] dark:bg-[#0A0A0C] rounded-[40px] border border-[#F0F0F3] dark:border-white/5 shadow-2xl overflow-hidden p-12">
                  <div className="space-y-8">
                     <div className="flex items-center gap-4 border-b border-[#F0F0F3] dark:border-white/5 pb-6">
                        <Lock className="text-blue-600" />
                        <span className="text-sm font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white">Authorized Access Required</span>
                     </div>
                     <div className="space-y-4 font-mono text-xs text-[#86868B]">
                        <div>&gt; DEPLOYING EDGE SCRAPERS...</div>
                        <div>&gt; ESTABLISHING SECURE BACKBONE...</div>
                        <div className="text-emerald-500">&gt; SURVEILLANCE LINK ESTABLISHED.</div>
                        <div>&gt; TARGET SECTORS: FINTECH, HEALTHCARE, CLOUD</div>
                        <div className="animate-pulse">_</div>
                     </div>
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 p-10 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-600/40 text-white">
                  <Shield size={60} />
               </div>
            </div>

            <div className="space-y-10 order-1 lg:order-2">
              <FeatureLabel color="#34C759">Ironclad Privacy</FeatureLabel>
              <h2 className="text-6xl md:text-7xl font-black tracking-tight leading-none dark:text-white">
                Zero Data <br />
                <span className="text-blue-600">Exposure.</span>
              </h2>
              <p className="text-xl md:text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed">
                We handle market intelligence with the same rigor as mission-critical cloud infrastructure. Your tracking parameters remain strictly confidential.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-6">
                 {[
                   { icon: Shield, title: "AES-256", desc: "Encryption at rest." },
                   { icon: Lock, title: "E2E Secure", desc: "Encrypted pipelines." },
                   { icon: Activity, title: "Audit Trail", desc: "Full traceability." },
                   { icon: Cloud, title: "Edge Privacy", desc: "Local processing." }
                 ].map(item => (
                   <div key={item.title} className="space-y-2">
                      <div className="flex items-center gap-3">
                         <item.icon className="text-blue-600 w-5 h-5" />
                         <span className="text-sm font-bold uppercase tracking-widest">{item.title}</span>
                      </div>
                      <p className="text-xs text-[#86868B] font-medium ml-8">{item.desc}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational FAQ - High Tech Professionalism */}
      <section className="py-40 px-6">
        <div className="max-w-4xl mx-auto space-y-20">
          <div className="text-center">
            <h2 className="text-5xl font-black tracking-tight dark:text-white">Technical <span className="text-blue-600">Briefing.</span></h2>
          </div>
          <div className="space-y-4">
             {[
               { q: "How are technical signals verified?", a: "Every signal detected by our agents is cross-referenced against multiple technical endpoints (release logs, API docs, site changes) and linked to an immutable citation URL." },
               { q: "Can we track custom competitors?", a: "Yes. The ScoutForge AI platform allows for ad-hoc addition of any corporate entity with a technical presence for real-time tracking." },
               { q: "What is the update frequency?", a: "Our High-Velocity nodes scan mission-critical targets every 15 minutes, while standard monitoring operates on a 2-hour cycle." }
             ].map((faq, i) => (
               <div key={i} className="glass-card p-10 rounded-3xl border border-[#F0F0F3] dark:border-white/5 hover:border-blue-600/30 transition-all group">
                 <div className="text-lg font-bold mb-4 dark:text-white flex items-center justify-between group-hover:text-blue-600 transition-colors">
                   {faq.q}
                   <ChevronRight size={18} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <p className="text-sm text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed">{faq.a}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action - The Big Tech Finish */}
      <section className="py-60 relative overflow-hidden bg-[#FBFBFE] dark:bg-[#050505]">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="space-y-16"
          >
            <h2 className="text-7xl md:text-[120px] font-black tracking-tight leading-[0.8] text-[#1D1D1F] dark:text-white uppercase italic">
              Own the <br />
              <span className="text-blue-600">Future.</span>
            </h2>
            <p className="text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium max-w-3xl mx-auto">
              Join the world's most aggressive category leaders in monitoring the technical future today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-8 pt-8">
               <Link to="/register">
                 <Button className="h-24 px-16 rounded-[32px] bg-blue-600 hover:bg-blue-500 text-white text-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 transition-all transform hover:scale-105 active:scale-95">
                    Start System Scan
                 </Button>
               </Link>
               <Link to="/login">
                 <Button variant="outline" className="h-24 px-16 rounded-[32px] border-2 border-[#1D1D1F] dark:border-white text-[#1D1D1F] dark:text-white text-2xl font-black uppercase tracking-[0.2em] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                    System Login
                 </Button>
               </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Abstract Particle Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
      </section>
      
      <Footer />
    </div>
  );
}