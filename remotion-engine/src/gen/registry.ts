// 由 AI/skill 流程维护：磁盘上 src/gen/*/Scene*.tsx 的注册表（重写时保留全部项目）。
import React from "react";
import type { GenSceneComponent } from "./types";
import Scene_agent_browser_2026_01 from "./agent-browser-2026/Scene01";
import Scene_agent_browser_2026_02 from "./agent-browser-2026/Scene02";
import Scene_agent_browser_2026_03 from "./agent-browser-2026/Scene03";
import Scene_agent_browser_2026_04 from "./agent-browser-2026/Scene04";
import Scene_agent_browser_2026_05 from "./agent-browser-2026/Scene05";
import Scene_agent_browser_2026_06 from "./agent-browser-2026/Scene06";
import Scene_agent_browser_2026_07 from "./agent-browser-2026/Scene07";
import Scene_agent_browser_2026_08 from "./agent-browser-2026/Scene08";
import Scene_agent_browser_2026_09 from "./agent-browser-2026/Scene09";
import Scene_agent_browser_2026_10 from "./agent-browser-2026/Scene10";
import Scene_agent_desktop_2026_01 from "./agent-desktop-2026/Scene01";
import Scene_agent_desktop_2026_02 from "./agent-desktop-2026/Scene02";
import Scene_agent_desktop_2026_03 from "./agent-desktop-2026/Scene03";
import Scene_agent_desktop_2026_04 from "./agent-desktop-2026/Scene04";
import Scene_agent_desktop_2026_05 from "./agent-desktop-2026/Scene05";
import Scene_agent_desktop_2026_06 from "./agent-desktop-2026/Scene06";
import Scene_agent_desktop_2026_07 from "./agent-desktop-2026/Scene07";
import Scene_agent_desktop_2026_08 from "./agent-desktop-2026/Scene08";
import Scene_agent_desktop_2026_09 from "./agent-desktop-2026/Scene09";
import Scene_ai_backlash_2026_01 from "./ai-backlash-2026/Scene01";
import Scene_ai_backlash_2026_02 from "./ai-backlash-2026/Scene02";
import Scene_ai_backlash_2026_03 from "./ai-backlash-2026/Scene03";
import Scene_ai_backlash_2026_04 from "./ai-backlash-2026/Scene04";
import Scene_ai_backlash_2026_05 from "./ai-backlash-2026/Scene05";
import Scene_ai_backlash_2026_06 from "./ai-backlash-2026/Scene06";
import Scene_ai_backlash_2026_07 from "./ai-backlash-2026/Scene07";
import Scene_ai_backlash_2026_08 from "./ai-backlash-2026/Scene08";
import Scene_ai_backlash_2026_09 from "./ai-backlash-2026/Scene09";
import Scene_ai_backlash_2026_10 from "./ai-backlash-2026/Scene10";
import Scene_ai_backlash_2026_11 from "./ai-backlash-2026/Scene11";
import Scene_ai_backlash_2026_12 from "./ai-backlash-2026/Scene12";
import Scene_ai_backlash_2026_13 from "./ai-backlash-2026/Scene13";
import Scene_apec_shenzhen_2026_01 from "./apec-shenzhen-2026/Scene01";
import Scene_apec_shenzhen_2026_02 from "./apec-shenzhen-2026/Scene02";
import Scene_apec_shenzhen_2026_03 from "./apec-shenzhen-2026/Scene03";
import Scene_apec_shenzhen_2026_04 from "./apec-shenzhen-2026/Scene04";
import Scene_apec_shenzhen_2026_05 from "./apec-shenzhen-2026/Scene05";
import Scene_apec_shenzhen_2026_06 from "./apec-shenzhen-2026/Scene06";
import Scene_apec_shenzhen_2026_07 from "./apec-shenzhen-2026/Scene07";
import Scene_apec_shenzhen_2026_08 from "./apec-shenzhen-2026/Scene08";
import Scene_apec_shenzhen_2026_09 from "./apec-shenzhen-2026/Scene09";
import Scene_apec_shenzhen_2026_10 from "./apec-shenzhen-2026/Scene10";
import Scene_apec_shenzhen_2026_11 from "./apec-shenzhen-2026/Scene11";
import Scene_apec_shenzhen_2026_12 from "./apec-shenzhen-2026/Scene12";
import Scene_apec_shenzhen_2026_13 from "./apec-shenzhen-2026/Scene13";
import Scene_apec_shenzhen_2026_14 from "./apec-shenzhen-2026/Scene14";
import Scene_apec_shenzhen_2026_15 from "./apec-shenzhen-2026/Scene15";
import Scene_ashare_2026_01 from "./ashare-2026/Scene01";
import Scene_ashare_2026_02 from "./ashare-2026/Scene02";
import Scene_ashare_2026_03 from "./ashare-2026/Scene03";
import Scene_ashare_2026_04 from "./ashare-2026/Scene04";
import Scene_ashare_2026_05 from "./ashare-2026/Scene05";
import Scene_ashare_2026_06 from "./ashare-2026/Scene06";
import Scene_ashare_2026_07 from "./ashare-2026/Scene07";
import Scene_autoloop_2026_01 from "./autoloop-2026/Scene01";
import Scene_autoloop_2026_02 from "./autoloop-2026/Scene02";
import Scene_autoloop_2026_03 from "./autoloop-2026/Scene03";
import Scene_autoloop_2026_04 from "./autoloop-2026/Scene04";
import Scene_autoloop_2026_05 from "./autoloop-2026/Scene05";
import Scene_autoloop_2026_06 from "./autoloop-2026/Scene06";
import Scene_autoloop_2026_07 from "./autoloop-2026/Scene07";
import Scene_autoloop_2026_08 from "./autoloop-2026/Scene08";
import Scene_autoloop_2026_09 from "./autoloop-2026/Scene09";
import Scene_autoloop_2026_10 from "./autoloop-2026/Scene10";
import Scene_autoloop_2026_11 from "./autoloop-2026/Scene11";
import Scene_autoloop_2026_12 from "./autoloop-2026/Scene12";
import Scene_autoloop_2026_13 from "./autoloop-2026/Scene13";
import Scene_autoloop_2026_14 from "./autoloop-2026/Scene14";
import Scene_coldest_space_2026_01 from "./coldest-space-2026/Scene01";
import Scene_coldest_space_2026_02 from "./coldest-space-2026/Scene02";
import Scene_coldest_space_2026_03 from "./coldest-space-2026/Scene03";
import Scene_coldest_space_2026_04 from "./coldest-space-2026/Scene04";
import Scene_coldest_space_2026_05 from "./coldest-space-2026/Scene05";
import Scene_coldest_space_2026_06 from "./coldest-space-2026/Scene06";
import Scene_coldest_space_2026_07 from "./coldest-space-2026/Scene07";
import Scene_coldest_space_2026_08 from "./coldest-space-2026/Scene08";
import Scene_embodied_frontier_2026_01 from "./embodied-frontier-2026/Scene01";
import Scene_embodied_frontier_2026_02 from "./embodied-frontier-2026/Scene02";
import Scene_embodied_frontier_2026_03 from "./embodied-frontier-2026/Scene03";
import Scene_embodied_frontier_2026_04 from "./embodied-frontier-2026/Scene04";
import Scene_embodied_frontier_2026_05 from "./embodied-frontier-2026/Scene05";
import Scene_embodied_frontier_2026_06 from "./embodied-frontier-2026/Scene06";
import Scene_embodied_frontier_2026_07 from "./embodied-frontier-2026/Scene07";
import Scene_embodied_frontier_2026_08 from "./embodied-frontier-2026/Scene08";
import Scene_fable_astra_brief_2026_01 from "./fable-astra-brief-2026/Scene01";
import Scene_fable_astra_brief_2026_02 from "./fable-astra-brief-2026/Scene02";
import Scene_fable_astra_brief_2026_03 from "./fable-astra-brief-2026/Scene03";
import Scene_fable_astra_brief_2026_04 from "./fable-astra-brief-2026/Scene04";
import Scene_fable_astra_brief_2026_05 from "./fable-astra-brief-2026/Scene05";
import Scene_fable_astra_brief_2026_06 from "./fable-astra-brief-2026/Scene06";
import Scene_fable_astra_brief_2026_07 from "./fable-astra-brief-2026/Scene07";
import Scene_fable_astra_brief_2026_08 from "./fable-astra-brief-2026/Scene08";
import Scene_gpu_price_2026_01 from "./gpu-price-2026/Scene01";
import Scene_gpu_price_2026_02 from "./gpu-price-2026/Scene02";
import Scene_gpu_price_2026_03 from "./gpu-price-2026/Scene03";
import Scene_gpu_price_2026_04 from "./gpu-price-2026/Scene04";
import Scene_gpu_price_2026_05 from "./gpu-price-2026/Scene05";
import Scene_gpu_price_2026_06 from "./gpu-price-2026/Scene06";
import Scene_gpu_price_2026_07 from "./gpu-price-2026/Scene07";
import Scene_gpu_price_2026_08 from "./gpu-price-2026/Scene08";
import Scene_gpu_price_2026_09 from "./gpu-price-2026/Scene09";
import Scene_gpu_price_2026_10 from "./gpu-price-2026/Scene10";
import Scene_gpu_price_2026_11 from "./gpu-price-2026/Scene11";
import Scene_gpu_price_2026_12 from "./gpu-price-2026/Scene12";
import Scene_gpu_price_2026_13 from "./gpu-price-2026/Scene13";
import Scene_hot_20261109_1_01 from "./hot-20261109-1/Scene01";
import Scene_hot_20261109_1_02 from "./hot-20261109-1/Scene02";
import Scene_hot_20261109_1_03 from "./hot-20261109-1/Scene03";
import Scene_hot_20261109_1_04 from "./hot-20261109-1/Scene04";
import Scene_hot_20261109_1_05 from "./hot-20261109-1/Scene05";
import Scene_hot_20261109_1_06 from "./hot-20261109-1/Scene06";
import Scene_hot_20261109_1_07 from "./hot-20261109-1/Scene07";
import Scene_hot_20261109_1_08 from "./hot-20261109-1/Scene08";
import Scene_hot_20261109_1_09 from "./hot-20261109-1/Scene09";
import Scene_hot_20261109_1_10 from "./hot-20261109-1/Scene10";
import Scene_hot_20261110_1_01 from "./hot-20261110-1/Scene01";
import Scene_hot_20261110_1_02 from "./hot-20261110-1/Scene02";
import Scene_hot_20261110_1_03 from "./hot-20261110-1/Scene03";
import Scene_hot_20261110_1_04 from "./hot-20261110-1/Scene04";
import Scene_hot_20261110_1_05 from "./hot-20261110-1/Scene05";
import Scene_hot_20261110_1_06 from "./hot-20261110-1/Scene06";
import Scene_hot_20261110_1_07 from "./hot-20261110-1/Scene07";
import Scene_hot_20261110_1_08 from "./hot-20261110-1/Scene08";
import Scene_hot_20261110_1_09 from "./hot-20261110-1/Scene09";
import Scene_hot_20261110_1_10 from "./hot-20261110-1/Scene10";
import Scene_hot_20261110_1_11 from "./hot-20261110-1/Scene11";
import Scene_hot_20261110_1_12 from "./hot-20261110-1/Scene12";
import Scene_huawei_knowledge_2026_01 from "./huawei-knowledge-2026/Scene01";
import Scene_huawei_knowledge_2026_02 from "./huawei-knowledge-2026/Scene02";
import Scene_huawei_knowledge_2026_03 from "./huawei-knowledge-2026/Scene03";
import Scene_huawei_knowledge_2026_04 from "./huawei-knowledge-2026/Scene04";
import Scene_huawei_knowledge_2026_05 from "./huawei-knowledge-2026/Scene05";
import Scene_huawei_knowledge_2026_06 from "./huawei-knowledge-2026/Scene06";
import Scene_huawei_knowledge_2026_07 from "./huawei-knowledge-2026/Scene07";
import Scene_huawei_knowledge_2026_08 from "./huawei-knowledge-2026/Scene08";
import Scene_huawei_knowledge_2026_09 from "./huawei-knowledge-2026/Scene09";
import Scene_huawei_knowledge_2026_10 from "./huawei-knowledge-2026/Scene10";
import Scene_huawei_knowledge_2026_11 from "./huawei-knowledge-2026/Scene11";
import Scene_huawei_mate60_2026_01 from "./huawei-mate60-2026/Scene01";
import Scene_huawei_mate60_2026_02 from "./huawei-mate60-2026/Scene02";
import Scene_huawei_mate60_2026_03 from "./huawei-mate60-2026/Scene03";
import Scene_huawei_mate60_2026_04 from "./huawei-mate60-2026/Scene04";
import Scene_huawei_mate60_2026_05 from "./huawei-mate60-2026/Scene05";
import Scene_huawei_mate60_2026_06 from "./huawei-mate60-2026/Scene06";
import Scene_huawei_mate60_2026_07 from "./huawei-mate60-2026/Scene07";
import Scene_huawei_mate60_2026_08 from "./huawei-mate60-2026/Scene08";
import Scene_huawei_mate60_2026_09 from "./huawei-mate60-2026/Scene09";
import Scene_huawei_mate60_2026_10 from "./huawei-mate60-2026/Scene10";
import Scene_huawei_mate60_2026_11 from "./huawei-mate60-2026/Scene11";
import Scene_huawei_mate60_2026_12 from "./huawei-mate60-2026/Scene12";
import Scene_jp_cars_cn_2026_01 from "./jp-cars-cn-2026/Scene01";
import Scene_jp_cars_cn_2026_02 from "./jp-cars-cn-2026/Scene02";
import Scene_jp_cars_cn_2026_03 from "./jp-cars-cn-2026/Scene03";
import Scene_jp_cars_cn_2026_04 from "./jp-cars-cn-2026/Scene04";
import Scene_jp_cars_cn_2026_05 from "./jp-cars-cn-2026/Scene05";
import Scene_jp_cars_cn_2026_06 from "./jp-cars-cn-2026/Scene06";
import Scene_jp_cars_cn_2026_07 from "./jp-cars-cn-2026/Scene07";
import Scene_jp_cars_cn_2026_08 from "./jp-cars-cn-2026/Scene08";
import Scene_jp_cars_cn_2026_09 from "./jp-cars-cn-2026/Scene09";
import Scene_jp_cars_cn_2026_10 from "./jp-cars-cn-2026/Scene10";
import Scene_jp_cars_cn_2026_11 from "./jp-cars-cn-2026/Scene11";
import Scene_jp_cars_cn_2026_12 from "./jp-cars-cn-2026/Scene12";
import Scene_jp_cars_cn_2026_13 from "./jp-cars-cn-2026/Scene13";
import Scene_localthings_vibe_01 from "./localthings-vibe/Scene01";
import Scene_localthings_vibe_02 from "./localthings-vibe/Scene02";
import Scene_localthings_vibe_03 from "./localthings-vibe/Scene03";
import Scene_localthings_vibe_04 from "./localthings-vibe/Scene04";
import Scene_localthings_vibe_05 from "./localthings-vibe/Scene05";
import Scene_localthings_vibe_06 from "./localthings-vibe/Scene06";
import Scene_localthings_vibe_07 from "./localthings-vibe/Scene07";
import Scene_localthings_vibe_08 from "./localthings-vibe/Scene08";
import Scene_localthings_vibe_09 from "./localthings-vibe/Scene09";
import Scene_localthings_vibe_10 from "./localthings-vibe/Scene10";
import Scene_localthings_vibe_11 from "./localthings-vibe/Scene11";
import Scene_localthings_vibe_12 from "./localthings-vibe/Scene12";
import Scene_localthings_vibe_13 from "./localthings-vibe/Scene13";
import Scene_localthings_vibe_14 from "./localthings-vibe/Scene14";
import Scene_localthings_vibe_15 from "./localthings-vibe/Scene15";
import Scene_localthings_vibe_16 from "./localthings-vibe/Scene16";
import Scene_localthings_vibe_17 from "./localthings-vibe/Scene17";
import Scene_localthings_vibe_18 from "./localthings-vibe/Scene18";
import Scene_mika_guide_2026_01 from "./mika-guide-2026/Scene01";
import Scene_mika_guide_2026_02 from "./mika-guide-2026/Scene02";
import Scene_mika_guide_2026_03 from "./mika-guide-2026/Scene03";
import Scene_mika_guide_2026_04 from "./mika-guide-2026/Scene04";
import Scene_mika_guide_2026_05 from "./mika-guide-2026/Scene05";
import Scene_mika_guide_2026_06 from "./mika-guide-2026/Scene06";
import Scene_mika_guide_2026_07 from "./mika-guide-2026/Scene07";
import Scene_mika_guide_2026_08 from "./mika-guide-2026/Scene08";
import Scene_mixue_knowledge_2026_01 from "./mixue-knowledge-2026/Scene01";
import Scene_mixue_knowledge_2026_02 from "./mixue-knowledge-2026/Scene02";
import Scene_mixue_knowledge_2026_03 from "./mixue-knowledge-2026/Scene03";
import Scene_mixue_knowledge_2026_04 from "./mixue-knowledge-2026/Scene04";
import Scene_mixue_knowledge_2026_05 from "./mixue-knowledge-2026/Scene05";
import Scene_mixue_knowledge_2026_06 from "./mixue-knowledge-2026/Scene06";
import Scene_mixue_knowledge_2026_07 from "./mixue-knowledge-2026/Scene07";
import Scene_mixue_knowledge_2026_08 from "./mixue-knowledge-2026/Scene08";
import Scene_mixue_knowledge_2026_09 from "./mixue-knowledge-2026/Scene09";
import Scene_mixue_knowledge_2026_10 from "./mixue-knowledge-2026/Scene10";
import Scene_mixue_knowledge_2026_11 from "./mixue-knowledge-2026/Scene11";
import Scene_nasdaq_crash_vibe_01 from "./nasdaq-crash-vibe/Scene01";
import Scene_nasdaq_crash_vibe_02 from "./nasdaq-crash-vibe/Scene02";
import Scene_nasdaq_crash_vibe_03 from "./nasdaq-crash-vibe/Scene03";
import Scene_nasdaq_crash_vibe_04 from "./nasdaq-crash-vibe/Scene04";
import Scene_nasdaq_crash_vibe_05 from "./nasdaq-crash-vibe/Scene05";
import Scene_nasdaq_crash_vibe_06 from "./nasdaq-crash-vibe/Scene06";
import Scene_nasdaq_crash_vibe_07 from "./nasdaq-crash-vibe/Scene07";
import Scene_nasdaq_crash_vibe_08 from "./nasdaq-crash-vibe/Scene08";
import Scene_nasdaq_crash_vibe_09 from "./nasdaq-crash-vibe/Scene09";
import Scene_nasdaq_crash_vibe_10 from "./nasdaq-crash-vibe/Scene10";
import Scene_nasdaq_crash_vibe_11 from "./nasdaq-crash-vibe/Scene11";
import Scene_nasdaq_crash_vibe_12 from "./nasdaq-crash-vibe/Scene12";
import Scene_oil_rise_vibe_02 from "./oil-rise-vibe/Scene02";
import Scene_oil_rise_vibe_10 from "./oil-rise-vibe/Scene10";
import Scene_openmausbot_vibe_01 from "./openmausbot-vibe/Scene01";
import Scene_openmausbot_vibe_02 from "./openmausbot-vibe/Scene02";
import Scene_openmausbot_vibe_03 from "./openmausbot-vibe/Scene03";
import Scene_openmausbot_vibe_04 from "./openmausbot-vibe/Scene04";
import Scene_openmausbot_vibe_05 from "./openmausbot-vibe/Scene05";
import Scene_openmausbot_vibe_06 from "./openmausbot-vibe/Scene06";
import Scene_openmausbot_vibe_07 from "./openmausbot-vibe/Scene07";
import Scene_scrapling_guide_2026_01 from "./scrapling-guide-2026/Scene01";
import Scene_scrapling_guide_2026_02 from "./scrapling-guide-2026/Scene02";
import Scene_scrapling_guide_2026_03 from "./scrapling-guide-2026/Scene03";
import Scene_scrapling_guide_2026_04 from "./scrapling-guide-2026/Scene04";
import Scene_scrapling_guide_2026_05 from "./scrapling-guide-2026/Scene05";
import Scene_scrapling_guide_2026_06 from "./scrapling-guide-2026/Scene06";
import Scene_scrapling_guide_2026_07 from "./scrapling-guide-2026/Scene07";
import Scene_scrapling_guide_2026_08 from "./scrapling-guide-2026/Scene08";
import Scene_scrapling_guide_2026_09 from "./scrapling-guide-2026/Scene09";

import Scene_agent_skills_vibe_01 from "./agent-skills-vibe/Scene01";
import Scene_agent_skills_vibe_02 from "./agent-skills-vibe/Scene02";
import Scene_agent_skills_vibe_03 from "./agent-skills-vibe/Scene03";
import Scene_agent_skills_vibe_04 from "./agent-skills-vibe/Scene04";
import Scene_agent_skills_vibe_05 from "./agent-skills-vibe/Scene05";
import Scene_agent_skills_vibe_06 from "./agent-skills-vibe/Scene06";
import Scene_agent_skills_vibe_07 from "./agent-skills-vibe/Scene07";
import Scene_agent_skills_vibe_08 from "./agent-skills-vibe/Scene08";

export const GEN_SCENES: Record<string, GenSceneComponent> = {
  "gen:agent-browser-2026:01": Scene_agent_browser_2026_01,
  "gen:agent-browser-2026:02": Scene_agent_browser_2026_02,
  "gen:agent-browser-2026:03": Scene_agent_browser_2026_03,
  "gen:agent-browser-2026:04": Scene_agent_browser_2026_04,
  "gen:agent-browser-2026:05": Scene_agent_browser_2026_05,
  "gen:agent-browser-2026:06": Scene_agent_browser_2026_06,
  "gen:agent-browser-2026:07": Scene_agent_browser_2026_07,
  "gen:agent-browser-2026:08": Scene_agent_browser_2026_08,
  "gen:agent-browser-2026:09": Scene_agent_browser_2026_09,
  "gen:agent-browser-2026:10": Scene_agent_browser_2026_10,
  "gen:agent-desktop-2026:01": Scene_agent_desktop_2026_01,
  "gen:agent-desktop-2026:02": Scene_agent_desktop_2026_02,
  "gen:agent-desktop-2026:03": Scene_agent_desktop_2026_03,
  "gen:agent-desktop-2026:04": Scene_agent_desktop_2026_04,
  "gen:agent-desktop-2026:05": Scene_agent_desktop_2026_05,
  "gen:agent-desktop-2026:06": Scene_agent_desktop_2026_06,
  "gen:agent-desktop-2026:07": Scene_agent_desktop_2026_07,
  "gen:agent-desktop-2026:08": Scene_agent_desktop_2026_08,
  "gen:agent-desktop-2026:09": Scene_agent_desktop_2026_09,
  "gen:ai-backlash-2026:01": Scene_ai_backlash_2026_01,
  "gen:ai-backlash-2026:02": Scene_ai_backlash_2026_02,
  "gen:ai-backlash-2026:03": Scene_ai_backlash_2026_03,
  "gen:ai-backlash-2026:04": Scene_ai_backlash_2026_04,
  "gen:ai-backlash-2026:05": Scene_ai_backlash_2026_05,
  "gen:ai-backlash-2026:06": Scene_ai_backlash_2026_06,
  "gen:ai-backlash-2026:07": Scene_ai_backlash_2026_07,
  "gen:ai-backlash-2026:08": Scene_ai_backlash_2026_08,
  "gen:ai-backlash-2026:09": Scene_ai_backlash_2026_09,
  "gen:ai-backlash-2026:10": Scene_ai_backlash_2026_10,
  "gen:ai-backlash-2026:11": Scene_ai_backlash_2026_11,
  "gen:ai-backlash-2026:12": Scene_ai_backlash_2026_12,
  "gen:ai-backlash-2026:13": Scene_ai_backlash_2026_13,
  "gen:apec-shenzhen-2026:01": Scene_apec_shenzhen_2026_01,
  "gen:apec-shenzhen-2026:02": Scene_apec_shenzhen_2026_02,
  "gen:apec-shenzhen-2026:03": Scene_apec_shenzhen_2026_03,
  "gen:apec-shenzhen-2026:04": Scene_apec_shenzhen_2026_04,
  "gen:apec-shenzhen-2026:05": Scene_apec_shenzhen_2026_05,
  "gen:apec-shenzhen-2026:06": Scene_apec_shenzhen_2026_06,
  "gen:apec-shenzhen-2026:07": Scene_apec_shenzhen_2026_07,
  "gen:apec-shenzhen-2026:08": Scene_apec_shenzhen_2026_08,
  "gen:apec-shenzhen-2026:09": Scene_apec_shenzhen_2026_09,
  "gen:apec-shenzhen-2026:10": Scene_apec_shenzhen_2026_10,
  "gen:apec-shenzhen-2026:11": Scene_apec_shenzhen_2026_11,
  "gen:apec-shenzhen-2026:12": Scene_apec_shenzhen_2026_12,
  "gen:apec-shenzhen-2026:13": Scene_apec_shenzhen_2026_13,
  "gen:apec-shenzhen-2026:14": Scene_apec_shenzhen_2026_14,
  "gen:apec-shenzhen-2026:15": Scene_apec_shenzhen_2026_15,
  "gen:ashare-2026:01": Scene_ashare_2026_01,
  "gen:ashare-2026:02": Scene_ashare_2026_02,
  "gen:ashare-2026:03": Scene_ashare_2026_03,
  "gen:ashare-2026:04": Scene_ashare_2026_04,
  "gen:ashare-2026:05": Scene_ashare_2026_05,
  "gen:ashare-2026:06": Scene_ashare_2026_06,
  "gen:ashare-2026:07": Scene_ashare_2026_07,
  "gen:autoloop-2026:01": Scene_autoloop_2026_01,
  "gen:autoloop-2026:02": Scene_autoloop_2026_02,
  "gen:autoloop-2026:03": Scene_autoloop_2026_03,
  "gen:autoloop-2026:04": Scene_autoloop_2026_04,
  "gen:autoloop-2026:05": Scene_autoloop_2026_05,
  "gen:autoloop-2026:06": Scene_autoloop_2026_06,
  "gen:autoloop-2026:07": Scene_autoloop_2026_07,
  "gen:autoloop-2026:08": Scene_autoloop_2026_08,
  "gen:autoloop-2026:09": Scene_autoloop_2026_09,
  "gen:autoloop-2026:10": Scene_autoloop_2026_10,
  "gen:autoloop-2026:11": Scene_autoloop_2026_11,
  "gen:autoloop-2026:12": Scene_autoloop_2026_12,
  "gen:autoloop-2026:13": Scene_autoloop_2026_13,
  "gen:autoloop-2026:14": Scene_autoloop_2026_14,
  "gen:coldest-space-2026:01": Scene_coldest_space_2026_01,
  "gen:coldest-space-2026:02": Scene_coldest_space_2026_02,
  "gen:coldest-space-2026:03": Scene_coldest_space_2026_03,
  "gen:coldest-space-2026:04": Scene_coldest_space_2026_04,
  "gen:coldest-space-2026:05": Scene_coldest_space_2026_05,
  "gen:coldest-space-2026:06": Scene_coldest_space_2026_06,
  "gen:coldest-space-2026:07": Scene_coldest_space_2026_07,
  "gen:coldest-space-2026:08": Scene_coldest_space_2026_08,
  "gen:embodied-frontier-2026:01": Scene_embodied_frontier_2026_01,
  "gen:embodied-frontier-2026:02": Scene_embodied_frontier_2026_02,
  "gen:embodied-frontier-2026:03": Scene_embodied_frontier_2026_03,
  "gen:embodied-frontier-2026:04": Scene_embodied_frontier_2026_04,
  "gen:embodied-frontier-2026:05": Scene_embodied_frontier_2026_05,
  "gen:embodied-frontier-2026:06": Scene_embodied_frontier_2026_06,
  "gen:embodied-frontier-2026:07": Scene_embodied_frontier_2026_07,
  "gen:embodied-frontier-2026:08": Scene_embodied_frontier_2026_08,
  "gen:fable-astra-brief-2026:01": Scene_fable_astra_brief_2026_01,
  "gen:fable-astra-brief-2026:02": Scene_fable_astra_brief_2026_02,
  "gen:fable-astra-brief-2026:03": Scene_fable_astra_brief_2026_03,
  "gen:fable-astra-brief-2026:04": Scene_fable_astra_brief_2026_04,
  "gen:fable-astra-brief-2026:05": Scene_fable_astra_brief_2026_05,
  "gen:fable-astra-brief-2026:06": Scene_fable_astra_brief_2026_06,
  "gen:fable-astra-brief-2026:07": Scene_fable_astra_brief_2026_07,
  "gen:fable-astra-brief-2026:08": Scene_fable_astra_brief_2026_08,
  "gen:gpu-price-2026:01": Scene_gpu_price_2026_01,
  "gen:gpu-price-2026:02": Scene_gpu_price_2026_02,
  "gen:gpu-price-2026:03": Scene_gpu_price_2026_03,
  "gen:gpu-price-2026:04": Scene_gpu_price_2026_04,
  "gen:gpu-price-2026:05": Scene_gpu_price_2026_05,
  "gen:gpu-price-2026:06": Scene_gpu_price_2026_06,
  "gen:gpu-price-2026:07": Scene_gpu_price_2026_07,
  "gen:gpu-price-2026:08": Scene_gpu_price_2026_08,
  "gen:gpu-price-2026:09": Scene_gpu_price_2026_09,
  "gen:gpu-price-2026:10": Scene_gpu_price_2026_10,
  "gen:gpu-price-2026:11": Scene_gpu_price_2026_11,
  "gen:gpu-price-2026:12": Scene_gpu_price_2026_12,
  "gen:gpu-price-2026:13": Scene_gpu_price_2026_13,
  "gen:hot-20261109-1:01": Scene_hot_20261109_1_01,
  "gen:hot-20261109-1:02": Scene_hot_20261109_1_02,
  "gen:hot-20261109-1:03": Scene_hot_20261109_1_03,
  "gen:hot-20261109-1:04": Scene_hot_20261109_1_04,
  "gen:hot-20261109-1:05": Scene_hot_20261109_1_05,
  "gen:hot-20261109-1:06": Scene_hot_20261109_1_06,
  "gen:hot-20261109-1:07": Scene_hot_20261109_1_07,
  "gen:hot-20261109-1:08": Scene_hot_20261109_1_08,
  "gen:hot-20261109-1:09": Scene_hot_20261109_1_09,
  "gen:hot-20261109-1:10": Scene_hot_20261109_1_10,
  "gen:hot-20261110-1:01": Scene_hot_20261110_1_01,
  "gen:hot-20261110-1:02": Scene_hot_20261110_1_02,
  "gen:hot-20261110-1:03": Scene_hot_20261110_1_03,
  "gen:hot-20261110-1:04": Scene_hot_20261110_1_04,
  "gen:hot-20261110-1:05": Scene_hot_20261110_1_05,
  "gen:hot-20261110-1:06": Scene_hot_20261110_1_06,
  "gen:hot-20261110-1:07": Scene_hot_20261110_1_07,
  "gen:hot-20261110-1:08": Scene_hot_20261110_1_08,
  "gen:hot-20261110-1:09": Scene_hot_20261110_1_09,
  "gen:hot-20261110-1:10": Scene_hot_20261110_1_10,
  "gen:hot-20261110-1:11": Scene_hot_20261110_1_11,
  "gen:hot-20261110-1:12": Scene_hot_20261110_1_12,
  "gen:huawei-knowledge-2026:01": Scene_huawei_knowledge_2026_01,
  "gen:huawei-knowledge-2026:02": Scene_huawei_knowledge_2026_02,
  "gen:huawei-knowledge-2026:03": Scene_huawei_knowledge_2026_03,
  "gen:huawei-knowledge-2026:04": Scene_huawei_knowledge_2026_04,
  "gen:huawei-knowledge-2026:05": Scene_huawei_knowledge_2026_05,
  "gen:huawei-knowledge-2026:06": Scene_huawei_knowledge_2026_06,
  "gen:huawei-knowledge-2026:07": Scene_huawei_knowledge_2026_07,
  "gen:huawei-knowledge-2026:08": Scene_huawei_knowledge_2026_08,
  "gen:huawei-knowledge-2026:09": Scene_huawei_knowledge_2026_09,
  "gen:huawei-knowledge-2026:10": Scene_huawei_knowledge_2026_10,
  "gen:huawei-knowledge-2026:11": Scene_huawei_knowledge_2026_11,
  "gen:huawei-mate60-2026:01": Scene_huawei_mate60_2026_01,
  "gen:huawei-mate60-2026:02": Scene_huawei_mate60_2026_02,
  "gen:huawei-mate60-2026:03": Scene_huawei_mate60_2026_03,
  "gen:huawei-mate60-2026:04": Scene_huawei_mate60_2026_04,
  "gen:huawei-mate60-2026:05": Scene_huawei_mate60_2026_05,
  "gen:huawei-mate60-2026:06": Scene_huawei_mate60_2026_06,
  "gen:huawei-mate60-2026:07": Scene_huawei_mate60_2026_07,
  "gen:huawei-mate60-2026:08": Scene_huawei_mate60_2026_08,
  "gen:huawei-mate60-2026:09": Scene_huawei_mate60_2026_09,
  "gen:huawei-mate60-2026:10": Scene_huawei_mate60_2026_10,
  "gen:huawei-mate60-2026:11": Scene_huawei_mate60_2026_11,
  "gen:huawei-mate60-2026:12": Scene_huawei_mate60_2026_12,
  "gen:jp-cars-cn-2026:01": Scene_jp_cars_cn_2026_01,
  "gen:jp-cars-cn-2026:02": Scene_jp_cars_cn_2026_02,
  "gen:jp-cars-cn-2026:03": Scene_jp_cars_cn_2026_03,
  "gen:jp-cars-cn-2026:04": Scene_jp_cars_cn_2026_04,
  "gen:jp-cars-cn-2026:05": Scene_jp_cars_cn_2026_05,
  "gen:jp-cars-cn-2026:06": Scene_jp_cars_cn_2026_06,
  "gen:jp-cars-cn-2026:07": Scene_jp_cars_cn_2026_07,
  "gen:jp-cars-cn-2026:08": Scene_jp_cars_cn_2026_08,
  "gen:jp-cars-cn-2026:09": Scene_jp_cars_cn_2026_09,
  "gen:jp-cars-cn-2026:10": Scene_jp_cars_cn_2026_10,
  "gen:jp-cars-cn-2026:11": Scene_jp_cars_cn_2026_11,
  "gen:jp-cars-cn-2026:12": Scene_jp_cars_cn_2026_12,
  "gen:jp-cars-cn-2026:13": Scene_jp_cars_cn_2026_13,
  "gen:localthings-vibe:01": Scene_localthings_vibe_01,
  "gen:localthings-vibe:02": Scene_localthings_vibe_02,
  "gen:localthings-vibe:03": Scene_localthings_vibe_03,
  "gen:localthings-vibe:04": Scene_localthings_vibe_04,
  "gen:localthings-vibe:05": Scene_localthings_vibe_05,
  "gen:localthings-vibe:06": Scene_localthings_vibe_06,
  "gen:localthings-vibe:07": Scene_localthings_vibe_07,
  "gen:localthings-vibe:08": Scene_localthings_vibe_08,
  "gen:localthings-vibe:09": Scene_localthings_vibe_09,
  "gen:localthings-vibe:10": Scene_localthings_vibe_10,
  "gen:localthings-vibe:11": Scene_localthings_vibe_11,
  "gen:localthings-vibe:12": Scene_localthings_vibe_12,
  "gen:localthings-vibe:13": Scene_localthings_vibe_13,
  "gen:localthings-vibe:14": Scene_localthings_vibe_14,
  "gen:localthings-vibe:15": Scene_localthings_vibe_15,
  "gen:localthings-vibe:16": Scene_localthings_vibe_16,
  "gen:localthings-vibe:17": Scene_localthings_vibe_17,
  "gen:localthings-vibe:18": Scene_localthings_vibe_18,
  "gen:mika-guide-2026:01": Scene_mika_guide_2026_01,
  "gen:mika-guide-2026:02": Scene_mika_guide_2026_02,
  "gen:mika-guide-2026:03": Scene_mika_guide_2026_03,
  "gen:mika-guide-2026:04": Scene_mika_guide_2026_04,
  "gen:mika-guide-2026:05": Scene_mika_guide_2026_05,
  "gen:mika-guide-2026:06": Scene_mika_guide_2026_06,
  "gen:mika-guide-2026:07": Scene_mika_guide_2026_07,
  "gen:mika-guide-2026:08": Scene_mika_guide_2026_08,
  "gen:mixue-knowledge-2026:01": Scene_mixue_knowledge_2026_01,
  "gen:mixue-knowledge-2026:02": Scene_mixue_knowledge_2026_02,
  "gen:mixue-knowledge-2026:03": Scene_mixue_knowledge_2026_03,
  "gen:mixue-knowledge-2026:04": Scene_mixue_knowledge_2026_04,
  "gen:mixue-knowledge-2026:05": Scene_mixue_knowledge_2026_05,
  "gen:mixue-knowledge-2026:06": Scene_mixue_knowledge_2026_06,
  "gen:mixue-knowledge-2026:07": Scene_mixue_knowledge_2026_07,
  "gen:mixue-knowledge-2026:08": Scene_mixue_knowledge_2026_08,
  "gen:mixue-knowledge-2026:09": Scene_mixue_knowledge_2026_09,
  "gen:mixue-knowledge-2026:10": Scene_mixue_knowledge_2026_10,
  "gen:mixue-knowledge-2026:11": Scene_mixue_knowledge_2026_11,
  "gen:nasdaq-crash-vibe:01": Scene_nasdaq_crash_vibe_01,
  "gen:nasdaq-crash-vibe:02": Scene_nasdaq_crash_vibe_02,
  "gen:nasdaq-crash-vibe:03": Scene_nasdaq_crash_vibe_03,
  "gen:nasdaq-crash-vibe:04": Scene_nasdaq_crash_vibe_04,
  "gen:nasdaq-crash-vibe:05": Scene_nasdaq_crash_vibe_05,
  "gen:nasdaq-crash-vibe:06": Scene_nasdaq_crash_vibe_06,
  "gen:nasdaq-crash-vibe:07": Scene_nasdaq_crash_vibe_07,
  "gen:nasdaq-crash-vibe:08": Scene_nasdaq_crash_vibe_08,
  "gen:nasdaq-crash-vibe:09": Scene_nasdaq_crash_vibe_09,
  "gen:nasdaq-crash-vibe:10": Scene_nasdaq_crash_vibe_10,
  "gen:nasdaq-crash-vibe:11": Scene_nasdaq_crash_vibe_11,
  "gen:nasdaq-crash-vibe:12": Scene_nasdaq_crash_vibe_12,
  "gen:oil-rise-vibe:02": Scene_oil_rise_vibe_02,
  "gen:oil-rise-vibe:10": Scene_oil_rise_vibe_10,
  "gen:openmausbot-vibe:01": Scene_openmausbot_vibe_01,
  "gen:openmausbot-vibe:02": Scene_openmausbot_vibe_02,
  "gen:openmausbot-vibe:03": Scene_openmausbot_vibe_03,
  "gen:openmausbot-vibe:04": Scene_openmausbot_vibe_04,
  "gen:openmausbot-vibe:05": Scene_openmausbot_vibe_05,
  "gen:openmausbot-vibe:06": Scene_openmausbot_vibe_06,
  "gen:openmausbot-vibe:07": Scene_openmausbot_vibe_07,
  "gen:scrapling-guide-2026:01": Scene_scrapling_guide_2026_01,
  "gen:scrapling-guide-2026:02": Scene_scrapling_guide_2026_02,
  "gen:scrapling-guide-2026:03": Scene_scrapling_guide_2026_03,
  "gen:scrapling-guide-2026:04": Scene_scrapling_guide_2026_04,
  "gen:scrapling-guide-2026:05": Scene_scrapling_guide_2026_05,
  "gen:scrapling-guide-2026:06": Scene_scrapling_guide_2026_06,
  "gen:scrapling-guide-2026:07": Scene_scrapling_guide_2026_07,
  "gen:scrapling-guide-2026:08": Scene_scrapling_guide_2026_08,
  "gen:scrapling-guide-2026:09": Scene_scrapling_guide_2026_09,
  "gen:agent-skills-vibe:01": Scene_agent_skills_vibe_01,
  "gen:agent-skills-vibe:02": Scene_agent_skills_vibe_02,
  "gen:agent-skills-vibe:03": Scene_agent_skills_vibe_03,
  "gen:agent-skills-vibe:04": Scene_agent_skills_vibe_04,
  "gen:agent-skills-vibe:05": Scene_agent_skills_vibe_05,
  "gen:agent-skills-vibe:06": Scene_agent_skills_vibe_06,
  "gen:agent-skills-vibe:07": Scene_agent_skills_vibe_07,
  "gen:agent-skills-vibe:08": Scene_agent_skills_vibe_08,
};
