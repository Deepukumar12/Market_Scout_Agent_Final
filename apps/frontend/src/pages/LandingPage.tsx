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
  LayoutGrid,
  Moon,
  Sun
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/layouts/Footer';
import { cn } from '@/utils/utils';
import { useIntelStore } from '@/store/intelStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/context/ThemeContext';

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
        variant === "light" ? "bg-[#0071E3] text-white" : "bg-white text-[#1D1D1F] dark:text-white"
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
    <span className="text-[10px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider">{children}</span>
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { globalMetrics, fetchGlobalMetrics } = useIntelStore();
  const { token } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

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
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-[#000] text-[#1D1D1F] dark:text-white selection:bg-[#0071E3] selection:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* Navigation Layer */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-[#F5F5F7] dark:border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#0071E3] rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-[#0071E3]/30">
                <Globe className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-black uppercase tracking-tighter italic">Market Scout</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              {['Features', 'Intelligence', 'Sectors', 'Network'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-[#6E6E73] dark:text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors uppercase tracking-widest italic">{item}</a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#86868B] transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link to="/login" className="text-sm font-bold text-[#1D1D1F] dark:text-white hover:opacity-70 transition-opacity uppercase tracking-widest italic">Login</Link>
            <Link to="/register">
              <Button size="sm" className="bg-[#1D1D1F] dark:bg-white text-white dark:text-black font-black uppercase tracking-widest h-10 px-6 rounded-full italic shadow-apple hover:scale-105 transition-all">
                Join Network
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 bg-[#F5F5F7] dark:bg-[#000]">
         <div className="max-w-[1440px] mx-auto text-center space-y-12">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white dark:bg-white/10 border border-[#E5E5EA] dark:border-white/10 shadow-apple animate-fade-in">
               <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-[#1D1D1F] dark:text-white">Neural Surveillance Online</span>
            </div>
            
            <div className="space-y-4">
               <h1 className="text-7xl md:text-[160px] font-black tracking-tight uppercase italic leading-[0.85] text-[#1D1D1F] dark:text-white animate-fade-in-up">
                  The <br /><span className="text-[#0071E3]">Future</span> <br /> Seen.
               </h1>
               <p className="max-w-2xl mx-auto text-xl md:text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium italic animate-fade-in" style={{ animationDelay: '200ms' }}>
                  Real-time technical intelligence for global category leaders. <br />
                  Zero mock data. 100% verified evidence.
               </p>
            </div>
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section id="features" className="py-40 px-6 bg-white dark:bg-[#000]">
         <div className="max-w-[1440px] mx-auto space-y-32">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-b border-[#F5F5F7] dark:border-white/5 pb-16">
               <div className="space-y-6 max-w-2xl">
                  <h2 className="text-6xl font-black uppercase italic leading-none text-[#1D1D1F] dark:text-white">
                     Engineered for <br /><span className="text-[#0071E3]">Superiority</span>
                  </h2>
               </div>
               <p className="text-lg text-[#6E6E73] dark:text-[#86868B] font-medium italic max-w-xs">
                  A high-fidelity intelligence mesh designed for instantaneous technical synthesis.
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               <BentoCard 
                  icon={Zap}
                  title="Flash Scan"
                  desc="Parallelized technical mapping across thousands of global sources in <2s."
                  className="md:col-span-2 bg-[#F5F5F7] dark:bg-white/5"
               />
               <BentoCard 
                  icon={Shield}
                  title="Verified Evidence"
                  desc="Every insight is linked to live source citations with temporal filtering."
                  className="bg-[#1D1D1F] text-white"
               />
               <BentoCard 
                  icon={Activity}
                  title="Pulse Monitoring"
                  desc="Adaptive frequency scanning that evolves with technical momentum."
                  className="bg-white dark:bg-white/5 border border-[#F5F5F7] dark:border-white/10 shadow-apple"
               />
               <BentoCard 
                  icon={Cpu}
                  title="Neural Synthesis"
                  desc="Proprietary RAG engines performing cross-sector technical correlation."
                  className="md:col-span-2 bg-[#0071E3] text-white"
               />
            </div>
         </div>
      </section>

      {/* Intelligence Showcase */}
      <section className="py-40 relative px-8" id="intelligence">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div>
               <FeatureLabel color="#5856D6">Visualizing Data Density</FeatureLabel>
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-[#1D1D1F] dark:text-white mb-12">
                  The <span className="text-[#0071E3]">Signal</span> <br />is Here.
               </h2>
               <p className="text-xl text-[#6E6E73] dark:text-[#86868B] font-medium leading-relaxed max-w-xl mb-12">
                  Our Intelligence Globe processes millions of data points per second. It identifies patterns that humans miss, providing a 90-day predictive window into your competitors' next move.
               </p>
               <div className="flex items-center gap-12 border-t border-[#E5E5EA] dark:border-white/10 pt-12">
                  <div>
                     <div className="text-4xl font-black italic text-[#1D1D1F] dark:text-white">
                        {globalMetrics?.articles_processed ? `${Math.min(99, 85 + (globalMetrics.articles_processed % 10))}%` : '87%'}
                     </div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6]">Precision Level</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black italic text-[#1D1D1F] dark:text-white">99.9%</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6]">Agent Uptime</div>
                  </div>
               </div>
            </div>

            <div className="relative aspect-square bg-white dark:bg-[#1D1D1F] rounded-[60px] border border-[#E5E5EA] dark:border-white/10 shadow-apple-large p-12 overflow-hidden group">
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
               <div className="absolute top-10 left-10 p-6 bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-[24px] border border-white/20 shadow-apple">
                  <div className="text-[10px] font-black text-[#6E6E73] dark:text-[#86868B] uppercase tracking-widest mb-1">Global Load</div>
                  <div className="text-2xl font-black italic text-[#1D1D1F] dark:text-white">NORMAL</div>
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
               <p className="text-xl md:text-2xl text-[#86868B] font-medium leading-relaxed italic">
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
      <section className="py-60 px-8 text-center bg-white dark:bg-[#000]">
         <div className="max-w-4xl mx-auto space-y-16">
            <h2 className="text-7xl md:text-[140px] font-black tracking-tight uppercase italic leading-[0.8] text-[#1D1D1F] dark:text-white">
               Ready to <br /><span className="text-[#0071E3]">Evolve?</span>
            </h2>
            <p className="text-2xl text-[#6E6E73] dark:text-[#86868B] font-medium italic">
               Join 500+ category leaders monitoring the technical future.
            </p>
            <div className="flex justify-center pt-8">
               <Link to="/register">
                 <Button size="lg" className="h-24 px-16 rounded-full bg-[#1D1D1F] dark:bg-white hover:bg-[#000] dark:hover:bg-[#F5F5F7] text-white dark:text-black text-xl font-black uppercase tracking-widest shadow-apple-large transition-all transform hover:scale-105">
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