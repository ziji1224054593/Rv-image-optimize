# AGENTS

本仓库的图片处理能力优先使用 `rv-image-optimize` 提供的正式公开入口，不要绕过 `exports` 直接引用内部实现。

## 入口选择规则

- React 组件接入：`rv-image-optimize`
- React 单组件：`rv-image-optimize/LazyImage`、`rv-image-optimize/ProgressiveImage`
- React 样式：`rv-image-optimize/styles`
- Vue / 原生 JS / Webpack 运行时：`rv-image-optimize/utils-only`
- 浏览器侧无损压缩：`rv-image-optimize/lossless`
- Node 服务端压缩：`rv-image-optimize/node-compress`
- Agent / CLI / 多语言后端：`rv-image-optimize` CLI
- Vite 构建期静态图片压缩：`rv-image-optimize/vite-plugin`

## 禁止事项

- 不要使用 `src/*`
- 不要使用 `lib/*`
- 不要使用 `dist/*`
- 不要在 Vue 项目里导入 React 根入口
- 不要在浏览器环境里使用 `rv-image-optimize/node-compress`

## CLI 默认策略

当任务需要通过终端批量压缩图片时：

- 默认使用 `--output-dir`
- 默认使用 `--json`
- 默认不要删除原图
- 默认不要替换原图

只有用户明确要求时，才允许：

- `--delete-original`
- `--replace-original`

推荐命令：

```bash
npx rv-image-optimize "./images" --output-dir "./images-compressed" --format webp --quality 82 --json
```

## Vite 项目规则

如果任务是 Vite 项目打包阶段优化静态图片，优先使用：

```ts
import { rvImageOptimizeVitePlugin } from 'rv-image-optimize/vite-plugin'
```

说明：

- 该插件在 `vite build` / `npm run build` 阶段生效
- 默认不影响 `vite dev`
- 默认更适合处理 `png`、`webp`、`avif`、`svg`

## 优先参考文档

- `AI_TOOLKIT.md`
- `README.md`
- `AGENT_INTEGRATION.md`
- `NODE_CLI_COMPRESS.md`
- `MULTI_LANGUAGE_CLI_USAGE.md`
- `STATIC_IMAGE_BUILD_PLUGIN.md`
