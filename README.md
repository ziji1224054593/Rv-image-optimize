# rv-image-optimize

高性能、跨框架的图片优化与懒加载解决方案。提供 React 组件、通用工具函数、浏览器/Node 压缩、上传编排和 IndexedDB 缓存能力，适合 React、Vue、Vite、Webpack、Node 脚本和 CLI 场景。

![npm version](https://img.shields.io/npm/v/rv-image-optimize?color=0ea5e9&label=npm)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)
![React](https://img.shields.io/badge/React-supported-61dafb?logo=react&logoColor=000)
![Vue](https://img.shields.io/badge/Vue-supported-42b883?logo=vuedotjs&logoColor=fff)
![Node CLI](https://img.shields.io/badge/Node%20CLI-supported-3c873a?logo=nodedotjs&logoColor=fff)
![Agent Ready](https://img.shields.io/badge/Agent-Cursor%20%7C%20Claude%20Code%20%7C%20Skills-8b5cf6)

> 最新版本：**v3.0.3**
>
> `3.x` 只保证 `exports` 中声明的正式入口兼容，不再支持 `src/*`、`lib/*`、`dist/*` 这类内部文件直引。

[在线预览](https://imageoptimize.gitee.io/rv-image-optimize)

## 插件亮点

- 🚀 跨框架可用：同一个包同时覆盖 React 组件、Vue / Webpack / 原生 JS 工具函数，以及 Node / CLI 场景
- 🌐 跨语言调用友好：Java / Python / PHP 等后端可直接通过 CLI 复用压缩能力，不必先单独重写图片处理链路
- 🖼️ 图片优化能力完整：支持多 CDN 参数适配、自动格式选择、响应式图片、懒加载和渐进式加载
- ⚙️ 浏览器与服务端双压缩链路：既支持浏览器端压缩 / 无损压缩，也支持 `node-compress` 在 Node 环境原生处理图片
- 📤 上传链路可复用：提供 `upload-core` 和 `upload` 两层入口，既能单独上传，也能做“压缩后上传”编排
- 💾 缓存体系完善：内置 IndexedDB + Worker 缓存能力，支持多库多表、自动过期和配额检测
- 🧩 `JS / TS` 都可直接接入：从 `3.x` 开始提供官方 `.d.ts`，不需要消费者手写模块声明
- 🤖 Agent 集成友好：可直接接入 `Cursor`、`Claude Code`、skills 型 Agent，推荐通过 CLI + `--json` 进行稳定调用

## Agent 集成亮点

- 支持 `Cursor`、`Claude Code`、skills 型 Agent 直接接入
- 推荐统一通过 `rv-image-optimize` CLI 调用，避免 Agent 临时拼接脚本
- 支持 `--json` 结构化输出，方便 Agent 稳定解析成功数、失败数、输出目录和压缩结果
- 既适合“安全输出到新目录”，也支持在用户明确授权时执行删除原图或替换原图
- 详细接入方式、推荐提示词和 skill 规则见 [AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md)

## 安装

```bash
npm install rv-image-optimize
```

## JS / TS 是否开箱即用

- `JavaScript`：开箱即用
- `TypeScript`：从 `3.x` 开始提供官方 `.d.ts`，开箱即用
- React 项目：使用 `rv-image-optimize`、`rv-image-optimize/LazyImage`、`rv-image-optimize/ProgressiveImage`、`rv-image-optimize/styles`
- Vue / 原生 JS / Webpack：使用 `rv-image-optimize/utils-only`

如果你是第一次安装并直接使用 `3.x`，按本 README 示例接入即可，不需要看迁移文档。

## 快速开始

### React

```jsx
import { LazyImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';

export default function App() {
  return (
    <LazyImage
      src="https://example.com/image.jpg"
      width={800}
      height={600}
      optimize={{ width: 800, quality: 85, autoFormat: true }}
    />
  );
}
```

### Vue / 原生 JS / Webpack

```javascript
import { optimizeImageUrl, loadImageWithCache } from 'rv-image-optimize/utils-only';

const optimized = optimizeImageUrl('https://example.com/image.jpg', {
  width: 800,
  quality: 80,
  format: 'webp',
});

const blobUrl = await loadImageWithCache(optimized);
```

### Node / CLI

```javascript
import { compressImageFile } from 'rv-image-optimize/node-compress';

const result = await compressImageFile('./images/demo.png', {
  outputDir: './compressed',
  format: 'webp',
  quality: 82,
});

console.log(result.outputPath, result.compressedSizeFormatted);
```

```bash
rv-image-optimize ./images --output-dir ./compressed --format webp --quality 82
```

## 正式入口

| 入口 | 说明 |
| --- | --- |
| `rv-image-optimize` | React 根入口，导出 `LazyImage` / `ProgressiveImage` 与常用能力 |
| `rv-image-optimize/LazyImage` | React `LazyImage` 单独入口 |
| `rv-image-optimize/ProgressiveImage` | React `ProgressiveImage` 单独入口 |
| `rv-image-optimize/styles` | React 组件样式 |
| `rv-image-optimize/utils-only` | 不含 React 的工具函数入口，适合 Vue / Webpack / 原生 JS |
| `rv-image-optimize/cache` | 通用缓存能力 |
| `rv-image-optimize/lossless` | 浏览器端无损压缩 |
| `rv-image-optimize/node-compress` | Node 原生压缩 |
| `rv-image-optimize/upload-core` | 无 UI 上传核心 |
| `rv-image-optimize/upload` | 浏览器端压缩后上传编排 |

## 框架接入建议

- React：优先使用 `rv-image-optimize` 或 `rv-image-optimize/LazyImage`
- Vue / Vite：统一使用 `rv-image-optimize/utils-only`
- Webpack 5：可直接使用 `rv-image-optimize/utils-only`
- Webpack 4：使用 `rv-image-optimize/utils-only`，并为 `.worker.js` 配置 `worker-loader`
- Node / CLI：使用 `rv-image-optimize/node-compress` 或直接调用 `rv-image-optimize` CLI
- Agent / Cursor / Claude Code / skills：优先通过 `rv-image-optimize` CLI 调用，并配合 `--json` 读取结构化结果

## 常见问题

| 问题 | 解决方式 |
| --- | --- |
| Vue 中报 `ReactCurrentDispatcher` | 导入了 React 入口，改用 `rv-image-optimize/utils-only` |
| Webpack `Module parse failed` | 补 `worker-loader`，或检查是否误用了不适合当前环境的入口 |
| Node 里调用 `losslessCompress` 报浏览器 API 错误 | 改用 `rv-image-optimize/node-compress` |
| 想压缩成功后删除或替换原图 | CLI 使用 `--delete-original` 或 `--replace-original` |

## 迁移与详细文档

README 只保留首页摘要。以下细节请看对应文档：

| 文档 | 内容 |
| --- | --- |
| [REACT_MIGRATION_3X.md](./REACT_MIGRATION_3X.md) | React 项目从 2.x 升级到 3.x 的迁移对照 |
| [VUE_USAGE.md](./VUE_USAGE.md) | Vue / Vite / Webpack 详细接入说明 |
| [ProgressiveImage.md](./ProgressiveImage.md) | 渐进式加载配置与示例 |
| [LOSSLESS_COMPRESS.md](./LOSSLESS_COMPRESS.md) | 无损压缩能力与 API |
| [NODE_CLI_COMPRESS.md](./NODE_CLI_COMPRESS.md) | Node API 与 CLI 压缩入口 |
| [MULTI_LANGUAGE_CLI_USAGE.md](./MULTI_LANGUAGE_CLI_USAGE.md) | Java / Python / PHP 等后端通过 CLI 调用说明 |
| [UPLOAD_PIPELINE.md](./UPLOAD_PIPELINE.md) | 上传编排、`upload-core` / `upload` 说明 |
| [STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md) | 样式自定义 |
| [AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md) | Cursor / Claude Code / skills / Agent CLI 集成说明 |
| [PUBLISH.md](./PUBLISH.md) | npm 发版流程 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录 |

## License

ISC
