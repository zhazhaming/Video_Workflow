// MotionShow 主合成：设计令牌驱动的轻量版式（无片头、句间 0.35s、镜尾 0.6s、最短 2.4s）。
// 时间轴与 backend voice.py mix_motion_track 逐帧对齐（见 dv/timeline.ts）。
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  getInputProps,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { LookSpec, RenderProps, ToolSpec } from "./types";
import { FPS, buildMotionTimeline, TRACK_OVERLAP } from "./timeline";
import type { MotionTimeline } from "./timeline";
import { FONT_STACK, MONO_STACK, clamp, luminance } from "./atmosphere";
import { SAMPLE_MOTIONSHOW } from "./sample";
import { DVGrain, DVProgress, DVVignette, DVFadeOut } from "./layers";
import { TransitionIn } from "./motion";
import { DVSubtitle } from "./Subtitle";

const DEFAULT_ACCENT = "#FFD166";

const ToolCard: React.FC<{ tool: ToolSpec; accent: string; ink: string; paper: boolean }> = ({
  tool,
  accent,
  ink,
  paper,
}) => (
  <div
    style={{
      background: paper ? "rgba(255,255,255,0.72)" : "rgba(12,14,22,0.62)",
      border: `1px solid ${accent}44`,
      borderRadius: 26,
      padding: "34px 44px",
      width: 860,
      fontFamily: FONT_STACK,
      color: ink,
      boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 56, fontWeight: 900 }}>
        {tool.index}. {tool.name}
      </span>
      <span style={{ fontSize: 34, fontWeight: 800, color: accent }}>
        ★ {tool.stars >= 1000 ? `${(tool.stars / 1000).toFixed(1)}k` : tool.stars}
      </span>
    </div>
    <div style={{ fontSize: 30, opacity: 0.65, marginTop: 8, fontFamily: MONO_STACK }}>
      {tool.repo} · {tool.license}
    </div>
    <div style={{ fontSize: 38, marginTop: 20, lineHeight: 1.45, fontWeight: 600 }}>
      {tool.tagline}
    </div>
  </div>
);

const MotionShotView: React.FC<{
  shotIndex: number;
  timeline: MotionTimeline;
  look: LookSpec | null;
  accent: string;
}> = ({ shotIndex, timeline, look, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = timeline.shots[shotIndex];
  const shot = m.shot;
  const progress = clamp(frame / Math.max(1, m.frames), 0, 1);
  const paper = (look?.bg ?? "paper") === "paper" || look?.mode === "light";
  const ink = look?.ink || (paper ? "#1c1c24" : "#f5f5f8");
  const bgLight = luminance(shot.colors[0]) > 0.5;

  // 当前句窗口
  const lineStarts = m.lines.map((l) => Math.round(l.start * fps));
  const activeIndex = (() => {
    for (let i = m.lines.length - 1; i >= 0; i--) {
      if (frame >= lineStarts[i]) return i;
    }
    return -1;
  })();
  const active = activeIndex >= 0 ? m.lines[activeIndex] : null;

  const [c1, c2] = shot.colors;
  const align = shot.align === "center" ? "center" : shot.align === "right" ? "right" : "left";

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        padding: "150px 90px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 44,
      }}
    >
      <TransitionIn
        kind={shot.enterTransition || "dissolve"}
        frames={TRACK_OVERLAP[shot.enterTransition || "dissolve"] ?? 16}
      >
        <AbsoluteFill style={{ padding: "150px 90px" }}>
          {shot.tool ? (
            <ToolCard tool={shot.tool} accent={accent} ink={ink} paper={bgLight} />
          ) : shot.image ? (
            <div style={{ position: "absolute", inset: 0 }}>
              <img
                src={staticFile(shot.image)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${(shot.focal?.[0] ?? 0.5) * 100}% ${(shot.focal?.[1] ?? 0.5) * 100}%`,
                }}
              />
              <AbsoluteFill style={{ background: "rgba(0,0,0,0.22)" }} />
            </div>
          ) : null}

          {shot.year || shot.label ? (
            <div style={{ marginBottom: 10 }}>
              <span
                style={{
                  fontFamily: FONT_STACK,
                  color: accent,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: 6,
                }}
              >
                {[shot.year, shot.label].filter(Boolean).join(" · ")}
              </span>
            </div>
          ) : null}

          <div style={{ marginTop: shot.image || shot.tool ? 0 : "auto", marginBottom: "auto" }}>
            {m.lines.map((l, li) => {
              const shown = frame >= lineStarts[li];
              const appear = interpolate(
                frame,
                [lineStarts[li], lineStarts[li] + 8],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={l.id}
                  style={{
                    fontFamily: FONT_STACK,
                    fontSize: (shot.textStyle === "mono" ? 44 : 64) * (li === activeIndex ? 1 : 0.82),
                    fontWeight: 800,
                    lineHeight: 1.4,
                    color: ink,
                    textAlign: align as "left" | "center" | "right",
                    opacity: shown ? appear * (li === activeIndex ? 1 : 0.5) : 0,
                    transform: `translateY(${shown ? (1 - appear) * 30 : 26}px)`,
                    transition: "none",
                    textShadow: bgLight ? undefined : "0 3px 14px rgba(0,0,0,0.4)",
                  }}
                >
                  {l.text}
                </div>
              );
            })}
          </div>

          {active && look?.subtitleStyle !== "none" ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
              <DVSubtitle line={active} look={look} accent={accent} entering={1} />
            </div>
          ) : null}
        </AbsoluteFill>
      </TransitionIn>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: interpolate(progress, [0, 1], [0, 8]),
            background: `${accent}55`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const MotionShow: React.FC<RenderProps> = () => {
  const raw = getInputProps<RenderProps>();
  const props: RenderProps =
    raw && Array.isArray(raw.shots) && raw.shots.length > 0 ? raw : SAMPLE_MOTIONSHOW;
  const timeline = useMemo(() => buildMotionTimeline(props), [props]);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const look = props.look ?? null;
  const accent = look?.accent || DEFAULT_ACCENT;
  const grainOpacity = clamp(props.grainOpacity ?? 0.04, 0, 0.2);

  return (
    <AbsoluteFill style={{ background: "#101018", fontFamily: FONT_STACK }}>
      {props.narrationAudio ? (
        <Audio
          src={staticFile(props.narrationAudio.src)}
          volume={props.narrationAudio.volume ?? 1}
        />
      ) : (
        timeline.shots.map((m) =>
          m.lines.map((l) =>
            l.audio ? (
              <Sequence
                key={l.id}
                from={m.startFrame + Math.round(l.start * FPS)}
                durationInFrames={Math.ceil(l.dur * FPS) + FPS}
              >
                <Audio src={staticFile(l.audio)} />
              </Sequence>
            ) : null,
          ),
        )
      )}

      {props.bgm ? (
        <Audio
          src={staticFile(props.bgm.src)}
          volume={(f) => {
            const base = clamp(props.bgm?.volume ?? 0.7, 0, 1.4);
            const fi = interpolate(f, [0, fps], [0, 1], { extrapolateRight: "clamp" });
            const fo = interpolate(
              f,
              [durationInFrames - fps * 2, durationInFrames - fps * 0.3],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return base * fi * fo;
          }}
        />
      ) : null}

      {timeline.shots.map((m, i) => (
        <Sequence key={`m-${i}`} from={m.startFrame} durationInFrames={m.frames}>
          <MotionShotView shotIndex={i} timeline={timeline} look={look} accent={accent} />
        </Sequence>
      ))}

      <DVVignette strength={look?.vignette ?? 0.5} />
      <DVGrain opacity={grainOpacity} />
      <DVProgress progress={frame / durationInFrames} color={accent} />
      <DVFadeOut frames={Math.round(fps * 0.5)} color="#101018" />
    </AbsoluteFill>
  );
};
