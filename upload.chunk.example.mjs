import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { File } from 'node:buffer';
import { uploadFileWithConfig } from 'rv-image-optimize/upload-core';

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const DEFAULT_RESUME_STATE_FILE = path.resolve(process.cwd(), '.upload-chunk-resume-state.json');

function printUsage() {
  console.log(`
用法:
  node ./upload.chunk.example.mjs <inputPath> <baseUploadUrl> [token]

示例:
  node ./upload.chunk.example.mjs ./large-assets/demo.mp4 https://example.com/admin/upload Bearer-demo-token

说明:
  - 会话初始化接口:   POST <baseUploadUrl>/session
  - 分片上传接口:     POST <baseUploadUrl>/chunk
  - 完成合并接口:     POST <baseUploadUrl>/complete
  - 续传状态文件:     ${DEFAULT_RESUME_STATE_FILE}

可选环境变量:
  CHUNK_UPLOAD_TOKEN
  CHUNK_UPLOAD_CHUNK_SIZE
  CHUNK_UPLOAD_RESUME_STATE_FILE
`);
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function sanitizeHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

async function readInputFileAsNodeFile(inputPath) {
  const absolutePath = path.resolve(inputPath);
  const [buffer, stat] = await Promise.all([
    fs.readFile(absolutePath),
    fs.stat(absolutePath),
  ]);

  return {
    absolutePath,
    stat,
    file: new File([buffer], path.basename(absolutePath), {
      type: 'application/octet-stream',
      lastModified: stat.mtimeMs,
    }),
  };
}

async function callJson(url, { method = 'POST', headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: sanitizeHeaders({
      'Content-Type': 'application/json',
      ...headers,
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.message || payload?.error || `请求失败 (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function createFileResumeStore(resumeStateFile) {
  async function readStateMap() {
    try {
      const raw = await fs.readFile(resumeStateFile, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  async function writeStateMap(stateMap) {
    await fs.writeFile(resumeStateFile, JSON.stringify(stateMap, null, 2), 'utf8');
  }

  return {
    async load(sessionId) {
      const stateMap = await readStateMap();
      return stateMap[sessionId] || null;
    },
    async save(sessionId, state) {
      const stateMap = await readStateMap();
      stateMap[sessionId] = state;
      await writeStateMap(stateMap);
    },
    async remove(sessionId) {
      const stateMap = await readStateMap();
      delete stateMap[sessionId];
      await writeStateMap(stateMap);
    },
  };
}

async function main() {
  const inputPath = process.argv[2];
  const baseUploadUrl = normalizeBaseUrl(process.argv[3]);
  const token = process.argv[4] || process.env.CHUNK_UPLOAD_TOKEN || '';

  if (!inputPath || !baseUploadUrl) {
    printUsage();
    process.exit(1);
  }

  const chunkSize = Number(process.env.CHUNK_UPLOAD_CHUNK_SIZE) || DEFAULT_CHUNK_SIZE;
  const resumeStateFile = process.env.CHUNK_UPLOAD_RESUME_STATE_FILE
    ? path.resolve(process.env.CHUNK_UPLOAD_RESUME_STATE_FILE)
    : DEFAULT_RESUME_STATE_FILE;
  const resumeStore = createFileResumeStore(resumeStateFile);
  const requestHeaders = sanitizeHeaders({
    Authorization: token,
  });

  const { absolutePath, stat, file } = await readInputFileAsNodeFile(inputPath);

  console.log(`开始处理文件: ${absolutePath}`);
  console.log(`文件大小: ${stat.size} bytes`);
  console.log(`分片大小: ${chunkSize} bytes`);
  console.log(`续传状态文件: ${resumeStateFile}`);

  const result = await uploadFileWithConfig(file, {
    sourceFileName: path.basename(absolutePath),
    sourceFileSize: stat.size,
    originalFileName: path.basename(absolutePath),
    originalFileSize: stat.size,
  }, {
    url: `${baseUploadUrl}/chunk`,
    method: 'POST',
    authorization: token,
    headers: requestHeaders,
    dataMode: 'formFields',
    fileFieldKey: 'chunkFile',
    formFields: [
      { key: 'chunkFile', valueType: 'file' },
      { key: 'originName', valueType: 'originalFileName' },
      { key: 'sessionId', valueType: 'sessionId' },
      { key: 'chunkIndex', valueType: 'chunkIndex' },
      { key: 'chunkNumber', valueType: 'chunkNumber' },
      { key: 'totalChunks', valueType: 'totalChunks' },
      { key: 'chunkSize', valueType: 'chunkSize' },
      { key: 'chunkStart', valueType: 'chunkStart' },
      { key: 'chunkEnd', valueType: 'chunkEnd' },
      { key: 'isLastChunk', valueType: 'isLastChunk' },
    ],
    timeoutMs: 30000,
    retry: {
      count: 2,
      baseDelayMs: 800,
      factor: 2,
      maxDelayMs: 5000,
    },
    chunkUpload: {
      enabled: true,
      chunkSize,
      minFileSize: chunkSize,
      concurrency: 2,
      resume: true,
      persistResume: true,
      cleanupOnSuccess: true,
      fileFieldKey: 'chunkFile',
      resumeStore,
      resolveSession: async ({ file: currentFile, defaultSessionId }) => {
        console.log(`初始化上传会话: ${defaultSessionId}`);
        const payload = await callJson(`${baseUploadUrl}/session`, {
          headers: requestHeaders,
          body: {
            sessionId: defaultSessionId,
            fileName: currentFile.name,
            fileSize: currentFile.size,
            chunkSize,
          },
        });

        return {
          sessionId: payload.sessionId || defaultSessionId,
          uploadedChunks: Array.isArray(payload.uploadedChunks) ? payload.uploadedChunks : [],
          metadata: payload.metadata || {},
        };
      },
      onChunkComplete: async ({ descriptor, uploadedChunks, result: chunkResult }) => {
        console.log(
          `分片 ${descriptor.chunkNumber}/${descriptor.totalChunks} 完成，` +
          `HTTP ${chunkResult.status}，累计完成 ${uploadedChunks.length} 片`
        );
      },
      completeUpload: async ({ sessionId, totalChunks, uploadedChunks, skippedChunks, chunkResults }) => {
        console.log(`调用完成合并接口: sessionId=${sessionId}`);
        return callJson(`${baseUploadUrl}/complete`, {
          headers: requestHeaders,
          body: {
            sessionId,
            totalChunks,
            uploadedChunks,
            skippedChunks,
            chunkResults: chunkResults.map((item) => ({
              chunkIndex: item.chunkIndex,
              skipped: Boolean(item.skipped),
            })),
          },
        });
      },
    },
  });

  console.log('\n上传完成:');
  console.log(JSON.stringify({
    ok: result.ok,
    status: result.status,
    sessionId: result.sessionId,
    chunkCount: result.chunkCount,
    uploadedChunks: result.uploadedChunks,
    skippedChunks: result.skippedChunks,
    resumeUsed: result.resumeUsed,
    data: result.data,
  }, null, 2));
}

main().catch((error) => {
  console.error(`上传失败: ${error.message}`);
  if (error?.payload) {
    console.error(JSON.stringify(error.payload, null, 2));
  }
  process.exit(1);
});
