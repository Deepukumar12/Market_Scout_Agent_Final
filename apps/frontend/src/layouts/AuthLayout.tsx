import { useAuthStore } from "@/store/authStore"
import { Navigate, Outlet, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import { IntelligenceGlobe } from '@/components/animations/IntelligenceGlobe'
import { Zap, Sparkles, Shield, Activity } from 'lucide-react'

export function AuthLayout() {
  const { token } = useAuthStore()
  
  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col lg:flex-row overflow-hidden">
       {/* Left Side: Branding & Visuals (Hidden on small screens) */}
       <div className="hidden lg:flex lg:w-1/2 relative bg-white border-r border-[#E5E5EA] flex-col overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0071E3]/5 rounded-full blur-[100px]" />
          </div>

          {/* Logo & Header */}
          <div className="p-12 relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center shadow-apple">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                Scout<span className="text-[#0071E3]"> Agent</span>
              </span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E5E5EA] shadow-apple-sm mb-6">
                <Sparkles size={14} className="text-[#0071E3]" />
                <span className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-wider">Secure Access</span>
              </div>
              <h2 className="text-6xl font-black text-[#1D1D1F] leading-[0.9] uppercase italic tracking-tighter mb-6">
                Global <br />
                <span className="text-[#0071E3]">Intelligence.</span>
              </h2>
              <p className="text-lg text-[#6E6E73] dark:text-[#86868B] font-medium italic max-w-sm">
                Enter the terminal to synchronize with your autonomous signals and competitor movements across the globe.
              </p>
            </motion.div>
          </div>

          {/* Globe Canvas */}
          <div className="flex-1 relative">
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} className="w-full h-full cursor-grab active:cursor-grabbing">
              <color attach="background" args={['#FFFFFF']} />
              <ambientLight intensity={0.8} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              
              <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <IntelligenceGlobe />
              </Float>
              
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {/* Float UI Mockup */}
            <div className="absolute bottom-12 left-12 right-12 grid grid-cols-2 gap-6 pb-4">
               <div className="p-5 bg-white/70 backdrop-blur-xl rounded-[24px] border border-[#E5E5EA] shadow-apple">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity size={16} className="text-[#0071E3]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6]">Signal Flow</span>
                  </div>
                  <div className="text-2xl font-black text-[#1D1D1F]">ACTIVE</div>
               </div>
               <div className="p-5 bg-white/70 backdrop-blur-xl rounded-[24px] border border-[#E5E5EA] shadow-apple">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield size={16} className="text-[#34C759]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#86868B] dark:text-[#A1A1A6]">Verified</span>
                  </div>
                  <div className="text-2xl font-black text-[#1D1D1F]">100%</div>
               </div>
            </div>
          </div>
       </div>

       {/* Right Side: Form Content */}
       <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F5F5F7] lg:bg-white/30 relative">
          {/* Background Gradient for mobile */}
          <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#0071E3]/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#AF52DE]/5 rounded-full blur-[80px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
             <Outlet />
          </motion.div>

          <div className="mt-8 text-center relative z-10">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B] dark:text-[#A1A1A6] italic">
                © 2026 Scout Agent Autonomous Systems. All protocols active.
             </p>
          </div>
       </div>
    </div>
  )
}
