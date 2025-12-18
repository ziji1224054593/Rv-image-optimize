# Vue 项目使用指南

## 问题说明

`rv-image-optimize` 是一个主要为 React 设计的图片优化库。如果在 Vue 项目中直接导入主入口，会因为缺少 React 环境而报错：

```
Uncaught TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')
```

## 解决方案

在 Vue 项目中，请使用 **工具函数专用入口** `utils-only`，它不包含任何 React 组件代码。

**注意：** 现在项目也提供了专门的 Vue 组件 `LazyImage.vue`，可以直接在 Vue 项目中使用。

## 使用方法

### 1. 安装

```bash
npm install rv-image-optimize
```

### 2. 使用 Vue 组件（推荐）

项目提供了专门的 Vue 组件 `LazyImage.vue`，可以直接在 Vue 项目中使用：

```vue
<template>
  <div class="app-container">
    <h1>图片优化示例</h1>
    
    <div class="demo-section">
      <h2>懒加载 + 渐进式加载示例</h2>
      <LazyImage
        :src="imageUrl"
        :alt="'渐进式加载图片'"
        width="100%"
        :height="300"
        root-margin="50px"
        :progressive="true"
        :progressive-stages="[
          { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
          { width: 400, quality: 50, blur: 3 },   // 阶段2: 中等质量
          { width: null, quality: 80, blur: 1 }   // 阶段3: 最终质量（原图）
        ]"
        :progressive-transition-duration="300"
        :progressive-timeout="30000"
        @progressive-stage-complete="handleProgressiveStageComplete"
        @load="handleImageLoad"
      />
    </div>
  </div>
</template>

<script setup>
import LazyImage from "rv-image-optimize/src/LazyImage.vue"

const imageUrl = "https://example.com/image.jpg"

const handleProgressiveStageComplete = (stageIndex, stageUrl, stage) => {
  // 可以在这里处理阶段完成事件
  console.log(`阶段 ${stageIndex + 1} 完成`)
}

const handleImageLoad = (event, optimizationInfo) => {
  console.log('图片加载成功', optimizationInfo)
}
</script>

<style scoped>
@import 'rv-image-optimize/src/LazyImage.css';
</style>
```

### 3. 组件属性说明

`LazyImage.vue` 组件支持以下属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | String | '' | 图片原始URL |
| `alt` | String | '' | 图片alt文本 |
| `width` | String/Number | '100%' | 容器宽度 |
| `height` | String/Number | 'auto' | 容器高度 |
| `immediate` | Boolean | false | 是否立即加载（不懒加载） |
| `rootMargin` | String | '50px' | IntersectionObserver的rootMargin |
| `progressive` | Boolean | false | 是否启用渐进式加载 |
| `progressiveStages` | Array | 见默认值 | 渐进式加载阶段配置 |
| `progressiveTransitionDuration` | Number | 300 | 过渡动画时间（毫秒） |
| `progressiveTimeout` | Number | 30000 | 每个阶段加载超时时间 |
| `progressiveEnableCache` | Boolean | true | 是否启用缓存 |

### 4. 事件说明

组件支持以下事件：
- `@load`: 图片加载完成事件
- `@progressive-stage-complete`: 渐进式加载每个阶段完成事件
- `@error`: 图片加载失败事件
- `@click`: 图片点击事件
- `@optimization`: 优化信息事件

### 5. 查看完整示例

请查看项目中的 `test.vue` 文件，其中包含了 `LazyImage.vue` 组件的完整使用示例：

- **文件位置**: `test.vue`
- **示例内容**: 包含懒加载、渐进式加载、多图片展示等完整示例
- **样式导入**: 展示了如何正确导入组件的样式文件

### 6. 使用工具函数（替代方案）

如果不想使用 Vue 组件，也可以使用工具函数：

```javascript
// ✅ 正确：使用 utils-only 入口（推荐）
import { 
  optimizeImageUrl,
  detectCDN,
  formatFileSize,
  loadImageWithCache,
  // ... 其他工具函数
} from 'rv-image-optimize/utils-only';

// ❌ 错误：不要使用主入口（包含 React 组件）
// import { LazyImage } from 'rv-image-optimize'; // 这会导致错误
```

### 7. 可用的工具函数

从 `utils-only` 入口可以导入以下工具函数：

#### 图片优化相关
- `optimizeImageUrl(url, options)` - 优化图片 URL
- `detectCDN(url)` - 检测 CDN 类型
- `detectSupportedFormats()` - 检测浏览器支持的格式
- `getBestFormat(url)` - 获取最佳格式
- `generateSrcset(url, sizes)` - 生成 srcset
- `generateSizes(breakpoints)` - 生成 sizes 属性
- `generateResponsiveImage(url, options)` - 生成响应式图片
- `getOptimizedCoverUrl(url, options)` - 获取优化后的封面图 URL
- `generateBlurPlaceholderUrl(url, options)` - 生成模糊占位符 URL

#### 图片加载相关
- `preloadImage(url)` - 预加载图片
- `preloadImages(urls)` - 预加载多张图片
- `loadImagesProgressively(urls, options)` - 渐进式加载多张图片
- `loadImageProgressive(url, options)` - 渐进式加载单张图片
- `loadImagesProgressiveBatch(urls, options)` - 批量渐进式加载

#### 图片处理相关
- `compressImageInBrowser(file, options)` - 浏览器端压缩图片
- `dataURLToBlob(dataURL)` - 将 data URL 转换为 Blob
- `getImageSize(url)` - 获取图片尺寸
- `formatFileSize(bytes)` - 格式化文件大小
- `compareImageSizes(originalUrl, optimizedUrl)` - 对比图片大小

#### 缓存相关
- `setCache(key, value)` - 设置缓存
- `getCache(key)` - 获取缓存
- `deleteCache(key)` - 删除缓存
- `hasCache(key)` - 检查缓存是否存在
- `loadImageWithCache(url)` - 使用缓存加载图片
- `loadImageProgressiveWithCache(url, options)` - 使用缓存渐进式加载

## 注意事项

1. **推荐使用 Vue 组件**: `LazyImage.vue` 组件专门为 Vue 设计，使用更方便
2. **查看示例文件**: 完整的使用示例请参考 `test.vue` 文件
3. **样式文件**: 使用组件时记得导入样式文件 `@import 'rv-image-optimize/src/LazyImage.css'`
4. **缓存功能**: 工具函数支持 IndexedDB 缓存，可以提升性能

## 更多信息

- 查看 [README.md](./README.md) 了解完整的 API 文档
- 查看 [lib/imageOptimize.js](./lib/imageOptimize.js) 了解所有可用的工具函数
- 查看 `test.vue` 文件获取完整的 Vue 组件使用示例