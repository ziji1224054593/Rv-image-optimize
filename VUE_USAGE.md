# Vue 项目使用指南

## 问题说明

`rv-image-optimize` 是一个主要为 React 设计的图片优化库。如果在 Vue 项目中直接导入主入口，会因为缺少 React 环境而报错：

```
Uncaught TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')
```

## 解决方案

在 Vue 项目中，请使用 **工具函数专用入口** `utils-only`，它不包含任何 React 组件代码。

## 使用方法

### 1. 安装

```bash
npm install rv-image-optimize
```

### 2. 导入工具函数

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

### 3. 在 Vue 组件中使用

```vue
<template>
  <div>
    <img :src="optimizedUrl" alt="示例图片" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize/utils-only';

const originalUrl = ref('https://example.com/image.jpg');

const optimizedUrl = computed(() => {
  return optimizeImageUrl(originalUrl.value, {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp'
  });
});
</script>
```

### 4. 可用的工具函数

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

### 5. 创建 Vue 组件包装器（可选）

如果需要类似 React 组件的功能，可以基于工具函数创建 Vue 组件：

```vue
<template>
  <div class="lazy-image-container" :style="containerStyle">
    <img
      v-if="shouldLoad && optimizedSrc"
      :src="optimizedSrc"
      :alt="alt"
      :class="imageClassName"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="!shouldLoad" class="placeholder">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { optimizeImageUrl, loadImageWithCache } from 'rv-image-optimize/utils-only';

const props = defineProps({
  src: String,
  alt: String,
  width: [String, Number],
  height: [String, Number],
  optimize: Object,
});

const shouldLoad = ref(false);
const optimizedSrc = ref('');

const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}));

// 使用 Intersection Observer 实现懒加载
let observer = null;

onMounted(() => {
  if (typeof window !== 'undefined' && window.IntersectionObserver) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          shouldLoad.value = true;
          loadImage();
          observer?.unobserve(entry.target);
        }
      });
    });
    
    const container = document.querySelector('.lazy-image-container');
    if (container) {
      observer.observe(container);
    }
  } else {
    shouldLoad.value = true;
    loadImage();
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

const loadImage = async () => {
  try {
    const url = props.optimize 
      ? optimizeImageUrl(props.src, props.optimize)
      : props.src;
    
    // 尝试从缓存加载
    const cachedUrl = await loadImageWithCache(url);
    optimizedSrc.value = cachedUrl || url;
  } catch (error) {
    console.error('图片加载失败:', error);
    optimizedSrc.value = props.src;
  }
};

const handleLoad = () => {
  // 图片加载成功
};

const handleError = () => {
  // 图片加载失败
};
</script>
```

## 注意事项

1. **不要导入 React 组件**：`LazyImage` 和 `ProgressiveImage` 是 React 组件，不能在 Vue 中使用
2. **使用工具函数**：所有图片优化功能都可以通过工具函数实现
3. **样式文件**：如果需要样式，可以导入 `rv-image-optimize/styles`
4. **缓存功能**：工具函数支持 IndexedDB 缓存，可以提升性能

## 完整示例

```vue
<template>
  <div class="image-gallery">
    <div v-for="(image, index) in images" :key="index" class="image-item">
      <img 
        :src="getOptimizedUrl(image.url)" 
        :alt="image.alt"
        @load="onImageLoad(index)"
      />
      <div v-if="imageStats[index]" class="stats">
        节省: {{ imageStats[index].savedPercentage }}%
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  optimizeImageUrl, 
  compareImageSizes,
  formatFileSize 
} from 'rv-image-optimize/utils-only';

const images = ref([
  { url: 'https://example.com/image1.jpg', alt: '图片1' },
  { url: 'https://example.com/image2.jpg', alt: '图片2' },
]);

const imageStats = ref({});

const getOptimizedUrl = (url) => {
  return optimizeImageUrl(url, {
    width: 800,
    quality: 80,
    format: 'webp'
  });
};

const onImageLoad = async (index) => {
  const image = images.value[index];
  try {
    const comparison = await compareImageSizes(
      image.url,
      getOptimizedUrl(image.url)
    );
    imageStats.value[index] = {
      savedPercentage: comparison.savedPercentage,
      savedSize: formatFileSize(comparison.savedSize),
    };
  } catch (error) {
    console.error('获取图片统计失败:', error);
  }
};
</script>
```

## 更多信息

- 查看 [README.md](./README.md) 了解完整的 API 文档
- 查看 [lib/imageOptimize.js](./lib/imageOptimize.js) 了解所有可用的工具函数

