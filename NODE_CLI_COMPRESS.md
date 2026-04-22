# Node / CLI 压缩入口

`rv-image-optimize` 现已提供独立的 Node 压缩子入口与 CLI，可用于服务脚本、批处理任务和 AI Agent 场景。

## 入口说明

- `rv-image-optimize/node-compress`
  - 适合 Node 18+ 服务脚本、批处理、后端任务
  - 基于 `sharp`
  - 不依赖浏览器 API
- `rv-image-optimize` CLI
  - 安装包后可直接执行 `rv-image-optimize`
  - 适合命令行批量压缩文件或目录

## 安装

```bash
npm install rv-image-optimize
```

## Node API

### 压缩单个文件

```javascript
import { compressImageFile } from 'rv-image-optimize/node-compress';

const result = await compressImageFile('./images/demo.png', {
  outputDir: './compressed',
  format: 'webp',
  quality: 82,
  maxWidth: 1600,
});

console.log(result.outputPath);
console.log(result.compressedSizeFormatted);
```

### 压缩整个目录

```javascript
import { compressImageDirectory } from 'rv-image-optimize/node-compress';

const summary = await compressImageDirectory('./images', {
  outputDir: './compressed',
  format: 'avif',
  quality: 70,
  recursive: true,
  concurrency: 4,
});

console.log(summary.total, summary.success, summary.failed);
```

### 压缩内存中的 Buffer

```javascript
import { readFile } from 'node:fs/promises';
import { compressImageBuffer } from 'rv-image-optimize/node-compress';

const input = await readFile('./images/demo.jpg');
const result = await compressImageBuffer(input, {
  sourceFileName: 'demo.jpg',
  format: 'webp',
  quality: 80,
});

console.log(result.compressedFormat, result.compressedSize);
```

## 支持的主要选项

- `format`: `jpeg` / `png` / `webp` / `avif` / `null`
- `quality`: 1-100，默认 `80`
- `maxWidth`: 最大宽度
- `maxHeight`: 最大高度
- `compressionLevel`: 编码强度，默认 `6`
- `maxBytes`: 输出体积上限（字节）
- `targetSizeBytes`: 目标输出体积（字节）
- `outputPath`: 单文件精确输出路径
- `outputDir`: 输出目录
- `suffix`: 输出文件后缀，默认 `.compressed`
- `overwrite`: 是否覆盖已存在文件
- `recursive`: 目录模式下是否递归子目录，默认 `true`
- `preserveStructure`: 目录模式下是否保留目录结构，默认 `true`
- `concurrency`: 目录压缩并发数，默认 `4`
- `deleteOriginal`: 压缩成功后删除原图
- `replaceOriginal`: 压缩成功后用压缩结果替换原图

## 压缩后的文件如何处理

默认行为：

- 原图保留不动
- 压缩结果写入新文件
- 默认文件名形如 `demo.compressed.webp`

如果启用 `deleteOriginal`：

- 压缩结果仍然会先写入新文件
- 写入成功后再删除原图
- 如果写入失败，原图不会被删除

如果启用 `replaceOriginal`：

- 压缩结果会回写到原图所在目录
- 默认使用原文件名 + 新扩展名，例如 `demo.png -> demo.webp`
- 只有压缩结果写入成功后，旧原图才会被删除
- 该模式下不能再配合 `outputPath` / `outputDir` / `suffix` 使用

## 返回结构

单文件压缩会返回与浏览器侧 `losslessCompress` 风格接近的结果摘要：

- `inputPath`
- `outputPath`
- `originalFormat`
- `originalSize`
- `compressedFormat`
- `compressedSize`
- `savedSize`
- `savedPercentage`
- `buffer`

## CLI 用法

### 压缩单文件

```bash
rv-image-optimize ./images/demo.jpg --format webp --quality 82 --output-dir ./compressed
```

### 压缩目录

```bash
rv-image-optimize ./images --output-dir ./compressed --format avif --quality 70
```

### 压缩成功后删除原图

```bash
rv-image-optimize ./images --output-dir ./compressed --format webp --delete-original
```

### 直接替换原图

```bash
rv-image-optimize ./images --format webp --replace-original
```

### 输出 JSON

```bash
rv-image-optimize ./images --output-dir ./compressed --json
```

### 目标体积压缩

```bash
rv-image-optimize ./images --output-dir ./compressed --format webp --target-size-bytes 153600 --json
```

### 通过配置文件执行分片上传 / 断点续传

```bash
rv-image-optimize upload ./large-assets --config ./upload.chunk.config.json --timeout-ms 10000 --json
```

## CLI 参数

- `--output <file>`: 单文件模式的精确输出文件
- `--output-dir <dir>`: 输出目录
- `--format <fmt>`: 输出格式
- `--quality <1-100>`: 压缩质量
- `--max-width <number>`: 最大宽度
- `--max-height <number>`: 最大高度
- `--max-bytes <number>`: 输出体积上限（字节）
- `--target-size-bytes <number>`: 目标输出体积（字节）
- `--suffix <text>`: 输出后缀
- `--overwrite`: 允许覆盖
- `--delete-original`: 压缩成功后删除原图
- `--replace-original`: 压缩成功后替换原图
- `--flatten`: 目录模式下平铺输出
- `--no-recursive`: 目录模式下不递归
- `--concurrency <number>`: 并发数
- `--json`: 输出 JSON
- `--help`: 显示帮助

## 注意事项

- 这是 Node 专用入口，不要在浏览器端直接使用
- 如果你需要浏览器压缩，请继续使用 `rv-image-optimize/lossless`
- `replaceOriginal` 会修改源目录中的文件，请谨慎使用，建议先在测试目录验证
- 如果你需要“压缩后上传”编排：
  - 浏览器端用 `rv-image-optimize/upload`
  - Node/CLI 端上传用 `rv-image-optimize/upload-core`
- 如果你需要分片上传 / 断点续传，优先把 `chunkUpload` 写进 `--config` JSON 文件，再通过 `rv-image-optimize upload` 或 `rv-image-optimize pipeline` 调用
- 如果你需要让 `Cursor`、`Claude Code` 或 skills 型 Agent 调用本工具，详见 [AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md)
