import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AvatarCore({ voiceState = 'idle', isSpeaking = false }) {
  const groupRef = useRef();
  const sphereRef = useRef();
  const coreRef = useRef();
  
  // State-based scale and glow
  const targetScale = isSpeaking ? 1.3 : voiceState === 'listening' ? 1.15 : 1.0;
  let currentScale = 1.0;

  useFrame((state) => {
    if (!groupRef.current) return;

    // Smooth scale transition
    currentScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    sphereRef.current.scale.set(currentScale, currentScale, currentScale);

    // Gentle bobbing on speaking
    if (isSpeaking) {
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    } else {
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }

    // Core pulse on speaking
    if (coreRef.current) {
      const intensity = isSpeaking ? 0.8 : 0.5;
      coreRef.current.material.emissiveIntensity = 
        0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15 * intensity;
    }

    // Subtle rotation
    groupRef.current.rotation.z += 0.0005;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={sphereRef} position={[0, 0, 0]}>
        {/* Outer glow sphere */}
        <sphereGeometry args={[0.6, 64, 64]} />
        <meshPhongMaterial
          color="#a78bfa"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          wireframe={false}
          transparent={true}
          opacity={0.9}
        />
      </mesh>

      {/* Inner luminous core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color="#e9d5ff"
          emissive="#c084fc"
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Ethereal accent rings */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI * 0.3, 0, 0]}>
        <torusGeometry args={[0.75, 0.08, 16, 100]} />
        <meshPhongMaterial
          color="#c4b5fd"
          emissive="#a78bfa"
          emissiveIntensity={0.4}
          transparent={true}
          opacity={0.6}
          wireframe={false}
        />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[0, Math.PI * 0.5, Math.PI * 0.2]}>
        <torusGeometry args={[0.7, 0.06, 16, 100]} />
        <meshPhongMaterial
          color="#60a5fa"
          emissive="#3b82f6"
          emissiveIntensity={0.3}
          transparent={true}
          opacity={0.5}
          wireframe={false}
        />
      </mesh>
    </group>
  );
}