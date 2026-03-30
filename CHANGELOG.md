# Changelog

本文档记录 `rv-image-optimize` 预览页和核心能力的重要更新。

## v3.0.0

发布时间：2026-03-30

### Breaking Changes

- 收紧 npm 包公开导出面，仅保留 `exports` 中声明的正式入口，不再支持 `src/*`、`lib/*`、`dist/*` 这类内部文件直引。
- 移除 `./utils`、`./lib/*`、`./src/*` 等内部实现级导出，避免把源码目录结构当成长期兼容契约。
- 移除 UMD 构建产物，浏览器脚本直链场景需改为通过构建工具消费 ESM/CJS 入口。
- Vue 项目不再通过 npm 包直接提供 `LazyImage.vue` / `LazyImage.css`，统一改为 `utils-only` 入口或自行封装 Vue 组件。

### 改进

- 新增稳定的 React 组件子入口：`rv-image-optimize/LazyImage` 和 `rv-image-optimize/ProgressiveImage`。
- 收缩发布文件范围，仅保留运行时所需目录与核心文档，降低 npm 包体积。
- 统一 README / Vue 接入文档中的正式入口说明，减少升级后导入报错的风险。

## v2.3.0

发布时间：2026-03-30

### 新增

- 新增 `upload-core`，支持无 UI 的上传核心能力，适合 Node、CLI、服务脚本和 AI Agent 复用。
- 新增 `upload` 浏览器上传编排能力，支持压缩后直接上传接口。
- 新增 `node-compress` 子入口，支持 Node 原生压缩单文件、目录和内存 Buffer。
- 新增 CLI 命令 `rv-image-optimize`，支持批量压缩、JSON 输出、删除原图和替换原图。
- 新增 `AGENT_INTEGRATION.md`，说明 Cursor、Claude Code 和 skills 型 Agent 如何通过 CLI 接入。
- 新增预览页公告弹窗，可在公网预览中直接查看最新版本变更和文档内容。

### 改进

- `example/App.jsx` 中的上传配置 UI 已拆分为独立组件，降低演示页复杂度。
- 预览页文档浏览支持直接读取项目中的 Markdown 内容。
- Markdown 浏览器增强为更接近文档页的阅读体验。

### 文档

- 更新 `README.md`，补充上传编排、Node / CLI 压缩、Agent 集成和 FAQ 说明。
- 新增 `NODE_CLI_COMPRESS.md`，集中说明 Node API 与 CLI 用法。
- 更新 `UPLOAD_PIPELINE.md`，补充 upload-core / upload 的分层说明。

## v2.2.0

### 说明

- 作为 `v2.3.0` 之前的稳定基线版本，主要提供浏览器侧图片优化、懒加载、渐进式加载、缓存和无损压缩能力。

## v2.1.3

### 说明

- 质量参数相关问题在该版本后得到修复，后续版本在此基础上持续增强。
