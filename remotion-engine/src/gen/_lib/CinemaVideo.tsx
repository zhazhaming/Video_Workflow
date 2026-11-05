// CinemaVideo —— 横屏影院版包装（1920×1080）：竖屏 DataVideo 等比居中，
// 两侧以同色系暗场延展。用途：B 站/西瓜横屏双投（A9 双画幅输出）。
// 注：竖屏版式仍是主体；真正的横屏重排版式留待后续迭代。
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { DataVideo } from "../../dv/DataVideo";
import type { RenderProps } from "../../dv/types";

export const CinemaVideo: React.FC<RenderProps> = (props) => {
  const { width, height } = useVideoConfig(); // 1920 × 1080
  const scale = height / 1920; // 竖屏高铺满 → 0.5625
  const w = 1080 * scale; // 607.5
  const light = props.look?.bg === "paper" || props.look?.mode === "light";
  const bg = light ? "#f4efe6" : "#0b0b10";
  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* 两侧延展：与底色同源，中心微亮（避免纯平死板） */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${light ? "#fffdf8" : "#14151d"} 0%, ${bg} 68%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          left: (width - w) / 2,
          width: 1080,
          height: 1920,
        }}
      >
        <DataVideo {...props} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
