
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { IntelligenceGlobe } from '@/components/animations/IntelligenceGlobe'
import { ArrowRight, ShieldCheck, Zap, Database, BarChart3, Lock, Users, Globe, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-cyan-500/30 font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            SCOUT<span className="text-cyan-400">IQ</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm text-gray-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white">Log in</Button>
          </Link>
            <Link to="/register">
              <Button variant="neon" className="font-bold">
                Get Intelligence <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-20 pt-20 overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Text Content */}
        <div className="w-full md:w-1/2 z-10 flex flex-col gap-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-6 shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              SYSTEM ONLINE // SCANNING COMPETITORS
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
              Know competitor moves <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 neon-glow">
                before they happen.
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed mb-8 border-l-2 border-cyan-500/30 pl-6">
              Autonomous market intelligence that monitors, analyzes, and predicts competitor roadmaps. 
              <span className="text-white block mt-2 font-medium">Stop guessing. Start dominating.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/register">
                <Button variant="neon" size="lg" className="w-full sm:w-auto text-md px-8 py-6 h-auto shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  Launch Console
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="w-full sm:w-auto text-md px-8 py-6 h-auto hover:bg-white/5 hover:border-white/30 transition-all">
                View Live Demo
              </Button>
            </div>

            {/* Simulated Terminal Output */}
            <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-gray-500 min-h-[120px] w-full max-w-md shadow-2xl backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px] pointer-events-none"></div>
              <TypewriterEffect />
            </div>
          </motion.div>
        </div>

        {/* 3D Visual */}
        <div className="absolute top-0 right-0 w-full h-full md:w-1/2 z-0 opacity-40 md:opacity-100 pointer-events-none md:pointer-events-auto">
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            <IntelligenceGlobe />
          </Canvas>
          
          {/* Gradient Overlay for blending */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Trusted By Section (New) */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-gray-500 mb-8 uppercase tracking-widest">Trusted by strategic teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Simple text logos for now, replaces with SVGs in prod */}
             <span className="text-xl font-bold font-mono">ACME<span className="text-cyan-500">CORP</span></span>
             <span className="text-xl font-bold font-serif">Globex</span>
             <span className="text-xl font-bold italic">Soylent</span>
             <span className="text-xl font-bold tracking-tighter">Initech</span>
             <span className="text-xl font-bold">Umbrella</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 md:px-20 bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-300 mb-6">
            AUTONOMOUS AGENTS
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Enterprise-Grade Intelligence
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            ScoutIQ replaces manual research with autonomous AI agents that work 24/7 to uncover hidden market signals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 container mx-auto">
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-cyan-400" />}
            title="Risk Analysis Engine"
            desc="Automatically calculates impact scores for every competitor release. Know exactly what threatens your roadmap."
          />
          <FeatureCard 
            icon={<Database className="w-8 h-8 text-blue-500" />}
            title="Multi-Source Validation"
            desc="Cross-references 50+ data points including GitHub, patent filings, and job boards to verify news credibility."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-8 h-8 text-purple-500" />}
            title="Trend Prediction"
            desc="Identify innovation velocity and predict upcoming features before they are announced publicly."
          />
           <FeatureCard 
            icon={<BrainCircuit className="w-8 h-8 text-pink-500" />}
            title="Cognitive Modeling"
            desc="Simulates competitor decision-making processes to forecast their strategic pivots."
          />
           <FeatureCard 
            icon={<Globe className="w-8 h-8 text-emerald-500" />}
            title="Global Surveillance"
            desc="Monitors international markets in 100+ languages with real-time translation and sentiment analysis."
          />
           <FeatureCard 
            icon={<Users className="w-8 h-8 text-orange-500" />}
            title="Talent Movement"
            desc="Tracks key engineer movements to predict new product focus areas."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
           
           <div className="container mx-auto px-6 relative z-10 text-center">
             <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
               Ready to dominate your market?
             </h2>
             <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
               Join the top 1% of strategy teams using ScoutIQ to stay ahead of the curve.
             </p>
             <Link to="/register">
                <Button variant="neon" size="lg" className="px-12 py-8 text-xl rounded-full shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:shadow-[0_0_60px_rgba(0,240,255,0.5)] transition-shadow duration-500">
                  Start Deployment <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
             </Link>
           </div>
      </section>

      <Footer />

    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:bg-white/10 group cursor-default hover:-translate-y-1 hover:shadow-2xl">
      <div className="mb-6 p-4 rounded-xl bg-white/5 inline-block group-hover:scale-110 transition-transform group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

function TypewriterEffect() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <span className="text-green-500 font-bold">➜</span>
        <span>Initializing query query_planner...</span>
      </div>
      <div className="flex gap-2 text-blue-400/80">
        <span className="text-green-500 font-bold">➜</span>
        <span>Scanning competitors [OpenAI, Anthropic, Google]...</span>
      </div>
      <div className="flex gap-2 text-yellow-400/80">
        <span className="text-green-500 font-bold">➜</span>
        <span>Found 3 new technical updates...</span>
      </div>
      <div className="animate-pulse flex gap-2 text-cyan-400 font-bold">
        <span className="text-green-500">➜</span>
        <span>Generating executive summary..._</span>
      </div>
    </div>
  )
}
