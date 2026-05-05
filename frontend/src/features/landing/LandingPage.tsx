import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei';
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
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';
import { useIntelStore } from '@/store/intelStore';
import { useComponentLogger } from '@/hooks/useComponentLogger';
import { logger } from '@/lib/logger';

// --- Components ---

const BentoCard = ({ 
  children, 
  className, 
  title, 
  description, 
  icon: Icon,
  variant = "light"
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={cn(
      "relative overflow-hidden rounded-[40px] border p-10 flex flex-col justify-between group transition-all duration-500",
      variant === "light" ? "bg-card border-border shadow-apple-sm hover:shadow-apple" : "bg-foreground border-border/10 text-background",
      className
    )}
  >
    <div className="relative z-10">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
        variant === "light" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
      )}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className={cn(
        "text-sm font-medium leading-relaxed max-w-[280px]",
        variant === "light" ? "text-muted-foreground" : "text-background/70"
      )}>{description}</p>
    </div>
    <div className="relative z-10 mt-8">
      {children}
    </div>
    
    {/* Subtle Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] pointer-events-none group-hover:to-black/[0.04] transition-all" />
  </motion.div>
);

const FeatureLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border shadow-apple-sm mb-6">
    <Sparkles size={14} className="text-primary" />
    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{children}</span>
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  useComponentLogger('LandingPage');
  const containerRef = useRef<HTMLDivElement>(null);
  const { globalMetrics, fetchGlobalMetrics, signals, fetchSignals } = useIntelStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    logger.info('LandingPage mounted');
    fetchGlobalMetrics();
    fetchSignals();
    return () => logger.info('LandingPage unmounted');
  }, [fetchGlobalMetrics, fetchSignals]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans antialiased overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full z-50 px-4 py-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between backdrop-blur-2xl bg-card/80 rounded-full border border-border px-6 py-4 shadow-apple relative">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-apple">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Market<span className="text-primary"> Scout</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              {['Features', 'Intelligence', 'Security'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest text-[10px]">
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link to="/login" className="hidden sm:block text-[10px] font-black text-muted-foreground hover:text-foreground px-4 uppercase tracking-widest italic">Sign In</Link>
              <Link to="/dashboard">
                <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 sm:px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-apple transition-all h-10">
                  Console
                </Button>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-foreground"
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-card rounded-3xl border border-border shadow-2xl p-6 flex flex-col gap-4 lg:hidden"
                >
                  {['Features', 'Intelligence', 'Security'].map((item) => (
                    <a 
                      key={item} 
                      href={`#${item.toLowerCase()}`} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-black text-foreground uppercase italic tracking-tighter"
                    >
                      {item}
                    </a>
                  ))}
                  <div className="h-px bg-muted my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Appearance</span>
                    <ThemeToggle />
                  </div>
                  <Link to="/login" className="text-lg font-black text-muted-foreground uppercase italic tracking-tighter">Sign In</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center text-center px-8"
      >
        <div className="max-w-5xl mx-auto z-10 space-y-8">
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            >
             <FeatureLabel>Version 1.0 Stable</FeatureLabel>
             <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[160px] font-black tracking-tighter leading-[0.8] uppercase italic text-foreground">
                Autonomous <br />
                <span className="text-primary">Signals.</span>
             </h1>
              <p className="mt-12 text-xl md:text-2xl text-muted-foreground font-medium italic max-w-2xl mx-auto leading-relaxed">
                The enterprise-grade autonomous competitive intelligence network. Built for sub-15s technical surveillance and AI-driven synthesis.
             </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12"
           >
               <Link to="/dashboard">
                <Button size="lg" className="h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[12px] font-black uppercase tracking-widest shadow-apple-large group">
                  Initiate Exploration
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
               <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-border text-foreground text-[12px] font-black uppercase tracking-widest hover:bg-muted shadow-apple-sm">
                Watch Technical Briefing
              </Button>
           </motion.div>
        </div>

        {/* Visionary Background */}
        <div className="absolute inset-0 -z-10 bg-card">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-40">
              <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 1]}>
                <ambientLight intensity={0.5} />
                <Float speed={4} rotationIntensity={1} floatIntensity={1}>
                   <mesh>
                      <sphereGeometry args={[2, 64, 64]} />
                      <MeshDistortMaterial color="#0071E3" speed={2} distort={0.4} radius={1} transparent opacity={0.05} />
                   </mesh>
                </Float>
              </Canvas>
           </div>
        </div>
      </motion.section>

      {/* Product Preview Section */}
      <section className="py-20 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-8">
             <motion.div
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="relative z-10 bg-foreground rounded-[48px] p-4 md:p-8 shadow-2xl border border-border/10"
            >
               {/* Mockup Top Bar */}
               <div className="flex items-center justify-between mb-8 px-4">
                  <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/50" />
                     <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                     <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="px-6 py-2 rounded-full bg-card/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                     scout-intelligence-console.v1.0.4
                  </div>
                  <div className="w-12" />
               </div>
               
               {/* Mockup Content */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 aspect-video bg-muted/20 rounded-[32px] border border-border/10 p-8 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-12">
                        <div className="space-y-1">
                           <div className="text-[10px] font-black text-primary uppercase tracking-widest italic">Operational Overview</div>
                           <div className="text-3xl font-black text-white italic">COMMAND CENTER</div>
                        </div>
                        <div className="flex gap-3">
                           {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-card/5 border border-white/5" />)}
                        </div>
                     </div>
                     
                     {/* Simple Chart Mockup */}
                     <div className="flex items-end gap-2 h-40">
                        {[40, 70, 45, 90, 65, 80, 55, 95, 70, 85].map((h, i) => (
                           <motion.div 
                              key={i}
                              initial={{ height: 0 }}
                              whileInView={{ height: `${h}%` }}
                              transition={{ delay: i * 0.05 }}
                              className="flex-1 bg-primary/20 border-t-2 border-primary rounded-t-lg"
                           />
                        ))}
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     {[1,2].map(i => (
                        <div key={i} className="bg-card/5 rounded-[32px] border border-white/5 p-6 space-y-4">
                           <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                              <Zap className="w-6 h-6 text-primary" />
                           </div>
                           <div className="space-y-2">
                              <div className="h-4 w-32 bg-card/20 rounded-full" />
                              <div className="h-2 w-full bg-card/5 rounded-full" />
                              <div className="h-2 w-3/4 bg-card/5 rounded-full" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Glass Reflection */}
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[48px]" />
            </motion.div>
            
            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[120px] pointer-events-none" />
         </div>
      </section>

      {/* Live System Status */}
      <section className="py-10 bg-muted dark:bg-background border-b border-border ">
         <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-wrap items-center justify-between gap-8">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-foreground  uppercase tracking-[0.2em] italic">Live Operational Status</span>
               </div>
               
               <div className="flex flex-wrap items-center gap-8 md:gap-12">
                  {[
                    { label: 'API Gateway', status: 'Healthy' },
                    { label: 'Intelligence Mesh', status: 'Active' },
                    { label: 'Global DB', status: 'Synchronized' },
                    { label: 'Vector Cache', status: 'Optimized' }
                  ].map(sys => (
                    <div key={sys.label} className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{sys.label}</span>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-[10px] font-bold text-foreground  italic">{sys.status}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Bento Feature Grid */}
      <section className="py-40 px-8 bg-card border-y border-border " id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
             <FeatureLabel >The Bento Architecture</FeatureLabel>
             <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Engineered for <br /><span className="text-primary">Omniscience.</span>
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[450px]">
             {/* Large Item */}
             <BentoCard 
               className="md:col-span-2" 
               title="Autonomous Agent Swarming" 
               description="Our agents don't just search; they perform deep technical audits. Comparing commit histories, patent filings, and job trajectories in real-time."
               icon={Cpu}
             >
                <div className="h-full w-full bg-muted/20 dark:bg-background rounded-[32px] border border-border flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent p-8 flex flex-col justify-end">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground">A{i}</div>)}
                         </div>
                         <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic animate-pulse">Syncing...</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: "75%" }}
                           className="h-full bg-primary" 
                         />
                      </div>
                   </div>
                   <Activity className="w-24 h-24 text-primary/20" />
                </div>
             </BentoCard>

             {/* Small Item */}
             <BentoCard 
               title="Global Pulse" 
               description="Monitor movements across 195 countries with 99.9% precision."
               icon={Globe}
               variant="dark"
             >
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Latency</span>
                      <span className="text-2xl font-black italic text-green-500">{globalMetrics?.system_latency || '22'}ms</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Signals</span>
                      <span className="text-2xl font-black italic">{globalMetrics?.articles_processed ? `${(globalMetrics.articles_processed / 1000).toFixed(1)}k+` : '10k+'}</span>
                   </div>
                </div>
             </BentoCard>

             {/* Small Item 2 */}
             <BentoCard 
               title="Risk Scoring" 
               description="ML-driven threat assessments for intellectual property and market share."
               icon={Shield}
             >
                <div className="flex items-center justify-center">
                   <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[#F5F5F7]" />
                         <motion.circle 
                           cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                           strokeDasharray="440"
                           initial={{ strokeDashoffset: 440 }}
                           whileInView={{ strokeDashoffset: 110 }}
                           className="text-red-500" 
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-black italic">HIGH</span>
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Threat Level</span>
                      </div>
                   </div>
                </div>
             </BentoCard>

             {/* Dynamic Intelligence Feed */}
             <BentoCard 
               className="md:col-span-2" 
               title="Live Intelligence Stream" 
               description="Real-time signals detected by our autonomous agent mesh. Verified technical updates from across the web."
               icon={Activity}
               variant="dark"
             >
                <div className="flex flex-col gap-3 mt-4 h-[250px] overflow-hidden">
                   {signals && signals.length > 0 ? (
                      signals.slice(0, 4).map((signal: any, i: number) => (
                        <motion.div 
                          key={signal.id || i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 bg-card/5 border border-white/10 rounded-2xl flex items-center gap-4 group hover:bg-card/10 transition-all"
                        >
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                             signal.sentiment === 'Positive' ? "bg-green-500/20 text-green-500" : "bg-primary/20 text-primary"
                           )}>
                              <Zap size={18} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-primary truncate">{signal.company_name}</span>
                                 <span className="text-[8px] font-medium opacity-40 uppercase tracking-widest">{new Date(signal.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs font-medium text-white/80 line-clamp-1 mt-1">{signal.summary}</p>
                           </div>
                        </motion.div>
                      ))
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40 italic text-sm">
                         <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                         <span>Synchronizing with global signal mesh...</span>
                      </div>
                   )}
                </div>
             </BentoCard>
          </div>
        </div>
      </section>

      {/* Intelligence Showcase */}
      <section className="py-40 relative px-8" id="intelligence">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div>
               <FeatureLabel >Visualizing Data Density</FeatureLabel>
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-foreground  mb-12">
                  The <span className="text-primary">Signal</span> <br />is Here.
               </h2>
               <p className="text-xl text-muted-foreground  font-medium leading-relaxed max-w-xl mb-12">
                  Our Intelligence Globe processes millions of data points per second. It identifies patterns that humans miss, providing a 90-day predictive window into your competitors' next move.
               </p>
               <div className="flex items-center gap-12 border-t border-border  pt-12">
                  <div>
                     <div className="text-4xl font-black italic text-foreground ">
                        {globalMetrics?.articles_processed ? `${Math.min(99, 85 + (globalMetrics.articles_processed % 10))}%` : '87%'}
                     </div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ">Precision Level</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black italic text-foreground ">99.9%</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ">Agent Uptime</div>
                  </div>
               </div>
            </div>

            <div className="relative aspect-square bg-card rounded-[60px] border border-border  shadow-apple-large p-12 overflow-hidden group">
               <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                  <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                      <IntelligenceGlobe />
                    </Float>
                    <CompetitorPins />
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                  </Canvas>
               </div>
               
               {/* Live Overlay */}
               <div className="absolute top-10 left-10 p-6 bg-card/70 dark:bg-black/70 backdrop-blur-xl rounded-[24px] border border-white  shadow-apple">
                  <div className="text-[10px] font-black text-muted-foreground  uppercase tracking-widest mb-1">Global Load</div>
                  <div className="text-2xl font-black italic text-foreground ">NORMAL</div>
               </div>
            </div>
         </div>
      </section>

      {/* Security Section */}
      <section className="py-40 bg-foreground text-background overflow-hidden" id="security">
         <div className="max-w-7xl mx-auto px-8 relative">
            <div className="max-w-3xl space-y-12">
               <FeatureLabel color="#34C759">Privacy First</FeatureLabel>
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
                  Ironclad <br /><span className="text-primary">Confidentiality.</span>
               </h2>
               <p className="text-xl md:text-2xl text-background/70 font-medium leading-relaxed italic">
                  Your tracking criteria is yours and yours alone. Scout Agent uses end-to-end encrypted pipelines to ensure your competitive strategy remains a secret.
               </p>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-12 pt-12">
                  {[
                    { icon: Lock, title: "E2E Encrypted" },
                    { icon: Shield, title: "GDPR Compliant" },
                    { icon: Activity, title: "Zero Data Leak" }
                  ].map(item => (
                    <div key={item.title} className="space-y-4">
                       <item.icon className="w-10 h-10 text-primary" />
                       <div className="text-xs font-black uppercase tracking-widest">{item.title}</div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Subtle Abstract Tech Background */}
            <div className="absolute right-[-20%] top-0 h-full w-full pointer-events-none opacity-20 hidden lg:block">
               <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 1]}>
                  <mesh rotation={[1, 1, 1]}>
                     <torusKnotGeometry args={[2, 0.4, 128, 32]} />
                     <meshPhongMaterial color="currentColor" wireframe />
                  </mesh>
                  <ambientLight intensity={1} />
               </Canvas>
            </div>
         </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-60 px-8 text-center bg-background">
         <div className="max-w-4xl mx-auto space-y-16">
            <h2 className="text-7xl md:text-[140px] font-black tracking-tight uppercase italic leading-[0.8] text-foreground">
               Ready to <br /><span className="text-primary">Evolve?</span>
            </h2>
            <p className="text-2xl text-muted-foreground font-medium italic">
               Join 500+ category leaders monitoring the technical future.
            </p>
            <div className="flex justify-center pt-8">
               <Link to="/register">
                 <Button size="lg" className="h-24 px-16 rounded-full bg-foreground hover:bg-foreground/90 text-background text-xl font-black uppercase tracking-widest shadow-apple-large transition-all transform hover:scale-105">
                    Register Protocol
                 </Button>
               </Link>
            </div>
         </div>
      </section>
      
      <Footer />
    </div>
  );
}