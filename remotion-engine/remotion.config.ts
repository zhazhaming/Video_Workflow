import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// 渲染并发适中：1080×1920 竖屏 + 大量 CSS 滤镜，太高并发反而吃内存
Config.setConcurrency(4);
