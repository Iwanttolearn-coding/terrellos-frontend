/**
 * AvatarScene.jsx — TerrellOS / TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Core cinematic 3D avatar engine.
 * React Three Fiber + Drei + Postprocessing.
 *
 * Features:
 *  · GLB/GLTF model loading with animation mixer
 *  · Drag-to-rotate orbit camera
 *  · Floating idle animation
 *  · Rotating halo ring (Three.js mesh)
 *  · Wing-flap animation blend
 *  · Orbiting particle sparkles
 *  · Volumetric point lights
 *  · Bloom + ChromaticAberration postprocessing
 *  · HDR-style environment
 *  · GPU-accelerated, 60fps
 *  · Mobile-responsive
 * ─────────────────────────────────────────────────────────────────
 */
import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  Sparkles,
  Environment,
  ContactShadows,
  Float,
  Ring,
  MeshDistortMaterial,
  GradientTexture,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// ── Halo Ring ────────────────────────────────────────────────────
function HaloRing({ color = '#ffd700', radiusX = 0.55, radiusZ = 0.45, y = 1.95 }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
      <torusGeometry args={[0.5, 0.04, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.2}
        roughness={0.1}
        metalness={0.9}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Wing Planes (procedural) ─────────────────────────────────────
function Wings({ style = 'Ethereal Feather', color = '#a855f7' }) {
  const leftRef  = useRef();
  const rightRef = useRef();

  const shapeArgs = useMemo(() => {
    // Different wing profiles per style
    const styles = {
      'Ethereal Feather': [1.2, 0.7],
      'Neon Blade':       [1.0, 0.4],
      'Crystal Drift':    [1.4, 0.5],
      'Obsidian Flow':    [1.1, 0.8],
    };
    return styles[style] || [1.2, 0.7];
  }, [style]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const flap = Math.sin(t * 1.8) * 0.25;
    if (leftRef.current)  leftRef.current.rotation.z  =  0.3 + flap;
    if (rightRef.current) rightRef.current.rotation.z = -0.3 - flap;
  });

  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.6}
      transparent
      opacity={0.75}
      roughness={0.3}
      metalness={0.4}
      side={THREE.DoubleSide}
      toneMapped={false}
    />
  );

  return (
    <group position={[0, 0.8, -0.1]}>
      {/* Left wing */}
      <mesh ref={leftRef} position={[-0.5, 0, 0]} rotation={[0, 0.2, 0.3]}>
        <planeGeometry args={shapeArgs} />
        {mat}
      </mesh>
      {/* Right wing */}
      <mesh ref={rightRef} position={[0.5, 0, 0]} rotation={[0, -0.2, -0.3]}>
        <planeGeometry args={shapeArgs} />
        {mat}
      </mesh>
    </group>
  );
}

// ── Aura Glow Sphere ─────────────────────────────────────────────
function AuraGlow({ color = '#7c3aed' }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.04);
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <sphereGeometry args={[1.1, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.15}
        transparent
        opacity={0.12}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── GLB Avatar Model ─────────────────────────────────────────────
function AvatarModel({ url, animationName }) {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);

  // Play named animation or first available
  useMemo(() => {
    const key = animationName || Object.keys(actions)[0];
    if (key && actions[key]) {
      actions[key].reset().fadeIn(0.4).play();
    }
  }, [actions, animationName]);

  return <primitive object={scene} scale={1.0} position={[0, -1.1, 0]} />;
}

// ── Fallback Procedural Avatar ────────────────────────────────────
function ProceduralAvatar({ glowColor = '#a855f7' }) {
  const bodyRef = useRef();
  const headRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bodyRef.current) bodyRef.current.position.y = Math.sin(t * 0.6) * 0.03;
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
  });

  return (
    <group ref={bodyRef}>
      {/* Torso */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.28, 0.7, 8, 16]} />
        <meshStandardMaterial color="#1a0533" emissive={glowColor} emissiveIntensity={0.08}
          roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Head */}
      <group ref={headRef}>
        <mesh position={[0, 0.88, 0]}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial color="#f5c8a0" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Eyes */}
        {[-0.09, 0.09].map((x, i) => (
          <mesh key={i} position={[x, 0.92, 0.25]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={3}
              toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── Orbiting Light ────────────────────────────────────────────────
function OrbitLight({ color = '#a855f7', radius = 2, speed = 0.5, height = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * radius, height, Math.sin(t) * radius);
    }
  });
  return <pointLight ref={ref} color={color} intensity={4} distance={6} decay={2} />;
}

// ── Ground Portal ─────────────────────────────────────────────────
function GroundPortal({ color = '#7c3aed' }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z += 0.003;
  });
  return (
    <mesh ref={ref} position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.4, 1.3, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.9}
        transparent
        opacity={0.45}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Main Scene ────────────────────────────────────────────────────
function SceneContent({ config }) {
  const {
    glbUrl,
    animationName,
    haloColor,
    wingStyle,
    wingColor,
    glowColor,
    particleColor,
    orbitLightColor,
  } = config;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 6, 3]} intensity={1.2} color="#ffffff" castShadow />
      <OrbitLight color={orbitLightColor || glowColor} radius={2.2} speed={0.45} height={1.2} />
      <OrbitLight color="#60a5fa" radius={2.0} speed={-0.3} height={0.4} />

      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Avatar */}
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
        {glbUrl ? (
          <AvatarModel url={glbUrl} animationName={animationName} />
        ) : (
          <ProceduralAvatar glowColor={glowColor} />
        )}
        <HaloRing color={haloColor} />
        <Wings style={wingStyle} color={wingColor} />
        <AuraGlow color={glowColor} />
      </Float>

      {/* Particles */}
      <Sparkles
        count={120}
        scale={[4, 5, 4]}
        size={1.8}
        speed={0.4}
        color={particleColor || glowColor}
        noise={0.3}
      />

      {/* Ground */}
      <GroundPortal color={glowColor} />
      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.45}
        scale={4}
        blur={2.5}
        far={4}
        color={glowColor}
      />

      {/* Camera */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.72}
        minDistance={2.5}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.06}
      />

      {/* Postprocessing */}
      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={1.6}
          kernelSize={4}
          blendFunction={BlendFunction.SCREEN}
        />
        <ChromaticAberration
          offset={[0.0005, 0.0005]}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

// ── Loading Fallback ──────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
        <span className="text-xs text-purple-300/60 font-mono">Loading Avatar Engine…</span>
      </div>
    </div>
  );
}

// ── Public Component ──────────────────────────────────────────────
/**
 * AvatarScene — drop-in cinematic avatar canvas.
 *
 * Props:
 *   glbUrl?        — URL to a .glb model (optional — uses procedural if absent)
 *   animationName? — GLB animation clip name to play
 *   haloColor?     — hex color for halo ring
 *   wingStyle?     — 'Ethereal Feather' | 'Neon Blade' | 'Crystal Drift' | 'Obsidian Flow'
 *   wingColor?     — hex color for wings
 *   glowColor?     — hex color for aura + ground portal + orbiting light
 *   particleColor? — hex color for sparkles (defaults to glowColor)
 *   className?     — additional CSS classes for outer container
 *   height?        — canvas height in px (default: 480)
 */
export default function AvatarScene({
  glbUrl        = null,
  animationName = null,
  haloColor     = '#ffd700',
  wingStyle     = 'Ethereal Feather',
  wingColor     = '#a855f7',
  glowColor     = '#7c3aed',
  particleColor = null,
  className     = '',
  height        = 480,
}) {
  const config = {
    glbUrl, animationName, haloColor, wingStyle, wingColor, glowColor,
    particleColor: particleColor || glowColor,
    orbitLightColor: glowColor,
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-black ${className}`}
      style={{ height }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 4.2], fov: 42 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
          powerPreference: 'high-performance',
        }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneContent config={config} />
        </Suspense>
      </Canvas>
      <Suspense fallback={<LoadingFallback />}>
        <span style={{ display: 'none' }} />
      </Suspense>
    </div>
  );
}
