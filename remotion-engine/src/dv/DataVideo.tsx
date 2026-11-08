// DataVideo 主合成：1080×1920 竖屏口播短视频。
// 时间轴与 backend voice.py mix_line_track 逐帧对齐（见 dv/timeline.ts）。
// 音频优先级：narrationAudio 整轨预混 > 逐句 audio 兜底；两者都无则纯画面。
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
import type { AtmosphereSpec, LookSpec, RenderProps, RenderShot } from "./types";
import { buildDataVideoTimeline, FPS, INTRO_FRAMES, TRACK_OVERLAP } from "./timeline";
import type { Timeline } from "./timeline";
import { FONT_STACK, clamp, rand } from "./atmosphere";
import { SAMPLE_DATAVIDEO } from "./sample";
import { DVAtmosphere, DVGrain, DVProgress, DVVignette, DVFadeOut } from "./layers";
import { CameraWrap, TransitionIn, cameraForLine } from "./motion";
import { DVSubtitle } from "./Subtitle";
import { DVOverlay } from "./Overlays";
import { DVTitleCard } from "./TitleCard";
import { GEN_SCENES } from "../gen/registry";

const DEFAULT_ACCENT = "#FFD166";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 100000);
}

// ---------- 单镜背景：gen 场景 > 图片 > 渐变 ----------

const GenSceneView: React.FC<{
  kind: string;
  shot: RenderShot;
  progress: number;
  accent: string;
  marks: { start: number; dur: number }[];
}> = ({ kind, shot, progress, accent, marks }) => {
  const Comp = GEN_SCENES[kind];
  if (!Comp) return null;
  const palette = shot.scene?.palette ?? shot.colors;
  return (
    <Comp
      p={clamp(progress, 0, 1)}
      c1={palette[0] ?? "#141b3a"}
      c2={palette[1] ?? "#2a3a6a"}
      accent={accent}
      speed={clamp(shot.scene?.speed ?? 1, 0.5, 2)}
      seed={hashStr(kind) % 9973}
      marks={marks}
    />
  );
};

const SceneBackdrop: React.FC<{
  shot: RenderShot;
  progress: number;
  accent: string;
  paper: boolean;
  marks: { start: number; dur: number }[];
}> = ({ shot, progress, accent, paper, marks }) => {
  const scene = shot.scene;
  if (scene?.kind && scene.kind.startsWith("gen:")) {
    return <GenSceneView kind={scene.kind} shot={shot} progress={progress} accent={accent} marks={marks} />;
  }
  const [c1, c2] = shot.colors;
  if (shot.image) {
    const fx = clamp(shot.focal?.[0] ?? 0.5, 0, 1);
    const fy = clamp(shot.focal?.[1] ?? 0.5, 0, 1);
    const drift = (progress - 0.5) * 2.4;
    return (
      <AbsoluteFill>
        <img
          src={staticFile(shot.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${fx * 100}% ${fy * 100}%`,
            transform: `scale(1.08) translateY(${drift}%)`,
          }}
        />
        {/* 轻压暗保证字幕可读 */}
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.18)" }} />
      </AbsoluteFill>
    );
  }
  const a = paper ? "#f4efe6" : c1;
  const b = paper ? "#e7dfcf" : c2;
  const spotSeed = hashStr(shot.lines[0]?.id ?? "s");
  return (
    <AbsoluteFill style={{ background: `linear-gradient(150deg, ${a} 0%, ${b} 100%)` }}>
      {/* 低饱和强调色光斑，避免纯渐变单调 */}
      {[0, 1].map((i) => {
        const x = 16 + rand(spotSeed + i) * 68;
        const y = 14 + rand(spotSeed + i + 5) * 66;
        const pul = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2 + i * 2.4);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 560,
              height: 560,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}${Math.round(18 + pul * 22).toString(16)} 0%, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 单镜 ----------

const SceneView: React.FC<{
  shot: RenderShot;
  sceneIndex: number;
  timeline: Timeline;
  look: LookSpec | null;
  accent: string;
  paper: boolean;
  safe: number;
}> = ({ shot, sceneIndex, timeline, look, accent, paper, safe }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = timeline.scenes[sceneIndex];
  const durFrames = Math.round(scene.dur * fps);
  const progress = clamp(frame / Math.max(1, durFrames), 0, 1);
  const enter = scene.enter;
  const overlapFrames = TRACK_OVERLAP[enter] ?? 16;

  // 每句字幕的时间窗（镜内相对帧）：出现到下一句开始（末句到句尾+留白）
  const lineWindows = scene.lines.map((l, li) => {
    const startF = Math.round(l.start * fps);
    const next = scene.lines[li + 1];
    const endF = next
      ? Math.round(next.start * fps)
      : Math.round((l.start + l.dur + 0.25) * fps);
    return { line: l, startF, endF };
  });
  const activeIndex = lineWindows.findIndex((w) => frame >= w.startF && frame < w.endF);
  const activeLine = activeIndex >= 0 ? lineWindows[activeIndex] : null;

  // 逐句“呼吸”：每句开头 8 帧一次 0.8% 的推近，随后缓出回位。
  // 它不替换运镜，只是让 8s 长镜里每 2~3s 有一点画面事件（P1）。
  const lineT = activeLine ? clamp((frame - activeLine.startF) / 9, 0, 1) : 1;
  const lineEase = lineT * lineT * (3 - 2 * lineT);
  const linePulse = 1 + 0.008 * (1 - lineEase);

  // 逐句时间窗（归一化到本镜），交给 gen 场景做“事件驻留”的数据游标。
  const marks = scene.lines.map((l) => ({
    start: l.start / Math.max(0.001, scene.dur),
    dur: l.dur / Math.max(0.001, scene.dur),
  }));

  const grade = shot.grade;
  const filter = [
    grade?.contrast != null ? `contrast(${grade.contrast})` : "contrast(1.06)",
    grade?.saturate != null ? `saturate(${grade.saturate})` : "saturate(1.05)",
    grade?.brightness != null ? `brightness(${grade.brightness})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const tintOpacity = grade?.tintOpacity ?? 0.14;

  const camera = cameraForLine(shot, activeIndex >= 0 ? activeIndex : 0, sceneIndex);
  const intensity = shot.camIntensity ?? 1;
  const atmo: AtmosphereSpec | null = shot.atmosphere ?? look?.atmosphere ?? null;

  return (
    // 安全画幅：整镜（含背景/字幕/标签）缩到中央，被平台全屏裁掉的正好是纸色边框。
    // 外层铺同色系渐变，缩放后四边不会露出突兀底色。
    <AbsoluteFill
      style={{
        filter,
        background: `linear-gradient(158deg, ${shot.colors[0]} 0%, ${shot.colors[1]} 100%)`,
      }}
    >
      {/* 边框区域也吃一层同参数调色罩，避免安全画幅出现明暗接缝 */}
      <AbsoluteFill
        style={{
          background: shot.colors[1],
          mixBlendMode: "soft-light",
          opacity: tintOpacity,
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${safe})`, transformOrigin: "50% 50%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${linePulse})`,
          transformOrigin: "50% 50%",
        }}
      >
        <TransitionIn kind={enter} frames={overlapFrames}>
          {/* 实底放在 TransitionIn 内部：dissolve 时跟着淡入（能看见上一镜），
              slide/zoom/whip 时不透明（盖住上一镜，避免双标题重影）。 */}
          <AbsoluteFill style={{ background: shot.colors[0] }} />
          <CameraWrap camera={camera} progress={progress} intensity={intensity}>
            <SceneBackdrop shot={shot} progress={progress} accent={accent} paper={paper} marks={marks} />
          </CameraWrap>
          {/* 调色罩 */}
          <AbsoluteFill
            style={{
              background: shot.colors[1],
              mixBlendMode: "soft-light",
              opacity: tintOpacity,
            }}
          />
        </TransitionIn>
      </div>

      <DVAtmosphere spec={atmo} frame={frame} />

      {shot.overlay && <DVOverlay spec={shot.overlay} accent={accent} />}

      {/* 镜头标签（year / label）：图片镜头也显示——ComfyUI 插画无水印，label 有米白小板保证可读 */}
      {(shot.year || shot.label) && (
        <div
          style={{
            position: "absolute",
            top: 170,
            left: 72,
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 30,
            opacity: interpolate(frame, [4, 16], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {shot.year ? (
            <span
              style={{
                background: accent,
                color: "#14141c",
                fontWeight: 900,
                fontSize: 34,
                borderRadius: 10,
                padding: "6px 18px",
              }}
            >
              {shot.year}
            </span>
          ) : null}
          {shot.label ? (
            <span
              style={{
                color: paper ? "rgba(20,17,15,0.9)" : "rgba(255,255,255,0.92)",
                fontWeight: 700,
                fontSize: 34,
                textShadow: paper ? "0 2px 10px rgba(244,241,232,0.9)" : "0 2px 10px rgba(0,0,0,0.6)",
                // 图片镜头：标签下垫米白小板（插画顶部常是深色区域，墨字会被吃掉）
                ...(paper && shot.image
                  ? {
                      background: "rgba(244,239,230,0.9)",
                      borderRadius: 10,
                      padding: "5px 16px",
                      border: "1px solid rgba(27,24,21,0.14)",
                      boxShadow: "0 6px 18px rgba(27,24,21,0.2)",
                      textShadow: "none",
                    }
                  : {}),
              }}
            >
              {shot.label}
            </span>
          ) : null}
        </div>
      )}

      {/* 当前句字幕 */}
      {activeLine && (
        <DVSubtitle
          key={activeLine.line.id}
          line={activeLine.line}
          look={look}
          accent={accent}
          entering={interpolate(
            frame,
            [activeLine.startF, activeLine.startF + 7],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
          age={frame - activeLine.startF}
          plate={!!shot.image}
        />
      )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Studio 预览样例（无 --props 时）见 dv/sample.ts ----------

// ---------- 主组件 ----------

export const DataVideo: React.FC<RenderProps> = () => {
  const raw = getInputProps<RenderProps>();
  const props: RenderProps =
    raw && Array.isArray(raw.shots) && raw.shots.length > 0 ? raw : SAMPLE_DATAVIDEO;
  const timeline = useMemo(() => buildDataVideoTimeline(props), [props]);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const look = props.look ?? null;
  const paper = look?.bg === "paper" || look?.mode === "light";
  const accent = look?.accent || DEFAULT_ACCENT;
  const sfxOn = props.sfx !== false;
  const grainOpacity = clamp(props.grainOpacity ?? 0.05, 0, 0.28);
  const vignette = look?.vignette ?? 0.8;
  const intro = props.titleCard !== false;
  // 安全画幅（抖音全屏 cover 会裁左右约 13%）：0.6~1，1 = 旧行为。
  const safe = clamp(props.safeScale ?? 1, 0.6, 1);

  return (
    <AbsoluteFill style={{ background: paper ? "#f4efe6" : "#0b0b10", fontFamily: FONT_STACK }}>
      {/* 整轨预混旁白：从 0 开始播放（轨道内部已含 offset 静音头） */}
      {props.narrationAudio ? (
        <Audio
          src={staticFile(props.narrationAudio.src)}
          volume={props.narrationAudio.volume ?? 1}
        />
      ) : (
        /* 逐句兜底：预混失败时按同一时间轴逐句播放 */
        props.shots.map((shot, i) => {
          const scene = timeline.scenes[i];
          return scene.lines.map((l) =>
            l.audio ? (
              <Sequence
                key={l.id}
                from={Math.round((timeline.offset + scene.start + l.start) * FPS)}
                durationInFrames={Math.ceil(l.dur * FPS) + FPS}
              >
                <Audio src={staticFile(l.audio)} />
              </Sequence>
            ) : null,
          );
        })
      )}

      {/* BGM：音量 + 首尾淡入淡出 */}
      {props.bgm ? (
        <Audio
          src={staticFile(props.bgm.src)}
          volume={(f) => {
            const base = clamp(props.bgm?.volume ?? 0.75, 0, 1.4);
            const fi = interpolate(f, [0, fps * 1.2], [0, 1], { extrapolateRight: "clamp" });
            const fo = interpolate(
              f,
              [durationInFrames - fps * 2.2, durationInFrames - fps * 0.3],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return base * fi * fo;
          }}
        />
      ) : null}

      {/* 片头音效 */}
      {sfxOn && intro ? (
        <>
          <Sequence from={0} durationInFrames={Math.round(fps * 2.0)}>
            <Audio src={staticFile("sfx/impact.wav")} volume={0.85} />
          </Sequence>
          <Sequence from={2} durationInFrames={Math.round(fps * 2.0)}>
            <Audio src={staticFile("sfx/riser.wav")} volume={0.5} />
          </Sequence>
        </>
      ) : null}

      {/* 场景序列（重叠进入，后者压前者） */}
      {props.shots.map((shot, i) => {
        const scene = timeline.scenes[i];
        const fromF = Math.round((timeline.offset + scene.start) * FPS);
        const next = timeline.scenes[i + 1];
        const nextFrom = next
          ? Math.round((timeline.offset + next.start) * FPS)
          : durationInFrames;
        const nextOverlap = next ? (TRACK_OVERLAP[next.enter] ?? 16) : 0;
        const ownOverlap = TRACK_OVERLAP[scene.enter] ?? 16;
        // 本镜至少活到“下一镜完成入场”，填掉拍点吸附造成的几十毫秒空黑。
        const durF = Math.min(
          durationInFrames - fromF,
          Math.max(
            Math.round(scene.dur * FPS) + ownOverlap,
            nextFrom + nextOverlap - fromF,
          ),
        );
        return (
          <Sequence key={`shot-${i}`} from={fromF} durationInFrames={durF}>
            <SceneView
              shot={shot}
              sceneIndex={i}
              timeline={timeline}
              look={look}
              accent={accent}
              paper={paper}
              safe={safe}
            />
          </Sequence>
        );
      })}

      {/* 转场音效：本镜 enter 重叠开始时触发 */}
      {sfxOn
        ? props.shots.map((shot, i) => {
            if (i === 0) return null;
            const scene = timeline.scenes[i];
            const fromF = Math.round((timeline.offset + scene.start) * FPS);
            const kind = scene.enter;
            const sfxName = kind === "flash" ? "impact" : kind === "cut" ? null : "whoosh";
            if (!sfxName) return null;
            return (
              <Sequence key={`sfx-${i}`} from={fromF} durationInFrames={Math.round(FPS * 1.4)}>
                <Audio src={staticFile(`sfx/${sfxName}.wav`)} volume={0.55} />
              </Sequence>
            );
          })
        : null}

      {/* 高潮点音效 */}
      {sfxOn
        ? props.shots.map((shot, i) => {
            if (!shot.sfxMoment) return null;
            const scene = timeline.scenes[i];
            const fromF = Math.round((timeline.offset + scene.start + scene.dur * 0.55) * FPS);
            const name = ["impact", "riser", "whoosh"].includes(shot.sfxMoment)
              ? shot.sfxMoment
              : "impact";
            return (
              <Sequence key={`moment-${i}`} from={fromF} durationInFrames={Math.round(FPS * 1.6)}>
                <Audio src={staticFile(`sfx/${name}.wav`)} volume={0.6} />
              </Sequence>
            );
          })
        : null}

      {/* 片头标题序列（同样套安全画幅，片头底色与纸色一致，缩放后无接缝） */}
      {intro ? (
        <Sequence
          from={0}
          durationInFrames={Math.max(INTRO_FRAMES, Math.round(timeline.offset * FPS))}
        >
          <AbsoluteFill style={{ background: paper ? "#f4efe6" : "#0b0b10" }}>
            <AbsoluteFill style={{ transform: `scale(${safe})`, transformOrigin: "50% 50%" }}>
              <DVTitleCard title={props.title} kicker={props.kicker} accent={accent} paper={paper} />
            </AbsoluteFill>
          </AbsoluteFill>
        </Sequence>
      ) : null}

      {/* 全局质感层 */}
      <DVVignette strength={vignette} />
      <DVGrain opacity={grainOpacity} />
      <DVProgress progress={frame / durationInFrames} color={accent} />
      <DVFadeOut frames={Math.round(fps * 0.7)} color={paper ? "#f4efe6" : "#0b0b10"} />
    </AbsoluteFill>
  );
};
