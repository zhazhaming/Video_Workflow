import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// 渲染并发：16 逻辑核跑 8 路 Chrome（Remotion 默认即核数一半）；GPU 编码见 renderer.py 的 NVENC 参数
Config.setConcurrency(8);
