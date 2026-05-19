import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import AvatarCore from './AvatarCore';
import AvatarHalo from './AvatarHalo';
import AvatarWings from './AvatarWings';

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#a78bfa" />
      <ambientLight intensity={0.3} color="#60a5fa" />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#c4b5fd" />
      <pointLight position={[-5, -5, 5]} intensity={0.2} color="#93c5fd" />
      <directionalLight position={[0, 10, 5]} intensity={0.3} color="#fbbf24" />
    </>
  );
}

function CameraController() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.z = 3;
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export default function AvatarScene({ voiceState = 'idle', isSpeaking = false }) {
  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-950/80 border border-purple-500/20">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        dpr={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
        className="w-full h-full"
      >
        <Lighting />
        <CameraController />
        <AvatarCore voiceState={voiceState} isSpeaking={isSpeaking} />
        <AvatarHalo voiceState={voiceState} />
        <AvatarWings voiceState={voiceState} />
      </Canvas>
    </div>
  );
}