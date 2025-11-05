# image-optimize

图片优化工具和懒加载组件，支持多种CDN和自动格式转换。

## 功能特性

- 🚀 **多CDN支持**：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront
- 🎨 **自动格式转换**：自动检测浏览器支持的格式（AVIF、WebP、JPG等）
- 📱 **响应式图片**：支持 srcset 和 sizes 属性
- ⚡ **懒加载**：基于 Intersection Observer 的图片懒加载
- 🔧 **灵活配置**：支持自定义优化参数和错误处理

## 安装

```bash
npm install image-optimize
```

## 使用方法

### React 组件

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

### 工具函数

```javascript
import { optimizeImageUrl, generateResponsiveImage } from 'image-optimize';

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

// 在HTML中使用
// <img src={responsiveImg.src} srcset={responsiveImg.srcset} sizes={responsiveImg.sizes} />
```

## API

### LazyImage 组件

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | string | '' | 原始图片URL |
| alt | string | '' | 图片alt文本 |
| width | string\|number | '100%' | 容器宽度 |
| height | string\|number | 'auto' | 容器高度 |
| className | string | '' | 容器类名 |
| imageClassName | string | '' | 图片类名 |
| optimize | object | {width: 240, height: 320, quality: 75} | 图片优化选项 |
| immediate | boolean | false | 是否立即加载 |
| rootMargin | string | '50px' | 懒加载根边距 |
| showPlaceholderIcon | boolean | false | 是否显示占位符图标 |
| showErrorMessage | boolean | false | 是否显示错误信息 |
| errorSrc | string | '/imgea/videoCover.png' | 错误时的默认图片 |
| onLoad | function | null | 加载成功回调 |
| onError | function | null | 加载失败回调 |
| onClick | function | null | 点击回调 |

### 工具函数

#### optimizeImageUrl(url, options)

优化图片URL。

#### generateResponsiveImage(url, options)

生成响应式图片属性对象（包含 src、srcset、sizes）。

#### detectSupportedFormats()

检测浏览器支持的图片格式。

更多API请参考源码。

## 支持的CDN

- 阿里云OSS
- 腾讯云COS
- 七牛云
- 又拍云
- AWS CloudFront

## 样式自定义

`image-optimize` 使用命名空间前缀（`image-optimize-`）避免样式冲突，并提供了多种自定义方式：

### 1. 使用 CSS 变量（推荐）

```css
:root {
  --image-optimize-placeholder-bg: #e0e0e0;
  --image-optimize-loading-icon-color: #1890ff;
  --image-optimize-error-icon-color: #ff4d4f;
}
```

### 2. 使用 className 覆盖

```jsx
<LazyImage
  src="..."
  className="my-custom-wrapper"
  imageClassName="my-custom-image"
/>
```

```css
.my-custom-wrapper .image-optimize-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 3. 使用内联样式

```jsx
<LazyImage
  src="..."
  style={{ borderRadius: '8px' }}
  imageStyle={{ borderRadius: '8px' }}
/>
```

详细的自定义指南请参考 [STYLE_CUSTOMIZATION.md](./STYLE_CUSTOMIZATION.md)

## License

ISC
