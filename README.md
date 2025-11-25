# rv-image-optimize

高性能、跨框架的图片优化与懒加载解决方案。内�?React 组件、渐进式加载、浏览器/无损压缩�?IndexedDB 通用缓存，同时提�?`utils-only` 入口，方�?Vue/Vite/Webpack/原生 JS 等环境直接调用工具函数�?
> 最新版本：**v2.1.3**（新�?`utils-only` 入口、修复浏览器压缩质量参数、完善构建流程）
>
> ⚠️ Vue / Webpack / 原生项目务必使用 `rv-image-optimize/utils-only` �?`dist/image-optimize-utils.*` 入口，避免导�?React 组件导致错误。详�?[VUE_USAGE.md](./VUE_USAGE.md)�?

### 插件预览地址 
#### [插件预览地址]( https://imageoptimize.gitee.io/rv-image-optimize)
---

## 目录

1. [核心特性](#核心特�?
2. [安装与构建](#安装与构�?
3. [快速开始](#快速开�?
4. [框架接入指南](#框架接入指南)
5. [功能模块概要](#功能模块概要)
6. [通用缓存系统（IndexedDB）](#通用缓存系统indexeddb)
7. [高级能力](#高级能力)
8. [FAQ & 故障排查](#faq--故障排查)
9. [配套文档](#配套文档)
10. [License](#license)

---

## 核心特�?
| 方向 | 能力 |
| --- | --- |
| 图片优化 | �?CDN 适配、自动格式（AVIF/WebP/JPG）、响应式 srcset/sizes |
| 加载体验 | 懒加载、渐进式模糊→清晰、占位符、错误兜�?|
| 压缩能力 | 浏览器端压缩（质�?模糊/尺寸）、GPU 加速无损压缩、批量处�?|
| 缓存体系 | Worker 驱动 IndexedDB、多库多表、自动过期、配额检�?|
| 框架兼容 | React 组件、Vue/Vite/Webpack/原生 JS 工具函数、微前端隔离 |
| 周边生�?| 按需导出、样式自定义、发�?调试指引完整 |

---

## 安装与构�?
```bash
npm install rv-image-optimize

# 本地开�?npm run dev

# 构建 React 组件 + utils-only 版本
npm run build
```

`dist/` 将生成：
- `image-optimize.[es|cjs|umd].js`：React 组件版本
- `image-optimize-utils.[es|cjs|umd].js`：工具函数版本（不含 React�?- `style.css`

更多发布流程：见 [PUBLISH.md](./PUBLISH.md)�?
---

## 快速开�?
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

### 任意框架（Vue / Webpack / 原生 JS�?
```javascript
// �?utils-only 入口完全不含 React 代码
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

- 入口：`rv-image-optimize`
- 组件：`LazyImage`, `ProgressiveImage`
- 样式：`import 'rv-image-optimize/styles';`
- 适用�?CRA、Next.js、Remix �?
### Vue（Vite�?
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

### Vue / 任意框架（Webpack�?
- 入口：`rv-image-optimize/utils-only`（ESM）或 `rv-image-optimize/dist/image-optimize-utils.cjs.js`
- Webpack 5 原生支持 Worker；Webpack 4 需配置 `worker-loader`

```javascript
// webpack.config.js（Webpack4 示例�?module.exports = {
  module: {
    rules: [
      { test: /\.worker\.js$/i, loader: 'worker-loader' },
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    ],
  },
  resolve: { extensions: ['.js', '.vue', '.json'] },
};
```

常见问题�?
| 错误 | 原因 | 解决 |
| --- | --- | --- |
| `ReactCurrentDispatcher` | 导入�?React 组件入口 | 使用 `rv-image-optimize/utils-only` |
| `Module parse failed` | Webpack 未处�?Worker/ESM | 使用 CJS 入口或添�?`worker-loader` |
| `"./utils-only" is not exported...` | 旧版本缓�?| `npm install rv-image-optimize@latest` 并重�?dev server |

更多 Vue/Vite/Webpack 细节请查�?[VUE_USAGE.md](./VUE_USAGE.md)�?
---

## 功能模块概要

### React 组件

| 组件 | 能力 |
| --- | --- |
| `LazyImage` | 懒加载、CDN 参数、占位符、错误兜底、浏览器压缩 |
| `ProgressiveImage` | 渐进式模糊→清晰，支持阶段回�?|

### 工具函数（`utils-only` 入口全部可用�?
- 图片优化：`optimizeImageUrl`, `generateResponsiveImage`, `detectCDN`, `compareImageSizes`
- 加载辅助：`preloadImage(s)`, `loadImageProgressive`, `loadImagesProgressively`
- 浏览器压缩：`compressImageInBrowser`, `dataURLToBlob`
- 无损压缩：`losslessCompress`, `losslessCompressBatch`
- 缓存体系：`setCache`, `getCache`, `loadImageWithCache`, `checkStorageQuota`, `cleanExpiredCache`, `deleteDatabase` �?
### 浏览器压缩示�?
```javascript
const dataURL = await compressImageInBrowser(file, {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.75,
  compressionLevel: 0.3,
  format: 'webp',
});
```

### 无损压缩示例

```javascript
const result = await losslessCompress(file, {
  maxWidth: 1600,
  optimizePalette: true,
  format: 'webp',
});
// result.file 可直接上�?```

---

## 通用缓存系统（IndexedDB�?
特性：
- Worker 架构，后台执行；浏览器不支持时自动降�?- 多数据库 / 多表，自动创�?- 统一 API：`setCache / getCache / deleteCache / cleanExpiredCache / getStoreNames / deleteDatabase / getStorageQuota`
- 适合图片缓存、API 缓存、会话状态、微前端隔离

### 快速示�?
```javascript
import { setCache, getCache, cleanExpiredCache } from 'rv-image-optimize/utils-only';

await setCache('user:123', { name: 'John' });  // 默认 30 �?const user = await getCache('user:123');
await cleanExpiredCache();
```

### 多库多表 & 会话场景

```javascript
await setCache('user:1', {...}, 24, 'UserDB', 'users');
await setCache('session:token', { token: 'abc' }, 2, 'SessionDB', 'sessions'); // 临时存储
const session = await getCache('session:token', 'SessionDB', 'sessions');
```

### 微前端最佳实�?
- 为每个子应用配置独立 `dbName/storeName`
- 可使用共享库 + 不同表，或在 Key 中添加前缀（`appA:image:{url}`�?- 详见“微前端使用指南”小�?
### 配额监控

```javascript
const quota = await getStorageQuota();
const usage = await getAllDatabasesUsage();
const canStore = await checkStorageQuota(5 * 1024 * 1024);
```

若遇�?`QuotaExceededError`，使�?`autoCleanOnQuotaError` 或手动调�?`cleanExpiredCache()`�?
---

## 高级能力

### 渐进式加�?
```jsx
<ProgressiveImage
  src="https://example.com/hero.jpg"
  stages={[
    { width: 20, quality: 20 },
    { width: 400, quality: 50 },
    { width: null, quality: 80 },
  ]}
  onStageComplete={(index) => console.log('阶段', index)}
/>
```

`loadImageProgressive` / `loadImagesProgressively` 也可在任意框架中使用，支持阶段回调、错误重试、缓存�?
### 浏览器压缩最佳实�?
| 场景 | 推荐参数 |
| --- | --- |
| 产品�?/ 详情�?| `quality: 0.9-1`, `compressionLevel: 0` |
| 列表缩略�?| `quality: 0.75-0.85`, `compressionLevel: 0.3` |
| 背景�?| `quality: 0.6-0.75`, `compressionLevel: 0.5`, `blur: 1-2` |

### 样式自定�?
```css
:root {
  --image-optimize-placeholder-bg: #f4f4f4;
  --image-optimize-loading-icon-color: #1890ff;
}

.my-wrapper .image-optimize-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

更多示例�?[STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md)�?
---

## FAQ & 故障排查

| 问题 | 解决方案 |
| --- | --- |
| Vue 中报 `ReactCurrentDispatcher` | 使用 `rv-image-optimize/utils-only` �?`dist/image-optimize-utils.cjs.js` |
| Webpack `Module parse failed` | Webpack4 配置 `worker-loader` 并使�?CJS 入口；Webpack5 直接使用 |
| `quality` 参数无效 | 升级�?v2.1.3+ |
| Worker 无法加载 | 确认构建工具处理 `.worker.js`，或禁用缓存相关功能 |
| IndexedDB 配额�?| 调用 `cleanExpiredCache()` / `deleteCache()`，或启用 `autoCleanOnQuotaError` |
| 懒加载不触发 | 检�?`immediate` 是否�?true，或 IntersectionObserver 是否可用 |
| Vue 中使�?`rootMargin` | 自行创建 IntersectionObserver，工具函数不处理该参�?|

更多问答与示例：�?[VUE_USAGE.md](./VUE_USAGE.md)�?
---

## 配套文档

| 文档 | 内容 |
| --- | --- |
| [ProgressiveImage.md](./ProgressiveImage.md) | 渐进式加载配置与示例 |
| [LOSSLESS_COMPRESS.md](./LOSSLESS_COMPRESS.md) | 无损压缩与上传集�?|
| [STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md) | 样式自定�?|
| [VUE_USAGE.md](./VUE_USAGE.md) | Vue/Vite/Webpack 详细接入 |
| [PUBLISH.md](./PUBLISH.md) | npm 发布流程 |

---

## License

ISC

---

欢迎在项目中自由组合 CDN 参数、IndexedDB 缓存、渐进式加载等能力。如果遇到问题或希望贡献新特性，欢迎提交 issue / PR 🙌



**错误3：尝试导�?React 组件**
```javascript
// �?错误：Vue 中不能使�?React 组件
import { LazyImage, ProgressiveImage } from 'rv-image-optimize';

// �?正确：只导入工具函数
import { optimizeImageUrl, loadImageProgressive } from 'rv-image-optimize/utils-only';
```

**错误4：ES 模块兼容性问�?*
如果遇到 `Cannot find module` �?`Module not found` 错误�?```javascript
// �?方式1：使�?utils-only 入口（推荐，构建后的文件�?import { optimizeImageUrl } from 'rv-image-optimize/utils-only';

// �?方式2：使用源码路径（需要支�?ES 模块�?import { optimizeImageUrl } from 'rv-image-optimize/utils';

// �?方式3：直接导�?lib（需要支�?ES 模块�?import { optimizeImageUrl } from 'rv-image-optimize/lib/imageOptimize.js';
```

#### 1. 安装依赖

```bash
npm install rv-image-optimize
```

**版本要求�?*
- 推荐使用最新版本（v2.1.2+�?- 如果使用旧版本（v1.x），请升级到最新版本以获得更好的兼容�?- 检查版本：`npm list rv-image-optimize`

#### 2. Vue3 使用示例（Composition API�?
```vue
<template>
  <div>
