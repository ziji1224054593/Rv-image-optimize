# rv-image-optimize 渐进式图片加载

## 功能介绍

渐进式图片加载（Progressive Image Loading）是一种优化图片加载体验的技术。它通过多个阶段逐步加载图片，从低质量的模糊版本（快速加载）过渡到高质量的清晰版本（最终完整图片）。这在网络较慢或图片较大的场景下特别有用，能减少用户等待时间，提高感知性能。

### 关键特性
- 🚀 **多阶段自定义加载**：支持灵活配置多个加载阶段，例如先加载极小模糊图（20x20，质量20），逐步过渡到中等质量（400宽，质量50），最后原图（质量80）。
- 🎨 **平滑视觉过渡**：内置 CSS 动画和模糊效果（filter: blur），实现从低质量模糊到高清清晰的渐变，支持自定义动画时长和样式。
- ⚡ **高性能并发处理**：通过 `loadImagesProgressively` 函数支持批量加载多张图片，高并发、优先级排序和错误重试，不会阻塞页面。
- 🔧 **错误与超时控制**：内置超时机制（默认30秒）、重试选项和回调函数（onError、onStageComplete），确保加载可靠，并提供详细错误信息。
- 📱 **跨框架兼容**：React 中使用 ProgressiveImage 组件直接集成；Vue2/Vue3 通过工具函数（如 loadImageProgressive）手动实现，支持响应式和自定义 UI。
- 📊 **进度与回调支持**：实时进度回调（onProgress）、阶段完成通知和整体完成事件，便于集成 UI 更新，如进度条或动态显示。
- 💾 **IndexedDB 缓存**：已加载的图片自动缓存到 IndexedDB，下次访问时直接从缓存加载，大幅提升加载速度，减少网络请求。支持缓存开关控制（`enableCache` 参数，默认 `true`）。

在 React 中，通过 `ProgressiveImage` 组件实现；在 Vue 中，使用工具函数 `loadImageProgressive` 手动实现。

---

## React 组件使用方式

`ProgressiveImage` 是 React 专属组件，导入自 `rv-image-optimize`。它自动处理渐进式加载、占位符和错误显示。

### 安装和导入
```bash
npm install rv-image-optimize
```

```jsx
import { ProgressiveImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles'; // 导入样式（可选，自定义样式见 STYLE_CUSTOMIZATION.md）
```

### ProgressiveImage 组件参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `src` | `string` | ✅ | `''` | 原始图片URL（必填） |
| `alt` | `string` | ❌ | `''` | 图片alt文本 |
| `width` | `string \| number` | ❌ | `'100%'` | 容器宽度（支持像素或百分比） |
| `height` | `string \| number` | ❌ | `'auto'` | 容器高度（支持像素或'auto'） |
| `className` | `string` | ❌ | `''` | 容器类名，用于自定义样式 |
| `imageClassName` | `string` | ❌ | `''` | 图片元素类名 |
| `imageStyle` | `Object` | ❌ | `{}` | 图片元素的额外样式 |
| `stages` | `Array<StageConfig>` | ❌ | `[{ width: 20, quality: 20 }, { width: 400, quality: 50 }, { width: null, quality: 80 }]` | 加载阶段配置数组（详见下方 StageConfig 类型） |
| `transitionDuration` | `number` | ❌ | `300` | 过渡动画时间（毫秒） |
| `timeout` | `number` | ❌ | `30000` | 每个阶段的加载超时时间（毫秒） |
| `showPlaceholder` | `boolean` | ❌ | `true` | 是否显示初始占位符图标 |
| `enableCache` | `boolean` | ❌ | `true` | 是否启用 IndexedDB 缓存 |
| `onStageComplete` | `Function` | ❌ | `null` | 阶段完成回调：`(stageIndex: number, stageUrl: string, stage: StageConfig) => void` |
| `onComplete` | `Function` | ❌ | `null` | 全部完成回调：`(finalUrl: string) => void` |
| `onError` | `Function` | ❌ | `null` | 错误回调：`(error: Error, stageIndex: number) => void` |
| `onLoad` | `Function` | ❌ | `null` | 最终加载完成回调：`(event: Event) => void` |

### StageConfig 类型（stages 数组中的每个对象）

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `width` | `number \| null` | ❌ | `null` | 图片宽度（像素），`null` 表示原图宽度 |
| `height` | `number \| null` | ❌ | `null` | 图片高度（像素），`null` 表示按比例 |
| `quality` | `number` | ❌ | `80` | 图片质量（0-100） |
| `format` | `string \| null` | ❌ | `null` | 输出格式：`'webp' \| 'jpg' \| 'png' \| 'avif'`，`null` 表示自动 |
| `autoFormat` | `boolean` | ❌ | `true` | 是否自动选择最佳格式（AVIF > WebP > JPG） |

### 使用示例

```jsx
import { ProgressiveImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';

function App() {
  return (
    <ProgressiveImage
      src="https://example.com/image.jpg"
      alt="渐进式加载图片"
      width="100%"
      height={400}
      stages={[
        { width: 20, quality: 20 },   // 阶段1: 极速模糊图
        { width: 400, quality: 50 },   // 阶段2: 中等质量
        { width: null, quality: 80 }    // 阶段3: 最终质量（原图）
      ]}
      timeout={30000}  // 每个阶段的加载超时时间（毫秒，默认30000）
      transitionDuration={300}
      onStageComplete={(stageIndex, stageUrl, stage) => {
        console.log(`阶段 ${stageIndex + 1} 完成`);
      }}
      onComplete={(finalUrl) => {
        console.log('全部加载完成');
      }}
      onError={(error, stageIndex) => {
        console.error('加载失败', error);
      }}
      enableCache={true}  // 启用缓存（默认 true）
    />
  );
}
```

---

## Vue2 和 Vue3 工具函数使用方式

`ProgressiveImage` 是 React 组件，无法直接在 Vue 中使用。但您可以使用 `loadImageProgressive` 工具函数手动实现渐进式加载（从模糊到清晰）。该函数返回 Promise，支持阶段回调。

### 导入
```javascript
import { loadImageProgressive, generateBlurPlaceholderUrl } from 'rv-image-optimize/utils-only';
```

### loadImageProgressive 函数

#### 函数签名
```typescript
loadImageProgressive(
  url: string,
  options?: LoadImageProgressiveOptions
): Promise<LoadImageProgressiveResult>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `url` | `string` | ✅ | - | 原始图片URL |
| `options` | `LoadImageProgressiveOptions` | ❌ | `{}` | 配置选项对象（详见下方） |

#### LoadImageProgressiveOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `stages` | `Array<StageConfig>` | ❌ | `[{ width: 20, quality: 20, blur: 10 }, { width: 400, quality: 50, blur: 3 }, { width: null, quality: 80, blur: 0 }]` | 加载阶段配置数组（同 React 组件） |
| `timeout` | `number` | ❌ | `30000` | 每个阶段超时（毫秒） |
| `enableCache` | `boolean` | ❌ | `true` | 是否启用 IndexedDB 缓存 |
| `urlTransformer` | `Function` | ❌ | `null` | URL转换函数：`(url: string, stage: StageConfig, stageIndex: number) => string` |
| `onStageComplete` | `Function` | ❌ | `null` | 阶段完成回调：`(stageIndex: number, stageUrl: string, stage: StageConfig) => void` |
| `onStageError` | `Function` | ❌ | `null` | 阶段错误回调：`(error: Error, stageIndex: number, stageUrl: string, stage: StageConfig) => string \| null`，返回降级URL或null |
| `onComplete` | `Function` | ❌ | `null` | 全部完成回调：`(finalUrl: string) => void` |
| `onError` | `Function` | ❌ | `null` | 错误回调：`(error: Error, stageIndex: number) => void` |

#### 返回值类型：LoadImageProgressiveResult

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `url` | `string` | 最终图片URL |
| `stages` | `Array<StageResult>` | 阶段结果数组 |
| `success` | `boolean` | 是否成功 |
| `error` | `Error \| null` | 错误信息（失败时） |

#### StageResult 类型

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `url` | `string` | 阶段图片URL |
| `stage` | `StageConfig` | 阶段配置对象 |
| `loaded` | `boolean` | 是否已加载 |

### Vue3 使用示例（Composition API）

```vue
<template>
  <div>
    <img :src="currentImageUrl" :alt="alt" :style="imageStyle" />
    <div v-if="isLoading">加载中... 阶段 {{ currentStage + 1 }} / {{ totalStages }}</div>
    <div v-if="hasError">加载失败: {{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { loadImageProgressive, generateBlurPlaceholderUrl } from 'rv-image-optimize/utils-only';

const src = 'https://example.com/image.jpg';
const alt = '渐进式加载图片';
const currentImageUrl = ref('');
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const currentStage = ref(0);
const totalStages = ref(3);

onMounted(async () => {
  // 初始化模糊占位符
  currentImageUrl.value = generateBlurPlaceholderUrl(src, { width: 20, quality: 20 });
  isLoading.value = true;

  try {
    await loadImageProgressive(src, {
      stages: [
        { width: 20, quality: 20 },
        { width: 400, quality: 50 },
        { width: null, quality: 80 }
      ],
      timeout: 30000,
      onStageComplete: (stageIndex, stageUrl) => {
        currentImageUrl.value = stageUrl;
        currentStage.value = stageIndex;
      },
      onComplete: (finalUrl) => {
        currentImageUrl.value = finalUrl;
        isLoading.value = false;
      },
      onError: (error, stageIndex) => {
        hasError.value = true;
        errorMessage.value = error.message;
      },
      enableCache: true  // 启用缓存（默认 true）
    });
  } catch (error) {
    hasError.value = true;
    errorMessage.value = error.message;
  }
});

const imageStyle = {
  width: '100%',
  height: 'auto',
  transition: 'filter 300ms ease-in-out',
  filter: isLoading.value ? 'blur(10px)' : 'none'  // 简单模糊效果
};
</script>
```

### Vue2 使用示例（Options API）

```vue
<template>
  <div>
    <img :src="currentImageUrl" :alt="alt" :style="imageStyle" />
    <div v-if="isLoading">加载中... 阶段 {{ currentStage + 1 }} / {{ totalStages }}</div>
    <div v-if="hasError">加载失败: {{ errorMessage }}</div>
  </div>
</template>

<script>
import { loadImageProgressive, generateBlurPlaceholderUrl } from 'rv-image-optimize/utils-only';

export default {
  name: 'ImageComponent',
  data() {
    return {
      src: 'https://example.com/image.jpg',
      alt: '渐进式加载图片',
      currentImageUrl: '',
      isLoading: false,
      hasError: false,
      errorMessage: '',
      currentStage: 0,
      totalStages: 3
    };
  },
  mounted() {
    // 初始化模糊占位符
    this.currentImageUrl = generateBlurPlaceholderUrl(this.src, { width: 20, quality: 20 });
    this.isLoading = true;

    loadImageProgressive(this.src, {
      stages: [
        { width: 20, quality: 20 },
        { width: 400, quality: 50 },
        { width: null, quality: 80 }
      ],
      timeout: 30000,
      onStageComplete: (stageIndex, stageUrl) => {
        this.currentImageUrl = stageUrl;
        this.currentStage = stageIndex;
      },
      onComplete: (finalUrl) => {
        this.currentImageUrl = finalUrl;
        this.isLoading = false;
      },
      onError: (error, stageIndex) => {
        this.hasError = true;
        this.errorMessage = error.message;
      },
      enableCache: true  // 启用缓存（默认 true）
    }).catch(error => {
      this.hasError = true;
      this.errorMessage = error.message;
    });
  },
  computed: {
    imageStyle() {
      return {
        width: '100%',
        height: 'auto',
        transition: 'filter 300ms ease-in-out',
        filter: this.isLoading ? 'blur(10px)' : 'none'
      };
    }
  }
};
</script>
```

---

## 批量渐进式加载 (loadImagesProgressively)

如果需要同时加载多张图片（例如图片画廊），可以使用 `loadImagesProgressively` 函数。它支持高并发、优先级排序、错误重试和进度回调，实现批量从模糊到清晰的渐进式加载。

### 导入
```javascript
import { loadImagesProgressively } from 'rv-image-optimize/utils-only';
```

### loadImagesProgressively 函数

#### 函数签名
```typescript
loadImagesProgressively(
  imageList: Array<string | ImageItem>,
  options?: LoadImagesProgressivelyOptions
): Promise<Array<LoadResult>>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageList` | `Array<string \| ImageItem>` | ✅ | - | 图片URL数组，或包含 `url` 和可选 `priority` 的对象数组（priority 值越大优先级越高） |

#### ImageItem 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `url` | `string` | ✅ | - | 图片URL |
| `priority` | `number` | ❌ | `0` | 优先级（值越大优先级越高） |

#### LoadImagesProgressivelyOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `stages` | `Array<StageConfig>` | ❌ | `[{ width: 20, quality: 20 }, { width: 400, quality: 50 }, { width: null, quality: 80 }]` | 每个图片的加载阶段配置（同 loadImageProgressive） |
| `concurrency` | `number` | ❌ | `10` | 并发加载数量 |
| `timeout` | `number` | ❌ | `30000` | 每个阶段超时（毫秒） |
| `priority` | `boolean` | ❌ | `true` | 是否按优先级加载 |
| `retryOnError` | `boolean` | ❌ | `false` | 是否重试失败的加载 |
| `maxRetries` | `number` | ❌ | `1` | 最大重试次数 |
| `enableCache` | `boolean` | ❌ | `true` | 是否启用 IndexedDB 缓存 |
| `urlTransformer` | `Function` | ❌ | `null` | URL转换函数：`(url: string, stage: StageConfig, stageIndex: number) => string` |
| `onStageError` | `Function` | ❌ | `null` | 阶段错误回调：`(error: Error, stageIndex: number, stageUrl: string, stage: StageConfig) => string \| null` |
| `onProgress` | `Function` | ❌ | `null` | 整体进度回调：`(current: number, total: number, result: LoadResult) => void` |
| `onItemComplete` | `Function` | ❌ | `null` | 单个图片完成回调：`(result: LoadResult) => void` |
| `onItemStageComplete` | `Function` | ❌ | `null` | 单个图片阶段完成回调：`(stageResult: StageResult, stageIndex: number) => void` |

#### 返回值类型：Array<LoadResult>

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `url` | `string` | 最终图片URL |
| `success` | `boolean` | 是否成功 |
| `error` | `Error \| null` | 错误信息（失败时） |
| `index` | `number` | 原始索引 |
| `retries` | `number` | 重试次数 |
| `stages` | `Array<StageResult>` | 阶段信息（可选） |

### 使用示例

```javascript
const imageUrls = [
  'https://example.com/image1.jpg',
  { url: 'https://example.com/image2.jpg', priority: 10 }
];

const results = await loadImagesProgressively(imageUrls, {
  concurrency: 10,
  stages: [
    { width: 20, quality: 20 },
    { width: 400, quality: 50 },
    { width: null, quality: 80 }
  ],
  onItemStageComplete: (stageResult, stageIndex) => {
    console.log(`图片 ${stageResult.index} 阶段 ${stageIndex + 1} 完成: ${stageResult.stageUrl}`);
  },
  onItemComplete: (result) => {
    console.log(`图片 ${result.index} 完成: ${result.url}`);
  }
});
```

### React 集成示例

```jsx
import { useState, useEffect } from 'react';
import { loadImagesProgressively } from 'rv-image-optimize/utils-only';

function ImageGallery({ imageUrls }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadImagesProgressively(imageUrls, {
      concurrency: 10,
      onItemStageComplete: (stageResult) => {
        setImages(prev => {
          const newImages = [...prev];
          newImages[stageResult.index] = stageResult.stageUrl;
          return newImages;
        });
      }
    });
  }, [imageUrls]);

  return (
    <div>
      {images.map((url, i) => <img key={i} src={url} alt={`Image ${i}`} />)}
    </div>
  );
}
```

### Vue3 集成示例

```vue
<template>
  <div>
    <img v-for="(url, i) in images" :key="i" :src="url" :alt="`Image ${i}`" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { loadImagesProgressively } from 'rv-image-optimize/utils-only';

const images = ref([]);
const imageUrls = ['url1', 'url2']; // 您的图片列表

onMounted(async () => {
  await loadImagesProgressively(imageUrls, {
    concurrency: 10,
    onItemStageComplete: (stageResult) => {
      images.value[stageResult.index] = stageResult.stageUrl;
    }
  });
});
</script>
```

---

## IndexedDB 缓存功能

渐进式加载支持 IndexedDB 缓存，可以大幅提升图片加载速度，减少网络请求。

### 缓存机制

- **自动缓存**：图片加载完成后，会自动将图片数据保存到 IndexedDB
- **自动读取**：下次访问相同 URL 时，优先从缓存读取，瞬间显示
- **缓存键**：使用最终优化后的 URL 作为缓存键，确保缓存准确性
- **Blob URL**：从缓存读取的图片会创建 Blob URL，可以直接用于 `<img>` 标签

### 使用方式

#### React 组件

```jsx
<ProgressiveImage
  src="https://example.com/image.jpg"
  enableCache={true}  // 启用缓存（默认 true）
  // ... 其他配置
/>
```

#### 工具函数

```javascript
import { loadImageProgressive, loadImagesProgressively } from 'rv-image-optimize/utils-only';

// 单个图片
await loadImageProgressive(url, {
  enableCache: true,  // 启用缓存（默认 true）
  // ... 其他配置
});

// 批量图片
await loadImagesProgressively(imageList, {
  enableCache: true,  // 启用缓存（默认 true）
  // ... 其他配置
});
```

### 缓存管理

如果需要手动管理缓存，可以使用通用缓存 API：

```javascript
import { 
  setCache, 
  getCache, 
  deleteCache,
  cleanExpiredCache 
} from 'rv-image-optimize/utils-only';

// 图片缓存键格式：image:{url}
const imageUrl = 'https://example.com/image.jpg';
const cacheKey = `image:${imageUrl}`;

// 获取缓存
const cached = await getCache(cacheKey);
if (cached && cached.data && cached.mimeType) {
  // cached.data 是 base64 格式的图片数据（如：'data:image/jpeg;base64,...'）
  // cached.mimeType 是图片的 MIME 类型（如：'image/jpeg'）
}

// 保存缓存（通常不需要手动调用，加载函数会自动保存）
await setCache(cacheKey, {
  data: 'data:image/jpeg;base64,...',  // base64 格式的图片数据
  mimeType: 'image/jpeg'                // MIME 类型
}, 30 * 24); // 30 天过期（默认）

// 删除缓存
await deleteCache(cacheKey);

// 清理过期缓存（默认 30 天过期）
await cleanExpiredCache();
```

**注意**：图片缓存现在使用通用缓存 API，所有图片数据存储在 `generalCache` 表中。缓存键使用 `image:` 前缀以区分图片数据和其他数据。

### 注意事项

1. **缓存大小**：IndexedDB 有存储限制（通常 50MB-数GB），建议定期清理过期缓存
2. **缓存键**：使用 `image:{最终优化后的URL}` 作为缓存键，确保不同优化参数的图片不会互相覆盖
3. **Blob URL**：从缓存读取的图片会创建 Blob URL，浏览器会自动管理这些 URL 的生命周期
4. **隐私模式**：在隐私模式下，IndexedDB 可能不可用，会自动降级为网络加载
5. **跨域问题**：缓存功能需要图片支持 CORS，否则无法保存到 IndexedDB
6. **Worker 架构**：缓存操作在 Web Worker 中执行，不会阻塞主线程。如果浏览器不支持 Worker，会自动降级到主线程
7. **存储格式**：图片数据以 base64 字符串格式存储，包含完整的 data URL（如：`data:image/jpeg;base64,...`）

### 性能优势

- **首次加载**：正常网络加载，并保存到缓存
- **二次加载**：从缓存读取，加载速度提升 10-100 倍
- **减少流量**：避免重复下载相同图片，节省用户流量
- **离线支持**：已缓存的图片在离线状态下也能正常显示
