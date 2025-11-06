# 无损压缩功能使用文档

## 简介

`losslessCompress.js` 是一个专门用于无损压缩图片的模块，它继承并使用了 `imageOptimize.js` 中的基础功能，在保持图片质量不变的前提下，通过优化编码、去除元数据等方式减小文件大小。

## 特性

- ✅ **真正的无损压缩**：保持图片质量不变
- ✅ **支持多种格式**：PNG、WebP 等支持无损压缩的格式
- ✅ **批量处理**：支持批量压缩多张图片
- ✅ **智能检测**：自动检测图片是否适合无损压缩
- ✅ **详细统计**：提供压缩前后的详细对比信息
- ✅ **继承现有功能**：使用 `imageOptimize.js` 中的工具函数

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
} from 'rv-image-optimize/lossless';

// 或者导入默认导出
import losslessCompressModule from 'rv-image-optimize/lossless';
```

### 1. 基本无损压缩

```javascript
import { losslessCompress } from 'rv-image-optimize/lossless';

// 压缩图片URL
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

// 使用压缩后的图片
const img = document.createElement('img');
img.src = result.dataURL;
document.body.appendChild(img);
```

### 2. 压缩文件上传的图片

```javascript
import { losslessCompress, checkLosslessCompressionSuitability } from 'rv-image-optimize/lossless';

const fileInput = document.querySelector('input[type="file"]');
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // 先检查是否适合无损压缩
  const suitability = await checkLosslessCompressionSuitability(file);
  console.log(suitability.recommendation);
  
  if (suitability.isSuitable) {
    // 执行无损压缩
    const result = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',
    });
    
    // 显示结果
    console.log('压缩成功！', result);
    
    // 下载压缩后的图片
    downloadCompressedImage(result.blob, `compressed-${file.name}`);
  }
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

## API 参考

### `losslessCompress(imageSource, options)`

无损压缩单张图片。

**参数：**
- `imageSource` (string|File|Blob): 图片源（URL、File 或 Blob）
- `options` (Object): 压缩选项
  - `maxWidth` (number, 可选): 最大宽度
  - `maxHeight` (number, 可选): 最大高度
  - `format` (string, 可选): 输出格式（'png'/'webp'），默认自动选择
  - `removeMetadata` (boolean, 可选): 是否移除元数据（默认 true）
  - `optimizePalette` (boolean, 可选): 是否优化调色板（仅 PNG，默认 true）
  - `compressionLevel` (number, 可选): PNG 压缩级别（0-9，默认 6）

**返回：**
- `Promise<Object>`: 包含压缩结果和统计信息的对象

**返回对象属性：**
- `dataURL` (string): 压缩后的图片 DataURL
- `blob` (Blob): 压缩后的图片 Blob
- `originalWidth` (number): 原始宽度
- `originalHeight` (number): 原始高度
- `originalFormat` (string): 原始格式
- `originalSize` (number): 原始大小（字节）
- `originalSizeFormatted` (string): 格式化后的原始大小
- `compressedWidth` (number): 压缩后宽度
- `compressedHeight` (number): 压缩后高度
- `compressedFormat` (string): 压缩后格式
- `compressedSize` (number): 压缩后大小（字节）
- `compressedSizeFormatted` (string): 格式化后的压缩后大小
- `savedSize` (number): 节省的大小（字节）
- `savedSizeFormatted` (string): 格式化后的节省大小
- `savedPercentage` (number): 节省的百分比
- `isEffective` (boolean): 是否有效压缩

### `losslessCompressBatch(imageSources, options, concurrency)`

批量无损压缩图片。

**参数：**
- `imageSources` (Array<string|File|Blob>): 图片源数组
- `options` (Object): 压缩选项（同 `losslessCompress`）
- `concurrency` (number, 可选): 并发数量（默认 3）

**返回：**
- `Promise<Array<Object>>`: 压缩结果数组，每个元素包含：
  - `source`: 原始图片源
  - `success` (boolean): 是否成功
  - `result` (Object): 压缩结果（成功时）
  - `error` (string): 错误信息（失败时）

### `compareLosslessCompression(imageSource, options)`

对比无损压缩效果。

**参数：**
- `imageSource` (string|File|Blob): 图片源
- `options` (Object): 压缩选项（同 `losslessCompress`）

**返回：**
- `Promise<Object>`: 包含压缩对比信息的对象，包含 `losslessCompress` 的所有返回属性，以及：
  - `compressionRatio` (number): 压缩比
  - `recommendation` (string): 建议信息

### `checkLosslessCompressionSuitability(imageSource)`

检查图片是否适合无损压缩。

**参数：**
- `imageSource` (string|File|Blob): 图片源

**返回：**
- `Promise<Object>`: 包含检查结果的对象
  - `format` (string): 图片格式
  - `size` (number): 图片大小（字节）
  - `sizeFormatted` (string): 格式化后的大小
  - `isSuitable` (boolean): 是否适合无损压缩
  - `recommendation` (string): 建议信息

### `downloadCompressedImage(compressedImage, filename)`

下载压缩后的图片。

**参数：**
- `compressedImage` (Blob|string): 压缩后的图片（Blob 或 DataURL）
- `filename` (string, 可选): 文件名（默认使用时间戳）

**返回：**
- `void`

## React 组件示例

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
      const compressed = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',
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
    const compressed = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',
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

## 注意事项

1. **浏览器环境**：无损压缩功能仅在浏览器环境中可用，不支持 Node.js 环境
2. **格式支持**：最适合无损压缩的格式是 PNG 和 WebP，JPEG 格式不支持真正的无损压缩
3. **CORS 限制**：如果压缩远程图片 URL，需要确保图片服务器支持 CORS
4. **性能考虑**：压缩大图片可能需要一些时间，建议使用 `maxWidth`/`maxHeight` 限制尺寸
5. **质量保证**：无损压缩保持图片质量不变，但压缩率可能不如有损压缩

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

