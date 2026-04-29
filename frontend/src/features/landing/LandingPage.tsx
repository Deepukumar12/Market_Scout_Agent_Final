import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { useIntelStore } from '@/store/intelStore';

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
      variant === "light" ? "bg-white border-[#E5E5EA] dark:border-white/10 shadow-apple-sm hover:shadow-apple" : "bg-[#1D1D1F] border-white/10 text-white",
      className
    )}
  >
    <div className="relative z-10">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
        variant === "light" ? "bg-[#0071E3] text-white" : "bg-white text-[#1D1D1F]"
      )}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className={cn(
        "text-sm font-medium leading-relaxed max-w-[280px]",
        variant === "light" ? "text-[#6E6E73] dark:text-[#86868B]" : "text-[#86868B] dark:text-[#A1A1A6]"
      )}>{description}</p>
    </div>
    <div className="relative z-10 mt-8">
      {children}
    </div>
    
    {/* Subtle Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] pointer-events-none group-hover:to-black/[0.04] transition-all" />
  </motion.div>
);

const FeatureLabel = ({ children, color = "#0071E3" }: any) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E5E5EA] dark:border-white/10 shadow-apple-sm mb-6">
    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-wider">{children}</span>
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { globalMetrics, fetchGlobalMetrics } = useIntelStore();

  useEffect(() => {
    fetchGlobalMetrics();
  }, [fetchGlobalMetrics]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F5F5F7] dark:bg-background text-[#1D1D1F] selection:bg-[#0071E3]/20 font-sans antialiased overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full z-50 px-6 py-6"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between backdrop-blur-2xl bg-white/80 rounded-full border border-[#E5E5EA] dark:border-white/10 px-8 py-4 shadow-apple">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center shadow-apple">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                Scout<span className="text-[#0071E3]"> Agent</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-10">
              {['Features', 'Intelligence', 'Security'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-[#6E6E73] dark:text-[#86868B] hover:text-[#1D1D1F] transition-colors uppercase tracking-widest text-[10px]">
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[10px] font-black text-[#6E6E73] dark:text-[#86868B] hover:text-[#1D1D1F] px-4 uppercase tracking-widest italic">Sign In</Link>
              <Link to="/dashboard">
                <Button className="bg-[#1D1D1F] hover:bg-[#323235] text-white px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-apple transition-all">
                  Launch Console
                </Button>
              </Link>
            </div>
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
             <h1 className="text-8xl md:text-[160px] font-black tracking-tighter leading-[0.8] uppercase italic text-[#1D1D1F]">
                Autonomous <br />
                <span className="text-[#0071E3]">Signals.</span>
             </h1>
             <p className="mt-12 text-xl md:text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium italic max-w-2xl mx-auto leading-relaxed">
                The world's first autonomous competitive intelligence network. Built for the era of hyper-velocity technical shifts.
             </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12"
           >
              <Link to="/dashboard">
                <Button size="lg" className="h-16 px-12 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-black uppercase tracking-widest shadow-apple-large group">
                  Initiate Exploration
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] text-[12px] font-black uppercase tracking-widest hover:bg-white shadow-apple-sm">
                Watch Technical Briefing
              </Button>
           </motion.div>
        </div>

        {/* Visionary Background */}
        <div className="absolute inset-0 -z-10 bg-white">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-40">
              <Canvas camera={{ position: [0, 0, 5] }}>
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

      {/* Bento Feature Grid */}
      <section className="py-40 px-8 bg-white border-y border-[#E5E5EA] dark:border-white/10" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
             <FeatureLabel color="#AF52DE">The Bento Architecture</FeatureLabel>
             <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Engineered for <br /><span className="text-[#0071E3]">Omniscience.</span>
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
                <div className="h-full w-full bg-[#F5F5F7] dark:bg-background rounded-[32px] border border-[#E5E5EA] dark:border-white/10 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent p-8 flex flex-col justify-end">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-[#0071E3] flex items-center justify-center text-[10px] font-black text-white">A{i}</div>)}
                         </div>
                         <span className="text-[10px] font-black text-[#34C759] uppercase tracking-widest italic animate-pulse">Syncing...</span>
                      </div>
                      <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: "75%" }}
                           className="h-full bg-[#0071E3]" 
                         />
                      </div>
                   </div>
                   <Activity className="w-24 h-24 text-[#0071E3]/20" />
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
                      <span className="text-2xl font-black italic text-[#34C759]">{globalMetrics?.system_latency || '22'}ms</span>
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
                           className="text-[#FF3B30]" 
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-black italic">HIGH</span>
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Threat Level</span>
                      </div>
                   </div>
                </div>
             </BentoCard>

             {/* Dynamic Item */}
             <BentoCard 
               className="md:col-span-2" 
               title="Real-time Visual Intelligence" 
               description="Watch as our agents map the competitive landscape. Every connection is a real signal, every node is a verified technical event."
               icon={LayoutGrid}
               variant="dark"
             >
                <div className="absolute right-0 bottom-0 top-0 w-1/2 p-4 hidden md:block">
                   <div className="w-full h-full bg-black/40 backdrop-blur-xl rounded-l-[40px] border-l border-white/10 p-8 flex flex-col justify-center">
                      <div className="space-y-6">
                         {[1,2,3].map(i => (
                           <div key={i} className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-[#0071E3]" />
                              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ delay: i * 0.2, duration: 1.5, repeat: Infinity }} className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </BentoCard>
          </div>
        </div>
      </section>

      {/* Intelligence Showcase */}
      <section className="py-40 relative px-8" id="intelligence">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div>
               <FeatureLabel color="#5856D6">Visualizing Data Density</FeatureLabel>
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-[#1D1D1F] mb-12">
                  The <span className="text-[#0071E3]">Signal</span> <br />is Here.
               </h2>
               <p className="text-xl text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed max-w-xl mb-12">
                  Our Intelligence Globe processes millions of data points per second. It identifies patterns that humans miss, providing a 90-day predictive window into your competitors' next move.
               </p>
               <div className="flex items-center gap-12 border-t border-[#E5E5EA] dark:border-white/10 pt-12">
                  <div>
                     <div className="text-4xl font-black italic text-[#1D1D1F]">
                        {globalMetrics?.articles_processed ? `${Math.min(99, 85 + (globalMetrics.articles_processed % 10))}%` : '87%'}
                     </div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6]">Precision Level</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black italic text-[#1D1D1F]">99.9%</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6]">Agent Uptime</div>
                  </div>
               </div>
            </div>

            <div className="relative aspect-square bg-white rounded-[60px] border border-[#E5E5EA] dark:border-white/10 shadow-apple-large p-12 overflow-hidden group">
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
               <div className="absolute top-10 left-10 p-6 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-apple">
                  <div className="text-[10px] font-black text-[#6E6E73] dark:text-[#86868B] uppercase tracking-widest mb-1">Global Load</div>
                  <div className="text-2xl font-black italic text-[#1D1D1F]">NORMAL</div>
               </div>
            </div>
         </div>
      </section>

      {/* Security Section */}
      <section className="py-40 bg-[#1D1D1F] text-white overflow-hidden" id="security">
         <div className="max-w-7xl mx-auto px-8 relative">
            <div className="max-w-3xl space-y-12">
               <FeatureLabel color="#34C759">Privacy First</FeatureLabel>
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
                  Ironclad <br /><span className="text-[#0071E3]">Confidentiality.</span>
               </h2>
               <p className="text-xl md:text-2xl text-[#86868B] dark:text-[#A1A1A6] font-medium leading-relaxed italic">
                  Your tracking criteria is yours and yours alone. Scout Agent uses end-to-end encrypted pipelines to ensure your competitive strategy remains a secret.
               </p>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-12 pt-12">
                  {[
                    { icon: Lock, title: "E2E Encrypted" },
                    { icon: Shield, title: "GDPR Compliant" },
                    { icon: Activity, title: "Zero Data Leak" }
                  ].map(item => (
                    <div key={item.title} className="space-y-4">
                       <item.icon className="w-10 h-10 text-[#0071E3]" />
                       <div className="text-xs font-black uppercase tracking-widest">{item.title}</div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Subtle Abstract Tech Background */}
            <div className="absolute right-[-20%] top-0 h-full w-full pointer-events-none opacity-20 hidden lg:block">
               <Canvas camera={{ position: [0, 0, 5] }}>
                  <mesh rotation={[1, 1, 1]}>
                     <torusKnotGeometry args={[2, 0.4, 128, 32]} />
                     <meshPhongMaterial color="#0071E3" wireframe />
                  </mesh>
                  <ambientLight intensity={1} />
               </Canvas>
            </div>
         </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-60 px-8 text-center bg-white">
         <div className="max-w-4xl mx-auto space-y-16">
            <h2 className="text-7xl md:text-[140px] font-black tracking-tight uppercase italic leading-[0.8] text-[#1D1D1F]">
               Ready to <br /><span className="text-[#0071E3]">Evolve?</span>
            </h2>
            <p className="text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium italic">
               Join 500+ category leaders monitoring the technical future.
            </p>
            <div className="flex justify-center pt-8">
               <Link to="/register">
                 <Button size="lg" className="h-24 px-16 rounded-full bg-[#1D1D1F] hover:bg-[#000] text-white text-xl font-black uppercase tracking-widest shadow-apple-large transition-all transform hover:scale-105">
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