# Webpack 使用说明

## 核心结论

`rv-image-optimize` 目前对 `Webpack` 的支持分两层：

- 运行时能力：已支持
- 构建期静态图片打包压缩插件：已支持 `rv-image-optimize/webpack-plugin`

如果你是在 `Webpack` 项目里做这些事情：

- 图片 URL 优化
- 渐进式加载
- 缓存
- 浏览器压缩
- 上传编排

那么现在已经可以直接使用。

## 统一入口

在 `Webpack` 项目中，统一使用：

```javascript
import { optimizeImageUrl, loadImageWithCache } from 'rv-image-optimize/utils-only';
```

不要直接使用根入口：

```javascript
import { LazyImage } from 'rv-image-optimize';
```

除非你明确是在 React 项目里，并且就是要使用 React 组件版本。

## Webpack 5

### 构建期静态图片压缩插件

```javascript
import path from 'node:path';
import { rvImageOptimizeWebpackPlugin } from 'rv-image-optimize/webpack-plugin';

export default {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js',
  },
  plugins: [
    rvImageOptimizeWebpackPlugin({
      includeFormats: ['png', 'webp', 'avif', 'svg'],
      compressionLevel: 9,
      minSavings: 0,
    }),
  ],
};
```

### 推荐方式

```javascript
import {
  optimizeImageUrl,
  loadImageWithCache,
  loadImageProgressive,
  compressImageInBrowser,
  uploadFileWithConfig,
} from 'rv-image-optimize/utils-only';
```

### 说明

- `Webpack 5` 通常可以直接使用 `utils-only`
- Worker 相关能力一般不需要额外补 loader
- 如果需要构建期静态图片压缩，可直接使用 `rv-image-optimize/webpack-plugin`

### 示例

```javascript
import { optimizeImageUrl, loadImageWithCache } from 'rv-image-optimize/utils-only';

const optimized = optimizeImageUrl('https://example.com/image.jpg', {
  width: 1200,
  quality: 82,
  autoFormat: true,
});

const blobUrl = await loadImageWithCache(optimized);
document.querySelector('#preview').src = blobUrl;
```

## Webpack 4

### 构建期静态图片压缩插件

```javascript
const path = require('path');
const { rvImageOptimizeWebpackPlugin } = require('rv-image-optimize/webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    rvImageOptimizeWebpackPlugin(),
  ],
};
```

### 推荐方式

- 继续使用 `rv-image-optimize/utils-only`
- 为 `.worker.js` 增加 `worker-loader`

### 配置示例

```javascript
module.exports = {
  module: {
    rules: [
      { test: /\.worker\.js$/i, loader: 'worker-loader' },
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    ],
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
};
```

### CommonJS 示例

```javascript
const {
  optimizeImageUrl,
  loadImageWithCache,
} = require('rv-image-optimize/utils-only');
```

## React + Webpack

如果你是 `React + Webpack` 项目，有两种路线：

### 路线 1：只用工具函数

```javascript
import { optimizeImageUrl } from 'rv-image-optimize/utils-only';
```

适合：

- 你有自己的图片组件
- 只想用 URL 优化、缓存、渐进式加载工具函数

### 路线 2：使用 React 组件

```javascript
import { LazyImage, ProgressiveImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';
```

适合：

- 你明确是 React 项目
- 想直接复用现成组件

注意：

- 如果不是 React 项目，不要导入根入口
- 如果出现 `ReactCurrentDispatcher`，通常就是误用了根入口

## Vue / 原生 JS + Webpack

这类项目统一推荐：

```javascript
import { optimizeImageUrl } from 'rv-image-optimize/utils-only';
```

如果你是 Vue 项目，也可以参考：

- [VUE_USAGE.md](./VUE_USAGE.md)

## 现在 Webpack 已支持哪些能力

从 `rv-image-optimize/utils-only` 可以直接使用：

- 图片优化：`optimizeImageUrl`、`generateResponsiveImage`、`detectCDN`
- 渐进式加载：`loadImageProgressive`、`loadImagesProgressively`
- 缓存：`setCache`、`getCache`、`loadImageWithCache`、`cleanExpiredCache`
- 浏览器压缩：`compressImageInBrowser`、`dataURLToBlob`
- 上传：`uploadFileWithConfig`、`compressAndUploadFiles`

## 目前还没有的能力

目前项目已经提供：

- `rv-image-optimize/vite-plugin`
- `rv-image-optimize/webpack-plugin`

但暂时还没有提供：

- `webpack loader` 形式的静态图片构建压缩方案
- `jpg/jpeg` 默认纳入无损静态压缩的策略

也就是说：

- 构建期静态图片压缩现在已经支持
- 但实现路线是 `plugin`，不是 `loader`

## 常见问题

### 1. `ReactCurrentDispatcher`

原因：

- 在非 React 项目里导入了根入口 `rv-image-optimize`

解决：

- 改用 `rv-image-optimize/utils-only`

### 2. `Module parse failed`

原因：

- 多见于 `Webpack 4`，没有处理 `.worker.js`

解决：

- 补 `worker-loader`

### 3. `"./utils-only" is not exported`

原因：

- 常见于旧缓存或老版本依赖

解决：

```bash
npm install rv-image-optimize@latest
```

然后重启 dev server。

### 4. 想做构建期图片压缩

现在可直接使用：

```javascript
import { rvImageOptimizeWebpackPlugin } from 'rv-image-optimize/webpack-plugin';
```

如果你还需要：

- `loader` 形态的链路级压缩
- 对 `jpg/jpeg` 的默认处理策略

这两项目前仍建议按项目需要单独评估。

## 相关文档

- [README.md](./README.md)
- [VUE_USAGE.md](./VUE_USAGE.md)
- [ProgressiveImage.md](./ProgressiveImage.md)
- [UPLOAD_PIPELINE.md](./UPLOAD_PIPELINE.md)
- [STATIC_IMAGE_BUILD_PLUGIN.md](./STATIC_IMAGE_BUILD_PLUGIN.md)
