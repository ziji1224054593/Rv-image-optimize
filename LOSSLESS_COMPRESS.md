# 无损压缩功能使用文档

## 简介

`losslessCompress.js` 是一个专门用于无损压缩图片的模块，它继承并使用了 `imageOptimize.js` 中的基础功能，在保持图片质量不变的前提下，通过优化编码、去除元数据等方式减小文件大小。

## 特性

- ✅ **真正的无损压缩**：保持图片质量不变
- ✅ **支持多种格式**：PNG、WebP 等支持无损压缩的格式，JPEG 自动转换为 PNG/WebP
- ✅ **GPU 加速**：自动检测并使用 GPU 加速（如果支持），提升处理性能
- ✅ **Element UI 格式**：返回的文件信息兼容 Element UI Upload 组件
- ✅ **回调函数支持**：压缩完成后自动调用回调函数，便于上传到后端
- ✅ **一步到位**：无需额外检查，直接使用即可
- ✅ **批量处理**：支持批量压缩多张图片
- ✅ **详细统计**：提供压缩前后的详细对比信息
- ✅ **继承现有功能**：使用 `imageOptimize.js` 中的工具函数
- ✅ **全面的文件验证**：支持图片格式验证（扩展名、MIME类型、文件头）和文件大小校验

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

### 1. 基本无损压缩（一步到位）

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

// 直接使用，无需额外检查，一步到位
const result = await losslessCompress('https://example.com/image.png', {
  maxWidth: 1920,        // 可选：最大宽度
  maxHeight: 1080,       // 可选：最大高度
  format: 'webp',        // 可选：输出格式（png/webp），默认自动选择
  removeMetadata: true,  // 可选：是否移除元数据（默认true）
  compressionLevel: 6,   // 可选：PNG压缩级别（0-9，默认6）
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
    format: 'webp',
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
  format: 'webp',
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

### 4. 对比压缩效果

```javascript
import { compareLosslessCompression } from 'rv-image-optimize/lossless';

const comparison = await compareLosslessCompression('https://example.com/image.png', {
  maxWidth: 1920,
  format: 'webp',
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

### 5. 检查图片是否适合无损压缩

```javascript
import { checkLosslessCompressionSuitability } from 'rv-image-optimize/lossless';

const suitability = await checkLosslessCompressionSuitability('https://example.com/image.png');

console.log('格式:', suitability.format);
console.log('大小:', suitability.sizeFormatted);
console.log('是否适合:', suitability.isSuitable);
console.log('建议:', suitability.recommendation);
```

### 6. 文件验证功能（格式和大小校验）

#### 6.1 在压缩时启用验证

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

const fileInput = document.querySelector('input[type="file"]');
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const result = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',
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

#### 6.2 单独使用验证函数

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

#### 6.3 批量文件验证

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

## API 参考

### `losslessCompress(imageSource, options)`

无损压缩单张图片。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSource` | `string \| File \| Blob` | 是 | - | 图片源（URL、File 或 Blob） |
| `options` | `Object` | 否 | `{}` | 压缩选项对象 |

#### options 对象属性

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `maxWidth` | `number` | 否 | `null` | 最大宽度（像素） |
| `maxHeight` | `number` | 否 | `null` | 最大高度（像素） |
| `format` | `string` | 否 | `null` | 输出格式（'png'/'webp'），默认自动选择 |
| `removeMetadata` | `boolean` | 否 | `true` | 是否移除元数据 |
| `optimizePalette` | `boolean` | 否 | `true` | 是否优化调色板（仅 PNG） |
| `compressionLevel` | `number` | 否 | `6` | PNG 压缩级别（0-9） |
| `onComplete` | `Function` | 否 | `null` | 压缩完成回调函数，接收三个参数：<br/>- `compressedFile` (File): 压缩后的 File 对象<br/>- `compressionResult` (Object): 完整的压缩结果对象<br/>- `fileInfo` (Object): Element UI Upload 组件格式的文件信息对象 |
| `fileName` | `string` | 否 | `null` | 压缩后文件的名称（默认自动生成） |
| `validation` | `Object` | 否 | `null` | 文件验证选项对象 |

#### validation 对象属性

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `allowedFormats` | `string[]` | 否 | 所有支持的格式 | 允许的图片格式列表 |
| `strict` | `boolean` | 否 | `true` | 是否严格验证格式（同时检查扩展名、MIME类型和文件头） |
| `maxSize` | `number` | 否 | `null` | 最大文件大小（字节），默认不限制 |
| `minSize` | `number` | 否 | `0` | 最小文件大小（字节） |
| `enabled` | `boolean` | 否 | `true` | 是否启用验证（如果传入 validation 对象则启用） |

#### 返回值

**类型：** `Promise<Object>`

返回包含压缩结果和统计信息的对象。

#### 返回对象属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `fileInfo` | `Object` | Element UI Upload 组件格式的文件信息（主要使用字段） |
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

#### fileInfo 对象属性

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

### `losslessCompressBatch(imageSources, options, concurrency)`

批量无损压缩图片。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSources` | `Array<string \| File \| Blob>` | 是 | - | 图片源数组 |
| `options` | `Object` | 否 | `{}` | 压缩选项（同 `losslessCompress`） |
| `concurrency` | `number` | 否 | `3` | 并发数量 |

#### 返回值

**类型：** `Promise<Array<Object>>`

返回压缩结果数组，每个元素包含：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `source` | `string \| File \| Blob` | 原始图片源 |
| `success` | `boolean` | 是否成功 |
| `result` | `Object` | 压缩结果（成功时，同 `losslessCompress` 返回值） |
| `error` | `string` | 错误信息（失败时） |

### `compareLosslessCompression(imageSource, options)`

对比无损压缩效果。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSource` | `string \| File \| Blob` | 是 | - | 图片源 |
| `options` | `Object` | 否 | `{}` | 压缩选项（同 `losslessCompress`） |

#### 返回值

**类型：** `Promise<Object>`

包含压缩对比信息的对象，包含 `losslessCompress` 的所有返回属性，以及：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `compressionRatio` | `number` | 压缩比 |
| `recommendation` | `string` | 建议信息 |

### `checkLosslessCompressionSuitability(imageSource)`

检查图片是否适合无损压缩（可选，现在可以直接使用 `losslessCompress`，无需先检查）。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `imageSource` | `string \| File \| Blob` | 是 | - | 图片源 |

#### 返回值

**类型：** `Promise<Object>`

包含检查结果的对象：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `format` | `string` | 图片格式 |
| `size` | `number` | 图片大小（字节） |
| `sizeFormatted` | `string` | 格式化后的大小 |
| `isSuitable` | `boolean` | 是否适合无损压缩 |
| `recommendation` | `string` | 建议信息 |

### `getGPUSupportInfo()`

获取 GPU 加速支持信息。

#### 返回值

**类型：** `Object`

GPU 支持信息：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `supported` | `boolean` | 是否支持 GPU 加速 |
| `method` | `string` | GPU 方法（webgl2/webgl/offscreenCanvas） |
| `details` | `Object` | 详细信息 |
| `reason` | `string` | 支持或不支持的原因 |

### `downloadCompressedImage(compressedImage, filename)`

下载压缩后的图片。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `compressedImage` | `Blob \| string` | 是 | - | 压缩后的图片（Blob 或 DataURL） |
| `filename` | `string` | 否 | 时间戳 | 文件名 |

#### 返回值

**类型：** `void`

### `validateImageFormat(file, options)`

验证图片文件格式。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | `File \| Blob` | 是 | - | 文件对象 |
| `options` | `Object` | 否 | `{}` | 验证选项对象 |

#### options 对象属性

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `allowedFormats` | `string[]` | 否 | 所有支持的格式 | 允许的格式列表 |
| `strict` | `boolean` | 否 | `true` | 是否严格验证（同时检查扩展名、MIME类型和文件头） |

#### 返回值

**类型：** `Promise<Object>`

验证结果：

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

### `validateImageSize(file, options)`

验证图片文件大小。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | `File \| Blob` | 是 | - | 文件对象 |
| `options` | `Object` | 否 | `{}` | 验证选项对象 |

#### options 对象属性

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `maxSize` | `number` | 否 | `null` | 最大文件大小（字节），默认不限制 |
| `minSize` | `number` | 否 | `0` | 最小文件大小（字节） |

#### 返回值

**类型：** `Object`

验证结果：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `valid` | `boolean` | 是否有效 |
| `size` | `number` | 文件大小（字节） |
| `errors` | `string[]` | 错误信息数组 |

### `validateImageFile(file, options)`

综合验证图片文件（格式 + 大小）。

#### 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | `File \| Blob` | 是 | - | 文件对象 |
| `options` | `Object` | 否 | `{}` | 验证选项对象（包含 `validateImageFormat` 和 `validateImageSize` 的所有选项） |

#### options 对象属性

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `allowedFormats` | `string[]` | 否 | 所有支持的格式 | 允许的格式列表 |
| `strict` | `boolean` | 否 | `true` | 是否严格验证格式 |
| `maxSize` | `number` | 否 | `null` | 最大文件大小（字节） |
| `minSize` | `number` | 否 | `0` | 最小文件大小（字节） |

#### 返回值

**类型：** `Promise<Object>`

验证结果：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `valid` | `boolean` | 是否有效 |
| `format` | `string \| null` | 检测到的格式 |
| `size` | `number` | 文件大小（字节） |
| `errors` | `string[]` | 错误信息数组 |

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
        format: 'webp',
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

### 带文件验证的示例

```jsx
import { useState } from 'react';
import { losslessCompress, validateImageFile } from 'rv-image-optimize/lossless';

function ImageCompressorWithValidation() {
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  
  // 验证配置
  const validationConfig = {
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    strict: true, // 严格验证
    maxSize: 10 * 1024 * 1024, // 10MB
    minSize: 0,
  };
  
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // 先验证所有文件
    const validFiles = [];
    const invalidFiles = [];
    
    for (const file of files) {
      const validationResult = await validateImageFile(file, validationConfig);
      if (validationResult.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          errors: validationResult.errors,
        });
      }
    }
    
    // 显示验证错误
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(item => 
        `${item.file.name}: ${item.errors.join('; ')}`
      );
      setErrors(errorMessages);
      alert(`以下文件验证失败：\n\n${errorMessages.join('\n')}`);
    } else {
      setErrors([]);
    }
    
    // 如果没有有效文件，直接返回
    if (validFiles.length === 0) {
      return;
    }
    
    // 处理第一个有效文件（或批量处理所有有效文件）
    setCompressing(true);
    try {
      const compressed = await losslessCompress(validFiles[0], {
        maxWidth: 1920,
        format: 'webp',
        // 可以再次传递验证配置（可选，如果已经验证过可以禁用）
        validation: {
          ...validationConfig,
          enabled: false, // 如果已经在前面验证过，这里可以禁用
        },
      });
      setResult(compressed);
    } catch (error) {
      console.error('压缩失败:', error);
      alert('压缩失败: ' + error.message);
    } finally {
      setCompressing(false);
    }
  };
  
  return (
    <div>
      <input type="file" accept="image/*" multiple onChange={handleFileUpload} />
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>文件验证规则：</strong>
        <ul>
          <li>支持的格式：{validationConfig.allowedFormats.join(', ').toUpperCase()}</li>
          <li>最大文件大小：{(validationConfig.maxSize / 1024 / 1024).toFixed(0)}MB</li>
          <li>验证模式：{validationConfig.strict ? '严格模式' : '宽松模式'}</li>
        </ul>
      </div>
      {errors.length > 0 && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          <strong>验证失败的文件：</strong>
          <ul>
            {errors.map((error, index) => (
              <li key={index} style={{ color: '#c62828' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {compressing && <p>正在压缩...</p>}
      {result && (
        <div>
          <p>原始大小: {result.originalSizeFormatted}</p>
          <p>压缩后大小: {result.compressedSizeFormatted}</p>
          <p>节省: {result.savedSizeFormatted} ({result.savedPercentage}%)</p>
          <img src={result.dataURL} alt="压缩后的图片" />
        </div>
      )}
    </div>
  );
}
```

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
      format: 'webp',
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

1. **自动格式转换**：如果原图是 JPEG，会自动转换为 PNG 或 WebP 无损格式
2. **避免进一步损失**：转换后不会再进一步损失质量
3. **注意**：转换后文件可能会变大，因为：
   - PNG/WebP 需要存储完整的像素信息（无损）
   - JPEG 已经丢失了一些信息，转换无法恢复这些信息
   - PNG/WebP 的压缩算法不如 JPEG 的有损压缩高效

## 注意事项

1. **浏览器环境**：无损压缩功能仅在浏览器环境中可用，不支持 Node.js 环境
2. **格式支持**：最适合无损压缩的格式是 PNG 和 WebP，JPEG 格式会自动转换为 PNG/WebP
3. **CORS 限制**：如果压缩远程图片 URL，需要确保图片服务器支持 CORS
4. **性能考虑**：压缩大图片可能需要一些时间，建议使用 `maxWidth`/`maxHeight` 限制尺寸
5. **质量保证**：无损压缩保持图片质量不变，但压缩率可能不如有损压缩
6. **GPU 加速**：函数会自动检测并使用 GPU 加速（如果支持），提升处理性能
7. **在线图片建议**：对于在线图片，优先使用 CDN 压缩参数（如果支持），而不是本地压缩
8. **文件验证**：
   - 验证功能只对 File 或 Blob 对象有效，URL 无法进行验证
   - 严格模式会检查扩展名、MIME 类型和文件头，确保文件格式真实可靠
   - 文件头检测（Magic Number）是最可靠的验证方式，可以防止文件扩展名被伪造
   - 建议在上传前进行验证，避免处理无效文件

## 与 imageOptimize.js 的关系

`losslessCompress.js` 继承并使用了 `imageOptimize.js` 中的以下功能：
- `detectImageFormat`: 检测图片格式
- `detectSupportedFormats`: 检测浏览器支持的格式
- `getBestFormat`: 获取最佳格式
- `dataURLToBlob`: 转换 DataURL 为 Blob
- `formatFileSize`: 格式化文件大小
- `getImageSize`: 获取图片大小

因此，无损压缩功能可以无缝配合现有的图片优化功能使用。

## 更多示例

详细的使用示例请参考 `example/lossless-compress-example.js` 文件。

