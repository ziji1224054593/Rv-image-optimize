# Upload Pipeline

`rv-image-optimize` 现在把上传能力拆成了两层：

- `upload-core`: 无 UI、无压缩依赖的上传核心，适合 Node 18+、CLI、服务脚本、自定义前端
- `upload`: 浏览器端“压缩后上传”编排，内部会调用 `losslessCompress`

## 1. 适用场景

### `rv-image-optimize/upload-core`

适用于：

- Node 18+ 脚本
- CLI 工具
- AI Agent 调用
- 已经有文件对象，只需要按配置上传

不负责：

- 图片压缩
- 文件选择 UI

### `rv-image-optimize/upload`

适用于：

- 浏览器页面
- 需要先无损压缩，再上传接口
- 批量文件上传

## 2. 上传配置结构

```javascript
const uploadConfig = {
  url: 'https://example.com/admin/upload',
  method: 'POST',
  authorization: 'Bearer your-token',
  headers: {
    'X-App-Id': 'demo',
  },
  dataMode: 'formFields',
  fileFieldKey: 'file',
  formFields: [
    { key: 'file', valueType: 'file' },
    { key: 'fileName', valueType: 'fileName' },
    { key: 'fileType', valueType: 'fileType' },
    { key: 'fileSize', valueType: 'fileSize' },
    { key: 'biz', valueType: 'text', textValue: 'review' },
  ],
};
```

## 3. 支持的动态值类型

- `text`
- `file`
- `fileName`
- `fileType`
- `fileSize`
- `originalFileName`
- `originalFileSize`
- `compressedFileName`
- `compressedFileType`
- `compressedFileSize`
- `savedSize`
- `savedPercentage`

## 4. JSON 模板模式

除了 `formFields`，也可以使用 JSON 模板：

```javascript
const uploadConfig = {
  url: 'https://example.com/admin/upload',
  authorization: 'Bearer your-token',
  dataMode: 'jsonTemplate',
  jsonTemplate: JSON.stringify({
    file: '{{file}}',
    fileName: '{{fileName}}',
    originalFileName: '{{originalFileName}}',
    meta: {
      fileType: '{{fileType}}',
      fileSize: '{{fileSize}}',
      savedPercentage: '{{savedPercentage}}',
    },
  }, null, 2),
};
```

支持的占位符：

- `{{file}}`
- `{{fileName}}`
- `{{fileType}}`
- `{{fileSize}}`
- `{{originalFileName}}`
- `{{originalFileSize}}`
- `{{compressedFileName}}`
- `{{compressedFileType}}`
- `{{compressedFileSize}}`
- `{{savedSize}}`
- `{{savedPercentage}}`

## 5. Node / CLI 示例

```javascript
import { readFile } from 'node:fs/promises';
import { uploadFileWithConfig } from 'rv-image-optimize/upload-core';

const buffer = await readFile('./demo.webp');
const file = new File([buffer], 'demo.webp', { type: 'image/webp' });

const result = await uploadFileWithConfig(file, {
  sourceFileName: 'origin.png',
  sourceFileSize: buffer.length,
}, {
  url: 'https://example.com/admin/upload',
  method: 'POST',
  authorization: 'Bearer your-token',
  dataMode: 'formFields',
  formFields: [
    { key: 'file', valueType: 'file' },
    { key: 'fileName', valueType: 'fileName' },
    { key: 'sourceName', valueType: 'originalFileName' },
  ],
});

console.log(result.status, result.data);
```

如果你只想预览最终会提交什么字段：

```javascript
import { createUploadPayloadPreview } from 'rv-image-optimize/upload-core';

const preview = createUploadPayloadPreview(file, {
  sourceFileName: 'origin.png',
  sourceFileSize: 1024,
}, uploadConfig);

console.log(preview.entries);
```

## 6. 浏览器压缩后上传示例

```javascript
import { compressAndUploadFiles } from 'rv-image-optimize/upload';

const results = await compressAndUploadFiles(fileInput.files, {
  maxWidth: 1920,
  format: 'webp',
  quality: 0.85,
}, {
  url: 'https://example.com/admin/upload',
  authorization: 'Bearer your-token',
  dataMode: 'formFields',
  formFields: [
    { key: 'file', valueType: 'file' },
    { key: 'fileName', valueType: 'fileName' },
    { key: 'fileSize', valueType: 'fileSize' },
  ],
}, {
  concurrency: 2,
  onProgress: ({ completed, total, result }) => {
    console.log(completed, total, result.success);
  },
});
```

返回结构中：

- `compressionResult`: 压缩结果
- `uploadResult`: 上传结果
- `success`: 当前文件是否成功

## 7. 注意事项

- `upload-core` 依赖运行时提供 `fetch`、`FormData`、`File`
- Node 18+ 通常可直接使用；更老版本请自行 polyfill
- `upload` 依赖浏览器里的无损压缩能力，不适合直接放到纯 Node 环境
- 如果接口要求额外头信息，请放在 `headers`
- `Authorization` 建议直接传完整值，例如 `Bearer xxx`
