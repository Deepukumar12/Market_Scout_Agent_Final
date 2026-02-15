import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html, OrbitControls, Stars, PerspectiveCamera, Environment, Ring, Sparkles, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompetitorStore } from '../../store/competitorStore';
import * as THREE from 'three';
import clsx from 'clsx';

// --- TYPES ---
interface VisualCompetitor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  marketShare: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  riskScore: number; // 0-100
}

// --- UTILS ---
const generateVisualData = (competitors: any[]): VisualCompetitor[] => {
  return competitors.map((comp, index) => {
    const hash = comp.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    // Adjusted lat/lng generation for more spread
    const lat = ((hash * 137) % 160) - 80; 
    const lng = ((hash * 263) % 360) - 180;
    
    // Simulate data
    const riskScore = (hash % 100);
    const sentiment = riskScore > 75 ? 'negative' : riskScore < 35 ? 'positive' : 'neutral';
    
    return {
      id: comp._id || comp.id || `comp-${index}`,
      name: comp.name,
      lat,
      lng,
      marketShare: (hash % 40) + 10,
      sentiment,
      riskScore
    };
  });
};

const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
};

// --- 3D COMPONENTS ---

const CyberGlobe = () => {
  const globeRef = useRef<THREE.Group>(null);
  const atmosRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.05; // Base rotation
    }
    if (atmosRef.current) {
        // Atmosphere pulse
        atmosRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.005);
    }
  });

  return (
    <group ref={globeRef}>
      {/* 1. Core "Ocean" Sphere - Glossy & Dark */}
      <Sphere args={[2.5, 64, 64]}>
        <meshPhysicalMaterial
          color="#020617" // Slate-950
          emissive="#0f172a"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.9} // Metallic look
          clearcoat={1}
          clearcoatRoughness={0.1}
          reflectivity={1}
        />
      </Sphere>

      {/* 2. Wireframe Lattice - "Data Grid" */}
      <Sphere args={[2.51, 48, 48]}>
        <meshBasicMaterial
          color="#3b82f6" // Blue-500
          wireframe
          transparent
          opacity={0.08}
        />
      </Sphere>

      {/* 3. Tech Rings / Orbital Paths */}
      <group rotation={[Math.PI / 3, 0, 0]}>
        <Ring args={[3.2, 3.22, 64]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} side={THREE.DoubleSide} />
        </Ring>
      </group>
      <group rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <Ring args={[2.8, 2.81, 64]} rotation={[Math.PI / 2, 0, 0]}>
             <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} side={THREE.DoubleSide} />
        </Ring>
      </group>

      {/* 4. Volumetric Glow / Atmosphere */}
      <Sphere ref={atmosRef} args={[2.65, 64, 64]}>
        <meshBasicMaterial
            color="#4f46e5" // Indigo
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
      </Sphere>
      
      {/* 5. Inner Core Glow (Visible at edges due to fresnel-like effect of layered spheres) */}
      <Sphere args={[2.4, 32, 32]}>
          <meshBasicMaterial color="#000" />
      </Sphere>
    </group>
  );
};

const Beacon = ({ data, isHovered, onHover }: { data: VisualCompetitor, isHovered: boolean, onHover: (id: string | null) => void }) => {
  // Convert lat/lng to position relative to the ROTATING globe group?
  // Actually, if we put pins INSIDE the globe group, they rotate with it.
  // But we want the HTML label to be stable? No, label should track.
  
  const pos = useMemo(() => latLngToVector3(data.lat, data.lng, 2.52), [data.lat, data.lng]);
  const color = data.sentiment === 'positive' ? '#10b981' : data.sentiment === 'negative' ? '#ef4444' : '#f59e0b';
  
  // Height of the beacon line
  const height = isHovered ? 0.8 : 0.4;
  
  // Create a LookAt matrix so cylinders point outwards from center
  const quaternion = useMemo(() => {
    const dummy = new THREE.Object3D();
    dummy.position.copy(pos);
    dummy.lookAt(0,0,0); 
    return dummy.quaternion;
  }, [pos]);

  return (
    <group position={pos} quaternion={quaternion}>
      {/* Interactive Hit Box (Invisible larger sphere for easier clicking) */}
      <mesh 
        position={[0, 0, height/2]} // Offset slightly out
        onClick={() => onHover(data.id)} 
        onPointerOver={() => onHover(data.id)} 
        onPointerOut={() => onHover(null)}
        visible={false}
      >
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* The Beacon Line */}
      <mesh position={[0, 0, -height / 2]} rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[0.02, 0.005, height, 8]} />
         <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* The Glowing Tip */}
      <mesh position={[0, 0, -height]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      
      {/* Pulse Wave at Base */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
         <ringGeometry args={[0.05, 0.15, 32]} />
         <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Floating Card UI */}
      {isHovered && (
        <Html position={[0, 0, -height - 0.2]} center distanceFactor={15} zIndexRange={[100, 0]}>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="pointer-events-none select-none w-72 bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                style={{
                    boxShadow: `0 0 40px ${color}30, inset 0 0 20px ${color}10`
                }}
            >
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
                
                <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-white font-bold text-lg leading-tight">{data.name}</h3>
                        <div className={clsx(
                            "text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider",
                            data.sentiment === 'positive' ? "bg-emerald-500 text-slate-950" :
                            data.sentiment === 'negative' ? "bg-red-500 text-white" :
                            "bg-amber-500 text-slate-950"
                        )}>
                            {data.sentiment}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white/5 rounded p-2">
                             <div className="text-[10px] text-slate-400 uppercase">Share</div>
                             <div className="text-lg font-mono text-white">{data.marketShare}%</div>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                             <div className="text-[10px] text-slate-400 uppercase">Risk</div>
                             <div className="text-lg font-mono text-white flex items-center gap-1">
                                {data.riskScore}
                                <span className={clsx("w-2 h-2 rounded-full", data.riskScore > 50 ? "bg-red-500" : "bg-emerald-500")} />
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 border-t border-white/10 pt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        ACTIVE MONITORING
                    </div>
                </div>
            </motion.div>
        </Html>
      )}
    </group>
  );
};

const BackgroundEffects = () => {
    return (
        <>
            <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
            <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.5} noise={0.2} color="#818cf8" />
            
            {/* Ambient Nebula Glows via massive sprites or simple colored lights */}
            <pointLight position={[-20, 10, -20]} intensity={2} color="#4338ca" distance={100} />
            <pointLight position={[20, -10, 10]} intensity={2} color="#06b6d4" distance={100} />
            
            {/* Reflective Environment */}
            <Environment preset="city" />
        </>
    )
}

// --- MAIN COMPONENT ---

const ThreeHero = () => {
  const { competitors } = useCompetitorStore();
  const [visualData, setVisualData] = useState<VisualCompetitor[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (competitors.length > 0) {
      setVisualData(generateVisualData(competitors));
    }
  }, [competitors]);

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#020617]"
    >
        {/* CSS Overlay Gradients for Depth */}
        <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[-40%] left-[-20%] w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-40%] right-[-20%] w-[1000px] h-[1000px] bg-cyan-600/10 rounded-full blur-[150px]" />
        </div>

        <Canvas className="z-10 relative" dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
            {/* Cinematic camera controls */}
            <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.8}
                minPolarAngle={Math.PI / 2.5}
                maxPolarAngle={Math.PI / 1.5}
                dampingFactor={0.05}
            />

            <BackgroundEffects />

            {/* Float the entire globe assembly slightly for weightlessness */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <group>
                    <CyberGlobe />
                    
                    {/* Add pins to the same group so they rotate WITH the globe if we rotate the group. 
                        Wait, CyberGlobe rotates strictly internally? 
                        The pattern: generate positions on sphere. 
                        If I put pins directly in Canvas, they won't rotate with the Globe's Y spin. 
                        They need to be inside the rotating mesh OR I need to rotate the group they are in.
                        Since CyberGlobe has internal useFrame rotation, I should probably hoist that rotation 
                        to a parent group containing both globe and pins.
                    */}
                    <RotatingGroup visualData={visualData} hoveredId={hoveredId} setHoveredId={setHoveredId} />
                </group>
            </Float>
            
        </Canvas>

        {/* 2D HUD Overlays */}
        <div className="absolute top-8 left-8 z-20 pointer-events-none select-none">
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Market Activity Map</h2>
                        <div className="flex items-center gap-2 text-xs text-indigo-300">
                             <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            LIVE DATA FEED
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </motion.div>
  );
};

// Helper: Group that handles the rotation for everything attached to the planet
const RotatingGroup = ({ visualData, hoveredId, setHoveredId }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001; // Independent slow drift
        }
    });

    return (
        <group ref={groupRef}>
             {/* Render Pins here so they stick to planet */}
             {visualData.map((comp: any) => (
                <Beacon 
                    key={comp.id} 
                    data={comp} 
                    isHovered={hoveredId === comp.id}
                    onHover={setHoveredId}
                />
            ))}
        </group>
    )
}

export default ThreeHero;

