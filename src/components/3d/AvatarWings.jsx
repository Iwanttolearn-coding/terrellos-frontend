import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Wing({ side = 1 }) {
  const wingRef = useRef();

  useFrame((state) => {
    if (!wingRef.current) return;

    // Gentle flapping animation
    wingRef.current.rotation.z = side * Math.sin(state.clock.elapsedTime * 2) * 0.4;
    wingRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });

  return (
    <group ref={wingRef} position={[side * 0.4, 0.2, -0.3]}>
      {/* Main wing feather */}
      <mesh>
        <planeGeometry args={[0.6, 1.2]} />
        <meshPhongMaterial
          color="#d8b4fe"
          emissive="#c084fc"
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0.7}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>

      {/* Wing accent */}
      <mesh position={[0, 0.3, 0.05]}>
        <planeGeometry args={[0.4, 0.9]} />
        <meshPhongMaterial
          color="#a78bfa"
          emissive="#8b5cf6"
          emissiveIntensity={0.6}
          transparent={true}
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Feather particles */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = (i / 5) * 1.2 - 0.6;
        return (
          <mesh key={i} position={[0, y, 0.1]}>
            <boxGeometry args={[0.12, 0.15, 0.02]} />
            <meshPhongMaterial
              color="#e9d5ff"
              emissive="#d8b4fe"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function AvatarWings({ voiceState = 'idle' }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;

    // Listening state: wings extend more
    if (voiceState === 'listening') {
      groupRef.current.scale.z = 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    } else {
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1.0, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <Wing side={1} />
      <Wing side={-1} />
    </group>
  );
}