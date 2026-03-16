"use client";

import { Suspense, useMemo, useRef, useCallback, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { Color, Vector2, SRGBColorSpace } from "three";
import { DitherEffect } from "@/lib/shaders/dither-effect";

const NORMAL_SCALE = new Vector2(0.6, 0.6);
const WHITE = new Color("#ffffff");
const BASE_SPEED = 1;
const MAX_SPEED = 4;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}
function getReducedMotionServer() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
}

function Dither() {
  const effect = useMemo(
    () => new DitherEffect({ gridSize: 4, pixelSizeRatio: 1, grayscaleOnly: true, color: "#555555" }),
    []
  );
  return <primitive object={effect} />;
}

// Simple spring: tracks a value toward a target with velocity and damping
function useSpring(target: number, stiffness = 180, damping = 12) {
  const value = useRef(target);
  const velocity = useRef(0);
  useFrame((_, delta) => {
    // Clamp delta to avoid spring explosion on tab-switch
    const dt = Math.min(delta, 0.05);
    const force = stiffness * (target - value.current);
    velocity.current += force * dt;
    velocity.current *= Math.exp(-damping * dt);
    value.current += velocity.current * dt;
  });
  return value;
}

function ConcreteOrb({ pressed }: { pressed: boolean }) {
  const [diffuseMap, normalMap, roughnessMap] = useTexture([
    "/textures/concrete-diffuse.jpg",
    "/textures/concrete-normal.jpg",
    "/textures/concrete-roughness.jpg",
  ]);

  diffuseMap.colorSpace = SRGBColorSpace;

  const meshRef = useRef<THREE.Mesh>(null);
  const scale = useSpring(pressed ? 0.88 : 1, 200, 10);

  useFrame(() => {
    if (!meshRef.current) return;
    const s = scale.current;
    meshRef.current.scale.set(s, s, s);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        map={diffuseMap}
        normalMap={normalMap}
        normalScale={NORMAL_SCALE}
        roughnessMap={roughnessMap}
        roughness={0.95}
        metalness={0.0}
        clearcoat={0.15}
        clearcoatRoughness={0.5}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

function RotationController({
  controlsRef,
  mouseVelocity,
}: {
  controlsRef: React.RefObject<{ autoRotateSpeed: number } | null>;
  mouseVelocity: React.RefObject<number>;
}) {
  const currentSpeed = useRef(BASE_SPEED);
  useFrame(() => {
    if (!controlsRef.current) return;
    const target = BASE_SPEED + mouseVelocity.current * (MAX_SPEED - BASE_SPEED);
    // Smooth interpolation toward target speed
    currentSpeed.current += (target - currentSpeed.current) * 0.08;
    controlsRef.current.autoRotateSpeed = currentSpeed.current;
  });
  return null;
}

export function HeroOrbGlass() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const mouseVelocity = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const decayTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pressed, setPressed] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      lastPos.current = { x, y };
      mouseVelocity.current = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 15);
      clearTimeout(decayTimer.current);
      decayTimer.current = setTimeout(() => {
        mouseVelocity.current = 0;
      }, 100);
    },
    []
  );

  const handlePointerLeave = useCallback(() => {
    mouseVelocity.current = 0;
    setPressed(false);
  }, []);

  return (
    <Canvas
      gl={{ alpha: false, antialias: false }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      scene={{ background: WHITE }}
      onPointerMove={prefersReducedMotion ? undefined : handlePointerMove}
      onPointerDown={prefersReducedMotion ? undefined : () => setPressed(true)}
      onPointerUp={prefersReducedMotion ? undefined : () => setPressed(false)}
      onPointerLeave={prefersReducedMotion ? undefined : handlePointerLeave}
      aria-hidden="true"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-3, -1, 2]} intensity={0.3} />
      <Suspense fallback={null}>
        <ConcreteOrb pressed={prefersReducedMotion ? false : pressed} />
        <Environment files="/textures/page-env.jpg" />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        autoRotate={!prefersReducedMotion}
        autoRotateSpeed={1}
      />
      {!prefersReducedMotion && (
        <RotationController controlsRef={controlsRef} mouseVelocity={mouseVelocity} />
      )}
      <EffectComposer multisampling={0}>
        <Dither />
      </EffectComposer>
    </Canvas>
  );
}
