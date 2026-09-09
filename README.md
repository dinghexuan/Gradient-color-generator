# Chromatic · 梯度色生成器

一个面向设计系统的 13 阶梯度色生成器。支持品牌色、辅助色与中性色的浅色/暗色色板，并提供单色复制、CSS 变量复制和 JSON 导出。

## 功能

- 品牌色 / 辅助色：以 `color-9` 为基准，使用 HSV 算法向两侧生成色阶
- 中性色：以 `color-13` 为基准，分别使用 HSV 与 HSL 算法生成浅色和暗色色板
- 暗色品牌色：以中性色基准叠加不同透明度的浅色色板
- 输入 HEX 色值或使用原生颜色选择器实时调整
- 一键复制 CSS 变量、下载完整 JSON tokens
- 响应式布局与实时应用预览

默认品牌色为 `#FF6000`，默认中性色为 `#0F131A`。

## 本地开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm test
npm run lint
npm run build
```
