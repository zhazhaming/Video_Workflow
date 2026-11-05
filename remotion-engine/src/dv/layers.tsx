// 视觉层：氛围粒子 / 胶片颗粒 / 暗角 / 进度条。全部确定性动画（禁止 Math.random）。
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { AtmosphereSpec } from "./types";
import { rand } from "./atmosphere";

const W = 1080;
const H = 1920;

// ---------- 氛围粒子层 ----------

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
}

function makeParticles(kind: string, count: number, seedBase: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = seedBase + i * 3.7;
    out.push({
      x: rand(s) * W,
      y: rand(s + 1) * H,
      size: 1 + rand(s + 2) * (kind === "rain" ? 1.5 : 3.5),
      speed: 0.4 + rand(s + 3) * 1.6,
      drift: (rand(s + 4) - 0.5) * 2,
      phase: rand(s + 5) * Math.PI * 2,
      alpha: 0.25 + rand(s + 6) * 0.6,
    });
  }
  return out;
}

const PALETTE: Record<string, string> = {
  stars: "#ffffff",
  rain: "#aac4e8",
  dust: "#e8d9b8",
  embers: "#ffb347",
};

export const DVAtmosphere: React.FC<{ spec?: AtmosphereSpec | null; frame: number }> = ({
  spec,
  frame,
}) => {
  const kind = spec?.kind && spec.kind !== "none" ? spec.kind : "";
  const opacity = spec?.opacity ?? 0.6;
  const color = PALETTE[kind] ?? "#ffffff";
  const particles = useMemo(() => {
    if (!kind) return [];
    const n = kind === "rain" ? 150 : kind === "stars" ? 120 : 90;
    return makeParticles(kind, n, 17);
  }, [kind]);

  if (!kind || particles.length === 0) return null;

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {particles.map((p, i) => {
          if (kind === "stars") {
            const tw = 0.55 + 0.45 * Math.sin(frame * 0.08 * p.speed + p.phase);
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y * 0.85}
                r={p.size * 0.9}
                fill={color}
                opacity={p.alpha * tw}
              />
            );
          }
          if (kind === "rain") {
            const y = (p.y + frame * (9 + p.speed * 7)) % (H + 120);
            return (
              <line
                key={i}
                x1={p.x}
                y1={y}
                x2={p.x + p.drift * 6}
                y2={y + 26 + p.speed * 10}
                stroke={color}
                strokeWidth={p.size * 0.7}
                opacity={p.alpha * 0.5}
              />
            );
          }
          if (kind === "embers") {
            const y = (p.y - frame * (1.5 + p.speed * 2.2)) % (H + 80);
            const flick = 0.5 + 0.5 * Math.sin(frame * 0.15 + p.phase);
            return (
              <circle
                key={i}
                cx={p.x + Math.sin(frame * 0.02 * p.speed + p.phase) * 30}
                cy={y < 0 ? y + H + 80 : y}
                r={p.size}
                fill={color}
                opacity={p.alpha * flick * 0.85}
              />
            );
          }
          // dust：缓慢漂移
          const x = (p.x + frame * p.drift * 0.35) % W;
          const y = (p.y + frame * 0.18 * p.speed) % H;
          return (
            <circle
              key={i}
              cx={x < 0 ? x + W : x}
              cy={y}
              r={p.size + 1.2}
              fill={color}
              opacity={p.alpha * 0.4}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- 胶片颗粒（噪声大图平铺 + 每帧位移）----------

const GRAIN_TILE = 256;

export const DVGrain: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  if (opacity <= 0) return null;
  const dx = (frame * 37) % GRAIN_TILE;
  const dy = (frame * 61) % GRAIN_TILE;
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width={W} height={H}>
        <defs>
          <filter id="grainNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={2}
              seed={7}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <g filter="url(#grainNoise)">
          <rect
            x={-GRAIN_TILE + dx}
            y={-GRAIN_TILE + dy}
            width={W + GRAIN_TILE * 2}
            height={H + GRAIN_TILE * 2}
            fill="white"
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------- 暗角 ----------

export const DVVignette: React.FC<{ strength: number }> = ({ strength }) => {
  if (strength <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse ${W * 0.82}px ${H * 0.62}px at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,${Math.min(0.75, 0.45 * strength)}) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};

// ---------- 底部进度条 ----------

export const DVProgress: React.FC<{ progress: number; color: string }> = ({
  progress,
  color,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      bottom: 0,
      height: 6,
      width: `${Math.min(100, Math.max(0, progress * 100))}%`,
      background: color,
      boxShadow: `0 0 12px ${color}`,
      zIndex: 60,
    }}
  />
);

// ---------- 片尾淡出 ----------

export const DVFadeOut: React.FC<{ frames: number; color: string }> = ({ frames, color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const left = durationInFrames - frame;
  if (left >= frames) return null;
  const opacity = Math.min(1, (frames - left) / frames);
  return <AbsoluteFill style={{ background: color, opacity, zIndex: 55 }} />;
};
