# 静态图片打包无损压缩插件

`rv-image-optimize` 现在同时提供 `Vite` 与 `Webpack` 的静态图片构建期压缩插件入口，可在产物生成阶段对静态图片做无损压缩或无损优化。

入口：

- `rv-image-optimize/vite-plugin`
- `rv-image-optimize/webpack-plugin`

## 适用场景

- Vite 项目打包后，自动压缩 `dist` 内静态图片
- Webpack 4 / 5 项目打包时，直接处理 `compilation assets` 中的静态图片
- 对 `public`、`src/assets` 产出的图片做构建后优化
- 希望保留原始引用路径，不改图片 URL

## 设计原则

- 默认只处理更适合无损优化的格式：`png`、`webp`、`avif`、`svg`
- 默认只有在“压缩后文件更小”时，才覆盖原文件
- 默认不修改文件名和引用路径
- 默认只在构建阶段生效，不影响开发模式

## 快速开始

### Vite

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { rvImageOptimizeVitePlugin } from 'rv-image-optimize/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    rvImageOptimizeVitePlugin(),
  ],
})
```

### Webpack

```js
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
    rvImageOptimizeWebpackPlugin(),
  ],
};
```

## 推荐配置

如果你当前项目里主要是 PNG / SVG：

```ts
rvImageOptimizeVitePlugin({
  includeFormats: ['png', 'svg'],
  compressionLevel: 9,
  minSavings: 0,
})
```

如果你还想处理 WebP / AVIF：

```ts
rvImageOptimizeVitePlugin({
  includeFormats: ['png', 'webp', 'avif', 'svg'],
  lossless: true,
  compressionLevel: 9,
})
```

Webpack 插件使用同一套配置项，示例：

```js
rvImageOptimizeWebpackPlugin({
  includeFormats: ['png', 'webp', 'avif', 'svg'],
  lossless: true,
  compressionLevel: 9,
  minSavings: 0,
})
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `includeFormats` | `string[]` | `['png', 'webp', 'avif', 'svg']` | 允许处理的扩展名 |
| `exclude` | `(string \| RegExp)[]` | `[]` | 排除文件路径 |
| `quality` | `number` | `100` | WebP / AVIF 编码质量 |
| `lossless` | `boolean` | `true` | 是否启用无损编码模式 |
| `compressionLevel` | `number` | `9` | PNG / WebP / AVIF 编码强度 |
| `concurrency` | `number` | `4` | 并发处理数 |
| `minSavings` | `number` | `0` | 至少节省多少字节才覆盖原文件 |
| `log` | `boolean` | `true` | 是否输出构建摘要日志 |
| `filter` | `Function` | `null` | 自定义过滤函数 |
| `onComplete` | `Function` | `null` | 构建结束后的回调，拿到统计结果 |

## 关于 JPEG

如果你的目标是“严格无损压缩”，不建议默认处理 `jpg/jpeg`：

- JPEG 本身不是天然无损格式
- 即便重新编码质量设为 `100`，也不等于真正无损
- 所以插件默认没有把 `jpg/jpeg` 放进处理名单

如果你后续接受“尽量不降质的重新编码优化”，再单独开启会更稳。

## 输出日志示例

```text
[rv-image-optimize/vite-plugin] 扫描 4 个静态图片，优化 3 个，跳过 1 个，失败 0 个，累计节省 12.35 KB
[rv-image-optimize/webpack-plugin] 扫描 4 个静态图片资源，优化 3 个，跳过 1 个，失败 0 个，累计节省 12.35 KB
```

## 注意事项

- `vite-plugin` 在 `build` 后扫描输出目录，`webpack-plugin` 则直接处理 `compilation assets`
- 两个插件都不会改源码目录，只处理构建产物
- `svg` 当前走的是安全型文本优化，主要移除注释和标签间空白
- `webpack-plugin` 当前同时兼容 Webpack 4 / 5，但 Webpack 4 仍建议保留 `worker-loader` 配置用于运行时工具函数能力
- 如果你需要目录级批处理或 CLI 调用，请看 [NODE_CLI_COMPRESS.md](./NODE_CLI_COMPRESS.md)
- 如果你只关心 Webpack 接入，请看 [WEBPACK_USAGE.md](./WEBPACK_USAGE.md)
