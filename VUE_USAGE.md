# Vue 项目使用指南

## 核心结论

从 `3.x` 开始，Vue / Vite / Webpack / 原生 JS 项目都应统一使用 `rv-image-optimize/utils-only`。

不要再使用以下内部文件路径：

- `rv-image-optimize/src/*`
- `rv-image-optimize/lib/*`
- `rv-image-optimize/dist/*`

如果在 Vue 项目里直接导入根入口 `rv-image-optimize`，会因为其中包含 React 组件而报错：

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')
```

## 1. 安装

```bash
npm install rv-image-optimize
```

## 2. Vue 推荐用法

### 直接优化图片 URL

```vue
<script setup>
import { computed, ref } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize/utils-only';

const src = ref('https://example.com/image.jpg');
const optimized = computed(() => optimizeImageUrl(src.value, {
  width: 800,
  quality: 80,
  autoFormat: true,
}));
</script>

<template>
  <img :src="optimized" alt="优化图片" />
</template>
```

### 带缓存的加载

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { loadImageWithCache, optimizeImageUrl } from 'rv-image-optimize/utils-only';

const src = 'https://example.com/image.jpg';
const blobUrl = ref('');

onMounted(async () => {
  const optimizedUrl = optimizeImageUrl(src, { width: 1200, quality: 82 });
  blobUrl.value = await loadImageWithCache(optimizedUrl);
});
</script>

<template>
  <img v-if="blobUrl" :src="blobUrl" alt="缓存图片" />
</template>
```

### 浏览器端压缩返回对象

```vue
<script setup>
import { ref } from 'vue';
import { compressImageInBrowser } from 'rv-image-optimize/utils-only';

const previewUrl = ref('');
const compressionInfo = ref(null);

async function handleChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const result = await compressImageInBrowser(file, {
    maxWidth: 1280,
    quality: 0.82,
    format: 'webp',
  });

  previewUrl.value = result.dataURL || result.url || '';
  compressionInfo.value = {
    compressedSize: result.compressedSize,
    savedPercentage: result.savedPercentage,
    compressedFileName: result.compressedFileName,
  };
}
</script>

<template>
  <input type="file" accept="image/*" @change="handleChange" />
  <img v-if="previewUrl" :src="previewUrl" alt="压缩预览" />
</template>
```

常用返回字段：

- `file`：压缩后的 `File`
- `blob`：压缩后的 `Blob`
- `dataURL` / `url`：压缩预览地址
- `originalSize` / `compressedSize` / `savedPercentage`
- `compressedFileName` / `compressedFormat`

## 3. 在 Vue 中封装自己的图片组件

`3.x` 不再通过 npm 包直接导出 `LazyImage.vue` 与 `LazyImage.css`。如果你需要 Vue 组件形态，推荐基于 `utils-only` 自己封一层，这样组件 API 也更容易贴合你的业务。

```vue
<script setup>
import { computed } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize/utils-only';

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  width: { type: Number, default: 800 },
  quality: { type: Number, default: 80 },
});

const optimizedSrc = computed(() => optimizeImageUrl(props.src, {
  width: props.width,
  quality: props.quality,
  autoFormat: true,
}));
</script>

<template>
  <img :src="optimizedSrc" :alt="alt" loading="lazy" />
</template>
```

## 4. Webpack 使用说明

如果你只关心 `Webpack`，建议优先查看独立文档 [WEBPACK_USAGE.md](./WEBPACK_USAGE.md)。

### Webpack 5

- 直接使用 `rv-image-optimize/utils-only`
- Worker 能力通常可直接工作

### Webpack 4

- 继续使用 `rv-image-optimize/utils-only`
- 需要为 `.worker.js` 增加 `worker-loader`

```javascript
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

如果你的项目仍是 CommonJS，也可以这样导入：

```javascript
const { optimizeImageUrl, loadImageWithCache } = require('rv-image-optimize/utils-only');
```

## 5. 常用能力

从 `rv-image-optimize/utils-only` 可直接导入：

- 图片优化：`optimizeImageUrl`、`generateResponsiveImage`、`detectCDN`
- 渐进式加载：`loadImageProgressive`、`loadImagesProgressively`
- 缓存：`setCache`、`getCache`、`loadImageWithCache`、`cleanExpiredCache`、`deleteDatabase`
- 浏览器压缩：`compressImageInBrowser`、`dataURLToBlob`
- 上传：`uploadFileWithConfig`、`compressAndUploadFiles`

## 6. 常见问题

- `ReactCurrentDispatcher`：说明误用了根入口，请改成 `rv-image-optimize/utils-only`
- `Module parse failed`：Webpack 4 未处理 Worker，请补 `worker-loader`
- `"./utils-only" is not exported`：通常是旧版本缓存，重新安装最新版并重启 dev server
- 想使用渐进式效果：请参考 [ProgressiveImage.md](./ProgressiveImage.md) 里的 Vue 工具函数示例
- `deleteDatabase()` 很慢或像卡住：当前版本会在删库或版本变更时主动关闭主线程 / Worker 持有的 IndexedDB 连接，并保留阻塞等待与超时保护；如果开发环境里还有旧页面或同源标签页占用，请先刷新页面或关闭相关标签页后再重试

## 更多信息

- 完整 API：见 [README.md](./README.md)
- 渐进式加载：见 [ProgressiveImage.md](./ProgressiveImage.md)
- 上传编排：见 [UPLOAD_PIPELINE.md](./UPLOAD_PIPELINE.md)