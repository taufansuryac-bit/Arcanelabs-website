"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface PhysicsNode {
  curr: Vector3;
  prev: Vector3;
  base: Vector3;
  proj: { x: number; y: number; scale: number; alpha: number };
  pinned: boolean;
  excitation: number;
}

interface StructuralConstraint {
  p1: number;
  p2: number;
  length: number;
}

export interface KineticFabricProps {
  className?: string;
  backgroundColor?: string;
  strokeColor?: string;
}

export function KineticFabric({
  className,
  backgroundColor = "#232428",
  strokeColor = "255, 255, 255",
}: KineticFabricProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const linksRef = useRef<StructuralConstraint[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const activeRef = useRef(true);
  const pointerRef = useRef({
    x: -2000,
    y: -2000,
    prevX: -2000,
    prevY: -2000,
    vx: 0,
    vy: 0,
    targetAngleX: 0.15,
    targetAngleY: 0,
    angleX: 0.15,
    angleY: 0,
    radius: 185,
    isDown: false,
    shockwaves: [] as Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      strength: number;
    }>,
  });

  const buildMesh = useCallback(() => {
    const { width, height } = dimensionsRef.current;
    if (!width || !height) return;

    const spacing = width < 720 ? 46 : 40;
    const cols = Math.ceil((width * 1.18) / spacing) + 1;
    const rows = Math.ceil((height * 1.18) / spacing) + 1;
    const nodes: PhysicsNode[] = [];
    const links: StructuralConstraint[] = [];
    const grid: number[][] = [];
    const startX = -(cols * spacing) / 2;
    const startY = -(rows * spacing) / 2;

    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      grid[row] = [];
      for (let col = 0; col < cols; col += 1) {
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        const pinned = col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
        nodes.push({
          curr: { x, y, z: 0 },
          prev: { x, y, z: 0 },
          base: { x, y, z: 0 },
          proj: { x: 0, y: 0, scale: 1, alpha: 1 },
          pinned,
          excitation: 0,
        });
        grid[row]![col] = index;
        index += 1;
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const current = grid[row]![col]!;
        if (col < cols - 1) {
          links.push({ p1: current, p2: grid[row]![col + 1]!, length: spacing });
        }
        if (row < rows - 1) {
          links.push({ p1: current, p2: grid[row + 1]![col]!, length: spacing });
        }
        if (col < cols - 1 && row < rows - 1) {
          links.push({
            p1: current,
            p2: grid[row + 1]![col + 1]!,
            length: Math.SQRT2 * spacing,
          });
        }
      }
    }

    nodesRef.current = nodes;
    linksRef.current = links;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const rect = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      dimensionsRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildMesh();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [buildMesh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = Boolean(entry?.isIntersecting);
      },
      { rootMargin: "160px 0px" },
    );
    observer.observe(container);

    const onVisibility = () => {
      if (document.hidden) activeRef.current = false;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let time = 0;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!activeRef.current) return;

      const { width, height } = dimensionsRef.current;
      if (!width || !height) return;
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const pointer = pointerRef.current;
      time += 0.016;

      pointer.vx = (pointer.x - pointer.prevX) * 0.4;
      pointer.vy = (pointer.y - pointer.prevY) * 0.4;
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      const pointerSpeed = Math.min(Math.hypot(pointer.vx, pointer.vy), 36);

      pointer.angleX += (pointer.targetAngleX - pointer.angleX) * 0.045;
      pointer.angleY += (pointer.targetAngleY - pointer.angleY) * 0.045;
      const cosX = Math.cos(pointer.angleX);
      const sinX = Math.sin(pointer.angleX);
      const cosY = Math.cos(pointer.angleY);
      const sinY = Math.sin(pointer.angleY);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      for (let i = pointer.shockwaves.length - 1; i >= 0; i -= 1) {
        const wave = pointer.shockwaves[i]!;
        wave.radius += 10;
        wave.strength *= 0.935;
        if (wave.radius > wave.maxRadius || wave.strength < 0.01) {
          pointer.shockwaves.splice(i, 1);
        }
      }

      for (const node of nodes) {
        if (node.pinned) continue;
        const vx = (node.curr.x - node.prev.x) * 0.955;
        const vy = (node.curr.y - node.prev.y) * 0.955;
        const vz = (node.curr.z - node.prev.z) * 0.955;
        node.prev.x = node.curr.x;
        node.prev.y = node.curr.y;
        node.prev.z = node.curr.z;
        node.curr.x += vx;
        node.curr.y += vy;
        node.curr.z += vz;

        const fluidZ =
          Math.sin(node.base.x * 0.009 + time) * 13 +
          Math.cos(node.base.y * 0.011 + time * 1.15) * 9;
        node.curr.x += (node.base.x - node.curr.x) * 0.038;
        node.curr.y += (node.base.y - node.curr.y) * 0.038;
        node.curr.z += (node.base.z + fluidZ - node.curr.z) * 0.038;
        node.excitation *= 0.91;
      }

      const fov = 620;
      const centerX = width / 2;
      const centerY = height / 2;
      for (const node of nodes) {
        const rx1 = node.curr.x * cosY + node.curr.z * sinY;
        const ry1 = node.curr.y;
        const rz1 = -node.curr.x * sinY + node.curr.z * cosY;
        const rx2 = rx1;
        const ry2 = ry1 * cosX - rz1 * sinX;
        const rz2 = ry1 * sinX + rz1 * cosX + 470;
        const scale = fov / Math.max(1, rz2);
        node.proj.x = centerX + rx2 * scale;
        node.proj.y = centerY + ry2 * scale;
        node.proj.scale = scale;
        node.proj.alpha = Math.min(1, Math.max(0.08, (scale - 0.45) * 1.35));

        if (node.pinned) continue;
        const dx = node.proj.x - pointer.x;
        const dy = node.proj.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < pointer.radius && distance > 0) {
          const ratio = 1 - distance / pointer.radius;
          const force = ratio * (pointer.isDown ? 34 : 16) + pointerSpeed * 0.28;
          const angle = Math.atan2(dy, dx);
          node.curr.x += (Math.cos(angle) * force * 0.65) / node.proj.scale;
          node.curr.y += (Math.sin(angle) * force * 0.65) / node.proj.scale;
          node.curr.z -= (force * 2.2) / node.proj.scale;
          node.excitation = Math.max(node.excitation, ratio);
        }

        for (const wave of pointer.shockwaves) {
          const waveDistance = Math.hypot(node.proj.x - wave.x, node.proj.y - wave.y);
          const ringDelta = Math.abs(waveDistance - wave.radius);
          if (ringDelta < 38) {
            const impulse = (1 - ringDelta / 38) * wave.strength * 22;
            node.curr.z += impulse / node.proj.scale;
            node.excitation = Math.max(node.excitation, 0.75);
          }
        }
      }

      for (let pass = 0; pass < 2; pass += 1) {
        for (const link of links) {
          const a = nodes[link.p1]!;
          const b = nodes[link.p2]!;
          const dx = b.curr.x - a.curr.x;
          const dy = b.curr.y - a.curr.y;
          const dz = b.curr.z - a.curr.z;
          const distance = Math.hypot(dx, dy, dz) || 1;
          const diff = (distance - link.length) / distance;
          if (!a.pinned) {
            a.curr.x += dx * 0.5 * diff;
            a.curr.y += dy * 0.5 * diff;
            a.curr.z += dz * 0.5 * diff;
          }
          if (!b.pinned) {
            b.curr.x -= dx * 0.5 * diff;
            b.curr.y -= dy * 0.5 * diff;
            b.curr.z -= dz * 0.5 * diff;
          }
        }
      }

      for (const link of links) {
        const a = nodes[link.p1]!;
        const b = nodes[link.p2]!;
        const avgScale = (a.proj.scale + b.proj.scale) / 2;
        const avgAlpha = (a.proj.alpha + b.proj.alpha) / 2;
        const glow = Math.max(a.excitation, b.excitation);
        ctx.strokeStyle = `rgba(${strokeColor}, ${Math.min(0.42, 0.07 * avgAlpha + glow * 0.24)})`;
        ctx.lineWidth = (0.6 + glow * 0.7) * avgScale;
        ctx.beginPath();
        ctx.moveTo(a.proj.x, a.proj.y);
        ctx.lineTo(b.proj.x, b.proj.y);
        ctx.stroke();
      }

      for (const node of nodes) {
        if (node.excitation < 0.2) continue;
        const radius = Math.min(2.2, 0.9 + node.excitation * 1.6) * node.proj.scale;
        ctx.fillStyle = `rgba(${strokeColor}, ${0.45 + node.excitation * 0.35})`;
        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [backgroundColor, strokeColor]);

  const updatePointer = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    pointerRef.current.x = x;
    pointerRef.current.y = y;
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;
    pointerRef.current.targetAngleY = normX * 0.22;
    pointerRef.current.targetAngleX = -normY * 0.16 + 0.15;
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      onPointerMove={(event) => updatePointer(event.clientX, event.clientY)}
      onPointerDown={(event) => {
        updatePointer(event.clientX, event.clientY);
        pointerRef.current.isDown = true;
        const { width, height } = dimensionsRef.current;
        pointerRef.current.shockwaves.push({
          x: pointerRef.current.x,
          y: pointerRef.current.y,
          radius: 10,
          maxRadius: Math.max(width, height) * 0.55,
          strength: 1,
        });
      }}
      onPointerUp={() => {
        pointerRef.current.isDown = false;
      }}
      onPointerLeave={() => {
        pointerRef.current.x = -2000;
        pointerRef.current.y = -2000;
        pointerRef.current.isDown = false;
        pointerRef.current.targetAngleX = 0.15;
        pointerRef.current.targetAngleY = 0;
      }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

export default KineticFabric;
