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
  cookie: 'sid=abc123; theme=dark',
  contentType: '',
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

如果你需要大文件分片上传 / 断点续传，可以在同一个配置对象里继续补：

```javascript
const uploadConfig = {
  url: 'https://example.com/admin/upload/chunk',
  method: 'POST',
  dataMode: 'formFields',
  fileFieldKey: 'chunkFile',
  formFields: [
    { key: 'chunkFile', valueType: 'file' },
    { key: 'fileName', valueType: 'originalFileName' },
  ],
  chunkUpload: {
    enabled: true,
    chunkSize: 5 * 1024 * 1024,
    concurrency: 2,
    resume: true,
    resolveSession: async ({ file, defaultSessionId }) => {
      const response = await fetch('https://example.com/admin/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          sessionId: defaultSessionId,
        }),
      }).then((res) => res.json());

      return {
        sessionId: response.sessionId,
        uploadedChunks: response.uploadedChunks || [],
      };
    },
    completeUpload: async ({ sessionId, totalChunks }) => {
      return fetch('https://example.com/admin/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, totalChunks }),
      }).then((res) => res.json());
    },
  },
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
- `chunkIndex`
- `chunkNumber`
- `totalChunks`
- `chunkSize`
- `chunkStart`
- `chunkEnd`
- `sessionId`
- `isLastChunk`

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
- `{{chunkIndex}}`
- `{{chunkNumber}}`
- `{{totalChunks}}`
- `{{chunkSize}}`
- `{{chunkStart}}`
- `{{chunkEnd}}`
- `{{sessionId}}`
- `{{isLastChunk}}`

说明：

- 当前上传链路只保留 `FormData` 请求体方式
- `contentType` 默认建议留空，让运行时自动生成 multipart boundary
- 如果你的接口文档明确要求手动设置 `Content-Type`，也可以显式传入

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

### 分片上传 / 断点续传

`upload-core` 现在支持可选的分片上传模式：

- `chunkUpload.enabled`: 开启分片模式
- `chunkUpload.chunkSize`: 单片大小，默认建议 `5MB`
- `chunkUpload.concurrency`: 单文件内分片并发数
- `chunkUpload.resume`: 是否启用断点续传
- `chunkUpload.resolveSession`: 上传前初始化 / 查询服务端已上传分片
- `chunkUpload.completeUpload`: 全部分片完成后调用合并接口
- `chunkUpload.fileFieldKey`: 分片模式下单片文件字段名
- `chunkUpload.fields`: 自定义自动追加的分片字段名

默认会自动追加这些分片字段（可通过 `fields` 改名）：

- `sessionId`
- `chunkIndex`
- `chunkNumber`
- `totalChunks`
- `chunkSize`
- `chunkStart`
- `chunkEnd`
- `isLastChunk`

浏览器环境下默认会把续传状态保存在本地存储中；如果你需要接自己的状态系统，也可以传 `chunkUpload.resumeStore`。

如果你想先快速确认这套流程的交互形态，可以直接打开示例页里的“核心升级功能预览”，其中已经内置了分片上传 / 断点续传的 mock 演示，会展示：

- 初始化上传会话
- 服务端返回已上传分片
- 跳过已完成分片
- 继续上传剩余分片
- 全部分片完成后调用合并接口

### Upload CLI

除了直接调用 `upload-core`，现在也可以直接使用 CLI：

```bash
rv-image-optimize upload ./demo.webp --url https://example.com/admin/upload --json
```

如果上传字段较多，推荐使用配置文件：

```json
{
  "uploadConfig": {
    "url": "https://example.com/admin/upload",
    "method": "POST",
    "authorization": "Bearer your-token",
    "cookie": "sid=abc123; theme=dark",
    "contentType": "",
    "headers": {
      "X-App-Id": "demo"
    },
    "dataMode": "formFields",
    "fileFieldKey": "file",
    "formFields": [
      { "key": "file", "valueType": "file" },
      { "key": "fileName", "valueType": "fileName" },
      { "key": "biz", "valueType": "text", "textValue": "review" }
    ]
  },
  "fileMeta": {
    "sourceFileName": "origin.png",
    "savedPercentage": 42.5
  }
}
```

```bash
rv-image-optimize upload ./dist --config ./upload.config.json --json
```

如果是大文件上传，推荐把 `chunkUpload` 配在 `upload.config.json` 里，而不是把长配置直接拼在命令行：

```json
{
  "uploadConfig": {
    "url": "https://example.com/admin/upload/chunk",
    "method": "POST",
    "fileFieldKey": "chunkFile",
    "formFields": [
      { "key": "chunkFile", "valueType": "file" },
      { "key": "sessionId", "valueType": "sessionId" },
      { "key": "chunkIndex", "valueType": "chunkIndex" },
      { "key": "totalChunks", "valueType": "totalChunks" }
    ],
    "chunkUpload": {
      "enabled": true,
      "chunkSize": 5242880,
      "concurrency": 2,
      "resume": true
    }
  }
}
```

仓库里也提供了一份可直接复制修改的模板：`upload.chunk.config.example.json`。

如果你需要完整的 Node API 示例（包含 `resolveSession` / `completeUpload` / 文件型 `resumeStore`），可以直接参考仓库根目录下的 `upload.chunk.example.mjs`。

临时覆盖少量字段时，也可以直接在命令行传：

```bash
rv-image-optimize upload ./demo.webp \
  --url https://example.com/admin/upload \
  --header X-App-Id=demo \
  --form-field file:file \
  --form-field biz:text:review \
  --json
```

如果你只想给 Agent 预览最终会提交什么字段，而不实际发请求：

```bash
rv-image-optimize upload ./demo.webp --config ./upload.config.json --preview-only --json
```

如果你想让 Agent 一条命令完成“压缩后上传”：

```bash
rv-image-optimize pipeline ./images --format webp --quality 82 --config ./upload.config.json --json
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
