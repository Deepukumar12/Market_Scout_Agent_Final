
import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Html, Ring } from '@react-three/drei';
import * as THREE from 'three';

// --- Types & Interfaces ---

export interface CompetitorPinProps {
  position: [number, number, number];
  color?: string;
  label?: string;
}

// --- Components ---

export const IntelligenceGlobe = forwardRef<THREE.Group>((props, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
        // Distorted outer shell rotation
        meshRef.current.rotation.y = t * 0.1;
    }
    if (coreRef.current) {
        // Core steady rotation
        coreRef.current.rotation.y = t * 0.05; 
    }
  });

  return (
    <group ref={ref as any} {...props}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#00f0ff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#0066ff" />
      
      {/* Liquid Metal Core */}
      <Sphere ref={meshRef} args={[2.2, 64, 64]}>
        <MeshDistortMaterial
          color="#001845"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.1}
          metalness={0.9} // Very metallic
          emissive="#000810"
          emissiveIntensity={0.5}
          wireframe={false}
        />
      </Sphere>

      {/* Tech Grid Overlay */}
      <Sphere ref={coreRef} args={[2.25, 32, 32]}>
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.1}
          wireframe
        />
      </Sphere>
      
      {/* Inner Glow */}
      <Sphere args={[2, 32, 32]}>
         <meshBasicMaterial color="#000" />
      </Sphere>
    </group>
  );
});

export function RiskAura() {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z += 0.002;
            ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group ref={ref} rotation={[Math.PI / 2, 0, 0]}>
             {/* Large faint hazard rings */}
            <Ring args={[3.0, 3.5, 64]} renderOrder={-1}>
                <meshBasicMaterial color="#ef4444" transparent opacity={0.05} side={THREE.DoubleSide} />
            </Ring>
            <Ring args={[3.8, 3.82, 64]} renderOrder={-1}>
                <meshBasicMaterial color="#ef4444" transparent opacity={0.1} side={THREE.DoubleSide} />
            </Ring>
        </group>
    )
}

export function CompetitorPin({ position, color = "#00f0ff", label }: CompetitorPinProps) {
    return (
        <group position={position}>
            <mesh>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.8]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            {label && (
                <Html position={[0, 0.9, 0]} center distanceFactor={10}>
                    <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded border border-white/20 whitespace-nowrap backdrop-blur-md">
                        {label}
                    </div>
                </Html>
            )}
        </group>
    )
}

export function SignalParticle() {
    // A small floating particle
    const ref = useRef<THREE.Mesh>(null);
    const initialPos = useMemo(() => [
        (Math.random() - 0.5) * 8, 
        (Math.random() - 0.5) * 8, 
        (Math.random() - 0.5) * 8
    ], []);
    
    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y += Math.sin(state.clock.elapsedTime + initialPos[0]) * 0.002;
        }
    });

    return (
        <mesh position={initialPos as any} ref={ref}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
    )
}

// Manager component to render multiple pins
export function CompetitorPins() {
    // Simulation of active pins on the globe surface
    const pins = useMemo(() => {
        const _pins = [];
        for(let i=0; i<8; i++) {
             // Random point on sphere (approx radius 2.2)
             const phi = Math.acos( -1 + ( 2 * Math.random() ) );
             const theta = Math.sqrt( 8 * Math.PI ) * phi;
             const r = 2.3;
             
             _pins.push({
                pos: [
                    r * Math.cos(theta) * Math.sin(phi),
                    r * Math.sin(theta) * Math.sin(phi),
                    r * Math.cos(phi)
                ] as [number, number, number],
                id: i,
                label: `Signal ${i+1}`
             })
        }
        return _pins;
    }, []);

    return (
        <group>
            {pins.map(p => (
                <CompetitorPin key={p.id} position={p.pos} label={p.label} />
            ))}
        </group>
    )
}
