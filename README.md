# rv-image-optimize

高性能、跨框架的图片优化与懒加载解决方案。内置 React 组件、渐进式加载、浏览器/无损压缩和 IndexedDB 通用缓存，同时提供 `utils-only` 入口，方便 Vue/Vite/Webpack/原生 JS 等环境直接调用工具函数。

> 最新版本：**v2.1.3**（新增 `utils-only` 入口、修复浏览器压缩质量参数、完善构建流程）
>
> ⚠️ Vue / Webpack / 原生项目务必使用 `rv-image-optimize/utils-only` 或 `dist/image-optimize-utils.*` 入口，避免导入 React 组件导致错误。详见 [VUE_USAGE.md](./VUE_USAGE.md)。

### 插件预览地址 
#### [插件预览地址](https://imageoptimize.gitee.io/rv-image-optimize)

---

## 目录

1. [核心特性](#核心特性)
2. [安装与构建](#安装与构建)
3. [快速开始](#快速开始)
4. [框架接入指南](#框架接入指南)
5. [功能模块概要](#功能模块概要)
6. [通用缓存系统（IndexedDB）](#通用缓存系统indexeddb)
7. [FAQ & 故障排查](#faq--故障排查)
8. [配套文档](#配套文档)
9. [License](#license)

---

## 核心特性

| 方向 | 能力 |
| --- | --- |
| **图片优化** | 多 CDN 适配、自动格式（AVIF/WebP/JPG）、响应式 srcset/sizes |
| **加载体验** | 懒加载、渐进式模糊→清晰、占位符、错误兜底 |
| **压缩能力** | 浏览器端压缩（质量/模糊/尺寸）、GPU 加速无损压缩、批量处理 |
| **缓存体系** | Worker 驱动 IndexedDB、多库多表、自动过期、配额检测 |
| **框架兼容** | React 组件、Vue/Vite/Webpack/原生 JS 工具函数、微前端隔离 |
| **周边生态** | 按需导出、样式自定义、发布/调试指引完整 |

### 核心亮点

- 🚀 **跨框架支持**：React 组件 + Vue/Webpack/原生 JS 工具函数，一套代码多端使用
- ⚡ **性能优化**：多 CDN 自动适配、格式自动选择、响应式图片、懒加载
- 🎨 **渐进式加载**：从模糊到清晰的渐进式加载体验，支持多阶段自定义
- 💾 **通用缓存**：Worker 架构 IndexedDB 缓存，支持多库多表、自动过期、配额管理
- 🔧 **浏览器压缩**：当 CDN 不支持优化时，自动启用浏览器端压缩
- 🎯 **无损压缩**：GPU 加速无损压缩，支持批量处理和文件验证
- 📦 **按需导入**：支持按需导入，减少打包体积

---

## 安装与构建

```bash
npm install rv-image-optimize

# 本地开发
npm run dev

# 构建 React 组件 + utils-only 版本
npm run build
```

`dist/` 将生成：
- `image-optimize.[es|cjs|umd].js`：React 组件版本
- `image-optimize-utils.[es|cjs|umd].js`：工具函数版本（不含 React）
- `style.css`

更多发布流程：见 [PUBLISH.md](./PUBLISH.md)。

---

## 快速开始

### React 组件

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
      onLoad={() => console.log('加载成功')}
      onError={() => console.log('加载失败')}
    />
  );
}
```

### 任意框架（Vue / Webpack / 原生 JS）

```javascript
// ✅ utils-only 入口完全不含 React 代码
import { optimizeImageUrl, loadImageWithCache } from 'rv-image-optimize/utils-only';

const optimized = optimizeImageUrl('https://example.com/image.jpg', {
  width: 800,
  quality: 80,
  format: 'webp',
});

const blobUrl = await loadImageWithCache(optimized);
```

---

## 框架接入指南

### React

- **入口**：`rv-image-optimize`
- **组件**：`LazyImage`, `ProgressiveImage`
- **样式**：`import 'rv-image-optimize/styles';`
- **适用于**：CRA、Next.js、Remix 等

### Vue（Vite）

```vue
<script setup>
import { ref, computed } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize/utils-only';

const src = ref('https://example.com/image.jpg');
const optimized = computed(() => optimizeImageUrl(src.value, { width: 800, quality: 80 }));
</script>

<template>
  <img :src="optimized" alt="优化图片" />
</template>
```

### Vue / 任意框架（Webpack）

- **入口**：`rv-image-optimize/utils-only`（ESM）或 `rv-image-optimize/dist/image-optimize-utils.cjs.js`
- **Webpack 5**：原生支持 Worker，直接使用
- **Webpack 4**：需配置 `worker-loader`

```javascript
// webpack.config.js（Webpack4 示例）
module.exports = {
  module: {
    rules: [
      { test: /\.worker\.js$/i, loader: 'worker-loader' },
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    ],
  },
  resolve: { extensions: ['.js', '.vue', '.json'] },
};
```

### 常见问题

| 错误 | 原因 | 解决 |
| --- | --- | --- |
| `ReactCurrentDispatcher` | 导入了 React 组件入口 | 使用 `rv-image-optimize/utils-only` |
| `Module parse failed` | Webpack 未处理 Worker/ESM | 使用 CJS 入口或添加 `worker-loader` |
| `"./utils-only" is not exported...` | 旧版本缓存 | `npm install rv-image-optimize@latest` 并重启 dev server |

更多 Vue/Vite/Webpack 细节请查看 [VUE_USAGE.md](./VUE_USAGE.md)。

---

## 功能模块概要

### React 组件

| 组件 | 能力 |
| --- | --- |
| `LazyImage` | 懒加载、CDN 参数、占位符、错误兜底、浏览器压缩 |
| `ProgressiveImage` | 渐进式模糊→清晰，支持阶段回调 |

### 工具函数（`utils-only` 入口全部可用）

- **图片优化**：`optimizeImageUrl`, `generateResponsiveImage`, `detectCDN`, `compareImageSizes`
- **加载辅助**：`preloadImage(s)`, `loadImageProgressive`, `loadImagesProgressively`
- **浏览器压缩**：`compressImageInBrowser`, `dataURLToBlob`
- **无损压缩**：`losslessCompress`, `losslessCompressBatch`
- **缓存体系**：`setCache`, `getCache`, `loadImageWithCache`, `checkStorageQuota`, `cleanExpiredCache`, `deleteDatabase` 等

### 详细文档

- **渐进式加载**：详见 [ProgressiveImage.md](./ProgressiveImage.md)
- **无损压缩**：详见 [LOSSLESS_COMPRESS.md](./LOSSLESS_COMPRESS.md)
- **样式自定义**：详见 [STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md)

---

## 通用缓存系统（IndexedDB）

### 核心特性

- **Worker 架构**：后台执行，不阻塞主线程；浏览器不支持时自动降级
- **多库多表**：支持创建多个数据库和多个表，自动创建
- **自动过期**：支持设置过期时间，自动清理过期缓存
- **配额管理**：支持查询存储配额、检查配额、自动清理
- **适用场景**：图片缓存、API 缓存、会话状态、微前端隔离

### 快速示例

```javascript
import { setCache, getCache, cleanExpiredCache } from 'rv-image-optimize/utils-only';

// 基础使用
await setCache('user:123', { name: 'John' });  // 默认 30 天
const user = await getCache('user:123');
await cleanExpiredCache();

// 多库多表使用
await setCache('user:1', {...}, 24, 'UserDB', 'users');
await setCache('session:token', { token: 'abc' }, 2, 'SessionDB', 'sessions'); // 临时存储
const session = await getCache('session:token', 'SessionDB', 'sessions');

// 配额监控
const quota = await getStorageQuota();
const usage = await getAllDatabasesUsage();
const canStore = await checkStorageQuota(5 * 1024 * 1024);
```

### 主要 API

| 函数 | 说明 |
|------|------|
| `setCache(key, value, expireHours, dbName, storeName, options)` | 设置缓存 |
| `getCache(key, dbName, storeName)` | 获取缓存 |
| `deleteCache(key?, dbName, storeName)` | 删除缓存 |
| `cleanExpiredCache(dbName, storeName)` | 清理过期缓存 |
| `getCacheStats(dbName, storeName)` | 获取缓存统计 |
| `getStorageQuota()` | 获取存储配额和使用情况 |
| `checkStorageQuota(requiredSize)` | 检查存储配额是否足够 |
| `getAllDatabasesUsage()` | 获取所有数据库的存储使用情况 |
| `deleteDatabase(dbName)` | 删除整个数据库 |

### 微前端支持

在微前端架构中，为每个子应用配置独立的 `dbName/storeName`，实现数据隔离：

```javascript
// 子应用 A
const APP_A_DB = 'AppA_ImageCache';
const APP_A_TABLE = 'appA_cache';
await setCache('user:123', userData, 24, APP_A_DB, APP_A_TABLE);

// 子应用 B
const APP_B_DB = 'AppB_ImageCache';
const APP_B_TABLE = 'appB_cache';
await setCache('user:123', userData, 24, APP_B_DB, APP_B_TABLE);
```

---

## FAQ & 故障排查

| 问题 | 解决方案 |
| --- | --- |
| Vue 中报 `ReactCurrentDispatcher` | 使用 `rv-image-optimize/utils-only` 或 `dist/image-optimize-utils.cjs.js` |
| Webpack `Module parse failed` | Webpack4 配置 `worker-loader` 并使用 CJS 入口；Webpack5 直接使用 |
| `quality` 参数无效 | 升级到 v2.1.3+ |
| Worker 无法加载 | 确认构建工具处理 `.worker.js`，或禁用缓存相关功能 |
| IndexedDB 配额满 | 调用 `cleanExpiredCache()` / `deleteCache()`，或启用 `autoCleanOnQuotaError` |
| 懒加载不触发 | 检查 `immediate` 是否为 true，或 IntersectionObserver 是否可用 |
| Vue 中使用 `rootMargin` | 自行创建 IntersectionObserver，工具函数不处理该参数 |

更多问答与示例：见 [VUE_USAGE.md](./VUE_USAGE.md)。

---

## 配套文档

| 文档 | 内容 |
| --- | --- |
| [ProgressiveImage.md](./ProgressiveImage.md) | 渐进式加载配置与示例 |
| [LOSSLESS_COMPRESS.md](./LOSSLESS_COMPRESS.md) | 无损压缩与上传集成 |
| [STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md) | 样式自定义 |
| [VUE_USAGE.md](./VUE_USAGE.md) | Vue/Vite/Webpack 详细接入 |

---

## License

ISC

---

欢迎在项目中自由组合 CDN 参数、IndexedDB 缓存、渐进式加载等能力。如果遇到问题或希望贡献新特性，欢迎提交 issue / PR 🙌
