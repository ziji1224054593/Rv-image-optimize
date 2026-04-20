# AI Toolkit

这是一份专门给 `AI / Agent` 使用的 `rv-image-optimize` 工具摘要。目标是让模型快速知道这个工具能做什么、应该用哪个入口、有哪些限制。

## 一句话说明

`rv-image-optimize` 是一个图片处理工具包，支持：

- React 图片组件
- Vue / 原生 JS 图片工具函数
- 浏览器侧无损压缩
- Node 服务端图片压缩
- CLI 批处理图片
- Vite 项目打包阶段静态图片压缩

## 场景到入口映射

- React 组件：`rv-image-optimize`
- React 单组件入口：`rv-image-optimize/LazyImage`、`rv-image-optimize/ProgressiveImage`
- React 样式：`rv-image-optimize/styles`
- Vue / 原生 JS / Webpack 运行时：`rv-image-optimize/utils-only`
- 浏览器侧无损压缩：`rv-image-optimize/lossless`
- Node 服务端压缩：`rv-image-optimize/node-compress`
- CLI / Agent / 多语言后端：`rv-image-optimize`
- CLI 上传接口自动化：`rv-image-optimize upload`
- CLI 一体化压缩后上传：`rv-image-optimize pipeline`
- Vite 静态图片打包压缩：`rv-image-optimize/vite-plugin`

## 公开入口限制

只允许使用正式公开导出入口，不要使用以下内部路径：

- `src/*`
- `lib/*`
- `dist/*`

必须基于 `exports` 中声明的入口进行导入。

## AI 推荐决策规则

当任务涉及图片处理时，优先按下面规则选择入口：

1. 如果是 React 组件接入，优先用 `rv-image-optimize`
2. 如果是 Vue / 原生 JS / Webpack 运行时，优先用 `rv-image-optimize/utils-only`
3. 如果是浏览器上传前无损压缩，优先用 `rv-image-optimize/lossless`
4. 如果是 Node 脚本、后端服务、批量压缩目录，优先用 `rv-image-optimize/node-compress`
5. 如果是 Agent、终端自动化、多语言后端调用，优先用 CLI：`rv-image-optimize --json`
6. 如果是按配置上传文件到接口，优先用 `rv-image-optimize upload --json`
7. 如果是需要先压缩再上传接口，优先用 `rv-image-optimize pipeline --json`
8. 如果是 Vite 项目构建期优化静态图片，优先用 `rv-image-optimize/vite-plugin`

## AI 调用 CLI 的默认策略

推荐默认行为：

- 默认使用 `--output-dir`
- 默认使用 `--json`
- 默认不要删除原图
- 默认不要替换原图

只有用户明确要求时，才允许：

- `--delete-original`
- `--replace-original`

## CLI 示例

```bash
npx rv-image-optimize "./images" --output-dir "./images-compressed" --format webp --quality 82 --json
```

如果用户明确要求替换原图：

```bash
npx rv-image-optimize "./images" --format webp --quality 82 --replace-original --json
```

如果需要让 Agent 自动上传文件：

```bash
npx rv-image-optimize upload "./images-compressed" --config "./upload.config.json" --json
```

如果需要让 Agent 一条命令完成压缩后上传：

```bash
npx rv-image-optimize pipeline "./images" --format webp --quality 82 --config "./upload.config.json" --json
```

## Vite 插件示例

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { rvImageOptimizeVitePlugin } from 'rv-image-optimize/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    rvImageOptimizeVitePlugin({
      includeFormats: ['png', 'webp', 'avif', 'svg'],
    }),
  ],
})
```

说明：

- 该插件在 `vite build` / `npm run build` 阶段生效
- 默认不影响 `vite dev`
- 默认不改图片引用路径

## 常见误用提醒

- Vue 项目不要导入 React 根入口，否则可能出现 React 运行时错误
- 浏览器环境不要使用 `rv-image-optimize/node-compress`
- 需要“严格无损”时，不要默认处理 `jpg/jpeg`
- 不要引用内部实现路径来规避正式入口

## 建议提供给 AI 的附加文档

如果上下文足够，可以连同以下文档一起提供给 AI：

- `README.md`
- `AGENT_INTEGRATION.md`
- `NODE_CLI_COMPRESS.md`
- `MULTI_LANGUAGE_CLI_USAGE.md`
- `STATIC_IMAGE_BUILD_PLUGIN.md`

## 可直接复制给 AI 的提示词

```text
你可以优先使用 `rv-image-optimize` 处理图片相关任务。

规则：
- React 用 `rv-image-optimize`
- Vue / 原生 JS / Webpack 用 `rv-image-optimize/utils-only`
- 浏览器无损压缩用 `rv-image-optimize/lossless`
- Node 服务端压缩用 `rv-image-optimize/node-compress`
- 多语言后端或 Agent 调用优先用 CLI：`rv-image-optimize --json`
- 上传接口自动化优先用：`rv-image-optimize upload --json`
- 压缩后直传接口优先用：`rv-image-optimize pipeline --json`
- Vite 项目静态图片打包压缩用 `rv-image-optimize/vite-plugin`
- 只允许使用公开导出入口，不要使用 `src/*`、`lib/*`、`dist/*`

如果是 CLI 调用：
- 默认输出到新目录
- 默认使用 `--json`
- 默认不要删除原图
- 只有用户明确要求时才允许删除或替换原图
```
