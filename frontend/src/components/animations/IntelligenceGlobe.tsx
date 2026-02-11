
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

export function IntelligenceGlobe() {
  const meshRef = useRef<any>();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#00f0ff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#0066ff" />
      
      {/* Main Core */}
      <Sphere args={[2, 64, 64]} ref={meshRef}>
        <MeshDistortMaterial
          color="#001845"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
          emissive="#000810"
          emissiveIntensity={0.5}
          wireframe={true}
        />
      </Sphere>

      {/* Outer Glow Shield */}
      <Sphere args={[2.2, 32, 32]}>
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.05}
          wireframe
        />
      </Sphere>
    </group>
  );
}
