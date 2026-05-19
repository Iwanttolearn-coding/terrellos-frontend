import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AvatarHalo({ voiceState = 'idle' }) {
  const groupRef = useRef();
  const haloRef = useRef();

  useFrame((state) => {
    if (!groupRef.current || !haloRef.current) return;

    // Primary rotation
    groupRef.current.rotation.z += 0.003;

    // Listening state: faster wobble
    if (voiceState === 'listening') {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.15;
      groupRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 1.5) * 0.15;
    } else {
      // Idle: gentle drift
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.4) * 0.08;
    }

    // Opacity pulse
    const opacity = voiceState === 'listening' ? 0.8 : 0.5;
    haloRef.current.material.opacity = 
      opacity + Math.sin(state.clock.elapsedTime * 2) * 0.15;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main halo torus */}
      <mesh ref={haloRef} position={[0, 0.3, 0]}>
        <torusGeometry args={[1.2, 0.12, 32, 200]} />
        <meshPhongMaterial
          color="#e9d5ff"
          emissive="#d8b4fe"
          emissiveIntensity={0.7}
          transparent={true}
          opacity={0.6}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary accent halo */}
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[1.4, 0.08, 32, 200]} />
        <meshPhongMaterial
          color="#c4b5fd"
          emissive="#a78bfa"
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0.4}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spiritual particles along halo */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * 1.2;
        const z = Math.sin(angle) * 1.2;
        return (
          <mesh key={i} position={[x, 0.3, z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshPhongMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}