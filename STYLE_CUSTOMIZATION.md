# 样式自定义指南

`image-optimize` 提供了多种方式来自定义和扩展样式，确保不会影响使用者项目的样式。

## 1. 使用 CSS 变量（推荐）

最简单的方式是使用 CSS 变量覆盖默认样式。所有样式都使用了 CSS 变量，您可以在全局或局部覆盖它们。

### 全局覆盖

```css
:root {
  /* 占位符样式 */
  --image-optimize-placeholder-bg: #e0e0e0;
  --image-optimize-placeholder-icon-color: #666;
  --image-optimize-placeholder-icon-size: 32px;
  --image-optimize-placeholder-min-height: 150px;
  
  /* 加载中样式 */
  --image-optimize-loading-bg: #fafafa;
  --image-optimize-loading-icon-color: #1890ff;
  --image-optimize-loading-icon-size: 28px;
  
  /* 错误样式 */
  --image-optimize-error-bg: #fff1f0;
  --image-optimize-error-icon-color: #ff4d4f;
  --image-optimize-error-icon-size: 28px;
  --image-optimize-error-text-color: #ff4d4f;
  --image-optimize-error-text-size: 14px;
  --image-optimize-error-min-height: 150px;
  
  /* 图片样式 */
  --image-optimize-image-cursor: pointer;
}
```

### 局部覆盖（针对特定组件）

```css
.my-custom-wrapper {
  --image-optimize-placeholder-bg: #custom-color;
  --image-optimize-loading-icon-color: #custom-color;
}
```

## 2. 使用 className 属性

通过 `className` 和 `imageClassName` 属性添加自定义类名，然后使用更高优先级的选择器覆盖样式。

```jsx
<LazyImage
  src="..."
  className="my-custom-container"
  imageClassName="my-custom-image"
/>
```

```css
/* 覆盖容器样式 */
.my-custom-container {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 覆盖图片样式 */
.my-custom-image {
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.my-custom-image:hover {
  transform: scale(1.05);
}

/* 覆盖占位符样式 */
.my-custom-container .image-optimize-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 覆盖加载样式 */
.my-custom-container .image-optimize-loading {
  background-color: rgba(255, 255, 255, 0.9);
}
```

## 3. 使用内联样式

通过 `style` 和 `imageStyle` 属性直接设置样式。

```jsx
<LazyImage
  src="..."
  style={{
    borderRadius: '8px',
    overflow: 'hidden'
  }}
  imageStyle={{
    borderRadius: '8px',
    transition: 'transform 0.3s ease'
  }}
/>
```

## 4. 完全自定义样式（不导入默认样式）

如果您想完全自定义样式，可以不导入默认样式文件：

```jsx
// 不导入默认样式
// import 'image-optimize/styles';

import { LazyImage } from 'image-optimize';
import './my-custom-styles.css';

function App() {
  return <LazyImage src="..." />;
}
```

然后在 `my-custom-styles.css` 中定义所有样式：

```css
.image-optimize-container {
  /* 您的自定义样式 */
}

.image-optimize-placeholder {
  /* 您的自定义样式 */
}

/* ... 其他样式 */
```

## 5. 使用 CSS Modules 或 styled-components

### CSS Modules

```jsx
import styles from './MyLazyImage.module.css';
import { LazyImage } from 'image-optimize';

<LazyImage
  src="..."
  className={styles.container}
  imageClassName={styles.image}
/>
```

### styled-components

```jsx
import styled from 'styled-components';
import { LazyImage } from 'image-optimize';

const StyledLazyImage = styled(LazyImage)`
  .image-optimize-container {
    border-radius: 12px;
  }
  
  .image-optimize-placeholder {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
`;

<StyledLazyImage src="..." />
```

## 样式类名参考

所有样式都使用了 `image-optimize-` 前缀，避免与项目样式冲突：

- `.image-optimize-container` - 容器
- `.image-optimize-placeholder` - 占位符
- `.image-optimize-placeholder-icon` - 占位符图标
- `.image-optimize-loading` - 加载中容器
- `.image-optimize-loading-icon` - 加载图标
- `.image-optimize-image` - 图片元素
- `.image-optimize-error` - 错误容器
- `.image-optimize-error-icon` - 错误图标
- `.image-optimize-error-text` - 错误文本

## 完整示例

```jsx
import { LazyImage } from 'image-optimize';
import './custom-styles.css';

function App() {
  return (
    <div className="app">
      {/* 使用默认样式 */}
      <LazyImage
        src="https://example.com/image1.jpg"
        width={400}
        height={300}
      />
      
      {/* 使用自定义样式 */}
      <LazyImage
        src="https://example.com/image2.jpg"
        width={400}
        height={300}
        className="custom-image-wrapper"
        imageClassName="custom-image"
        optimize={{ width: 400, quality: 90 }}
      />
    </div>
  );
}
```

```css
/* custom-styles.css */
:root {
  --image-optimize-loading-icon-color: #1890ff;
}

.custom-image-wrapper {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-image-wrapper .image-optimize-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.custom-image {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.custom-image:hover {
  transform: scale(1.05);
}
```

## 注意事项

1. **样式优先级**：使用 CSS 变量 > className 覆盖 > 内联 style
2. **命名空间**：所有类名都使用 `image-optimize-` 前缀，避免冲突
3. **CSS 变量**：使用 CSS 变量可以轻松覆盖主题颜色和尺寸
4. **向后兼容**：如果您的项目中有旧的类名，可以通过 className 映射来兼容
