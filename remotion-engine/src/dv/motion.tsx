// 运镜与入场转场：包裹层组件，作用于本镜内容的 transform / 首帧动效。
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FPS } from "./timeline";
import { clamp } from "./atmosphere";
import type { RenderShot } from "./types";

// ---------- 运镜 ----------

export const CAMERA_KINDS = [
  "push",
  "pull",
  "pan_left",
  "pan_right",
  "tilt_up",
  "tilt_down",
  "diag_in",
  "diag_out",
  "dolly_zoom",
  "handheld",
  "still",
] as const;

/** 8+ 种运镜在镜内进度 p（0~1）下的 transform。amp 为幅度倍率。 */
export function cameraTransform(camera: string, p: number, amp: number, frame: number) {
  const a = clamp(amp, 0.4, 1.8);
  const e = p * p * (3 - 2 * p); // smoothstep
  switch (camera) {
    case "push":
      return `scale(${1 + 0.11 * e * a})`;
    case "pull":
      return `scale(${1.11 - 0.11 * e * a})`;
    case "pan_left":
      return `scale(${1 + 0.06 * a}) translateX(${e * 34 * a}px)`;
    case "pan_right":
      return `scale(${1 + 0.06 * a}) translateX(${-e * 34 * a}px)`;
    case "tilt_up":
      return `scale(${1 + 0.06 * a}) translateY(${e * 30 * a}px)`;
    case "tilt_down":
      return `scale(${1 + 0.06 * a}) translateY(${-e * 30 * a}px)`;
    case "diag_in":
      return `scale(${1 + 0.1 * e * a}) translate(${e * 26 * a}px, ${-e * 22 * a}px)`;
    case "diag_out":
      return `scale(${1.1 - 0.1 * e * a}) translate(${-e * 22 * a}px, ${e * 20 * a}px)`;
    case "dolly_zoom":
      return `scale(${1 + 0.14 * e * a}) translateY(${e * 8 * a}px)`;
    case "handheld": {
      const w = Math.sin(frame * 0.11) * 5 + Math.sin(frame * 0.23 + 1.3) * 3;
      const h = Math.cos(frame * 0.09) * 4 + Math.sin(frame * 0.19) * 2.4;
      return `scale(${1 + 0.045 * a}) translate(${w * a}px, ${h * a}px)`;
    }
    default:
      return "none";
  }
}

/** 本句（行）生效的运镜名：cameraPerLine 优先，缺省用整镜 camera，再缺省按下标轮换。 */
export function cameraForLine(shot: RenderShot, lineIndex: number, sceneIndex: number): string {
  const per = shot.cameraPerLine;
  if (per && per.length > lineIndex && per[lineIndex]) return per[lineIndex];
  if (shot.camera) return shot.camera;
  const cycle = CAMERA_KINDS;
  return cycle[(sceneIndex * 3 + lineIndex * 2) % (cycle.length - 1)];
}

export const CameraWrap: React.FC<{
  camera: string;
  progress: number; // 镜内 0~1
  intensity: number;
  children: React.ReactNode;
}> = ({ camera, progress, intensity, children }) => {
  const frame = useCurrentFrame();
  const transform = cameraTransform(camera, progress, intensity, frame);
  return <AbsoluteFill style={{ transform, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>;
};

// ---------- 入场转场（前镜重叠帧内的入场动效）----------

export const TransitionIn: React.FC<{
  kind: string;
  frames: number; // 重叠帧数
  children: React.ReactNode;
}> = ({ kind, frames, children }) => {
  const frame = useCurrentFrame();
  const f = clamp(frame / Math.max(1, frames), 0, 1);
  const e = f * f * (3 - 2 * f);

  const base: React.CSSProperties = { transformOrigin: "50% 50%" };
  switch (kind) {
    case "cut":
      return <AbsoluteFill style={base}>{children}</AbsoluteFill>;
    case "dissolve":
      return <AbsoluteFill style={{ ...base, opacity: e }}>{children}</AbsoluteFill>;
    case "whip":
      return (
        <AbsoluteFill
          style={{
            ...base,
            // 强转场必须“实底覆盖”：靠位移/模糊完成，不能半透明叠在上一镜上，
            // 否则旧镜文字会和新镜一起显影（双标题、双坐标轴）。
            opacity: 1,
            transform: `translateX(${(1 - e) * 140}px)`,
            filter: `blur(${(1 - e) * 9}px)`,
          }}
        >
          {children}
        </AbsoluteFill>
      );
    case "zoom":
      return (
        <AbsoluteFill
          style={{
            ...base,
            opacity: 1,
            transform: `scale(${1 + (1 - e) * 0.22})`,
            filter: `blur(${(1 - e) * 5}px)`,
          }}
        >
          {children}
        </AbsoluteFill>
      );
    case "slide":
      return (
        <AbsoluteFill
          style={{
            ...base,
            opacity: 1,
            transform: `translateY(${(1 - e) * 130}px)`,
          }}
        >
          {children}
        </AbsoluteFill>
      );
    case "glitch": {
      const jitter = (1 - f) * 26;
      const jx = frame % 2 === 0 ? jitter : -jitter;
      return (
        <AbsoluteFill style={{ ...base, opacity: 1 }}>
          <AbsoluteFill style={{ transform: `translateX(${jx}px)`, opacity: 0.55, mixBlendMode: "screen" }}>
            {children}
          </AbsoluteFill>
          <AbsoluteFill style={{ transform: `translateX(${-jx}px)`, filter: "hue-rotate(38deg)", opacity: 0.45 }}>
            {children}
          </AbsoluteFill>
        </AbsoluteFill>
      );
    }
    case "flash": {
      // 新镜直接切入 + 首几帧白闪盖在画面上
      const flash = Math.max(0, 1 - frame / Math.max(2, frames * 0.8));
      return (
        <AbsoluteFill style={base}>
          {children}
          {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
        </AbsoluteFill>
      );
    }
    default:
      return <AbsoluteFill style={{ ...base, opacity: e }}>{children}</AbsoluteFill>;
  }
};

// 镜头渐入（首镜从片头下浮现用）
export const fadeIn = (frame: number, frames: number) =>
  clamp(frame / Math.max(1, frames), 0, 1);

export const frameToSec = (f: number) => f / FPS;
