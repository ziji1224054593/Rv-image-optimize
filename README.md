# rv-image-optimize

> **⚠️ 重要提示：请升级到最新版本 v2.1.2+**
> 
> **本次重大更新（v2.1.2）**：
> - 🔄 **IndexedDB 架构重构**：采用 Worker 架构，所有缓存操作在后台线程执行，避免阻塞主线程
> - 🛡️ **自动降级支持**：浏览器不支持 Worker 时自动降级到主线程，确保兼容性
> - 🗄️ **通用缓存 API**：支持多数据库、多表（objectStore）存储，可存储任意数据，不再局限于图片
> - 🚫 **API 变更**：移除了旧的图片专用缓存 API（`getImageCache`, `saveImageCache`, `deleteImageCache` 等），统一使用通用缓存 API（`setCache`, `getCache`, `deleteCache`）
> - 📦 **存储统一**：所有图片缓存统一存储在 `generalCache` 表中，使用 `image:` 前缀的键名
> 
> **升级指南**：如果您使用了旧的图片缓存 API，请参考文档更新为通用缓存 API。详情请查看 [通用缓存 API 文档](#通用缓存-apiindexeddb)

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
- 💾 **IndexedDB 缓存**：已加载的图片自动缓存到 IndexedDB，下次访问时直接从缓存加载，大幅提升加载速度，减少网络请求。支持缓存开关控制。采用 Worker 架构，避免阻塞主线程，不支持 Worker 时自动降级。


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
import { setCache, getCache } from 'rv-image-optimize/lib/imageCache.js';
import LazyImage from 'rv-image-optimize/src/LazyImage.jsx';
import ProgressiveImage from 'rv-image-optimize/src/ProgressiveImage.jsx';
```

**可用的按需导入路径：**

| 导入路径 | 说明 | 包含内容 |
|---------|------|---------|
| `rv-image-optimize/utils` | 图片优化工具函数 | `optimizeImageUrl`, `loadImageProgressive`, `loadImagesProgressively` 等 |
| `rv-image-optimize/lossless` | 无损压缩工具 | `compressImage`, `compressImages` 等 |
| `rv-image-optimize/cache` | 缓存工具库 | `setCache`, `getCache`, `deleteCache` 等 |
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
import { setCache, getCache, deleteCache } from 'rv-image-optimize/cache';
import LazyImage from 'rv-image-optimize/LazyImage';
import ProgressiveImage from 'rv-image-optimize/ProgressiveImage';

// ✅ 也可以：直接从 lib 或 src 导入（需要支持 ES 模块）
import { optimizeImageUrl } from 'rv-image-optimize/lib/imageOptimize.js';
import { setCache, getCache } from 'rv-image-optimize/lib/imageCache.js';
import LazyImage from 'rv-image-optimize/src/LazyImage.jsx';
```

**注意：**
- 使用 `lib/` 或 `src/` 直接导入时，需要确保您的打包工具支持 ES 模块
- 如果使用 JSX 文件（`.jsx`），需要配置 React 和 JSX 转换
- 推荐使用 `exports` 路径（如 `rv-image-optimize/utils`），更稳定可靠

### Vue3 / Vue2 项目使用

> **⚠️ 重要提示**：
> - `LazyImage` 和 `ProgressiveImage` 是 **React 组件**，**无法直接在 Vue 项目中使用**
> - Vue 项目应该使用**工具函数**来优化图片 URL，然后配合 Vue 的 `<img>` 标签或自行实现懒加载功能
> - 如果遇到导入错误，请确保只导入工具函数，不要导入 React 组件

#### ⚠️ 常见错误和解决方案

**错误1：尝试导入 React 组件**
```javascript
// ❌ 错误：Vue 中不能使用 React 组件
import { LazyImage, ProgressiveImage } from 'rv-image-optimize';

// ✅ 正确：只导入工具函数
import { optimizeImageUrl, loadImageProgressive } from 'rv-image-optimize';
```

**错误2：旧版本导入方式（v1.x）**
```javascript
// ❌ 旧版本可能不支持这种导入方式
import LazyImage from 'rv-image-optimize/LazyImage';

// ✅ 新版本（v2.x+）使用工具函数
import { optimizeImageUrl } from 'rv-image-optimize';
// 或按需导入
import { optimizeImageUrl } from 'rv-image-optimize/utils';
```

**错误3：ES 模块兼容性问题**
如果遇到 `Cannot find module` 或 `Module not found` 错误：
```javascript
// ✅ 方式1：使用默认导入（推荐）
import { optimizeImageUrl } from 'rv-image-optimize';

// ✅ 方式2：使用 exports 路径
import { optimizeImageUrl } from 'rv-image-optimize/utils';

// ✅ 方式3：如果以上都不行，尝试直接导入 lib
import { optimizeImageUrl } from 'rv-image-optimize/lib/imageOptimize.js';
```

#### 1. 安装依赖

```bash
npm install rv-image-optimize
```

**版本要求：**
- 推荐使用最新版本（v2.1.2+）
- 如果使用旧版本（v1.x），请升级到最新版本以获得更好的兼容性
- 检查版本：`npm list rv-image-optimize`

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

> **注意**：工具函数本身不支持 `rootMargin` 参数。`rootMargin` 是 IntersectionObserver 的参数，需要在 Vue 中自己实现 IntersectionObserver 时使用。

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

// 使用 IntersectionObserver 实现懒加载（支持 rootMargin）
// 注意：工具函数本身不支持 rootMargin，需要在 IntersectionObserver 中使用
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        shouldLoad.value = true;
        observer.disconnect();
      }
    });
  }, { 
    rootMargin: '50px'  // 提前 50px 开始加载，可以自定义
  });
  
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

### 通用缓存 API（IndexedDB）

`rv-image-optimize` 提供了通用的 IndexedDB 缓存系统，支持存储任意数据。**支持多数据库（库）和多表（objectStore）查询使用**。

**架构说明**：
- **Worker 架构**：所有 IndexedDB 操作在 Web Worker 中执行，避免阻塞主线程
- **自动降级**：如果浏览器不支持 Web Worker，自动降级到主线程执行
- **高性能**：使用 Transferable Objects 优化大数据传输
- **多库多表**：支持创建多个数据库和多个表，实现数据隔离和分类管理

#### 基础使用（默认库和表）

```javascript
import { setCache, getCache, deleteCache, cleanExpiredCache, getCacheStats, hasCache } from 'rv-image-optimize';

// 设置缓存（默认 30 天过期，使用默认库和表）
await setCache('user:123', { name: 'John', age: 30 });
await setCache('api:data', { data: 'some data' }, 24); // 24 小时过期

// 获取缓存
const user = await getCache('user:123');
console.log(user); // { name: 'John', age: 30 }

// 检查缓存是否存在
const exists = await hasCache('user:123');
console.log(exists); // true

// 删除缓存
await deleteCache('user:123'); // 删除单个缓存
await deleteCache(); // 清空当前表的所有缓存

// 清理过期缓存
const deletedCount = await cleanExpiredCache();
console.log(`清理了 ${deletedCount} 个过期缓存`);

// 获取缓存统计信息
const stats = await getCacheStats();
console.log(stats);
// {
//   count: 10,           // 缓存数量
//   totalSize: 1024000,  // 总大小（字节）
//   totalSizeMB: 0.98,   // 总大小（MB）
//   expiredCount: 2     // 过期缓存数量
// }
```

#### 多库多表使用（按库按表查询）

```javascript
import { 
  setCache, 
  getCache, 
  deleteCache, 
  getStoreNames,
  deleteDatabase,
  getAllDatabaseNames
} from 'rv-image-optimize';

// ========== 使用自定义库和表 ==========

// 1. 在自定义库 "UserDB" 的 "users" 表中存储数据
await setCache('user:123', { name: 'John' }, 24, 'UserDB', 'users');
await setCache('user:456', { name: 'Jane' }, 24, 'UserDB', 'users');

// 2. 在同一个库 "UserDB" 的 "sessions" 表中存储数据
await setCache('session:abc', { token: 'xxx' }, 1, 'UserDB', 'sessions');

// 3. 在另一个库 "AppDB" 的 "config" 表中存储数据
await setCache('app:theme', { theme: 'dark' }, 0, 'AppDB', 'config');

// 4. 从指定库和表获取数据
const user = await getCache('user:123', 'UserDB', 'users');
const session = await getCache('session:abc', 'UserDB', 'sessions');
const config = await getCache('app:theme', 'AppDB', 'config');

// 5. 删除指定库和表的缓存
await deleteCache('user:123', 'UserDB', 'users'); // 删除单个
await deleteCache(null, 'UserDB', 'users'); // 清空整个表

// 6. 获取指定库的所有表名
const storeNames = await getStoreNames('UserDB');
console.log(storeNames); // ['users', 'sessions']

// 7. 获取所有数据库名称
const dbNames = await getAllDatabaseNames();
console.log(dbNames); // ['ImageOptimizeCache', 'UserDB', 'AppDB']

// 8. 删除整个数据库（会删除该库下的所有表和数据）
await deleteDatabase('UserDB');
```

#### 库和表的概念

- **数据库（库）**：相当于一个独立的数据库，可以有多个表
- **对象存储（表）**：数据库中的表，用于存储数据
- **自动创建**：如果指定的库或表不存在，系统会自动创建

#### 使用场景示例

**场景1：用户数据管理**

```javascript
// 创建 "UserDB" 库，包含 "users" 和 "preferences" 两个表

// 用户基本信息表
await setCache('user:123', {
  name: 'John',
  email: 'john@example.com'
}, 30 * 24, 'UserDB', 'users');

// 用户偏好设置表
await setCache('user:123', {
  theme: 'dark',
  language: 'zh-CN'
}, 0, 'UserDB', 'preferences'); // 永不过期

// 查询用户信息
const userInfo = await getCache('user:123', 'UserDB', 'users');
const userPrefs = await getCache('user:123', 'UserDB', 'preferences');
```

**场景2：多应用数据隔离**

```javascript
// 应用A的数据存储在 "AppA_DB" 库
await setCache('data:1', { value: 'A' }, 24, 'AppA_DB', 'data');

// 应用B的数据存储在 "AppB_DB" 库
await setCache('data:1', { value: 'B' }, 24, 'AppB_DB', 'data');

// 两个应用的数据完全隔离，不会互相影响
```

**场景3：按业务模块分表**

```javascript
// 在同一个库中，按业务模块分表存储

// 订单表
await setCache('order:001', { amount: 100 }, 7 * 24, 'BusinessDB', 'orders');

// 商品表
await setCache('product:001', { name: 'Product' }, 30 * 24, 'BusinessDB', 'products');

// 购物车表
await setCache('cart:user123', { items: [] }, 1, 'BusinessDB', 'carts');
```

#### API 说明

| 函数 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `setCache(key, value, expireHours, dbName, storeName, options)` | 设置缓存 | `key`: 缓存键（string）<br/>`value`: 缓存值（任意类型）<br/>`expireHours`: 过期时间（小时，默认 30*24）<br/>`dbName`: 数据库名称（库名，可选，默认 'ImageOptimizeCache'）<br/>`storeName`: 表名（可选，默认 'generalCache'）<br/>`options`: 选项对象（可选）<br/>- `checkQuota`: 是否在存储前检查配额（默认 false）<br/>- `autoCleanOnQuotaError`: 配额不足时是否自动清理过期缓存（默认 false） | `Promise<void>` |
| `getCache(key, dbName, storeName)` | 获取缓存 | `key`: 缓存键（string）<br/>`dbName`: 数据库名称（可选）<br/>`storeName`: 表名（可选） | `Promise<any\|null>` |
| `deleteCache(key?, dbName, storeName)` | 删除缓存 | `key`: 缓存键（string，可选，不传则清空整个表）<br/>`dbName`: 数据库名称（可选）<br/>`storeName`: 表名（可选） | `Promise<void>` |
| `cleanExpiredCache(dbName, storeName)` | 清理过期缓存 | `dbName`: 数据库名称（可选）<br/>`storeName`: 表名（可选） | `Promise<number>`（返回清理数量） |
| `getCacheStats(dbName, storeName)` | 获取缓存统计 | `dbName`: 数据库名称（可选）<br/>`storeName`: 表名（可选） | `Promise<Object>` |
| `hasCache(key, dbName, storeName)` | 检查缓存是否存在 | `key`: 缓存键（string）<br/>`dbName`: 数据库名称（可选）<br/>`storeName`: 表名（可选） | `Promise<boolean>` |
| `getStoreNames(dbName)` | 获取指定库的所有表名 | `dbName`: 数据库名称（可选，默认 'ImageOptimizeCache'） | `Promise<Array<string>>` |
| `deleteDatabase(dbName)` | 删除整个数据库 | `dbName`: 数据库名称（必填） | `Promise<void>` |
| `getAllDatabaseNames()` | 获取所有数据库名称 | - | `Promise<Array<string>>` |
| `getStorageQuota()` | 获取存储配额和使用情况 | - | `Promise<Object>` |
| `checkStorageQuota(requiredSize)` | 检查存储配额是否足够 | `requiredSize`: 需要的存储空间（字节，可选） | `Promise<Object>` |
| `getAllDatabasesUsage()` | 获取所有数据库的存储使用情况 | - | `Promise<Array<Object>>` |

#### 使用场景示例

**1. API 数据缓存**

```javascript
import { setCache, getCache } from 'rv-image-optimize';

async function fetchUserData(userId) {
  // 先检查缓存
  const cached = await getCache(`user:${userId}`);
  if (cached) {
    return cached;
  }
  
  // 从 API 获取数据
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  
  // 保存到缓存（1 小时过期）
  await setCache(`user:${userId}`, data, 1);
  
  return data;
}
```

**2. 表单数据缓存**

```javascript
import { setCache, getCache } from 'rv-image-optimize';

// 保存表单数据（30 分钟过期）
await setCache('form:draft', formData, 0.5);

// 恢复表单数据
const draft = await getCache('form:draft');
if (draft) {
  formData = draft;
}
```

**3. 配置信息缓存**

```javascript
import { setCache, getCache } from 'rv-image-optimize';

// 缓存应用配置（7 天过期）
await setCache('app:config', {
  theme: 'dark',
  language: 'zh-CN',
  settings: { ... }
}, 7 * 24);

// 获取配置
const config = await getCache('app:config') || getDefaultConfig();
```

**4. 搜索结果缓存**

```javascript
import { setCache, getCache } from 'rv-image-optimize';

async function search(query) {
  const cacheKey = `search:${query}`;
  
  // 检查缓存
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 执行搜索
  const results = await performSearch(query);
  
  // 缓存结果（1 小时过期）
  await setCache(cacheKey, results, 1);
  
  return results;
}
```

#### 存储配额查询

```javascript
import { getStorageQuota, getAllDatabasesUsage } from 'rv-image-optimize';

// 查询存储配额和使用情况
const quota = await getStorageQuota();
console.log(quota);
// {
//   quota: 2147483648,        // 总配额（字节），约 2GB
//   usage: 52428800,          // 已使用（字节），约 50MB
//   quotaMB: 2048,            // 总配额（MB）
//   usageMB: 50,              // 已使用（MB）
//   availableMB: 1998,       // 可用空间（MB）
//   usagePercent: 2.44,       // 使用百分比
//   indexedDBUsage: 52428800, // IndexedDB 使用量（字节）
//   indexedDBUsageMB: 50     // IndexedDB 使用量（MB）
// }

// 查询所有数据库的使用情况
const databasesUsage = await getAllDatabasesUsage();
console.log(databasesUsage);
// [
//   {
//     dbName: 'ImageOptimizeCache',
//     stores: [
//       { storeName: 'generalCache', count: 10, size: 1024000, sizeMB: 0.98 },
//       { storeName: 'generalCache', count: 5, size: 5120000, sizeMB: 4.88 }
//     ],
//     totalSize: 6144000,
//     totalSizeMB: 5.86
//   },
//   {
//     dbName: 'UserDB',
//     stores: [
//       { storeName: 'users', count: 100, size: 2048000, sizeMB: 1.95 }
//     ],
//     totalSize: 2048000,
//     totalSizeMB: 1.95
//   }
// ]
```

#### IndexedDB 存储限制说明

IndexedDB 的存储能力取决于浏览器和设备：

| 浏览器 | 存储限制 | 说明 |
|--------|---------|------|
| **Chrome/Edge** | 通常为可用磁盘空间的 60% | 例如：100GB 磁盘空间，约 60GB 可用 |
| **Firefox** | 通常为可用磁盘空间的 50% | 例如：100GB 磁盘空间，约 50GB 可用 |
| **Safari** | 通常为 1GB | 移动端可能更少 |
| **移动浏览器** | 通常为 50MB-1GB | 取决于设备存储空间 |

**重要提示**：
- 存储限制是**动态的**，会根据设备可用空间自动调整
- 不同浏览器和设备的限制可能不同
- 使用 `getStorageQuota()` 可以查询当前的实际配额
- 建议在存储大量数据前先查询可用空间

#### 存储配额满时的处理

当存储配额已满时，会出现以下问题：

**1. 存储失败**
```javascript
try {
  await setCache('key', largeData);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('存储配额已满:', error.message);
    // 错误信息：存储配额已满，无法保存缓存。建议清理过期缓存或删除不需要的数据
  }
}
```

**2. 自动清理和重试**
```javascript
// 启用自动清理功能（配额不足时自动清理过期缓存后重试）
await setCache('key', largeData, 24, 'MyDB', 'MyTable', {
  checkQuota: true,              // 存储前检查配额
  autoCleanOnQuotaError: true    // 配额不足时自动清理过期缓存
});
```

**3. 手动检查配额**
```javascript
import { checkStorageQuota, cleanExpiredCache } from 'rv-image-optimize';

// 检查存储配额（估算需要 10MB）
const quotaCheck = await checkStorageQuota(10 * 1024 * 1024);
if (!quotaCheck.available) {
  console.warn('存储空间不足，清理过期缓存...');
  await cleanExpiredCache();
  
  // 再次检查
  const quotaCheckAfterClean = await checkStorageQuota(10 * 1024 * 1024);
  if (!quotaCheckAfterClean.available) {
    console.error('清理后仍不足，需要手动删除数据');
  }
}
```

**4. 配额满时的错误特征**
- 错误名称：`QuotaExceededError`
- 错误信息：包含"存储配额已满"或"QuotaExceededError"
- 可能的表现：
  - `setCache()` 抛出异常
  - 图片缓存保存失败，但不会影响图片显示（会降级为网络加载）

**5. 最佳实践**
```javascript
// 方案1：存储前检查配额
const dataSize = JSON.stringify(data).length;
const quotaCheck = await checkStorageQuota(dataSize);
if (quotaCheck.available) {
  await setCache('key', data);
} else {
  // 清理过期缓存
  await cleanExpiredCache();
  // 再次尝试
  await setCache('key', data);
}

// 方案2：使用自动清理选项
await setCache('key', data, 24, 'MyDB', 'MyTable', {
  autoCleanOnQuotaError: true  // 自动清理后重试
});

// 方案3：定期监控和清理
setInterval(async () => {
  const quota = await getStorageQuota();
  if (quota.usagePercent > 80) {
    console.warn('存储使用率超过 80%，清理过期缓存...');
    await cleanExpiredCache();
  }
}, 60 * 60 * 1000); // 每小时检查一次
```

#### 注意事项

1. **数据序列化**：所有数据都会被序列化为 JSON，因此只能存储可序列化的数据
2. **过期时间**：`expireHours` 为 0 表示永不过期，默认 30 天（720 小时）
3. **自动清理**：获取缓存时会自动检查并删除过期缓存
4. **存储限制**：IndexedDB 存储限制因浏览器而异（通常 50MB-数GB），建议：
   - 使用 `getStorageQuota()` 查询可用空间
   - 使用 `checkStorageQuota()` 在存储前检查配额
   - 定期清理过期缓存
   - 监控存储使用情况，避免超出配额
5. **隐私模式**：在隐私模式下，IndexedDB 可能不可用，函数会返回 null
6. **存储配额管理**：当存储空间不足时，浏览器可能会：
   - 提示用户清理存储空间
   - 自动删除最旧的数据
   - 拒绝新的存储请求（抛出 `QuotaExceededError`）
7. **配额满时的处理**：
   - 所有存储操作（`setCache`）会抛出 `QuotaExceededError` 异常
   - 建议使用 `autoCleanOnQuotaError: true` 选项自动清理过期缓存
   - 或手动调用 `cleanExpiredCache()` 清理过期数据
   - 图片缓存失败不会影响图片显示，会自动降级为网络加载
8. **Worker 架构**：
   - 所有 IndexedDB 操作在 Web Worker 中执行，不会阻塞主线程
   - 如果浏览器不支持 Web Worker，会自动降级到主线程执行
   - Worker 是单例模式，只启动一次，后续操作复用同一个 Worker
   - 使用 Transferable Objects 优化大数据传输，提升性能
9. **默认表名**：所有图片缓存统一存储在 `generalCache` 表中，使用 `image:` 前缀的键名

#### 图片缓存使用（使用通用缓存 API）

图片缓存现在使用通用缓存 API，通过 `image:` 前缀的键名存储：

```javascript
import { setCache, getCache, deleteCache } from 'rv-image-optimize';

// 图片缓存键格式：image:{url}
const imageUrl = 'https://example.com/image.jpg';
const cacheKey = `image:${imageUrl}`;

// 获取图片缓存
const cached = await getCache(cacheKey);
if (cached && cached.data && cached.mimeType) {
  // cached.data 是 base64 格式的图片数据
  // cached.mimeType 是图片的 MIME 类型
}

// 保存图片缓存（通常由 loadImageWithCache 或 loadImageProgressiveWithCache 自动完成）
await setCache(cacheKey, {
  data: 'data:image/jpeg;base64,...',
  mimeType: 'image/jpeg'
}, 30 * 24); // 30 天过期

// 删除图片缓存
await deleteCache(cacheKey);
```

**注意**：图片缓存功能已统一使用通用缓存 API，不再提供单独的图片缓存函数。所有图片数据都存储在 `generalCache` 表中。

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

#### Q: Vue3 中导入报错怎么办？

**问题描述：** 在 Vue3 项目中使用 `rv-image-optimize` 时遇到导入错误。

**可能的原因和解决方案：**

1. **错误导入 React 组件**
   ```javascript
   // ❌ 错误
   import { LazyImage, ProgressiveImage } from 'rv-image-optimize';
   
   // ✅ 正确：只导入工具函数
   import { optimizeImageUrl, loadImageProgressive } from 'rv-image-optimize';
   ```

2. **旧版本兼容性问题**
   ```bash
   # 检查当前版本
   npm list rv-image-optimize
   
   # 升级到最新版本
   npm install rv-image-optimize@latest
   ```

3. **ES 模块导入问题**
   ```javascript
   // 如果默认导入失败，尝试以下方式：
   
   // 方式1：使用 exports 路径
   import { optimizeImageUrl } from 'rv-image-optimize/utils';
   
   // 方式2：直接导入 lib
   import { optimizeImageUrl } from 'rv-image-optimize/lib/imageOptimize.js';
   ```

4. **打包工具配置问题**
   - 确保使用支持 ES 模块的打包工具（Vite、Webpack 5+）
   - 检查 `package.json` 中是否有 `"type": "module"` 配置
   - 如果使用 Webpack，确保配置了正确的解析规则

5. **TypeScript 类型错误**
   ```typescript
   // 如果使用 TypeScript，可能需要添加类型声明
   import type { OptimizeOptions } from 'rv-image-optimize';
   ```

**完整的 Vue3 使用示例：**
```vue
<script setup>
import { ref, computed } from 'vue';
// ✅ 只导入工具函数，不要导入 React 组件
import { optimizeImageUrl, loadImageProgressive } from 'rv-image-optimize';

const imageUrl = ref('https://example.com/image.jpg');
const optimizedUrl = computed(() => {
  return optimizeImageUrl(imageUrl.value, {
    width: 800,
    quality: 85,
    autoFormat: true
  });
});
</script>

<template>
  <img :src="optimizedUrl" alt="优化后的图片" />
</template>
```

如果以上方法都无法解决，请提供以下信息以便排查：
- Vue 版本：`npm list vue`
- rv-image-optimize 版本：`npm list rv-image-optimize`
- 打包工具和版本（Vite/Webpack）
- 完整的错误信息

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

#### Q: Vue 中如何使用 rootMargin？
A: 工具函数本身不支持 `rootMargin`，需要在 Vue 中自己实现 IntersectionObserver 时使用：

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import { optimizeImageUrl } from 'rv-image-optimize';

const imageUrl = ref('https://example.com/image.jpg');
const shouldLoad = ref(false);

const optimizedUrl = computed(() => {
  return optimizeImageUrl(imageUrl.value, { width: 800, quality: 85 });
});

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        shouldLoad.value = true;
        observer.disconnect();
      }
    });
  }, { 
    rootMargin: '50px'  // 在这里使用 rootMargin，提前 50px 开始加载
  });
  
  const imgElement = document.querySelector('.lazy-image');
  if (imgElement) {
    observer.observe(imgElement);
  }
});
</script>

<template>
  <img 
    v-if="shouldLoad"
    :src="optimizedUrl" 
    alt="懒加载图片"
    class="lazy-image"
  />
</template>
```

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
