import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type ParticleDimensionSceneProps = {
  progress: MotionValue<number>;
  className?: string;
};

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uForwardTravel;
  uniform float uExitProgress;
  uniform vec3 uMouse;
  uniform float uHoverStrength;
  uniform float uMouseRadius;
  uniform float uMouseForce;
  uniform float uParticleSize;
  uniform float uNoiseSpeed;
  uniform float uNoiseAmplitude;

  attribute vec3 aColor;
  attribute float aRandom;
  attribute vec3 aTarget;

  varying vec3 vColor;
  varying vec3 vMvPos;
  varying float vLocalZ;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(
      permute(
        permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
        i.y + vec4(0.0, i1.y, i2.y, 1.0)
      ) + i.x + vec4(0.0, i1.x, i2.x, 1.0)
    );
    vec3 ns = 0.142857142857 * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(
      vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
    );
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(
      0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)),
      0.0
    );
    m *= m;
    return 42.0 * dot(
      m * m,
      vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))
    );
  }

  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    vec3 p_x0 = vec3(snoise(p - dx), snoise(p - dx + 13.5), snoise(p - dx + 31.2));
    vec3 p_x1 = vec3(snoise(p + dx), snoise(p + dx + 13.5), snoise(p + dx + 31.2));
    vec3 p_y0 = vec3(snoise(p - dy), snoise(p - dy + 13.5), snoise(p - dy + 31.2));
    vec3 p_y1 = vec3(snoise(p + dy), snoise(p + dy + 13.5), snoise(p + dy + 31.2));
    vec3 p_z0 = vec3(snoise(p - dz), snoise(p - dz + 13.5), snoise(p - dz + 31.2));
    vec3 p_z1 = vec3(snoise(p + dz), snoise(p + dz + 13.5), snoise(p + dz + 31.2));
    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
    return normalize(vec3(x, y, z));
  }

  void main() {
    vColor = aColor;

    float morphEase = smoothstep(0.08, 0.28, uProgress);
    vec3 tunnelTarget = aTarget;
    const float tunnelSpan = 174.0;
    tunnelTarget.z = mod(
      tunnelTarget.z + uForwardTravel * 216.0 + 170.0,
      tunnelSpan
    ) - 170.0;

    vec3 pos = mix(position, tunnelTarget, morphEase);

    float transitionFlow = sin(morphEase * 3.14159265);
    vec3 transitionNoise = curlNoise(pos * 0.72 + aRandom * 7.0 + uTime * 0.26);
    pos += transitionNoise * transitionFlow * 0.24;

    float tunnelLife = smoothstep(0.2, 0.52, uProgress);
    vec3 idleNoise = curlNoise(pos * 0.24 + uTime * uNoiseSpeed + aRandom * 10.0);
    pos += idleNoise * uNoiseAmplitude * mix(0.2, 1.0, tunnelLife);

    pos.xy *= 1.0 + uExitProgress * 0.16;
    pos.z += uExitProgress * 10.0;

    vec3 dirToMouse = pos - uMouse;
    float distToMouse = length(dirToMouse);
    float influence = smoothstep(uMouseRadius, uMouseRadius * 0.12, distToMouse) * uHoverStrength;
    influence = pow(influence, 1.35);
    if (influence > 0.0) {
      vec3 normDir = normalize(dirToMouse);
      vec3 vortex = cross(normDir, vec3(0.0, 0.0, 1.0));
      vec3 sandCurl = curlNoise(pos * 0.42 - uTime * 0.9 + aRandom * 4.0);
      pos += (normDir * 0.22 + vortex * 0.44 + sandCurl * 0.72) * influence * uMouseForce;
    }

    vLocalZ = pos.z;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vMvPos = mvPosition.xyz;

    float depthSize = clamp(11.0 / max(2.0, -mvPosition.z), 0.38, 2.6);
    float tunnelSize = mix(1.18, 0.92, morphEase);
    gl_PointSize = uParticleSize * depthSize * tunnelSize * (1.0 + uExitProgress * 0.2);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uLightColor;
  uniform vec3 uShadowColor;
  uniform vec3 uLightDir;
  uniform float uExitProgress;

  varying vec3 vColor;
  varying vec3 vMvPos;
  varying float vLocalZ;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float sphereZ = sqrt(max(0.0, 0.25 - dist * dist));
    vec3 microNormal = normalize(vec3(coord.x, -coord.y, sphereZ));
    vec3 viewDir = normalize(-vMvPos);
    vec3 lightDir = normalize(uLightDir);
    float diff = max(dot(microNormal, lightDir), 0.0);
    float rim = pow(1.0 - max(dot(microNormal, viewDir), 0.0), 2.4);
    float depthTone = smoothstep(-170.0, 4.0, vLocalZ);

    vec3 diffuse = uLightColor * (0.28 + diff * 0.72);
    vec3 ambient = mix(uShadowColor, uLightColor, 0.18 + depthTone * 0.18);
    vec3 finalColor = vColor * (ambient + diffuse * 0.72) + rim * uLightColor * 0.22;

    float edge = smoothstep(0.5, 0.36, dist);
    float exitFade = 1.0 - smoothstep(0.48, 1.0, uExitProgress);
    gl_FragColor = vec4(finalColor, edge * exitFade);
  }
`;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep01(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export function ParticleDimensionScene({ progress, className }: ParticleDimensionSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(progress.get());
  const dark = useDarkMode();

  useEffect(() => {
    progressRef.current = progress.get();
    return progress.on("change", (value) => {
      progressRef.current = value;
    });
  }, [progress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let scene: THREE.Scene | null = null;
    let points: THREE.Points | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let raf = 0;
    let inViewport = true;
    let documentVisible = document.visibilityState !== "hidden";
    let lastFrame = performance.now();
    let hoverStrength = 0;
    let cameraX = 0;
    let cameraY = 0;
    let lookX = 0;
    let lookY = 0;

    const pointer = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector3(999, 999, 0);
    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const lookTarget = new THREE.Vector3(0, 0, -38);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const highColor = new THREE.Color(dark ? "#f4f4f5" : "#111418");
    const lowColor = new THREE.Color(dark ? "#7f8992" : "#3d464e");
    const lightColor = new THREE.Color(dark ? "#ffffff" : "#dfe5e7");
    const shadowColor = new THREE.Color(dark ? "#111319" : "#080b0d");

    const isRunning = () => inViewport && documentVisible;

    const schedule = (callback: FrameRequestCallback) => {
      cancelAnimationFrame(raf);
      if (isRunning()) raf = requestAnimationFrame(callback);
    };

    const buildLogoMask = (image: HTMLImageElement) => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return [] as Array<[number, number]>;

      context.clearRect(0, 0, size, size);
      const inset = 34;
      context.drawImage(image, inset, inset, size - inset * 2, size - inset * 2);
      const pixels = context.getImageData(0, 0, size, size).data;
      const result: Array<[number, number]> = [];

      for (let y = 0; y < size; y += 2) {
        for (let x = 0; x < size; x += 2) {
          const alpha = pixels[(y * size + x) * 4 + 3] ?? 0;
          if (alpha < 90) continue;
          result.push([(x / size) * 2 - 1, -(y / size) * 2 + 1]);
        }
      }

      return result;
    };

    const buildParticles = (image: HTMLImageElement) => {
      if (!scene || !renderer) return;
      const logoPoints = buildLogoMask(image);
      if (logoPoints.length === 0) return;

      const mobile = container.clientWidth < 768;
      const particleCap = mobile ? 62_000 : 105_000;
      const targetTotal = Math.min(
        particleCap,
        Math.max(42_000, Math.floor(logoPoints.length * (mobile ? 2.2 : 3.4))),
      );

      const positions = new Float32Array(targetTotal * 3);
      const targets = new Float32Array(targetTotal * 3);
      const colors = new Float32Array(targetTotal * 3);
      const randoms = new Float32Array(targetTotal);
      const worldScale = mobile ? 4.35 : 5.25;
      const tau = Math.PI * 2;
      const mixed = new THREE.Color();

      for (let index = 0; index < targetTotal; index += 1) {
        const baseIndex = index * 3;
        const point = logoPoints[Math.floor(seeded(index * 7.31 + 2.7) * logoPoints.length)];
        if (!point) continue;

        const randomA = seeded(index * 3.17 + 1.1);
        const randomB = seeded(index * 5.31 + 7.2);
        const randomC = seeded(index * 9.73 + 13.4);
        const randomD = seeded(index * 11.91 + 23.7);
        const angle = randomA * tau;
        const radius = 2.4 + Math.pow(randomB, 0.62) * (mobile ? 14.5 : 19.5);
        const squash = 0.68 + randomC * 0.2;
        const bevelAngle = randomD * tau;
        const bevelRadius = Math.pow(seeded(index * 17.13 + 5.2), 1.8) * 0.07;

        positions[baseIndex] = point[0] * worldScale + Math.cos(bevelAngle) * bevelRadius;
        positions[baseIndex + 1] = point[1] * worldScale + Math.sin(bevelAngle) * bevelRadius;
        positions[baseIndex + 2] = (seeded(index * 19.7 + 2.8) - 0.5) * 0.42;

        targets[baseIndex] = Math.cos(angle) * radius;
        targets[baseIndex + 1] = Math.sin(angle) * radius * squash;
        targets[baseIndex + 2] = -170 + seeded(index * 12.77 + 73.2) * 174;

        mixed.lerpColors(lowColor, highColor, 0.2 + randomC * 0.8);
        colors[baseIndex] = mixed.r;
        colors[baseIndex + 1] = mixed.g;
        colors[baseIndex + 2] = mixed.b;
        randoms[index] = randomD;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
      geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
      geometry.setDrawRange(0, targetTotal);
      geometry.computeBoundingSphere();

      const uniforms: Record<string, THREE.IUniform> = {
        uTime: { value: 0 },
        uProgress: { value: progressRef.current },
        uForwardTravel: { value: 0 },
        uExitProgress: { value: 0 },
        uMouse: { value: mouseWorld.clone() },
        uHoverStrength: { value: 0 },
        uMouseRadius: { value: mobile ? 1.7 : 2.1 },
        uMouseForce: { value: mobile ? 0.55 : 0.72 },
        uParticleSize: { value: (mobile ? 2.25 : 2.55) * renderer.getPixelRatio() },
        uNoiseSpeed: { value: reducedMotion ? 0 : 0.11 },
        uNoiseAmplitude: { value: reducedMotion ? 0 : mobile ? 0.12 : 0.16 },
        uLightColor: { value: lightColor },
        uShadowColor: { value: shadowColor },
        uLightDir: { value: new THREE.Vector3(0.72, 0.8, 1).normalize() },
      };

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
      });

      points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
    };

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        48,
        container.clientWidth / Math.max(1, container.clientHeight),
        0.1,
        420,
      );
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, -38);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
    };

    const animate = (now: number) => {
      if (!renderer || !camera || !scene) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      const p = clamp01(progressRef.current);
      const exitProgress = smoothstep01((p - 0.84) / 0.16);
      const forwardTravel = p * 0.86 + exitProgress * 0.72;

      if (material) {
        const uniforms = material.uniforms;
        uniforms["uTime"]!.value = (uniforms["uTime"]!.value as number) + delta;
        uniforms["uProgress"]!.value = p;
        uniforms["uForwardTravel"]!.value = forwardTravel;
        uniforms["uExitProgress"]!.value = exitProgress;

        const hoverTarget = pointer.lengthSq() > 0.0001 ? 1 : 0;
        hoverStrength += (hoverTarget - hoverStrength) * (1 - Math.exp(-delta * 7.5));
        uniforms["uHoverStrength"]!.value = hoverStrength;
        (uniforms["uMouse"]!.value as THREE.Vector3).lerp(mouseWorld, 1 - Math.exp(-delta * 8));
      }

      const pointerMagnitude = Math.min(1, pointer.length());
      const idleWeight = 1 - pointerMagnitude;
      const cameraResponse = 1 - Math.exp(-delta * 6.8);
      const targetX = pointer.x * 1.7;
      const targetY = pointer.y * 0.95;
      cameraX += (targetX - cameraX) * cameraResponse;
      cameraY += (targetY - cameraY) * cameraResponse;
      lookX += (pointer.x * 4.2 - lookX) * cameraResponse;
      lookY += (pointer.y * 2.5 - lookY) * cameraResponse;

      const time = now / 1000;
      camera.position.set(
        cameraX + Math.sin(time * 0.16) * 0.15 * idleWeight,
        cameraY + Math.cos(time * 0.13) * 0.09 * idleWeight,
        10,
      );
      lookTarget.set(
        lookX + Math.sin(time * 0.11) * 0.22 * idleWeight,
        lookY + Math.cos(time * 0.1) * 0.12 * idleWeight,
        -38 - exitProgress * 12,
      );
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
      if (isRunning()) raf = requestAnimationFrame(animate);
    };

    const updatePointer = (event: PointerEvent) => {
      if (!camera) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.ray.intersectPlane(interactionPlane, mouseWorld);
      if (!hit) mouseWorld.set(999, 999, 0);
    };

    const clearPointer = () => {
      pointer.set(0, 0);
      mouseWorld.set(999, 999, 0);
    };

    const handleVisibility = () => {
      documentVisible = document.visibilityState !== "hidden";
      if (isRunning()) {
        lastFrame = performance.now();
        schedule(animate);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    init();

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      buildParticles(image);
      lastFrame = performance.now();
      schedule(animate);
    };
    image.src = "/arcane-logo-black.svg";

    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !camera) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height);
      if (material?.uniforms["uParticleSize"]) {
        material.uniforms["uParticleSize"].value =
          (width < 768 ? 2.25 : 2.55) * renderer.getPixelRatio();
      }
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      inViewport = entry ? entry.isIntersecting : true;
      if (isRunning()) {
        lastFrame = performance.now();
        schedule(animate);
      } else {
        cancelAnimationFrame(raf);
      }
    }, { rootMargin: "220px 0px" });
    intersectionObserver.observe(container);

    document.addEventListener("visibilitychange", handleVisibility);
    container.addEventListener("pointermove", updatePointer);
    container.addEventListener("pointerenter", updatePointer);
    container.addEventListener("pointerleave", clearPointer);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      container.removeEventListener("pointermove", updatePointer);
      container.removeEventListener("pointerenter", updatePointer);
      container.removeEventListener("pointerleave", clearPointer);
      image.onload = null;

      if (points) {
        points.geometry.dispose();
        material?.dispose();
        scene?.remove(points);
      }
      scene?.clear();

      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      }
    };
  }, [dark]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        minWidth: 100,
        minHeight: 100,
        backgroundColor: "transparent",
        overflow: "hidden",
        touchAction: "none",
      }}
    />
  );
}
