// 合成注册：DataVideo（默认竖屏口播）/ MotionShow（轻量版式）。
// durationInFrames 由 calculateMetadata 按 props 实时计算，与预混音轨严格对齐。
import React from "react";
import { Composition } from "remotion";
import { DataVideo } from "./dv/DataVideo";
import { MotionShow } from "./dv/MotionShow";
import {
  FPS,
  HEIGHT,
  WIDTH,
  buildDataVideoTimeline,
  buildMotionTimeline,
} from "./dv/timeline";
import type { RenderProps } from "./dv/types";
import { SAMPLE_DATAVIDEO, SAMPLE_MOTIONSHOW } from "./dv/sample";
import { CinemaVideo } from "./gen/_lib/CinemaVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DataVideo"
        component={DataVideo}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={300}
        defaultProps={SAMPLE_DATAVIDEO}
        calculateMetadata={({ props }: { props: RenderProps }) => {
          const tl = buildDataVideoTimeline(props);
          return {
            durationInFrames: Math.max(30, tl.totalFrames),
          };
        }}
      />
      <Composition
        id="CinemaVideo"
        component={CinemaVideo}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={300}
        defaultProps={SAMPLE_DATAVIDEO}
        calculateMetadata={({ props }: { props: RenderProps }) => {
          const tl = buildDataVideoTimeline(props);
          return {
            durationInFrames: Math.max(30, tl.totalFrames),
          };
        }}
      />
      <Composition
        id="MotionShow"
        component={MotionShow}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={300}
        defaultProps={SAMPLE_MOTIONSHOW}
        calculateMetadata={({ props }: { props: RenderProps }) => {
          const tl = buildMotionTimeline(props);
          return {
            durationInFrames: Math.max(30, tl.totalFrames),
          };
        }}
      />
    </>
  );
};
