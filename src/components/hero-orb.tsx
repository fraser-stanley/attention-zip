"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { EffectComposer } from "@react-three/postprocessing";
import { Color } from "three";
import { DitherEffect } from "@/lib/shaders/dither-effect";

const WHITE = new Color("#ffffff");

function Dither() {
  const effect = useMemo(
    () => new DitherEffect({ gridSize: 4, pixelSizeRatio: 1, grayscaleOnly: true }),
    []
  );
  return <primitive object={effect} />;
}

function Orb() {
  const normalMap = useTexture("/textures/glass-normal.jpg");

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color="#888"
        normalMap={normalMap}
        roughness={0.25}
        metalness={0.05}
        clearcoat={0.6}
        clearcoatRoughness={0.08}
      />
    </mesh>
  );
}

export function HeroOrb() {
  return (
    <Canvas
      gl={{ alpha: false, antialias: false }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      scene={{ background: WHITE }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-3, -1, 2]} intensity={0.8} />
      <Suspense fallback={null}>
        <Orb />
      </Suspense>
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={1}
      />
      <EffectComposer multisampling={0}>
        <Dither />
      </EffectComposer>
    </Canvas>
  );
}
