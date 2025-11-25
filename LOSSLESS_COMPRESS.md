# 无损压缩功能使用文档

## 简介

`losslessCompress.js` 是一个专门用于无损压缩图片的模块，它继承并使用了 `imageOptimize.js` 中的基础功能，在保持图片质量不变的前提下，通过优化编码、去除元数据等方式减小文件大小。

## 最新更新

### v2.0+ 新增功能

1. **`quality` 参数支持**：
   - 新增 `quality` 参数（0-1），可以控制图片质量和文件大小
   - `quality: null` 或 `quality: 1.0`：无损压缩（默认）
   - `quality < 1.0`：有损压缩，文件更小但质量会降低
   - 注意：PNG 格式不支持 quality 参数，会自动转换为 WebP（如果支持）

2. **`format` 参数增强**：
   - 支持 `'webp'`、`'png'` 或 `null`（自动选择）
   - 自动选择逻辑：原图是 PNG/WebP 保持原格式，否则选择 WebP

3. **参数限制说明**：
   - `compressionLevel`：⚠️ **浏览器端无效**，Canvas API 不支持 PNG 压缩级别参数
   - `removeMetadata`：Canvas 绘制时默认会移除所有元数据，此参数主要用于文档说明
   - `optimizePalette`：仅对 PNG 格式有效，通过颜色量化减少颜色数量

### 重要提示

- **浏览器端限制**：Canvas API 不支持 PNG 压缩级别参数，`compressionLevel` 在浏览器端无效
- **质量控制**：主要使用 `quality` 参数控制文件大小，而不是 `compressionLevel`
- **格式选择**：推荐使用 WebP 格式，压缩率高且现代浏览器支持良好

## 特性

- ✅ **真正的无损压缩**：保持图片质量不变（使用 quality=1.0 时）
- ✅ **支持有损压缩**：通过 quality 参数（0-1）控制图片质量和文件大小
- ✅ **支持多种格式**：PNG、WebP 等支持无损压缩的格式，JPEG 自动转换为 PNG/WebP
- ✅ **自定义输出格式**：可选择 WebP（推荐）、PNG 或自动选择
- ✅ **GPU 加速**：自动检测并使用 GPU 加速（如果支持），提升处理性能
- ✅ **Element UI 格式**：返回的文件信息兼容 Element UI Upload 组件
- ✅ **回调函数支持**：压缩完成后自动调用回调函数，便于上传到后端
- ✅ **一步到位**：无需额外检查，直接使用即可
- ✅ **批量处理**：支持批量压缩多张图片
- ✅ **详细统计**：提供压缩前后的详细对比信息
- ✅ **继承现有功能**：使用 `imageOptimize.js` 中的工具函数
- ✅ **全面的文件验证**：支持图片格式验证（扩展名、MIME类型、文件头）和文件大小校验
- ⚠️ **浏览器端限制**：Canvas API 不支持 PNG 压缩级别参数，compressionLevel 在浏览器端无效

## 安装

无损压缩功能已包含在 `rv-image-optimize` 包中，无需额外安装。

## 使用方法

### 基础导入

```javascript
// ES6 模块导入
import {
  losslessCompress,
  losslessCompressBatch,
  compareLosslessCompression,
  checkLosslessCompressionSuitability,
  downloadCompressedImage,
  validateImageFormat,
  validateImageSize,
  validateImageFile,
} from 'rv-image-optimize/lossless';

// 或者导入默认导出
import losslessCompressModule from 'rv-image-optimize/lossless';
```

---

## API 参考

### `losslessCompress(imageSource, options)`

无损压缩单张图片。

#### 函数签名
```typescript
losslessCompress(
  imageSource: string | File | Blob,
  options?: LosslessCompressOptions
): Promise<LosslessCompressResult>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSource` | `string \| File \| Blob` | ✅ | - | 图片源（URL、File 或 Blob） |
| `options` | `LosslessCompressOptions` | ❌ | `{}` | 压缩选项对象（详见下方） |

#### LosslessCompressOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `maxWidth` | `number` | ❌ | `null` | 最大宽度（像素），超过此宽度会按比例缩放 |
| `maxHeight` | `number` | ❌ | `null` | 最大高度（像素），超过此高度会按比例缩放 |
| `format` | `string \| null` | ❌ | `null` | 输出格式：<br/>- `'webp'`: WebP格式（推荐，压缩率高）<br/>- `'png'`: PNG格式（无损，文件较大）<br/>- `null`: 自动选择（原图是PNG/WebP保持原格式，否则选择WebP） |
| `quality` | `number \| null` | ❌ | `null` | 图片质量（0-1）：<br/>- `null`: 使用默认值（无损压缩使用1.0，有损压缩使用0.8）<br/>- `0-1`: 指定质量值，值越大质量越高但文件越大<br/>- 注意：PNG格式不支持quality参数，会自动转换为WebP（如果支持） |
| `removeMetadata` | `boolean` | ❌ | `true` | 是否移除元数据：<br/>- `true`: 移除元数据（默认，Canvas绘制时自动移除）<br/>- `false`: 理论上保留元数据，但Canvas API不支持保留元数据<br/>- ⚠️ 注意：此参数主要用于文档说明，实际效果：Canvas绘制总是会移除元数据<br/>- 如需保留元数据，需要使用专门的库（如 piexifjs） |
| `optimizePalette` | `boolean` | ❌ | `true` | 是否优化调色板（仅PNG格式有效）：<br/>- `true`: 通过颜色量化减少颜色数量（超过256色时量化到216色），可减小PNG文件大小<br/>- `false`: 不优化调色板<br/>- ⚠️ 注意：可能会略微影响图片质量，但通常肉眼难以察觉 |
| `compressionLevel` | `number` | ❌ | `6` | PNG压缩级别（0-9）：<br/>- ⚠️ **重要限制**：Canvas API不支持直接设置PNG压缩级别参数<br/>- **实际效果**：<br/>  - 对于WebP格式：此参数**完全无效**，只有quality参数有效<br/>  - 对于PNG格式：此参数**也无效**，浏览器端无法控制PNG压缩级别<br/>  - 仅当compressionLevel > 6且输出格式为PNG时，会建议转换为WebP（如果支持）<br/>- **建议**：对于浏览器端压缩，主要使用quality参数控制文件大小<br/>- 如需精确控制PNG压缩级别，必须使用服务端处理工具（如pngquant、optipng、imagemin） |
| `onComplete` | `Function` | ❌ | `null` | 压缩完成回调函数，接收三个参数：<br/>- `compressedFile` (File): 压缩后的 File 对象<br/>- `compressionResult` (LosslessCompressResult): 完整的压缩结果对象<br/>- `fileInfo` (FileInfo): Element UI Upload 组件格式的文件信息对象 |
| `fileName` | `string` | ❌ | `null` | 压缩后文件的名称（默认自动生成：原文件名-compressed.扩展名） |
| `validation` | `ValidationOptions` | ❌ | `null` | 文件验证选项对象（详见下方 ValidationOptions 类型） |

#### ValidationOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `allowedFormats` | `string[]` | ❌ | 所有支持的格式 | 允许的图片格式列表 |
| `strict` | `boolean` | ❌ | `true` | 是否严格验证格式（同时检查扩展名、MIME类型和文件头） |
| `maxSize` | `number` | ❌ | `null` | 最大文件大小（字节），默认不限制 |
| `minSize` | `number` | ❌ | `0` | 最小文件大小（字节） |
| `enabled` | `boolean` | ❌ | `true` | 是否启用验证（如果传入 validation 对象则启用） |

#### 返回值类型：LosslessCompressResult

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `fileInfo` | `FileInfo` | Element UI Upload 组件格式的文件信息（主要使用字段） |
| `file` | `File` | 压缩后的 File 对象，可直接用于 FormData 上传 |
| `dataURL` | `string` | 压缩后的图片 DataURL |
| `blob` | `Blob` | 压缩后的图片 Blob |
| `gpuAccelerated` | `boolean` | 是否使用了 GPU 加速 |
| `gpuMethod` | `string` | GPU 加速方法（webgl2/webgl/offscreenCanvas） |
| `gpuInfo` | `Object` | GPU 支持信息 |
| `originalWidth` | `number` | 原始宽度（像素） |
| `originalHeight` | `number` | 原始高度（像素） |
| `originalFormat` | `string` | 原始格式 |
| `originalSize` | `number` | 原始大小（字节） |
| `originalSizeFormatted` | `string` | 格式化后的原始大小 |
| `compressedWidth` | `number` | 压缩后宽度（像素） |
| `compressedHeight` | `number` | 压缩后高度（像素） |
| `compressedFormat` | `string` | 压缩后格式 |
| `compressedSize` | `number` | 压缩后大小（字节） |
| `compressedSizeFormatted` | `string` | 格式化后的压缩后大小 |
| `compressedFileName` | `string` | 压缩后的文件名 |
| `savedSize` | `number` | 节省的大小（字节） |
| `savedSizeFormatted` | `string` | 格式化后的节省大小 |
| `savedPercentage` | `number` | 节省的百分比 |
| `isEffective` | `boolean` | 是否有效压缩 |

#### FileInfo 类型（fileInfo 对象）

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `name` | `string` | 文件名 |
| `size` | `number` | 文件大小（字节） |
| `sizeFormatted` | `string` | 格式化后的文件大小 |
| `type` | `string` | MIME 类型 |
| `uid` | `number` | 唯一标识 |
| `status` | `string` | 状态（ready/uploading/success/fail） |
| `raw` | `File` | 原始 File 对象 |
| `compressionInfo` | `Object` | 压缩相关信息 |

---

### `losslessCompressBatch(imageSources, options, concurrency)`

批量无损压缩图片。

#### 函数签名
```typescript
losslessCompressBatch(
  imageSources: Array<string | File | Blob>,
  options?: LosslessCompressOptions,
  concurrency?: number
): Promise<Array<BatchCompressResult>>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSources` | `Array<string \| File \| Blob>` | ✅ | - | 图片源数组 |
| `options` | `LosslessCompressOptions` | ❌ | `{}` | 压缩选项（同 `losslessCompress`） |
| `concurrency` | `number` | ❌ | `3` | 并发数量 |

#### 返回值类型：Array<BatchCompressResult>

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `source` | `string \| File \| Blob` | 原始图片源 |
| `success` | `boolean` | 是否成功 |
| `result` | `LosslessCompressResult` | 压缩结果（成功时，同 `losslessCompress` 返回值） |
| `error` | `string` | 错误信息（失败时） |

---

### `compareLosslessCompression(imageSource, options)`

对比无损压缩效果。

#### 函数签名
```typescript
compareLosslessCompression(
  imageSource: string | File | Blob,
  options?: LosslessCompressOptions
): Promise<CompareCompressionResult>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSource` | `string \| File \| Blob` | ✅ | - | 图片源 |
| `options` | `LosslessCompressOptions` | ❌ | `{}` | 压缩选项（同 `losslessCompress`） |

#### 返回值类型：CompareCompressionResult

包含 `LosslessCompressResult` 的所有属性，以及：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `success` | `boolean` | 是否成功 |
| `compressionRatio` | `number \| null` | 压缩比 |
| `recommendation` | `string` | 建议信息 |

---

### `checkLosslessCompressionSuitability(imageSource)`

检查图片是否适合无损压缩（可选，现在可以直接使用 `losslessCompress`，无需先检查）。

#### 函数签名
```typescript
checkLosslessCompressionSuitability(
  imageSource: string | File | Blob
): Promise<SuitabilityResult>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSource` | `string \| File \| Blob` | ✅ | - | 图片源 |

#### 返回值类型：SuitabilityResult

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `format` | `string \| null` | 图片格式 |
| `size` | `number \| null` | 图片大小（字节） |
| `sizeFormatted` | `string \| null` | 格式化后的大小 |
| `isSuitable` | `boolean` | 是否适合无损压缩 |
| `recommendation` | `string` | 建议信息 |
| `error` | `string \| null` | 错误信息（失败时） |

---

### `getGPUSupportInfo()`

获取 GPU 加速支持信息。

#### 函数签名
```typescript
getGPUSupportInfo(): GPUSupportInfo
```

#### 返回值类型：GPUSupportInfo

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `supported` | `boolean` | 是否支持 GPU 加速 |
| `method` | `string` | GPU 方法（webgl2/webgl/offscreenCanvas） |
| `details` | `Object` | 详细信息 |
| `reason` | `string` | 支持或不支持的原因 |

---

### `downloadCompressedImage(compressedImage, filename)`

下载压缩后的图片。

#### 函数签名
```typescript
downloadCompressedImage(
  compressedImage: Blob | string,
  filename?: string
): void
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `compressedImage` | `Blob \| string` | ✅ | - | 压缩后的图片（Blob 或 DataURL） |
| `filename` | `string` | ❌ | 时间戳 | 文件名 |

#### 返回值

**类型：** `void`

---

### `validateImageFormat(file, options)`

验证图片文件格式。

#### 函数签名
```typescript
validateImageFormat(
  file: File | Blob,
  options?: ValidateFormatOptions
): Promise<ValidateFormatResult>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | `File \| Blob` | ✅ | - | 文件对象 |
| `options` | `ValidateFormatOptions` | ❌ | `{}` | 验证选项对象（详见下方） |

#### ValidateFormatOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `allowedFormats` | `string[]` | ❌ | 所有支持的格式 | 允许的格式列表 |
| `strict` | `boolean` | ❌ | `true` | 是否严格验证（同时检查扩展名、MIME类型和文件头） |

#### 返回值类型：ValidateFormatResult

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `valid` | `boolean` | 是否有效 |
| `format` | `string \| null` | 检测到的格式 |
| `errors` | `string[]` | 错误信息数组 |

#### 验证方式

| 方式 | 说明 |
|------|------|
| **扩展名检测** | 检查文件扩展名 |
| **MIME 类型检测** | 检查文件的 MIME 类型 |
| **文件头检测** | 通过 Magic Number 检测实际文件格式（最可靠） |
| **严格模式** | 要求扩展名、MIME 类型和文件头检测的格式必须一致 |
| **宽松模式** | 优先使用文件头，其次 MIME 类型，最后扩展名 |

#### 支持的格式

jpg, jpeg, png, webp, gif, bmp, svg, avif

---

### `validateImageSize(file, options)`

验证图片文件大小。

#### 函数签名
```typescript
validateImageSize(
  file: File | Blob,
  options?: ValidateSizeOptions
): ValidateSizeResult
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | `File \| Blob` | ✅ | - | 文件对象 |
| `options` | `ValidateSizeOptions` | ❌ | `{}` | 验证选项对象（详见下方） |

#### ValidateSizeOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `maxSize` | `number` | ❌ | `null` | 最大文件大小（字节），默认不限制 |
| `minSize` | `number` | ❌ | `0` | 最小文件大小（字节） |

#### 返回值类型：ValidateSizeResult

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `valid` | `boolean` | 是否有效 |
| `size` | `number` | 文件大小（字节） |
| `errors` | `string[]` | 错误信息数组 |

---

### `validateImageFile(file, options)`

综合验证图片文件（格式 + 大小）。

#### 函数签名
```typescript
validateImageFile(
  file: File | Blob,
  options?: ValidateFileOptions
): Promise<ValidateFileResult>
```

#### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | `File \| Blob` | ✅ | - | 文件对象 |
| `options` | `ValidateFileOptions` | ❌ | `{}` | 验证选项对象（包含 `ValidateFormatOptions` 和 `ValidateSizeOptions` 的所有选项） |

#### ValidateFileOptions 类型

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `allowedFormats` | `string[]` | ❌ | 所有支持的格式 | 允许的格式列表 |
| `strict` | `boolean` | ❌ | `true` | 是否严格验证格式 |
| `maxSize` | `number` | ❌ | `null` | 最大文件大小（字节） |
| `minSize` | `number` | ❌ | `0` | 最小文件大小（字节） |

#### 返回值类型：ValidateFileResult

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `valid` | `boolean` | 是否有效 |
| `format` | `string \| null` | 检测到的格式 |
| `size` | `number` | 文件大小（字节） |
| `errors` | `string[]` | 错误信息数组 |

---

## 使用示例

### 1. 基本无损压缩（一步到位）

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

// 直接使用，无需额外检查，一步到位
const result = await losslessCompress('https://example.com/image.png', {
  maxWidth: 1920,        // 可选：最大宽度
  maxHeight: 1080,       // 可选：最大高度
  format: 'webp',        // 可选：输出格式（'webp'/'png' 或 null 自动选择）
  quality: 0.85,         // 可选：图片质量（0-1，默认null使用最高质量）
  removeMetadata: true,  // 可选：是否移除元数据（默认true，Canvas绘制时自动移除）
  optimizePalette: true, // 可选：是否优化调色板（仅PNG，默认true）
  compressionLevel: 6,   // 可选：PNG压缩级别（0-9，默认6，⚠️浏览器端无效）
});

console.log('原始大小:', result.originalSizeFormatted);
console.log('压缩后大小:', result.compressedSizeFormatted);
console.log('节省:', result.savedSizeFormatted, `(${result.savedPercentage}%)`);

// GPU 加速信息
if (result.gpuAccelerated) {
  console.log('✅ 使用了 GPU 加速:', result.gpuMethod);
}

// 使用 Element UI 格式的文件信息
const fileInfo = result.fileInfo;
console.log('文件信息:', fileInfo);

// 使用压缩后的图片
const img = document.createElement('img');
img.src = result.dataURL;
document.body.appendChild(img);

// 或者直接上传到后端
const formData = new FormData();
formData.append('image', result.file);
await fetch('/api/upload', { method: 'POST', body: formData });
```

### 2. 压缩文件上传的图片（使用回调函数自动上传）

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

const fileInput = document.querySelector('input[type="file"]');
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // 一步到位，直接压缩，无需额外检查
  const result = await losslessCompress(file, {
    maxWidth: 1920,
    format: 'webp',        // 或 'png' 或 null（自动选择）
    quality: 0.85,         // 图片质量（0-1），null表示使用默认值
    // 回调函数：压缩完成后自动调用
    onComplete: async (compressedFile, compressionResult, fileInfo) => {
      // fileInfo 已经是 Element UI 格式，直接使用
      fileInfo.status = 'uploading';
      
      // 上传到后端
      const formData = new FormData();
      formData.append('image', compressedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        fileInfo.status = 'success';
        fileInfo.response = data;
        fileInfo.url = data.url;
        console.log('上传成功！', fileInfo);
      } else {
        fileInfo.status = 'fail';
        fileInfo.error = '上传失败';
      }
    },
  });
  
  // 显示结果
  console.log('压缩成功！', result);
  console.log('Element UI 格式文件信息:', result.fileInfo);
  
  // 下载压缩后的图片
  downloadCompressedImage(result.blob, `compressed-${file.name}`);
};
```

### 3. 批量压缩图片

```javascript
import { losslessCompressBatch } from 'rv-image-optimize/lossless';

const imageUrls = [
  'https://example.com/image1.png',
  'https://example.com/image2.png',
  'https://example.com/image3.png',
];

const results = await losslessCompressBatch(imageUrls, {
  maxWidth: 1920,
  format: 'webp',  // 或 'png' 或 null（自动选择）
  quality: 0.85,   // 可选：图片质量（0-1）
}, 3); // 并发数量

results.forEach((item, index) => {
  if (item.success) {
    console.log(`图片 ${index + 1}:`, {
      原始大小: item.result.originalSizeFormatted,
      压缩后大小: item.result.compressedSizeFormatted,
      节省比例: item.result.savedPercentage + '%',
    });
  } else {
    console.error(`图片 ${index + 1} 压缩失败:`, item.error);
  }
});
```

### 4. 使用 quality 参数控制压缩质量

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

// 无损压缩（quality: null 或 1.0）
const losslessResult = await losslessCompress(file, {
  maxWidth: 1920,
  format: 'webp',
  quality: null,  // 或 quality: 1.0，使用最高质量（无损）
});

// 有损压缩（quality: 0.85，85% 质量）
const lossyResult = await losslessCompress(file, {
  maxWidth: 1920,
  format: 'webp',
  quality: 0.85,  // 85% 质量，文件更小但质量会降低
});

// 低质量压缩（quality: 0.5，50% 质量）
const lowQualityResult = await losslessCompress(file, {
  maxWidth: 1920,
  format: 'webp',
  quality: 0.5,   // 50% 质量，文件最小但质量较差
});

console.log('无损压缩:', losslessResult.compressedSizeFormatted);
console.log('有损压缩:', lossyResult.compressedSizeFormatted);
console.log('低质量压缩:', lowQualityResult.compressedSizeFormatted);
```

**注意**：
- `quality` 参数范围：0-1（0 表示最低质量，1 表示最高质量）
- 对于 WebP 格式：quality 参数有效，可以控制文件大小和质量
- 对于 PNG 格式：quality 参数无效，PNG 不支持 quality 参数
- 如果指定了 `quality < 1.0` 且输出格式为 PNG，会自动转换为 WebP（如果支持）

### 5. 对比压缩效果

```javascript
import { compareLosslessCompression } from 'rv-image-optimize/lossless';

const comparison = await compareLosslessCompression('https://example.com/image.png', {
  maxWidth: 1920,
  format: 'webp',  // 或 'png' 或 null（自动选择）
  quality: 0.85,   // 可选：图片质量（0-1）
});

if (comparison.success) {
  console.log('压缩对比:', {
    原始大小: comparison.originalSizeFormatted,
    压缩后大小: comparison.compressedSizeFormatted,
    节省比例: comparison.savedPercentage + '%',
    建议: comparison.recommendation,
  });
}
```

### 6. 检查图片是否适合无损压缩

```javascript
import { checkLosslessCompressionSuitability } from 'rv-image-optimize/lossless';

const suitability = await checkLosslessCompressionSuitability('https://example.com/image.png');

console.log('格式:', suitability.format);
console.log('大小:', suitability.sizeFormatted);
console.log('是否适合:', suitability.isSuitable);
console.log('建议:', suitability.recommendation);
```

### 7. 文件验证功能（格式和大小校验）

#### 7.1 在压缩时启用验证

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

const fileInput = document.querySelector('input[type="file"]');
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const result = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',  // 或 'png' 或 null（自动选择）
      quality: 0.85,   // 可选：图片质量（0-1）
      // 文件验证配置
      validation: {
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'], // 允许的格式
        strict: true, // 严格验证（检查扩展名、MIME类型和文件头）
        maxSize: 10 * 1024 * 1024, // 最大文件大小：10MB
        minSize: 0, // 最小文件大小：0字节
        enabled: true, // 启用验证
      },
    });
    console.log('压缩成功！', result);
  } catch (error) {
    console.error('压缩失败:', error.message);
    // 如果是验证失败，error.message 会包含详细的验证错误信息
  }
};
```

**文件头检测（Magic Number）校验方式**

当启用严格验证模式（`strict: true`）时，`losslessCompress.js` 中的 `detectFormatByFileHeader` 函数会通过读取文件头（Magic Number）来检测图片格式，这是最可靠的验证方式，可以防止文件扩展名被伪造。该函数的校验方式如下：

1. **读取文件头**：读取文件的前 100 个字节（对于 SVG 格式需要读取更多字节）

2. **格式检测规则**：
   - **JPEG**: 检测文件头是否为 `FF D8 FF`
   - **PNG**: 检测文件头是否为 `89 50 4E 47 0D 0A 1A 0A`
   - **GIF**: 检测文件头是否为 `47 49 46 38`（GIF8）
   - **WebP**: 检测文件头是否为 `RIFF`，并检查是否包含 `WEBP` 标识
   - **BMP**: 检测文件头是否为 `42 4D`
   - **AVIF**: 检测文件头是否包含 `ftyp` 和 `avif` 标识
   - **SVG**: 检测文件内容是否以 `<svg` 或 `<?xml` 开头（文本格式）

3. **严格模式验证**：在严格模式下，系统会同时检查：
   - 文件扩展名
   - MIME 类型
   - 文件头（Magic Number）
   
   只有当这三种方式检测到的格式完全一致时，验证才会通过。这样可以有效防止恶意文件通过修改扩展名来绕过验证。

4. **优势**：
   - **可靠性高**：文件头是文件格式的真实标识，无法通过简单修改扩展名来伪造
   - **安全性强**：可以检测出扩展名与真实格式不匹配的恶意文件
   - **准确性好**：即使文件扩展名或 MIME 类型错误，也能准确识别真实格式

#### 7.2 单独使用验证函数

```javascript
import { validateImageFormat, validateImageSize, validateImageFile } from 'rv-image-optimize/lossless';

const fileInput = document.querySelector('input[type="file"]');
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // 方式1：只验证格式
  const formatResult = await validateImageFormat(file, {
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    strict: true, // 严格模式：检查扩展名、MIME类型和文件头
  });
  
  if (!formatResult.valid) {
    console.error('格式验证失败:', formatResult.errors);
    return;
  }
  console.log('检测到的格式:', formatResult.format);
  
  // 方式2：只验证大小
  const sizeResult = validateImageSize(file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    minSize: 0,
  });
  
  if (!sizeResult.valid) {
    console.error('大小验证失败:', sizeResult.errors);
    return;
  }
  
  // 方式3：综合验证（格式 + 大小）
  const validationResult = await validateImageFile(file, {
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    strict: true,
    maxSize: 10 * 1024 * 1024,
    minSize: 0,
  });
  
  if (!validationResult.valid) {
    console.error('文件验证失败:', validationResult.errors);
    return;
  }
  
  console.log('验证通过！格式:', validationResult.format, '大小:', validationResult.size);
};
```

#### 7.3 批量文件验证

```javascript
import { validateImageFile } from 'rv-image-optimize/lossless';

const fileInput = document.querySelector('input[type="file"]');
fileInput.multiple = true;
fileInput.onchange = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  
  const validationConfig = {
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    strict: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    minSize: 0,
  };
  
  const validFiles = [];
  const invalidFiles = [];
  
  // 验证所有文件
  for (const file of files) {
    const result = await validateImageFile(file, validationConfig);
    if (result.valid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        errors: result.errors,
      });
    }
  }
  
  // 处理无效文件
  if (invalidFiles.length > 0) {
    console.warn('以下文件验证失败:', invalidFiles.map(item => 
      `${item.file.name}: ${item.errors.join('; ')}`
    ));
  }
  
  // 只处理有效文件
  console.log(`有效文件: ${validFiles.length} 个，无效文件: ${invalidFiles.length} 个`);
};
```

---

## React 组件示例

### 基础示例

```jsx
import { useState } from 'react';
import { losslessCompress } from 'rv-image-optimize/lossless';

function ImageCompressor() {
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCompressing(true);
    try {
      // 一步到位，直接压缩
      const compressed = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',  // 或 'png' 或 null（自动选择）
        quality: 0.85,   // 可选：图片质量（0-1）
        // 可选：使用回调函数自动上传
        onComplete: async (compressedFile, compressionResult, fileInfo) => {
          const formData = new FormData();
          formData.append('image', compressedFile);
          await fetch('/api/upload', { method: 'POST', body: formData });
        },
      });
      setResult(compressed);
    } catch (error) {
      console.error('压缩失败:', error);
    } finally {
      setCompressing(false);
    }
  };
  
  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      {compressing && <p>正在压缩...</p>}
      {result && (
        <div>
          <p>原始大小: {result.originalSizeFormatted}</p>
          <p>压缩后大小: {result.compressedSizeFormatted}</p>
          <p>节省: {result.savedSizeFormatted} ({result.savedPercentage}%)</p>
          {result.gpuAccelerated && (
            <p>✅ GPU加速: {result.gpuMethod}</p>
          )}
          {/* 使用 Element UI 格式的文件信息 */}
          <p>文件名: {result.fileInfo.name}</p>
          <p>文件大小: {result.fileInfo.sizeFormatted}</p>
          <img src={result.dataURL} alt="压缩后的图片" />
        </div>
      )}
    </div>
  );
}
```

---

## Vue 组件示例

```vue
<template>
  <div>
    <input type="file" accept="image/*" @change="handleFileUpload" />
    <div v-if="compressing">正在压缩...</div>
    <div v-if="result">
      <p>原始大小: {{ result.originalSizeFormatted }}</p>
      <p>压缩后大小: {{ result.compressedSizeFormatted }}</p>
      <p>节省: {{ result.savedSizeFormatted }} ({{ result.savedPercentage }}%)</p>
      <p v-if="result.gpuAccelerated">✅ GPU加速: {{ result.gpuMethod }}</p>
      <!-- 使用 Element UI 格式的文件信息 -->
      <p>文件名: {{ result.fileInfo.name }}</p>
      <p>文件大小: {{ result.fileInfo.sizeFormatted }}</p>
      <img :src="result.dataURL" alt="压缩后的图片" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { losslessCompress } from 'rv-image-optimize/lossless';

const compressing = ref(false);
const result = ref(null);

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  compressing.value = true;
  try {
    // 一步到位，直接压缩
    const compressed = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',  // 或 'png' 或 null（自动选择）
      quality: 0.85,   // 可选：图片质量（0-1）
      // 可选：使用回调函数自动上传
      onComplete: async (compressedFile, compressionResult, fileInfo) => {
        const formData = new FormData();
        formData.append('image', compressedFile);
        await fetch('/api/upload', { method: 'POST', body: formData });
      },
    });
    result.value = compressed;
  } catch (error) {
    console.error('压缩失败:', error);
  } finally {
    compressing.value = false;
  }
};
</script>
```

---

## 为什么 JPEG 格式不支持真正的无损压缩？

### JPEG 压缩算法的工作原理

JPEG（Joint Photographic Experts Group）是一种**有损压缩**格式，它的压缩算法基于以下步骤：

1. **颜色空间转换**：将 RGB 转换为 YCbCr（亮度+色度）
2. **离散余弦变换（DCT）**：将图像分成 8×8 的块，进行数学变换
3. **量化（Quantization）**：这是**关键的有损步骤**，通过量化表减少数据量
4. **熵编码**：使用霍夫曼编码进一步压缩

### 为什么 JPEG 不能无损压缩？

**核心原因：量化步骤会丢失信息**

```
原始像素值 → DCT变换 → 量化（丢失信息）→ 编码 → JPEG文件
                              ↑
                        这里会丢失精度
```

- **量化是不可逆的**：量化表会将高频细节信息舍入到最近的整数值，这些信息一旦丢失就无法恢复
- **即使质量设置为 100%**：JPEG 仍然使用量化，只是量化表更精细，但仍然会丢失信息
- **多次保存会累积损失**：每次保存 JPEG 都会重新量化，质量会逐渐下降

### JPEG vs PNG/WebP 无损模式

| 特性 | JPEG | PNG/WebP 无损 |
|------|------|---------------|
| 压缩方式 | 有损（量化） | 无损（预测+编码） |
| 质量损失 | 必然有损失 | 无损失 |
| 适合场景 | 照片、自然图像 | 图标、文字、需要精确的图片 |
| 文件大小 | 通常较小 | 通常较大 |
| 多次保存 | 质量下降 | 质量不变 |

### 解决方案

虽然 JPEG 本身不支持无损压缩，但 `losslessCompress` 会自动处理：

1. **自动格式转换**：如果原图是 JPEG/JPG，会自动转换为 PNG 或 WebP 无损格式
2. **避免进一步损失**：转换后不会再进一步损失质量
3. **注意**：转换后文件可能会变大，因为：
   - PNG/WebP 需要存储完整的像素信息（无损）
   - JPEG/JPG 已经丢失了一些信息，转换无法恢复这些信息
   - PNG/WebP 的压缩算法不如 JPEG 的有损压缩高效

---

## 注意事项

1. **浏览器环境**：无损压缩功能仅在浏览器环境中可用，不支持 Node.js 环境
2. **格式支持**：最适合无损压缩的格式是 PNG 和 WebP，JPEG 格式会自动转换为 PNG/WebP
3. **CORS 限制**：如果压缩远程图片 URL，需要确保图片服务器支持 CORS
4. **性能考虑**：压缩大图片可能需要一些时间，建议使用 `maxWidth`/`maxHeight` 限制尺寸
5. **质量保证**：
   - 使用 `quality: null` 或 `quality: 1.0` 时，保持图片质量不变（无损压缩）
   - 使用 `quality < 1.0` 时，可以进行有损压缩，文件更小但质量会降低
   - 压缩率可能不如专业的有损压缩工具
6. **GPU 加速**：函数会自动检测并使用 GPU 加速（如果支持），提升处理性能
7. **在线图片建议**：对于在线图片，优先使用 CDN 压缩参数（如果支持），而不是本地压缩
8. **文件验证**：
   - 验证功能只对 File 或 Blob 对象有效，URL 无法进行验证
   - 严格模式会检查扩展名、MIME 类型和文件头，确保文件格式真实可靠
   - 文件头检测（Magic Number）是最可靠的验证方式，可以防止文件扩展名被伪造
   - 建议在上传前进行验证，避免处理无效文件
9. **参数限制说明**：
   - **`quality` 参数**：控制图片质量（0-1），对 WebP 和 JPEG 格式有效，PNG 格式不支持
   - **`compressionLevel` 参数**：⚠️ **浏览器端无效**，Canvas API 不支持 PNG 压缩级别参数
     - 对于 WebP 格式：此参数完全无效，只有 quality 参数有效
     - 对于 PNG 格式：此参数也无效，浏览器端无法控制 PNG 压缩级别
     - 如需精确控制 PNG 压缩级别，必须使用服务端处理工具（如 pngquant、optipng、imagemin）
   - **`removeMetadata` 参数**：Canvas 重新绘制图片时默认会移除所有元数据，此参数主要用于文档说明
   - **`optimizePalette` 参数**：仅对 PNG 格式有效，通过颜色量化减少颜色数量，可能略微影响图片质量
10. **输出格式选择**：
    - **WebP**：推荐使用，压缩率高，文件小，现代浏览器支持良好
    - **PNG**：无损格式，文件通常较大，适合需要无损的场景
    - **自动选择**：如果原图是 PNG 或 WebP，保持原格式；否则选择最佳格式（WebP > PNG）

---

## 与 imageOptimize.js 的关系

`losslessCompress.js` 继承并使用了 `imageOptimize.js` 中的以下功能：
- `detectImageFormat`: 检测图片格式
- `detectSupportedFormats`: 检测浏览器支持的格式
- `getBestFormat`: 获取最佳格式
- `dataURLToBlob`: 转换 DataURL 为 Blob
- `formatFileSize`: 格式化文件大小
- `getImageSize`: 获取图片大小

因此，无损压缩功能可以无缝配合现有的图片优化功能使用。

---

## 更多示例

详细的使用示例请参考 `example/lossless-compress-example.js` 文件。
