import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type ParticleDimensionSceneProps = {
  progress: MotionValue<number>;
  className?: string;
};

const CORE_FRAGMENT_SHARE = 0.78;
const DEBRIS_SHARE = 0.22;
const LOGO_DEPTH = 1.7;
const FOREGROUND_FRAGMENT_SHARE = 0.18;
const DESKTOP_ELEMENT_BUDGET = 9000;
const MOBILE_ELEMENT_BUDGET = 4200;

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
    let coreMesh: THREE.InstancedMesh | null = null;
    let coreGeometry: THREE.BoxGeometry | null = null;
    let coreMaterial: THREE.MeshStandardMaterial | null = null;
    let debrisPoints: THREE.Points | null = null;
    let debrisGeometry: THREE.BufferGeometry | null = null;
    let debrisMaterial: THREE.PointsMaterial | null = null;

    let coreLogo = new Float32Array(0);
    let coreTunnel = new Float32Array(0);
    let coreScale = new Float32Array(0);
    let corePhase = new Float32Array(0);
    let coreSpin = new Float32Array(0);
    let coreCount = 0;

    let debrisLogo = new Float32Array(0);
    let debrisTunnel = new Float32Array(0);
    let debrisPhase = new Float32Array(0);
    let debrisCount = 0;

    let raf = 0;
    let inViewport = true;
    let documentVisible = document.visibilityState !== "hidden";
    let lastFrame = performance.now();
    let cameraX = 0;
    let cameraY = 0;
    let lookX = 0;
    let lookY = 0;
    let pointerPresence = 0;

    const pointer = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector3(999, 999, 0);
    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const lookTarget = new THREE.Vector3(0, 0, -34);
    const dummy = new THREE.Object3D();
    const instanceColor = new THREE.Color();
    const lowCoreColor = new THREE.Color(dark ? "#aeb5bd" : "#15191e");
    const highCoreColor = new THREE.Color(dark ? "#f4f4f5" : "#252a30");
    const coreBaseColor = dark ? "#f4f4f5" : "#252a30";
    const debrisColor = dark ? "#79838e" : "#5a626b";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

      for (let y = 0; y < size; y += 3) {
        for (let x = 0; x < size; x += 3) {
          const alpha = pixels[(y * size + x) * 4 + 3] ?? 0;
          if (alpha < 100) continue;
          result.push([(x / size) * 2 - 1, -(y / size) * 2 + 1]);
        }
      }

      return result;
    };

    const buildHybridField = (image: HTMLImageElement) => {
      if (!scene || !renderer) return;
      const logoPoints = buildLogoMask(image);
      if (logoPoints.length === 0) return;

      const mobile = container.clientWidth < 768;
      const elementBudget = mobile ? MOBILE_ELEMENT_BUDGET : DESKTOP_ELEMENT_BUDGET;
      coreCount = Math.min(
        logoPoints.length,
        Math.max(2200, Math.floor(elementBudget * CORE_FRAGMENT_SHARE)),
      );
      debrisCount = Math.max(700, Math.floor(elementBudget * DEBRIS_SHARE));

      coreLogo = new Float32Array(coreCount * 3);
      coreTunnel = new Float32Array(coreCount * 3);
      coreScale = new Float32Array(coreCount);
      corePhase = new Float32Array(coreCount);
      coreSpin = new Float32Array(coreCount * 3);

      debrisLogo = new Float32Array(debrisCount * 3);
      debrisTunnel = new Float32Array(debrisCount * 3);
      debrisPhase = new Float32Array(debrisCount);

      const worldScale = mobile ? 4.65 : 5.35;
      const tau = Math.PI * 2;
      const nearCameraZ = 5.4;
      const tunnelSpan = mobile ? 108 : 132;

      coreGeometry = new THREE.BoxGeometry(1, 1, 1);
      coreMaterial = new THREE.MeshStandardMaterial({
        color: coreBaseColor,
        roughness: dark ? 0.4 : 0.52,
        metalness: dark ? 0.38 : 0.2,
        transparent: true,
        opacity: 1,
      });
      coreMesh = new THREE.InstancedMesh(coreGeometry, coreMaterial, coreCount);
      coreMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      coreMesh.frustumCulled = false;
      coreMesh.castShadow = false;
      coreMesh.receiveShadow = false;

      for (let index = 0; index < coreCount; index += 1) {
        const sourcePosition = Math.floor((index / coreCount) * logoPoints.length);
        const jitter = Math.floor((seeded(index * 2.71 + 5.2) - 0.5) * 11);
        const point = logoPoints[
          Math.max(0, Math.min(logoPoints.length - 1, sourcePosition + jitter))
        ];
        if (!point) continue;

        const base = index * 3;
        const a = seeded(index * 3.17 + 1.1);
        const b = seeded(index * 5.31 + 7.2);
        const c = seeded(index * 9.73 + 13.4);
        const d = seeded(index * 11.91 + 23.7);
        const angle = a * tau;
        const foreground = b < FOREGROUND_FRAGMENT_SHARE;
        const radius = foreground
          ? 2.2 + Math.pow(c, 0.6) * (mobile ? 7.5 : 10.5)
          : 3.2 + Math.pow(c, 0.58) * (mobile ? 13.5 : 18.5);
        const squash = 0.7 + d * 0.18;

        coreLogo[base] = point[0] * worldScale + (a - 0.5) * 0.035;
        coreLogo[base + 1] = point[1] * worldScale + (b - 0.5) * 0.035;
        coreLogo[base + 2] = (c - 0.5) * LOGO_DEPTH;

        coreTunnel[base] = Math.cos(angle) * radius;
        coreTunnel[base + 1] = Math.sin(angle) * radius * squash;
        coreTunnel[base + 2] = foreground
          ? nearCameraZ - d * (mobile ? 13 : 17)
          : -tunnelSpan + d * (tunnelSpan - 8);

        coreScale[index] = mobile ? 0.105 + c * 0.105 : 0.12 + c * 0.14;
        corePhase[index] = d * tau;
        coreSpin[base] = (a - 0.5) * 1.4;
        coreSpin[base + 1] = (b - 0.5) * 1.8;
        coreSpin[base + 2] = (c - 0.5) * 1.2;

        instanceColor.lerpColors(lowCoreColor, highCoreColor, 0.32 + c * 0.68);
        coreMesh.setColorAt(index, instanceColor);
      }
      if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
      scene.add(coreMesh);

      const debrisPositions = new Float32Array(debrisCount * 3);
      for (let index = 0; index < debrisCount; index += 1) {
        const base = index * 3;
        const point = logoPoints[Math.floor(seeded(index * 13.7 + 4.8) * logoPoints.length)];
        if (!point) continue;

        const a = seeded(index * 4.1 + 1.3);
        const b = seeded(index * 6.7 + 9.4);
        const c = seeded(index * 8.9 + 17.2);
        const angle = a * tau;
        const radius = 3.4 + Math.pow(b, 0.55) * (mobile ? 14 : 20);

        debrisLogo[base] = point[0] * worldScale + (a - 0.5) * 0.1;
        debrisLogo[base + 1] = point[1] * worldScale + (b - 0.5) * 0.1;
        debrisLogo[base + 2] = (c - 0.5) * (LOGO_DEPTH * 1.25);

        debrisTunnel[base] = Math.cos(angle) * radius;
        debrisTunnel[base + 1] = Math.sin(angle) * radius * (0.72 + c * 0.18);
        debrisTunnel[base + 2] = -tunnelSpan + c * (tunnelSpan - 6);
        debrisPhase[index] = seeded(index * 12.3 + 31.7) * tau;

        debrisPositions[base] = debrisLogo[base];
        debrisPositions[base + 1] = debrisLogo[base + 1];
        debrisPositions[base + 2] = debrisLogo[base + 2];
      }

      debrisGeometry = new THREE.BufferGeometry();
      debrisGeometry.setAttribute("position", new THREE.BufferAttribute(debrisPositions, 3));
      debrisMaterial = new THREE.PointsMaterial({
        color: debrisColor,
        size: mobile ? 0.028 : 0.034,
        sizeAttenuation: true,
        transparent: true,
        opacity: dark ? 0.48 : 0.34,
        depthWrite: false,
        depthTest: true,
      });
      debrisPoints = new THREE.Points(debrisGeometry, debrisMaterial);
      debrisPoints.frustumCulled = false;
      scene.add(debrisPoints);
    };

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        47,
        container.clientWidth / Math.max(1, container.clientHeight),
        0.1,
        360,
      );
      camera.position.set(0, 0, 12.5);
      camera.lookAt(0, 0, -34);

      const ambient = new THREE.HemisphereLight(
        dark ? 0xf6f7f8 : 0xffffff,
        dark ? 0x0c1015 : 0xb8c0c8,
        dark ? 1.2 : 1.55,
      );
      const key = new THREE.DirectionalLight(dark ? 0xffffff : 0xeef3f5, dark ? 3.4 : 2.8);
      key.position.set(7, 10, 11);
      const rim = new THREE.DirectionalLight(dark ? 0xaebed3 : 0x9ca8b4, dark ? 2.1 : 1.4);
      rim.position.set(-8, -4, 7);
      scene.add(ambient, key, rim);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = dark ? 1.02 : 0.92;
      container.appendChild(renderer.domElement);
    };

    const animate = (now: number) => {
      if (!renderer || !camera || !scene) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      const p = clamp01(progressRef.current);
      const morph = smoothstep01((p - 0.055) / 0.13);
      const exitProgress = smoothstep01((p - 0.84) / 0.16);
      const forwardTravel = p * 0.92 + exitProgress * 0.9;
      const time = now / 1000;
      const mobile = container.clientWidth < 768;
      const tunnelSpan = mobile ? 108 : 132;
      const travelDistance = forwardTravel * (mobile ? 90 : 116);
      const interactionRadius = mobile ? 1.8 : 2.65;
      const pointerTarget = pointer.lengthSq() > 0.0001 ? 1 : 0;
      pointerPresence +=
        (pointerTarget - pointerPresence) * (1 - Math.exp(-delta * 7.5));

      if (coreMesh && coreMaterial) {
        for (let index = 0; index < coreCount; index += 1) {
          const base = index * 3;
          let tunnelZ = coreTunnel[base + 2] + travelDistance;
          while (tunnelZ > 6.4) tunnelZ -= tunnelSpan;

          const flow = reducedMotion ? 0 : Math.sin(time * 0.82 + corePhase[index]) * 0.11;
          let x = THREE.MathUtils.lerp(coreLogo[base], coreTunnel[base], morph);
          let y = THREE.MathUtils.lerp(coreLogo[base + 1], coreTunnel[base + 1], morph);
          let z = THREE.MathUtils.lerp(coreLogo[base + 2], tunnelZ, morph);

          x += flow * morph;
          y += Math.cos(time * 0.69 + corePhase[index] * 1.17) * 0.08 * morph;
          z += Math.sin(time * 0.53 + corePhase[index] * 0.71) * 0.14 * morph;

          const dx = x - mouseWorld.x;
          const dy = y - mouseWorld.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (pointerPresence > 0.01 && distance < interactionRadius) {
            const influence = Math.pow(1 - distance / interactionRadius, 1.7) * pointerPresence;
            const inverse = distance > 0.001 ? 1 / distance : 0;
            const nx = dx * inverse;
            const ny = dy * inverse;
            x += (nx * 0.34 - ny * 0.5) * influence;
            y += (ny * 0.34 + nx * 0.5) * influence;
            z += influence * 0.34;
          }

          x *= 1 + exitProgress * 0.13;
          y *= 1 + exitProgress * 0.13;
          z += exitProgress * 5.5;

          const nearBoost = 1 + Math.max(0, (z + 10) / 18) * 0.48 * morph;
          const scale = coreScale[index] * nearBoost;
          dummy.position.set(x, y, z);
          dummy.rotation.set(
            coreSpin[base] * morph + time * 0.09 * morph,
            coreSpin[base + 1] * morph + time * 0.11 * morph,
            coreSpin[base + 2] * morph + time * 0.07 * morph,
          );
          dummy.scale.set(scale * 1.08, scale * 0.9, scale * 1.22);
          dummy.updateMatrix();
          coreMesh.setMatrixAt(index, dummy.matrix);
        }
        coreMesh.instanceMatrix.needsUpdate = true;
        coreMaterial.opacity = 1 - smoothstep01((p - 0.9) / 0.1);
      }

      if (debrisGeometry && debrisMaterial) {
        const attribute = debrisGeometry.getAttribute("position") as THREE.BufferAttribute;
        const positions = attribute.array as Float32Array;
        for (let index = 0; index < debrisCount; index += 1) {
          const base = index * 3;
          let tunnelZ = debrisTunnel[base + 2] + travelDistance * 1.05;
          while (tunnelZ > 6.2) tunnelZ -= tunnelSpan;

          const drift = reducedMotion ? 0 : Math.sin(time * 0.95 + debrisPhase[index]) * 0.08;
          positions[base] = THREE.MathUtils.lerp(debrisLogo[base], debrisTunnel[base], morph) + drift * morph;
          positions[base + 1] =
            THREE.MathUtils.lerp(debrisLogo[base + 1], debrisTunnel[base + 1], morph) +
            Math.cos(time * 0.77 + debrisPhase[index]) * 0.055 * morph;
          positions[base + 2] =
            THREE.MathUtils.lerp(debrisLogo[base + 2], tunnelZ, morph) + exitProgress * 5.8;
        }
        attribute.needsUpdate = true;
        debrisMaterial.opacity = (dark ? 0.48 : 0.34) * (1 - smoothstep01((p - 0.88) / 0.12));
      }

      const pointerMagnitude = Math.min(1, pointer.length());
      const idleWeight = 1 - pointerMagnitude;
      const cameraResponse = 1 - Math.exp(-delta * 6.6);
      cameraX += (pointer.x * 1.65 - cameraX) * cameraResponse;
      cameraY += (pointer.y * 0.92 - cameraY) * cameraResponse;
      lookX += (pointer.x * 4.0 - lookX) * cameraResponse;
      lookY += (pointer.y * 2.3 - lookY) * cameraResponse;

      const forwardCamera = p * 1.2 + exitProgress * 2.8;
      camera.position.set(
        cameraX + Math.sin(time * 0.16) * 0.14 * idleWeight,
        cameraY + Math.cos(time * 0.13) * 0.08 * idleWeight,
        12.5 - forwardCamera,
      );
      lookTarget.set(
        lookX + Math.sin(time * 0.11) * 0.18 * idleWeight,
        lookY + Math.cos(time * 0.1) * 0.1 * idleWeight,
        -34 - p * 7 - exitProgress * 13,
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
      buildHybridField(image);
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
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inViewport = entry ? entry.isIntersecting : true;
        if (isRunning()) {
          lastFrame = performance.now();
          schedule(animate);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "220px 0px" },
    );
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

      if (coreMesh) scene?.remove(coreMesh);
      if (debrisPoints) scene?.remove(debrisPoints);
      coreGeometry?.dispose();
      coreMaterial?.dispose();
      debrisGeometry?.dispose();
      debrisMaterial?.dispose();
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
