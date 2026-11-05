# script.json Schema（ScriptDraft）

> 权威定义：`backend/app/schemas.py`（ScriptDraft/Shot/Line）。字段长度超限会被 Pydantic 拒收。

```json
{
  "title": "标题，1~60 字",
  "shots": [
    {
      "year": "年代/阶段标签，≤16 字，可为空串",
      "label": "本幕小标题，≤40 字",
      "colors": ["#RRGGBB", "#RRGGBB"],
      "lines": [
        { "text": "台词正文，1~300 字；实际遵守 ≤20 字/句" }
      ]
    }
  ]
}
```

## 字段说明

| 字段 | 必填 | 约束 | 用途 |
|---|---|---|---|
| `title` | ✔ | 1~60 字 | 全片标题；口播标题建议 ≤24 字（片头大字） |
| `shots` | ✔ | 1~40 个 | 幕数组，顺序即播放顺序 |
| `shots[].year` | | ≤16 字 | 幕标签（年代/阶段），非年代故事留 `""` |
| `shots[].label` | | ≤40 字 | 幕小标题（4~12 字最佳），找图与占位画面依赖它 |
| `shots[].colors` | | 两个 hex | 该幕背景渐变两色，贴情绪 |
| `shots[].lines` | ✔ | 1~8 句/幕 | 台词数组；`lines` 里的元素写纯字符串也会被自动包装成 `{"text": ...}`，但规范写法是对象 |
| `lines[].text` | ✔ | 1~300 字 | 一句台词（≤20 字） |

## 最小示例（3 幕，knowledge 配方变体）

```json
{
  "title": "为什么天空是蓝的",
  "shots": [
    {
      "year": "",
      "label": "抬头的问题",
      "colors": ["#F2EDE4", "#E6DCCB"],
      "lines": [
        { "text": "你有没有想过 天为什么是蓝的" },
        { "text": "晚霞又为什么是红的" }
      ]
    },
    {
      "year": "",
      "label": "光的小脾气",
      "colors": ["#EDE4D3", "#DCCBAF"],
      "lines": [
        { "text": "阳光其实是 7 种颜色混在一起的" },
        { "text": "蓝光波长短 最容易被空气弹开" }
      ]
    },
    {
      "year": "",
      "label": "答案",
      "colors": ["#F6E8D8", "#E8C9A8"],
      "lines": [
        { "text": "整个天空 就是被弹散的蓝光" },
        { "text": "下次抬头 你看的就是答案" }
      ]
    }
  ]
}
```

## 落盘位置与同步

- 写到 `backend/storage/projects/<pid>/script.json`（UTF-8）。
- 若 `backend/storage/projects/<pid>/meta.json` 存在，同步 `title`。
- 台词改动后，下游已生成的配音/props 会过期——提醒用户配音和渲染需要重跑。
