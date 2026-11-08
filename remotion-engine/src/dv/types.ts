// 渲染 props 类型：与 backend/app/schemas.py 的 camelCase 序列化（to_props_json）一一对应。
// 后端改动字段时同步这里。

export type TimedLine = {
  id: string;
  text: string;
  durationSec: number;
  audio?: string | null; // 相对 public/ 的路径
  pauseAfter: number;
  emphasis?: string[] | null; // 金色高亮关键词
}

export type GradeSpec = {
  contrast?: number | null;
  saturate?: number | null;
  brightness?: number | null;
  tintOpacity?: number | null;
}

export type OverlaySpec = {
  kind: string; // counter|typewriter|chat|stat|toast|terminal
  value?: number | null;
  label?: string | null;
  unit?: string | null;
  text?: string | null;
  side?: string | null; // chat: left|right
  name?: string | null;
  from?: number | null; // stat 起始值
  to?: number | null; // stat 目标值
  tone?: string | null; // toast: error|info|success
  lines?: string[] | null; // terminal 逐行文本
}

export type AtmosphereSpec = {
  kind: string; // none|stars|rain|dust|embers
  opacity?: number | null; // 0~1
}

export type SceneSpec = {
  kind: string; // gen:<pid>:<NN>（AI 现场编写场景）；其余 kind 由渲染端内置规则兜底
  palette?: string[] | null;
  accent?: string | null;
  speed?: number | null;
}

export type ToolSpec = {
  index: number;
  name: string;
  repo: string;
  stars: number;
  license: string;
  category: string;
  tagline: string;
  platform: string;
  icon: string;
}

export type LookSpec = {
  accent?: string | null;
  palette?: string[] | null;
  vignette?: number | null; // 0~1.5
  subtitleStyle?: string | null; // bold|pill
  bg?: string | null; // dark|paper
  atmosphere?: AtmosphereSpec | null;
  ink?: string | null;
  support?: string | null;
  preset?: string | null;
  mode?: string | null;
}

export type NarrationAudioSpec = {
  src: string; // 相对 public/ 的路径
  volume: number;
}

export type RenderShot = {
  year?: string;
  label?: string;
  image?: string | null; // 相对 public/ 的路径
  colors: string[]; // [背景, 次色]
  lines: TimedLine[];
  tail: number;
  durationSec?: number | null; // 镜长下限（卡点）
  camera?: string | null;
  camIntensity?: number | null; // 0.6~1.6
  enterTransition?: string | null; // dissolve|whip|zoom|flash|cut|glitch|slide
  cameraPerLine?: string[] | null;
  grade?: GradeSpec | null;
  grainOpacity?: number | null;
  overlay?: OverlaySpec | null;
  sfxMoment?: string | null; // impact|riser|whoosh
  atmosphere?: AtmosphereSpec | null;
  scene?: SceneSpec | null; // 代码绘制场景（优先于 image）
  layout?: string | null;
  align?: string | null;
  focal?: number[] | null; // 图片焦点 0~1
  textStyle?: string | null;
  tool?: ToolSpec | null;
}

export type BgmSpec = {
  src: string; // 相对 public/ 的路径
  volume: number;
  bpm: number;
  beats: number[];
}

export type RenderProps = {
  title: string;
  shots: RenderShot[];
  bgm?: BgmSpec | null;
  titleCard?: boolean;
  grainOpacity?: number | null;
  look?: LookSpec | null;
  kicker?: string | null;
  sfx?: boolean | null;
  narrationAudio?: NarrationAudioSpec | null;
  /** 安全画幅缩放（0.6~1，缺省 1）：抖音等平台全屏播放会按 cover 裁掉左右约 13%，
   *  把整镜内容缩到中央安全区后，被裁掉的正好是纸色边框；1 = 不缩放（旧行为）。 */
  safeScale?: number | null;
}
