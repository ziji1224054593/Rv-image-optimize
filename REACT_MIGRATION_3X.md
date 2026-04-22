# React 2.x -> 3.x 迁移说明

## 先看这句

如果你是第一次安装 `rv-image-optimize`，并且直接使用 `3.x`，那你**不需要阅读这份文档**。

这份文档只给两类人看：

- 已经在 React 项目里使用 `2.x`
- 准备从旧版本升级到 `3.x`

## 一句话结论

React 的主流使用方式**基本没变**：

```jsx
import { LazyImage, ProgressiveImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';
```

如果你之前就是这样用的，升级到 `3.x` 通常不需要改代码。

## 什么没变

以下 React 用法在 `3.x` 里继续可用：

### 方式 1：从根入口导入组件

```jsx
import { LazyImage, ProgressiveImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';
```

### 方式 2：按组件子入口导入

```jsx
import LazyImage from 'rv-image-optimize/LazyImage';
import ProgressiveImage from 'rv-image-optimize/ProgressiveImage';
import 'rv-image-optimize/styles';
```

## 什么变了

`3.x` 收紧了公开导出面，不再保证内部文件路径兼容。

下面这些旧写法不要再用了：

```jsx
import LazyImage from 'rv-image-optimize/src/LazyImage.jsx';
import ProgressiveImage from 'rv-image-optimize/src/ProgressiveImage.jsx';
import 'rv-image-optimize/src/LazyImage.css';
```

也不要再依赖这些内部路径：

- `rv-image-optimize/src/*`
- `rv-image-optimize/lib/*`
- `rv-image-optimize/dist/*`
- `rv-image-optimize/utils`

## React 用法对照表

| 场景 | 2.x 常见写法 | 3.x 推荐写法 | 是否需要改 |
| --- | --- | --- | --- |
| 根入口导入组件 | `import { LazyImage } from 'rv-image-optimize'` | `import { LazyImage } from 'rv-image-optimize'` | 否 |
| 根入口导入渐进式组件 | `import { ProgressiveImage } from 'rv-image-optimize'` | `import { ProgressiveImage } from 'rv-image-optimize'` | 否 |
| 导入样式 | `import 'rv-image-optimize/styles'` | `import 'rv-image-optimize/styles'` | 否 |
| 按组件拆分导入 | 有些项目直接引 `src/*.jsx` | `rv-image-optimize/LazyImage` / `rv-image-optimize/ProgressiveImage` | 是 |
| 直接引源码样式 | `rv-image-optimize/src/LazyImage.css` | `rv-image-optimize/styles` | 是 |
| 直接引构建产物 | `rv-image-optimize/dist/*` | 改用正式 `exports` 入口 | 是 |

## 推荐写法

### 推荐写法 A：最稳妥

```jsx
import { LazyImage, ProgressiveImage } from 'rv-image-optimize';
import 'rv-image-optimize/styles';
```

适合：

- 大多数 React 项目
- CRA、Next.js、Remix、Vite React

### 推荐写法 B：按组件入口导入

```jsx
import LazyImage from 'rv-image-optimize/LazyImage';
import ProgressiveImage from 'rv-image-optimize/ProgressiveImage';
import 'rv-image-optimize/styles';
```

适合：

- 希望导入路径更明确
- 不想依赖根入口的命名导出

## 升级时怎么判断自己要不要改

你可以直接全局搜这些关键词：

- `rv-image-optimize/src/`
- `rv-image-optimize/lib/`
- `rv-image-optimize/dist/`
- `rv-image-optimize/utils`

如果搜不到，通常说明你的 React 用法已经是兼容 `3.x` 的。

如果搜到了，就按下面规则替换：

- `src/LazyImage.jsx` -> `rv-image-optimize/LazyImage` 或根入口
- `src/ProgressiveImage.jsx` -> `rv-image-optimize/ProgressiveImage` 或根入口
- `src/LazyImage.css` -> `rv-image-optimize/styles`
- `dist/*` / `lib/*` -> 改成正式公开子路径

## 最后再强调一次

如果你是**第一次安装** `rv-image-optimize`，并且安装的就是 `3.x`，那你**不需要看这份迁移文档**。

你只要直接按 README 里的 React 示例使用即可。
