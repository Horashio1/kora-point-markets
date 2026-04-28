import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ───────────────────────── USER CONFIGURATION ───────────────────────── */
// Tweak these values to control the exact placement, angle, and size of the lines
export const SCENE_CONFIG = {
  // Horizontal offset (- is left, + is right)
  offsetX: -6,
  // Vertical offset (- is down, + is up)
  offsetY: 3,
  // Depth offset (- is away from camera, + is closer)
  offsetZ: 3,

  // Rotation angles in radians (Math.PI = 180 degrees)
  // 0 keeps it going straight left-to-right across the screen
  rotationZ: 0,
  rotationX: 0,
  rotationY: 0,

  // Overall size of the lines
  scale: 0.7,
};
/* ────────────────────────────────────────────────────────────────────── */

/* ───────────────────────── helpers ───────────────────────── */

function smoothNoise(t: number, seed: number): number {
  const s = seed * 1000;
  return (
    Math.sin(t * 0.7 + s) * 0.4 +
    Math.sin(t * 1.3 + s * 1.7) * 0.3 +
    Math.sin(t * 2.1 + s * 0.3) * 0.2 +
    Math.sin(t * 0.3 + s * 2.1) * 0.1
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothStep(edge0: number, edge1: number, x: number) {
  const clamped = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return clamped * clamped * (3 - 2 * clamped);
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/* ── Drifting parameter ── */
interface DriftParam {
  current: number;
  target: number;
  speed: number;
  min: number;
  max: number;
  changeInterval: number;
  nextChange: number;
}

function createDrift(min: number, max: number, speed: number, interval: number): DriftParam {
  const v = randRange(min, max);
  return {
    current: v,
    target: v,
    speed,
    min,
    max,
    changeInterval: interval,
    nextChange: randRange(interval * 0.5, interval * 1.5),
  };
}

function updateDrift(d: DriftParam, dt: number, elapsed: number): number {
  if (elapsed >= d.nextChange) {
    d.target = randRange(d.min, d.max);
    d.nextChange = elapsed + randRange(d.changeInterval * 0.6, d.changeInterval * 1.4);
  }
  d.current = lerp(d.current, d.target, Math.min(1, d.speed * dt));
  return d.current;
}

/* ───────────────── 3D Line Curve ───────────────── */

const LINE_SEGMENTS = 120;
const LINE_EXTENT_X = 24;
const LINE_EXTENT_Z = 10;
const SHARED_SEED = 123;

interface AnimatedLineProps {
  color: string;
  divergenceSeed: number;
  yOffset: number;
  opacity?: number;
  sharedState: React.MutableRefObject<{ t: number; momentum: number }>;
}

function AnimatedLine({ color, divergenceSeed, yOffset, opacity = 0.85, sharedState }: AnimatedLineProps) {
  const lineRef = useRef<THREE.Line>(null);

  const { geom, mat } = useMemo(() => {
    const positions = new Float32Array((LINE_SEGMENTS + 1) * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const m = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      linewidth: 1,
    });
    return { geom: g, mat: m };
  }, [color, opacity]);

  useFrame(() => {
    if (!lineRef.current) return;
    const { t, momentum } = sharedState.current;

    const posAttr = lineRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i <= LINE_SEGMENTS; i++) {
      const frac = i / LINE_SEGMENTS;
      // Base flowing shape
      const baseWave = smoothNoise(frac * 4 + t, SHARED_SEED) * 1.5;

      // Calculate divergence (how far this line branches from the base)
      // Multiplied by a slow oscillating factor so they converge/diverge dynamically
      const divergenceOscillator = (Math.sin(t * 0.2 + divergenceSeed) + 1) * 0.5; // 0 to 1
      const divergenceOffset = smoothNoise(frac * 6 + t * 1.2, divergenceSeed) * 2.0 * divergenceOscillator;

      let y = baseWave + divergenceOffset + yOffset;
      const frontBias = smoothStep(0.5, 1, frac);
      const rollingLift = Math.sin(t * 0.5 + divergenceSeed * 0.3 + frac * 5) * 0.45;
      const localVariation = smoothNoise(frac * 8 + t * 0.9, divergenceSeed * 2) * 0.2;
      y += momentum * frontBias + rollingLift * frontBias + localVariation;

      arr[i * 3] = (frac - 0.5) * LINE_EXTENT_X;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = (frac - 0.5) * LINE_EXTENT_Z;
    }
    posAttr.needsUpdate = true;
  });

  return <primitive ref={lineRef} object={new THREE.Line(geom, mat)} />;
}

/* ── Glowing line (two overlapping lines) ── */
function GlowLine({ color, divergenceSeed, yOffset, sharedState }: Omit<AnimatedLineProps, 'opacity'>) {
  return (
    <group>
      <AnimatedLine color={color} divergenceSeed={divergenceSeed} yOffset={yOffset} opacity={0.9} sharedState={sharedState} />
      <AnimatedLine color={color} divergenceSeed={divergenceSeed} yOffset={yOffset} opacity={0.25} sharedState={sharedState} />
    </group>
  );
}

/* ───────────── Floor grid ───────────── */
function FloorGrid() {
  const grid = useMemo(() => new THREE.GridHelper(25, 35, new THREE.Color('#1a1040'), new THREE.Color('#120d30')), []);
  // Moved the grid down so it's not cutting through the view too high
  return <primitive object={grid} position={[0, -4, 0]} />;
}

/* ───────────── Dynamic camera rig ───────────── */
function CameraRig({ sharedState }: { sharedState: React.MutableRefObject<{ t: number }> }) {
  const { camera } = useThree();
  const elapsedRef = useRef(0);

  // Allow the camera back a little further to see the whole offset scene
  const drifts = useRef({
    camX: createDrift(-3, 3, 0.05, randRange(10, 22)),
    camY: createDrift(3.5, 6.5, 0.04, randRange(12, 25)),
    camZ: createDrift(8, 14, 0.05, randRange(10, 20)),
    lookX: createDrift(-1, 1, 0.06, randRange(8, 16)),
    lookY: createDrift(2, 4.5, 0.06, randRange(8, 16)),
    lookZ: createDrift(-2, 1, 0.06, randRange(8, 16)),
    fov: createDrift(45, 60, 0.03, randRange(15, 30)),
  });

  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const el = elapsedRef.current;
    const d = drifts.current;

    const cx = updateDrift(d.camX, delta, el);
    const cy = updateDrift(d.camY, delta, el);
    const cz = updateDrift(d.camZ, delta, el);
    const lx = updateDrift(d.lookX, delta, el);
    const ly = updateDrift(d.lookY, delta, el);
    const lz = updateDrift(d.lookZ, delta, el);
    const fov = updateDrift(d.fov, delta, el);

    camera.position.set(cx, cy, cz);
    lookTarget.set(lx, ly, lz);
    camera.lookAt(lookTarget);

    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null;
}

/* ───────────── Dynamic lighting ───────────── */
function DynamicLighting({ sharedState }: { sharedState: React.MutableRefObject<{ t: number }> }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);

  const drifts = useRef({
    l1x: createDrift(-6, 6, 0.08, randRange(8, 16)),
    l1y: createDrift(3, 7, 0.08, randRange(10, 18)),
    l1z: createDrift(-4, 4, 0.08, randRange(8, 16)),
    l1int: createDrift(0.6, 2.0, 0.06, randRange(12, 22)),
    l2x: createDrift(-6, 6, 0.08, randRange(8, 16)),
    l2y: createDrift(2, 6, 0.08, randRange(10, 18)),
    l2z: createDrift(-4, 4, 0.08, randRange(8, 16)),
    l2int: createDrift(0.4, 1.8, 0.06, randRange(12, 22)),
    hue: createDrift(0.6, 0.85, 0.02, randRange(15, 30)),
  });

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const el = elapsedRef.current;
    const d = drifts.current;

    if (light1.current) {
      light1.current.position.set(
        updateDrift(d.l1x, delta, el),
        updateDrift(d.l1y, delta, el),
        updateDrift(d.l1z, delta, el)
      );
      light1.current.intensity = updateDrift(d.l1int, delta, el);
    }
    if (light2.current) {
      light2.current.position.set(
        updateDrift(d.l2x, delta, el),
        updateDrift(d.l2y, delta, el),
        updateDrift(d.l2z, delta, el)
      );
      light2.current.intensity = updateDrift(d.l2int, delta, el);
      const hue = updateDrift(d.hue, delta, el);
      light2.current.color.setHSL(hue, 0.8, 0.6);
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#2a1050" />
      <pointLight ref={light1} color="#9557db" intensity={2.0} distance={25} decay={2} />
      <pointLight ref={light2} color="#3f9efd" intensity={1.5} distance={25} decay={2} />
    </>
  );
}

/* ───────────── Central Time Controller ───────────── */
function TimeController({ sharedState }: { sharedState: React.MutableRefObject<{ t: number; momentum: number }> }) {
  const drifts = useRef({
    timeSpeed: createDrift(0.05, 0.4, 0.02, randRange(8, 16)),
    momentum: createDrift(-0.8, 0.8, 0.04, randRange(10, 18)),
  });
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const d = drifts.current;

    const currentSpeed = updateDrift(d.timeSpeed, delta, elapsedRef.current);
    sharedState.current.t += delta * currentSpeed;
    sharedState.current.momentum = lerp(
      sharedState.current.momentum,
      updateDrift(d.momentum, delta, elapsedRef.current),
      delta * 1.5
    );
  });

  return null;
}

/* ───────────── Scene composer ───────────── */
function Scene() {
  const sharedState = useRef({ t: 0, momentum: 0 });

  return (
    <>
      <TimeController sharedState={sharedState} />
      <CameraRig sharedState={sharedState} />
      <DynamicLighting sharedState={sharedState} />
      <FloorGrid />

      {/* Wrap Lines to apply user configuration */}
      <group
        position={[SCENE_CONFIG.offsetX, SCENE_CONFIG.offsetY, SCENE_CONFIG.offsetZ]}
        rotation={[SCENE_CONFIG.rotationX, SCENE_CONFIG.rotationY, SCENE_CONFIG.rotationZ]}
        scale={SCENE_CONFIG.scale}
      >
        {/* Purple Line - Diverges from base differently */}
        <GlowLine color="#9557db" divergenceSeed={88} yOffset={2.5} sharedState={sharedState} />

        {/* Blue Line - Diverges from base differently */}
        <GlowLine color="#3f9efd" divergenceSeed={42} yOffset={2.2} sharedState={sharedState} />
      </group>

      {/* Fog for depth styling */}
      <fog attach="fog" args={['#0a0618', 4, 18]} />
    </>
  );
}

/* ───────────── Exported component ───────────── */

export function LineGraphBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80 z-0 mask-gradient">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
