# rv-image-optimize

v2/v3(react) 图片优化工具和懒加载组件，支持多种CDN和自动格式转换。

## 功能特性

- 🚀 **多CDN支持**：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront
- 🎨 **自动格式转换**：自动检测浏览器支持的格式（AVIF、WebP、JPG等）
- 📱 **响应式图片**：支持 srcset 和 sizes 属性
- ⚡ **懒加载**：基于 Intersection Observer 的图片懒加载
- 🔧 **灵活配置**：支持自定义优化参数和错误处理
## 无损压缩
- 🚀 **真正无损**：100% 保留原始质量，无可见差异。
- 🎨 **多格式支持**：原生处理 PNG/WebP，JPEG 智能转换为最佳无损格式。
- ⚡ **GPU 加速**：自动启用 GPU 优化，显著提升大图处理速度。
- 🔗 **UI 组件兼容**：输出格式完美适配 Element UI Upload 等组件。
- 📞 **回调集成**：内置回调机制，便于无缝上传到服务器。
- 🔧 **即用即成**：无需手动验证，一步完成压缩与集成。
- 📦 **批量优化**：高效处理多张图片，支持并发操作。
- 📊 **智能统计**：详细报告压缩前后大小对比和节省比例。
## 渐进式加载
- 🚀 **多阶段自定义加载**：支持灵活配置多个加载阶段，例如先加载极小模糊图（20x20，质量20），逐步过渡到中等质量（400宽，质量50），最后原图（质量80）。
- 🎨 **平滑视觉过渡**：内置 CSS 动画和模糊效果（filter: blur），实现从低质量模糊到高清清晰的渐变，支持自定义动画时长和样式。
- ⚡ **高性能并发处理**：通过 `loadImagesProgressively` 函数支持批量加载多张图片，高并发、优先级排序和错误重试，不会阻塞页面。
- 🔧 **错误与超时控制**：内置超时机制（默认30秒）、重试选项和回调函数（onError、onStageComplete），确保加载可靠，并提供详细错误信息。
- 📱 **跨框架兼容**：React 中使用 ProgressiveImage 组件直接集成；Vue2/Vue3 通过工具函数（如 loadImageProgressive）手动实现，支持响应式和自定义 UI。
- 📊 **进度与回调支持**：实时进度回调（onProgress）、阶段完成通知和整体完成事件，便于集成 UI 更新，如进度条或动态显示。
- 💾 **IndexedDB 缓存**：已加载的图片自动缓存到 IndexedDB，下次访问时直接从缓存加载，大幅提升加载速度，减少网络请求。支持缓存开关控制。


### 插件预览地址 
#### [插件预览地址]( https://imageoptimize.gitee.io/rv-image-optimize)
### 渐进式加载指南请参考
####  [ProgressiveImage.md](https://gitee.com/imageOptimize/Rv-image-optimize/blob/master/ProgressiveImage.md)
### 无损压缩上传指南请参考
####  [LOSSLESS_COMPRESS.md](https://gitee.com/imageOptimize/Rv-image-optimize/blob/master/LOSSLESS_COMPRESS.md)
### 自定义样式指南请参考
####  [STYLE_CUSTOMIZATION.md](https://gitee.com/imageOptimize/Rv-image-optimize/blob/master/STYLE_CUSTOMIZATION.md)


### 安装

```bash
npm install rv-image-optimize
```

### 文件引用说明

当您使用 `import { LazyImage } from 'rv-image-optimize'` 时：

- **ES 模块环境**（现代打包工具如 Vite、Webpack 5+）：自动使用 `dist/image-optimize.es.js`
- **CommonJS 环境**（Node.js 或旧版 Webpack）：使用 `dist/image-optimize.cjs.js`
- **浏览器直接使用**：使用 `dist/image-optimize.umd.js`

当您使用 `import 'rv-image-optimize/styles'` 时：
- 自动引用 `dist/style.css` 样式文件

**注意**：所有引用都指向 `dist/` 目录中构建后的文件，这些文件已经过优化和打包，包含了所有必要的依赖（除了 React）。

### 基础使用

#### 1. 使用 LazyImage 组件（推荐）

```jsx
import { LazyImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';

function App() {
  return (
    <LazyImage
      src="https://example.com/image.jpg"
      alt="示例图片"
      width={800}
      height={600}
      optimize={{
        width: 800,
        quality: 85,
        autoFormat: true
      }}
      rootMargin="50px"
      onLoad={(e) => console.log('加载成功', e)}
      onError={(e) => console.log('加载失败', e)}
    />
  );
}
```

#### 2. 使用工具函数（从主入口导入）

```javascript
import { 
  optimizeImageUrl, 
  generateResponsiveImage,
  detectCDN,
  compareImageSizes 
} from 'rv-image-optimize';

// 优化单个图片URL
const optimizedUrl = optimizeImageUrl('https://example.com/image.jpg', {
  width: 800,
  quality: 85,
  autoFormat: true
});

// 生成响应式图片
const responsiveImg = generateResponsiveImage('https://example.com/image.jpg', {
  widths: [320, 640, 960, 1280],
  aspectRatio: 16/9,
  quality: 85
});

// 检测CDN
const cdn = detectCDN('https://example.oss-cn-hangzhou.aliyuncs.com/image.jpg');
console.log(cdn); // 'aliyun'

// 对比图片大小
const comparison = await compareImageSizes(
  originalUrl, 
  optimizedUrl
);
console.log(comparison.savedPercentage); // 节省比例
```

#### 3. 按需导入（推荐，减少打包体积）

如果您只需要部分功能，可以按需导入：

```javascript
// 方式1：通过 exports 路径导入（推荐）
import { optimizeImageUrl } from 'rv-image-optimize/utils';
import { compressImage } from 'rv-image-optimize/lossless';
import ProgressiveImage from 'rv-image-optimize/ProgressiveImage';

// 方式2：直接从 lib 或 src 导入（需要支持 ES 模块）
import { optimizeImageUrl } from 'rv-image-optimize/lib/imageOptimize.js';
import { getImageCache } from 'rv-image-optimize/lib/imageCache.js';
import LazyImage from 'rv-image-optimize/src/LazyImage.jsx';
import ProgressiveImage from 'rv-image-optimize/src/ProgressiveImage.jsx';
```

**可用的按需导入路径：**

| 导入路径 | 说明 | 包含内容 |
|---------|------|---------|
| `rv-image-optimize/utils` | 图片优化工具函数 | `optimizeImageUrl`, `loadImageProgressive`, `loadImagesProgressively` 等 |
| `rv-image-optimize/lossless` | 无损压缩工具 | `compressImage`, `compressImages` 等 |
| `rv-image-optimize/cache` | 缓存工具库 | `getImageCache`, `saveImageCache`, `loadImageWithCache` 等 |
| `rv-image-optimize/LazyImage` | LazyImage 组件 | `LazyImage` 组件（需要 React） |
| `rv-image-optimize/ProgressiveImage` | 渐进式加载组件 | `ProgressiveImage` 组件（需要 React） |
| `rv-image-optimize/lib/imageOptimize.js` | 完整工具库 | 所有图片优化相关函数 |
| `rv-image-optimize/lib/imageCache.js` | 缓存工具库 | IndexedDB 缓存相关函数 |
| `rv-image-optimize/lib/losslessCompress.js` | 无损压缩库 | 完整无损压缩功能 |
| `rv-image-optimize/src/LazyImage.jsx` | LazyImage 组件源码 | LazyImage 组件（需要 React） |
| `rv-image-optimize/src/ProgressiveImage.jsx` | ProgressiveImage 组件源码 | ProgressiveImage 组件（需要 React） |

**按需导入示例：**

```javascript
// ✅ 推荐：使用 exports 路径（更稳定）
import { optimizeImageUrl } from 'rv-image-optimize/utils';
import { compressImage } from 'rv-image-optimize/lossless';
import { getImageCache } from 'rv-image-optimize/cache';
import LazyImage from 'rv-image-optimize/LazyImage';
import ProgressiveImage from 'rv-image-optimize/ProgressiveImage';

// ✅ 也可以：直接从 lib 或 src 导入（需要支持 ES 模块）
import { optimizeImageUrl } from 'rv-image-optimize/lib/imageOptimize.js';
import { getImageCache } from 'rv-image-optimize/lib/imageCache.js';
import LazyImage from 'rv-image-optimize/src/LazyImage.jsx';
```

**注意：**
- 使用 `lib/` 或 `src/` 直接导入时，需要确保您的打包工具支持 ES 模块
- 如果使用 JSX 文件（`.jsx`），需要配置 React 和 JSX 转换
- 推荐使用 `exports` 路径（如 `rv-image-optimize/utils`），更稳定可靠

### Vue3 / Vue2 项目使用

> **注意**：`LazyImage` 组件是 React 组件，无法直接在 Vue 项目中使用。Vue 项目主要使用工具函数来优化图片 URL，然后配合 Vue 的 `<img>` 标签或自行实现懒加载功能。

#### 1. 安装依赖

```bash
npm install rv-image-optimize
```

#### 2. Vue3 使用示例（Composition API）

```vue
<template>
  <div>
    <!-- 使用工具函数优化后直接使用 img 标签 -->
    <img 
      :src="optimizedUrl" 
      alt="优化后的图片"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 或使用响应式图片 -->
    <img
      :src="responsive.src"
      :srcset="responsive.srcset"
      :sizes="responsive.sizes"
      alt="响应式图片"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { optimizeImageUrl, generateResponsiveImage } from 'rv-image-optimize';

const imageUrl = ref('https://example.com/image.jpg');

const optimizeOptions = ref({
  width: 800,
  quality: 85,
  autoFormat: true
});

// 使用工具函数优化图片URL
const optimizedUrl = computed(() => {
  return optimizeImageUrl(imageUrl.value, optimizeOptions.value);
});

// 生成响应式图片
const responsive = computed(() => {
  return generateResponsiveImage(imageUrl.value, {
    widths: [320, 640, 960, 1280],
    aspectRatio: 16/9,
    quality: 85
  });
});

const handleLoad = (e) => {
  console.log('加载成功', e);
};

const handleError = (e) => {
  console.log('加载失败', e);
};
</script>
```

#### 3. Vue3 使用示例（Options API）

```vue
<template>
  <div>
    <img 
      :src="optimizedUrl" 
      alt="优化后的图片"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script>
import { optimizeImageUrl } from 'rv-image-optimize';

export default {
  name: 'ImageComponent',
  data() {
    return {
      imageUrl: 'https://example.com/image.jpg',
      optimizeOptions: {
        width: 800,
        quality: 85,
        autoFormat: true
      }
    };
  },
  computed: {
    optimizedUrl() {
      return optimizeImageUrl(this.imageUrl, this.optimizeOptions);
    }
  },
  methods: {
    handleLoad(e) {
      console.log('加载成功', e);
    },
    handleError(e) {
      console.log('加载失败', e);
    }
  }
};
</script>
```

#### 4. Vue2 使用示例

```vue
<template>
  <div>
    <img 
      :src="optimizedUrl" 
      alt="优化后的图片"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script>
import { optimizeImageUrl } from 'rv-image-optimize';

export default {
  name: 'ImageComponent',
  data() {
    return {
      imageUrl: 'https://example.com/image.jpg',
      optimizeOptions: {
        width: 800,
        quality: 85,
        autoFormat: true
      }
    };
  },
  computed: {
    optimizedUrl() {
      return optimizeImageUrl(this.imageUrl, this.optimizeOptions);
    }
  },
  methods: {
    handleLoad(e) {
      console.log('加载成功', e);
    },
    handleError(e) {
      console.log('加载失败', e);
    }
  }
};
</script>
```

#### 5. Vue 中使用工具函数（响应式图片）

```vue
<template>
  <img
    :src="responsive.src"
    :srcset="responsive.srcset"
    :sizes="responsive.sizes"
    alt="响应式图片"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { generateResponsiveImage } from 'rv-image-optimize';

const imageUrl = ref('https://example.com/image.jpg');

const responsive = computed(() => {
  return generateResponsiveImage(imageUrl.value, {
    widths: [320, 640, 960, 1280],
    aspectRatio: 16/9,
    quality: 85
  });
});
</script>
```

#### 6. Vue 中批量图片优化

```vue
<template>
  <div class="image-gallery">
    <img
      v-for="(src, index) in images"
      :key="index"
      :src="getOptimizedUrl(src)"
      :alt="`图片 ${index + 1}`"
      class="gallery-image"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize';

const images = ref([
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  // ... 更多图片
]);

const imageConfig = {
  width: 200,
  quality: 80
};

const getOptimizedUrl = (src) => {
  return optimizeImageUrl(src, imageConfig);
};
</script>

<style scoped>
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.gallery-image {
  width: 100%;
  height: auto;
}
</style>
```

#### 7. Vue 中实现懒加载（使用 vue-lazyload 或自定义）

如果需要懒加载功能，可以配合第三方库使用：

```bash
# 安装 vue-lazyload（Vue2）
npm install vue-lazyload

# 或使用 vue-lazy-loading-component（Vue3）
npm install vue-lazy-loading-component
```

```vue
<template>
  <div>
    <!-- 使用 vue-lazyload (Vue2) -->
    <img v-lazy="optimizedUrl" alt="懒加载图片" />
    
    <!-- 或使用自定义懒加载 -->
    <img 
      v-if="shouldLoad"
      :src="optimizedUrl" 
      alt="懒加载图片"
      @load="handleLoad"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize';

const imageUrl = ref('https://example.com/image.jpg');
const shouldLoad = ref(false);

const optimizedUrl = computed(() => {
  return optimizeImageUrl(imageUrl.value, {
    width: 800,
    quality: 85
  });
});

// 使用 IntersectionObserver 实现懒加载
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        shouldLoad.value = true;
        observer.disconnect();
      }
    });
  }, { rootMargin: '50px' });
  
  const imgContainer = document.querySelector('.image-container');
  if (imgContainer) {
    observer.observe(imgContainer);
  }
});

const handleLoad = (e) => {
  console.log('加载成功', e);
};
</script>
```

#### 8. 在 Vue 项目中全局使用工具函数

```javascript
// main.js (Vue3)
import { createApp } from 'vue';
import App from './App.vue';
import { optimizeImageUrl, generateResponsiveImage } from 'rv-image-optimize';

const app = createApp(App);

// 全局注入工具函数
app.config.globalProperties.$optimizeImage = optimizeImageUrl;
app.config.globalProperties.$generateResponsive = generateResponsiveImage;

app.mount('#app');
```

```vue
<!-- 在组件中使用 -->
<template>
  <img :src="$optimizeImage(imageUrl, options)" />
</template>

<script setup>
import { getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance();
const imageUrl = 'https://example.com/image.jpg';
const options = { width: 800, quality: 85 };
</script>
```

### 高级功能

#### 1. 浏览器端压缩（当CDN不支持优化时）

```jsx
<LazyImage
  src="https://example.com/image.jpg"
  optimize={{
    width: 800,
    height: 600,
    quality: 80,
    compressionLevel: 0.5,  // 压缩程度 0-1（0=不压缩，1=最大压缩）
    blur: 0,                 // 模糊程度 0-10（0=不模糊）
    smooth: true,            // 图像平滑
  }}
  enableBrowserCompression={true}  // 默认启用
/>
```

#### 2. 懒加载批量图片

```jsx
function ImageGallery() {
  const images = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    // ... 更多图片
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
      {images.map((src, index) => (
        <LazyImage
          key={index}
          src={src}
          alt={`图片 ${index + 1}`}
          width={200}
          height={200}
          rootMargin="50px"
          optimize={{
            width: 200,
            quality: 80
          }}
        />
      ))}
    </div>
  );
}
```

#### 3. 响应式图片

```jsx
import { generateResponsiveImage } from 'rv-image-optimize';

function ResponsiveImage({ src }) {
  const responsive = generateResponsiveImage(src, {
    widths: [320, 640, 960, 1280],
    aspectRatio: 16/9,
    quality: 85
  });

  return (
    <img
      src={responsive.src}
      srcset={responsive.srcset}
      sizes={responsive.sizes}
      alt="响应式图片"
    />
  );
}
```

#### 4. 图片优化效果对比

组件会自动在控制台输出优化前后的图片大小对比：

```
✅ 图片优化效果 - 图片
原始URL: https://example.com/image.jpg
优化URL: https://example.com/image.jpg?x-oss-process=...
检测到的CDN: aliyun
原始大小: 2.5 MB (2621440 字节)
优化后大小: 450 KB (460800 字节)
节省大小: 2.05 MB (2160640 字节)
节省比例: 82.40%
```

### 完整配置示例

```jsx
<LazyImage
  src="https://example.com/image.jpg"
  alt="完整配置示例"
  width={800}
  height={600}
  className="my-image-container"
  imageClassName="my-image"
  immediate={false}              // 懒加载（默认）
  rootMargin="50px"             // 提前50px开始加载
  optimize={{
    width: 800,
    height: 600,
    quality: 85,                // 图片质量 0-100
    autoFormat: true,           // 自动选择最佳格式
    compressionLevel: 0,        // 压缩程度 0-1（0=不压缩）
    blur: 0,                    // 模糊程度 0-10（0=不模糊）
    smooth: true,               // 图像平滑
    format: null                // 自动格式（可选：webp/jpeg/png）
  }}
  enableBrowserCompression={true}  // 启用浏览器端压缩
  showPlaceholderIcon={true}       // 显示占位符图标
  showErrorMessage={true}          // 显示错误信息
  errorSrc={null}                  // 错误图片（null=使用内置占位符）
  onLoad={(e) => {
    console.log('图片加载成功', e);
  }}
  onError={(e) => {
    console.error('图片加载失败', e);
  }}
  onClick={(e) => {
    console.log('图片被点击', e);
  }}
/>
```

### 支持的CDN

- ✅ 阿里云OSS
- ✅ 腾讯云COS
- ✅ 七牛云
- ✅ 又拍云
- ✅ AWS CloudFront

如果图片URL不是以上CDN，会自动启用浏览器端压缩功能（如果启用）。

### 样式自定义

```css
/* 使用 CSS 变量自定义 */
:root {
  --image-optimize-placeholder-bg: #e0e0e0;
  --image-optimize-loading-icon-color: #1890ff;
  --image-optimize-error-icon-color: #ff4d4f;
}

/* 或使用 className 覆盖 */
.my-custom-wrapper .image-optimize-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```


### 最佳实践

#### 1. 性能优化建议

```jsx
// ✅ 推荐：使用合适的 rootMargin，避免过早加载
<LazyImage
  src="..."
  rootMargin="50px"  // 提前50px开始加载，平衡性能和体验
/>

// ❌ 不推荐：rootMargin 过大，会提前加载太多图片
<LazyImage
  src="..."
  rootMargin="500px"  // 太大了，会加载很多不可见的图片
/>
```

#### 2. 压缩参数建议

```jsx
// 高质量场景（产品图、详情图）
optimize={{
  quality: 90-100,
  compressionLevel: 0,
  blur: 0,
}}

// 缩略图场景（列表、卡片）
optimize={{
  quality: 75-85,
  compressionLevel: 0.3,
  blur: 0,
}}

// 背景图场景（可以接受模糊）
optimize={{
  quality: 60-75,
  compressionLevel: 0.5,
  blur: 1-2,
}}
```

#### 3. CDN 使用建议

- **优先使用支持的CDN**：阿里云OSS、腾讯云COS 等，性能最好
- **非CDN图片**：启用浏览器端压缩，减少渲染压力
- **检查优化效果**：查看控制台的优化效果对比，调整参数

#### 4. 批量图片优化

```jsx
// 批量图片使用相同的优化配置
const imageConfig = {
  width: 200,
  quality: 80,
  compressionLevel: 0,
};

{images.map((src, i) => (
  <LazyImage
    key={i}
    src={src}
    optimize={imageConfig}  // 复用配置
    rootMargin="50px"
  />
))}
```

### 常见问题

#### Q: 为什么图片还是模糊？
A: 检查以下几点：
1. 是否设置了 `compressionLevel > 0`？设置为 0
2. 是否设置了 `blur > 0`？设置为 0
3. 是否设置了 `width/height` 导致缩放？如果不需要缩放，不设置这些参数
4. 是否 `quality` 太低？建议至少 80-90

#### Q: 懒加载不生效？
A: 检查以下几点：
1. 是否设置了 `immediate={true}`？设置为 false 或不设置
2. 浏览器是否支持 IntersectionObserver？现代浏览器都支持
3. 图片是否在初始视口内？使用 `rootMargin` 控制提前加载距离

#### Q: 浏览器端压缩很慢？
A: 优化建议：
1. 减少 `compressionLevel`（0-0.3 即可）
2. 设置合适的 `maxWidth/maxHeight`，避免处理超大图片
3. 考虑使用 CDN 优化替代浏览器端压缩

#### Q: 如何关闭优化效果对比日志？
A: 目前无法关闭，但可以通过浏览器控制台过滤日志。

## 注意事项

1. 确保包名 `rv-image-optimize` 在 npm 上可用
2. 每次发布前更新版本号
3. 确保 README.md 文档完整
4. 测试构建后的文件是否正常工作
5. 测试不同 CDN 的图片URL
6. 测试浏览器端压缩功能
7. 验证懒加载在不同设备上的表现



## License

ISC
