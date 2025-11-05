# 发布到 npm 指南

## 准备工作

1. 确保已安装所有依赖：
```bash
npm install
```

2. 构建项目：
```bash
npm run build
```

3. 检查构建结果：
```bash
ls -la dist/
```

应该看到以下文件：
- `image-optimize.es.js` (ES模块)
- `image-optimize.cjs.js` (CommonJS)
- `image-optimize.umd.js` (UMD)
- `style.css` (样式文件)

## 发布步骤

### 1. 登录 npm（如果还没有登录）
```bash
npm login
```

### 2. 检查包信息
```bash
npm whoami
npm view image-optimize
```

### 3. 发布到 npm
```bash
npm publish
```

注意：发布前会自动运行 `prepublishOnly` 脚本，自动构建项目。

### 4. 发布测试版本（可选）
```bash
npm publish --tag beta
```

### 5. 更新版本
```bash
# 更新补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 更新次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 更新主版本 (1.0.0 -> 2.0.0)
npm version major
```

## 使用已发布的包

### 安装

```bash
npm install image-optimize
```

### 基础使用

#### 1. 使用 LazyImage 组件（推荐）

```jsx
import { LazyImage } from 'image-optimize';
import 'image-optimize/styles';

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

#### 2. 使用工具函数

```javascript
import { 
  optimizeImageUrl, 
  generateResponsiveImage,
  detectCDN,
  compareImageSizes 
} from 'image-optimize';

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

### Vue3 / Vue2 项目使用

> **注意**：`LazyImage` 组件是 React 组件，无法直接在 Vue 项目中使用。Vue 项目主要使用工具函数来优化图片 URL，然后配合 Vue 的 `<img>` 标签或自行实现懒加载功能。

#### 1. 安装依赖

```bash
npm install image-optimize
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
import { optimizeImageUrl, generateResponsiveImage } from 'image-optimize';

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
import { optimizeImageUrl } from 'image-optimize';

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
import { optimizeImageUrl } from 'image-optimize';

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
import { generateResponsiveImage } from 'image-optimize';

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
import { optimizeImageUrl } from 'image-optimize';

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
import { optimizeImageUrl } from 'image-optimize';

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
import { optimizeImageUrl, generateResponsiveImage } from 'image-optimize';

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
import { generateResponsiveImage } from 'image-optimize';

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

详细样式自定义请参考 [STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md)

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

1. 确保包名 `image-optimize` 在 npm 上可用
2. 每次发布前更新版本号
3. 确保 README.md 文档完整
4. 测试构建后的文件是否正常工作
5. 测试不同 CDN 的图片URL
6. 测试浏览器端压缩功能
7. 验证懒加载在不同设备上的表现
