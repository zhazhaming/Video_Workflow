// 时间轴：与 backend/app/services/voice.py 的 mix_line_track / mix_motion_track 逐帧对齐。
// 后端把逐句配音按本文件同一套常量预混成整轨（narrationAudio），画面/字幕必须复刻同样的
// 布局数学，否则人声与字幕会漂移。改动常量时两处必须同步。
import type { RenderProps, RenderShot } from "./types";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// ---- DataVideo（与 voice.py _TRACK_* 一致）----
export const INTRO_FRAMES = 48; // 片头 1.6s（B9 开场提速；改动需同步 TitleCard/voice 预混/契约文档）
// P0+P1 节奏：原来每句固定 0.4+0.45=0.85s 静音、镜首 0.9s，整片约一半是等。
// 现在把基础缓冲降下来，真正的停顿差异交给每句 pauseAfter（build_props 按标点给）。
export const TRACK_LEAD = 0.45; // 镜内首句前的留白
export const TRACK_TAIL = 0.4;
export const TRACK_GAP = 0.22;
export const TRACK_PAUSE_BONUS = 0.12;
// 转场重叠帧数（dissolve 缺省 16）
export const TRACK_OVERLAP: Record<string, number> = {
  whip: 11,
  zoom: 13,
  flash: 7,
  cut: 3,
  glitch: 10,
  slide: 12,
  dissolve: 16,
};

export function snapToBeat(t: number, beats: number[], tol = 0.35): number {
  if (!beats || beats.length === 0) return t;
  let best = t;
  let bd = Infinity;
  for (const b of beats) {
    const d = Math.abs(b - t);
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  return bd <= tol ? best : t;
}

export interface TLine {
  id: string;
  text: string;
  start: number; // 镜内相对秒
  dur: number;
  emphasis?: string[] | null;
  audio?: string | null;
}

export interface TScene {
  index: number;
  start: number; // 全片相对（未加 offset）秒
  dur: number;
  lines: TLine[];
  enter: string;
  shot: RenderShot;
}

export interface Timeline {
  introFrames: number;
  offset: number; // 整轨配音在全片中的起始秒（画面时间轴同样从这里展开）
  scenes: TScene[];
  durationSec: number;
  totalFrames: number;
}

// DataVideo：逐镜布局，与 mix_line_track 的 scenes/cursor/starts 计算完全一致
export function buildDataVideoTimeline(props: RenderProps): Timeline {
  const introFrames = props.titleCard === false ? 0 : INTRO_FRAMES;
  const beats = props.bgm?.beats ?? [];
  // offset 自己也必须落在拍网格上：否则所有切镜会整体偏 0.18~0.22s，
  // 而 build_props 是按绝对拍域吸附的（两边必须同一个 offset）。
  const offset = snapToBeat(
    Math.max(2.0, Math.max(0, (introFrames - 15) / FPS)),
    beats,
    0.45,
  );

  const unsnapped: number[] = [];
  const durs: number[] = [];
  const sceneLines: TLine[][] = [];
  let cursor = 0;
  props.shots.forEach((shot) => {
    const lines: TLine[] = [];
    let t = TRACK_LEAD;
    shot.lines.forEach((l, li) => {
      const dur = Math.max(0.3, l.durationSec || 1.5);
      const isLast = li === shot.lines.length - 1;
      const pause = isLast ? 0 : (l.pauseAfter ?? TRACK_GAP) + TRACK_PAUSE_BONUS;
      lines.push({
        id: l.id,
        text: l.text,
        start: t,
        dur,
        emphasis: l.emphasis,
        audio: l.audio,
      });
      t += dur + pause;
    });
    const dur = t + (shot.tail ?? TRACK_TAIL);
    unsnapped.push(cursor);
    sceneLines.push(lines);
    durs.push(dur);
    cursor += dur;
  });

  const starts = [0];
  for (let i = 1; i < durs.length; i++) {
    const enter = props.shots[i].enterTransition || "dissolve";
    const ov = (TRACK_OVERLAP[enter] ?? 16) / FPS;
    const guard = starts[i - 1] + durs[i - 1] - ov + 0.3;
    // 与 build_props 的“保底 → 吸附 → 保底后下一拍”完全一致：
    // 先保证不侵入上一镜，再吸附；若吸附后仍低于保底，则取保底之后的下一拍。
    const raw = Math.max(unsnapped[i], guard, starts[i - 1] + 0.6);
    let snapped = snapToBeat(raw, beats);
    if (snapped < guard) {
      const later = beats.find((b) => b >= guard);
      snapped = later ?? raw;
    }
    starts.push(snapped);
  }

  const scenes: TScene[] = props.shots.map((shot, i) => ({
    index: i,
    start: starts[i],
    dur: durs[i],
    lines: sceneLines[i],
    enter: shot.enterTransition || "dissolve",
    shot,
  }));

  const last = scenes[scenes.length - 1];
  const bodySec = last ? last.start + last.dur : 0;
  const durationSec = Math.max(2.0, offset + bodySec + 1.0);
  return {
    introFrames,
    offset,
    scenes,
    durationSec,
    totalFrames: Math.ceil(durationSec * FPS),
  };
}

// ---- MotionShow（与 voice.py _MOTION_* 一致：帧制，无片头）----
export const MOTION_GAP_FRAMES = 11; // round(0.35 * 30)
export const MOTION_TAIL_FRAMES = 18; // round(0.6 * 30)
export const MOTION_MIN_SHOT_FRAMES = 72; // 2.4s

export interface MotionShot {
  index: number;
  startFrame: number;
  frames: number;
  lines: TLine[]; // start 为镜内相对「秒」，由帧换算
  shot: RenderShot;
}

export interface MotionTimeline {
  shots: MotionShot[];
  totalFrames: number;
  durationSec: number;
}

export function buildMotionTimeline(props: RenderProps): MotionTimeline {
  const shots: MotionShot[] = [];
  let cursor = 0;
  props.shots.forEach((shot, i) => {
    let lineOff = 0;
    const lines: TLine[] = [];
    shot.lines.forEach((l) => {
      const dur = Math.max(0.3, l.durationSec || 1.4);
      lines.push({
        id: l.id,
        text: l.text,
        start: lineOff / FPS,
        dur,
        emphasis: l.emphasis,
        audio: l.audio,
      });
      lineOff += Math.max(1, Math.round(dur * FPS)) + MOTION_GAP_FRAMES;
    });
    const wanted = Math.round((shot.durationSec ?? 0) * FPS);
    const frames = Math.max(MOTION_MIN_SHOT_FRAMES, lineOff + MOTION_TAIL_FRAMES, wanted);
    shots.push({ index: i, startFrame: cursor, frames, lines, shot });
    cursor += frames;
  });
  const totalFrames = cursor + 12;
  return {
    shots,
    totalFrames,
    durationSec: totalFrames / FPS,
  };
}
