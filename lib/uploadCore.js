export const UPLOAD_VALUE_TYPES = [
  'text',
  'file',
  'fileName',
  'fileType',
  'fileSize',
  'originalFileName',
  'originalFileSize',
  'compressedFileName',
  'compressedFileType',
  'compressedFileSize',
  'savedSize',
  'savedPercentage',
  'chunkIndex',
  'chunkNumber',
  'totalChunks',
  'chunkSize',
  'chunkStart',
  'chunkEnd',
  'sessionId',
  'isLastChunk',
];

export const UPLOAD_PLACEHOLDERS = {
  file: '{{file}}',
  fileName: '{{fileName}}',
  fileType: '{{fileType}}',
  fileSize: '{{fileSize}}',
  originalFileName: '{{originalFileName}}',
  originalFileSize: '{{originalFileSize}}',
  compressedFileName: '{{compressedFileName}}',
  compressedFileType: '{{compressedFileType}}',
  compressedFileSize: '{{compressedFileSize}}',
  savedSize: '{{savedSize}}',
  savedPercentage: '{{savedPercentage}}',
  chunkIndex: '{{chunkIndex}}',
  chunkNumber: '{{chunkNumber}}',
  totalChunks: '{{totalChunks}}',
  chunkSize: '{{chunkSize}}',
  chunkStart: '{{chunkStart}}',
  chunkEnd: '{{chunkEnd}}',
  sessionId: '{{sessionId}}',
  isLastChunk: '{{isLastChunk}}',
};

const EXACT_PLACEHOLDER_PATTERN = /^\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}$/;
const INLINE_PLACEHOLDER_PATTERN = /\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g;
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const DEFAULT_RESUME_STORAGE_PREFIX = 'rv-image-optimize:upload-resume';
const DEFAULT_CHUNK_FIELD_NAMES = Object.freeze({
  sessionId: 'sessionId',
  chunkIndex: 'chunkIndex',
  chunkNumber: 'chunkNumber',
  totalChunks: 'totalChunks',
  chunkSize: 'chunkSize',
  chunkStart: 'chunkStart',
  chunkEnd: 'chunkEnd',
  isLastChunk: 'isLastChunk',
});
const chunkResumeStateMemoryStore = new Map();

function ensureHttpSupport() {
  if (typeof fetch !== 'function') {
    throw new Error('当前环境不支持 fetch，无法执行上传请求');
  }
  if (typeof FormData === 'undefined') {
    throw new Error('当前环境不支持 FormData，无法构建上传表单');
  }
}

function isBinaryValue(value) {
  const hasFile = typeof File !== 'undefined' && value instanceof File;
  const hasBlob = typeof Blob !== 'undefined' && value instanceof Blob;
  return hasFile || hasBlob;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function sanitizeHeaders(headers) {
  if (!headers || !isPlainObject(headers)) {
    return {};
  }

  return Object.entries(headers).reduce((result, [key, value]) => {
    if (!key) return result;
    if (value === undefined || value === null || value === '') return result;
    result[key] = String(value);
    return result;
  }, {});
}

function normalizeRetryConfig(retry) {
  if (!retry) {
    return {
      count: 0,
      factor: 2,
      baseDelayMs: 500,
      maxDelayMs: 4000,
      retryOnStatuses: [408, 425, 429, 500, 502, 503, 504],
    };
  }

  if (typeof retry === 'number') {
    return {
      count: Math.max(0, retry),
      factor: 2,
      baseDelayMs: 500,
      maxDelayMs: 4000,
      retryOnStatuses: [408, 425, 429, 500, 502, 503, 504],
    };
  }

  return {
    count: Math.max(0, Number(retry.count) || 0),
    factor: Math.max(1, Number(retry.factor) || 2),
    baseDelayMs: Math.max(0, Number(retry.baseDelayMs) || 500),
    maxDelayMs: Math.max(0, Number(retry.maxDelayMs) || 4000),
    retryOnStatuses: Array.isArray(retry.retryOnStatuses)
      ? retry.retryOnStatuses.map((status) => Number(status)).filter((status) => !Number.isNaN(status))
      : [408, 425, 429, 500, 502, 503, 504],
    shouldRetry: typeof retry.shouldRetry === 'function' ? retry.shouldRetry : null,
  };
}

function waitForRetry(delayMs) {
  if (!delayMs) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function getRetryDelay(retryConfig, attempt) {
  const rawDelay = retryConfig.baseDelayMs * Math.pow(retryConfig.factor, Math.max(0, attempt - 1));
  return Math.min(rawDelay, retryConfig.maxDelayMs);
}

function createAbortError(message = '上传已取消') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function normalizeTimeoutMs(value) {
  const timeoutMs = Number(value);
  if (!timeoutMs || Number.isNaN(timeoutMs) || timeoutMs < 0) {
    return 0;
  }
  return timeoutMs;
}

function normalizePositiveInteger(value, fallback, min = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }
  return Math.floor(parsed);
}

function createDefaultResumeStore(storageKeyPrefix = DEFAULT_RESUME_STORAGE_PREFIX, persistResume = true) {
  const createStorageKey = (sessionId) => `${storageKeyPrefix}:${sessionId}`;

  return {
    async load(sessionId) {
      const storageKey = createStorageKey(sessionId);
      if (chunkResumeStateMemoryStore.has(storageKey)) {
        return chunkResumeStateMemoryStore.get(storageKey);
      }

      if (!persistResume || typeof localStorage === 'undefined') {
        return null;
      }

      try {
        const rawValue = localStorage.getItem(storageKey);
        if (!rawValue) {
          return null;
        }
        const parsed = JSON.parse(rawValue);
        chunkResumeStateMemoryStore.set(storageKey, parsed);
        return parsed;
      } catch (error) {
        console.warn('[uploadCore] 读取断点续传状态失败:', error);
        return null;
      }
    },
    async save(sessionId, state) {
      const storageKey = createStorageKey(sessionId);
      chunkResumeStateMemoryStore.set(storageKey, state);

      if (!persistResume || typeof localStorage === 'undefined') {
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn('[uploadCore] 保存断点续传状态失败:', error);
      }
    },
    async remove(sessionId) {
      const storageKey = createStorageKey(sessionId);
      chunkResumeStateMemoryStore.delete(storageKey);

      if (!persistResume || typeof localStorage === 'undefined') {
        return;
      }

      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('[uploadCore] 删除断点续传状态失败:', error);
      }
    },
  };
}

function sanitizeChunkFieldNames(fields = {}) {
  return Object.entries(DEFAULT_CHUNK_FIELD_NAMES).reduce((result, [key, fallback]) => {
    const candidate = fields[key];
    result[key] = candidate === null
      ? ''
      : (candidate ? String(candidate).trim() : fallback);
    return result;
  }, {});
}

function normalizeChunkIndexList(indexes, totalChunks = Number.POSITIVE_INFINITY) {
  if (!Array.isArray(indexes)) {
    return [];
  }

  return Array.from(
    new Set(
      indexes
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0 && value < totalChunks)
    )
  ).sort((left, right) => left - right);
}

function normalizeChunkResumeState(state, totalChunks, fallback = {}) {
  if (!isPlainObject(state)) {
    return {
      sessionId: String(fallback.sessionId || ''),
      fileName: String(fallback.fileName || ''),
      fileSize: Number(fallback.fileSize) || 0,
      chunkSize: Number(fallback.chunkSize) || DEFAULT_CHUNK_SIZE,
      totalChunks: Number(fallback.totalChunks) || totalChunks || 0,
      completedChunks: normalizeChunkIndexList([], totalChunks),
      updatedAt: Date.now(),
    };
  }

  return {
    ...state,
    sessionId: String(state.sessionId || fallback.sessionId || ''),
    fileName: String(state.fileName || fallback.fileName || ''),
    fileSize: Number(state.fileSize ?? fallback.fileSize) || 0,
    chunkSize: Number(state.chunkSize ?? fallback.chunkSize) || DEFAULT_CHUNK_SIZE,
    totalChunks: Number(state.totalChunks ?? fallback.totalChunks) || totalChunks || 0,
    completedChunks: normalizeChunkIndexList(
      state.completedChunks || fallback.completedChunks || [],
      totalChunks
    ),
    updatedAt: Number(state.updatedAt) || Date.now(),
  };
}

function buildDefaultChunkSessionId(file, fileMeta = {}, config = {}) {
  const originalFileName = fileMeta.sourceFileName || fileMeta.originalFileName || file?.name || 'blob';
  const originalFileSize = fileMeta.sourceFileSize ?? fileMeta.originalFileSize ?? file?.size ?? 0;
  const lastModified = fileMeta.lastModified ?? file?.lastModified ?? 0;
  const targetUrl = config.url || '';
  return [
    targetUrl,
    originalFileName,
    originalFileSize,
    lastModified,
  ].join('::');
}

function normalizeChunkUploadConfig(chunkUpload = {}, baseConfig = {}) {
  const enabled = Boolean(chunkUpload?.enabled);
  const chunkSize = normalizePositiveInteger(chunkUpload?.chunkSize, DEFAULT_CHUNK_SIZE, 256 * 1024);
  const minFileSize = normalizePositiveInteger(chunkUpload?.minFileSize, chunkSize, 1);
  const persistResume = chunkUpload?.persistResume !== false;
  const resumeStore = (
    chunkUpload?.resumeStore &&
    typeof chunkUpload.resumeStore.load === 'function' &&
    typeof chunkUpload.resumeStore.save === 'function' &&
    typeof chunkUpload.resumeStore.remove === 'function'
  )
    ? chunkUpload.resumeStore
    : createDefaultResumeStore(
        chunkUpload?.storageKeyPrefix
          ? String(chunkUpload.storageKeyPrefix)
          : DEFAULT_RESUME_STORAGE_PREFIX,
        persistResume
      );

  return {
    enabled,
    chunkSize,
    minFileSize,
    concurrency: normalizePositiveInteger(chunkUpload?.concurrency, 1),
    resume: chunkUpload?.resume !== false,
    persistResume,
    appendDefaultFields: chunkUpload?.appendDefaultFields !== false,
    cleanupOnSuccess: chunkUpload?.cleanupOnSuccess !== false,
    fileFieldKey: chunkUpload?.fileFieldKey
      ? String(chunkUpload.fileFieldKey).trim()
      : (baseConfig.fileFieldKey ? String(baseConfig.fileFieldKey).trim() : 'file'),
    fields: sanitizeChunkFieldNames(chunkUpload?.fields),
    sessionId: typeof chunkUpload?.sessionId === 'function' || typeof chunkUpload?.sessionId === 'string'
      ? chunkUpload.sessionId
      : '',
    resolveSession: typeof chunkUpload?.resolveSession === 'function'
      ? chunkUpload.resolveSession
      : null,
    completeUpload: typeof chunkUpload?.completeUpload === 'function'
      ? chunkUpload.completeUpload
      : null,
    shouldSkipChunk: typeof chunkUpload?.shouldSkipChunk === 'function'
      ? chunkUpload.shouldSkipChunk
      : null,
    onChunkComplete: typeof chunkUpload?.onChunkComplete === 'function'
      ? chunkUpload.onChunkComplete
      : null,
    resumeStore,
  };
}

function shouldUseChunkUpload(file, normalizedConfig) {
  const chunkUpload = normalizedConfig?.chunkUpload;
  if (!chunkUpload?.enabled) {
    return false;
  }

  const fileSize = Number(file?.size) || 0;
  if (fileSize <= 0 || fileSize < chunkUpload.minFileSize) {
    return false;
  }

  return Math.ceil(fileSize / chunkUpload.chunkSize) > 1;
}

function buildChunkDescriptors(fileSize, chunkSize) {
  if (!fileSize || fileSize <= 0) {
    return [];
  }

  const descriptors = [];
  for (let start = 0, chunkIndex = 0; start < fileSize; start += chunkSize, chunkIndex += 1) {
    const end = Math.min(fileSize, start + chunkSize);
    descriptors.push({
      chunkIndex,
      chunkNumber: chunkIndex + 1,
      totalChunks: Math.ceil(fileSize / chunkSize),
      chunkStart: start,
      chunkEnd: end,
      chunkSize: end - start,
      isLastChunk: end >= fileSize,
    });
  }
  return descriptors;
}

function createChunkFile(file, descriptor) {
  const chunkBlob = file.slice(descriptor.chunkStart, descriptor.chunkEnd, file.type || undefined);
  const chunkFileName = file?.name || 'blob';
  if (typeof File !== 'undefined') {
    return new File([chunkBlob], chunkFileName, {
      type: file?.type || chunkBlob.type || '',
      lastModified: file?.lastModified || Date.now(),
    });
  }
  return chunkBlob;
}

function buildChunkFileMeta(file, fileMeta = {}, descriptor, sessionId) {
  return {
    ...fileMeta,
    sessionId,
    chunkIndex: descriptor.chunkIndex,
    chunkNumber: descriptor.chunkNumber,
    totalChunks: descriptor.totalChunks,
    chunkSize: descriptor.chunkSize,
    chunkStart: descriptor.chunkStart,
    chunkEnd: descriptor.chunkEnd,
    isLastChunk: descriptor.isLastChunk,
    sourceFileName: fileMeta.sourceFileName || fileMeta.originalFileName || file?.name || '',
    sourceFileSize: fileMeta.sourceFileSize ?? fileMeta.originalFileSize ?? file?.size ?? 0,
  };
}

function createRequestAbortState(externalSignal = null, timeoutMs = 0) {
  const controller = new AbortController();
  let timeoutId = null;
  let timedOut = false;

  const handleExternalAbort = () => {
    controller.abort(externalSignal?.reason || createAbortError('上传已取消'));
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason || createAbortError('上传已取消'));
    } else {
      externalSignal.addEventListener('abort', handleExternalAbort, { once: true });
    }
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(createAbortError(`上传超时 (${timeoutMs}ms)`));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (externalSignal) {
        externalSignal.removeEventListener('abort', handleExternalAbort);
      }
    },
  };
}

export function normalizeUploadConfig(config = {}) {
  const formFields = Array.isArray(config.formFields)
    ? config.formFields
        .filter((field) => field && field.key)
        .map((field, index) => ({
          id: field.id || `field-${index + 1}`,
          key: String(field.key),
          valueType: field.valueType || 'text',
          textValue: field.textValue ?? '',
        }))
    : [];

  return {
    url: config.url ? String(config.url).trim() : '',
    method: (config.method || 'POST').toUpperCase(),
    authorization: config.authorization ? String(config.authorization).trim() : '',
    cookie: config.cookie ? String(config.cookie).trim() : '',
    contentType: config.contentType ? String(config.contentType).trim() : '',
    headers: sanitizeHeaders(config.headers),
    dataMode: config.dataMode === 'jsonTemplate' ? 'jsonTemplate' : 'formFields',
    formFields,
    jsonTemplate: typeof config.jsonTemplate === 'string'
      ? config.jsonTemplate
      : JSON.stringify(config.jsonTemplate || {}, null, 2),
    fileFieldKey: config.fileFieldKey ? String(config.fileFieldKey).trim() : 'file',
    retry: normalizeRetryConfig(config.retry),
    fetchImpl: typeof config.fetchImpl === 'function' ? config.fetchImpl : fetch,
    beforeRequest: typeof config.beforeRequest === 'function' ? config.beforeRequest : null,
    afterResponse: typeof config.afterResponse === 'function' ? config.afterResponse : null,
    parseResponse: typeof config.parseResponse === 'function' ? config.parseResponse : null,
    transformResponse: typeof config.transformResponse === 'function'
      ? config.transformResponse
      : (typeof config.responseAdapter === 'function' ? config.responseAdapter : null),
    timeoutMs: normalizeTimeoutMs(config.timeoutMs ?? config.timeout),
    signal: config.signal || null,
    chunkUpload: normalizeChunkUploadConfig(config.chunkUpload, config),
  };
}

export function buildUploadContext(file, fileMeta = {}) {
  const originalFileName = fileMeta.sourceFileName ||
    fileMeta.originalFileName ||
    file.name;
  const originalFileSize = fileMeta.sourceFileSize ??
    fileMeta.originalSize ??
    file.size;

  return {
    file,
    fileName: file?.name || '',
    fileType: file.type || '',
    fileSize: file.size ?? 0,
    originalFileName,
    originalFileSize,
    compressedFileName: fileMeta.compressedFileName || file?.name || '',
    compressedFileType: file.type || '',
    compressedFileSize: fileMeta.compressedSize ?? file.size ?? 0,
    savedSize: fileMeta.savedSize ?? '',
    savedPercentage: fileMeta.savedPercentage ?? '',
    chunkIndex: fileMeta.chunkIndex ?? '',
    chunkNumber: fileMeta.chunkNumber ?? '',
    totalChunks: fileMeta.totalChunks ?? '',
    chunkSize: fileMeta.chunkSize ?? '',
    chunkStart: fileMeta.chunkStart ?? '',
    chunkEnd: fileMeta.chunkEnd ?? '',
    sessionId: fileMeta.sessionId || fileMeta.uploadSessionId || '',
    isLastChunk: fileMeta.isLastChunk ?? false,
  };
}

function resolveContextValue(valueType, context, textValue = '') {
  switch (valueType) {
    case 'file':
      return context.file;
    case 'fileName':
      return context.fileName;
    case 'fileType':
      return context.fileType;
    case 'fileSize':
      return String(context.fileSize);
    case 'originalFileName':
      return context.originalFileName;
    case 'originalFileSize':
      return String(context.originalFileSize ?? '');
    case 'compressedFileName':
      return context.compressedFileName;
    case 'compressedFileType':
      return context.compressedFileType;
    case 'compressedFileSize':
      return String(context.compressedFileSize ?? '');
    case 'savedSize':
      return String(context.savedSize ?? '');
    case 'savedPercentage':
      return String(context.savedPercentage ?? '');
    case 'chunkIndex':
      return String(context.chunkIndex ?? '');
    case 'chunkNumber':
      return String(context.chunkNumber ?? '');
    case 'totalChunks':
      return String(context.totalChunks ?? '');
    case 'chunkSize':
      return String(context.chunkSize ?? '');
    case 'chunkStart':
      return String(context.chunkStart ?? '');
    case 'chunkEnd':
      return String(context.chunkEnd ?? '');
    case 'sessionId':
      return String(context.sessionId ?? '');
    case 'isLastChunk':
      return String(Boolean(context.isLastChunk));
    case 'text':
    default:
      return textValue ?? '';
  }
}

function stringifyPreviewValue(value) {
  if (isBinaryValue(value)) {
    return `${value.name || 'binary'} (${value.size ?? 0} bytes)`;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function appendFormEntry(formData, entries, key, value, source) {
  if (!key) return;
  if (value === undefined || value === null) return;

  if (isBinaryValue(value)) {
    formData.append(key, value);
    entries.push({
      key,
      source,
      isFile: true,
      previewValue: stringifyPreviewValue(value),
    });
    return;
  }

  const textValue = typeof value === 'string' ? value : JSON.stringify(value);
  formData.append(key, textValue);
  entries.push({
    key,
    source,
    isFile: false,
    previewValue: textValue,
  });
}

function templateContainsFile(template) {
  if (typeof template === 'string') {
    return template.trim() === UPLOAD_PLACEHOLDERS.file;
  }

  if (Array.isArray(template)) {
    return template.some((item) => templateContainsFile(item));
  }

  if (isPlainObject(template)) {
    return Object.values(template).some((value) => templateContainsFile(value));
  }

  return false;
}

function resolveTemplateValue(value, context) {
  if (typeof value === 'string') {
    const exactMatch = value.trim().match(EXACT_PLACEHOLDER_PATTERN);
    if (exactMatch) {
      const exactValue = context[exactMatch[1]];
      return exactValue === undefined ? value : exactValue;
    }

    return value.replace(INLINE_PLACEHOLDER_PATTERN, (_, token) => {
      const resolved = context[token];
      if (resolved === undefined || resolved === null || isBinaryValue(resolved)) {
        return '';
      }
      return String(resolved);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValue(item, context));
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce((result, [key, nestedValue]) => {
      result[key] = resolveTemplateValue(nestedValue, context);
      return result;
    }, {});
  }

  return value;
}

function appendResolvedTemplate(formData, entries, key, value) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendResolvedTemplate(formData, entries, `${key}[${index}]`, item);
    });
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendResolvedTemplate(formData, entries, `${key}[${childKey}]`, childValue);
    });
    return;
  }

  appendFormEntry(formData, entries, key, value, 'jsonTemplate');
}

function appendDefaultChunkEntries(formData, entries, normalizedConfig, context) {
  const chunkUpload = normalizedConfig?.chunkUpload;
  if (!chunkUpload?.enabled || !chunkUpload.appendDefaultFields || context.chunkIndex === '') {
    return;
  }

  const existingKeys = new Set(entries.map((entry) => entry.key));
  const chunkFieldValues = {
    sessionId: context.sessionId,
    chunkIndex: String(context.chunkIndex ?? ''),
    chunkNumber: String(context.chunkNumber ?? ''),
    totalChunks: String(context.totalChunks ?? ''),
    chunkSize: String(context.chunkSize ?? ''),
    chunkStart: String(context.chunkStart ?? ''),
    chunkEnd: String(context.chunkEnd ?? ''),
    isLastChunk: String(Boolean(context.isLastChunk)),
  };

  Object.entries(chunkUpload.fields).forEach(([token, fieldKey]) => {
    if (!fieldKey || existingKeys.has(fieldKey)) {
      return;
    }
    appendFormEntry(formData, entries, fieldKey, chunkFieldValues[token], token);
    existingKeys.add(fieldKey);
  });
}

function parseJsonTemplate(jsonTemplate) {
  if (!jsonTemplate) {
    return {};
  }

  if (typeof jsonTemplate === 'string') {
    return JSON.parse(jsonTemplate);
  }

  if (isPlainObject(jsonTemplate)) {
    return jsonTemplate;
  }

  throw new Error('jsonTemplate 必须是 JSON 字符串或对象');
}

export function buildUploadRequestHeaders(config = {}) {
  const normalizedConfig = normalizeUploadConfig(config);
  const headers = { ...normalizedConfig.headers };
  if (normalizedConfig.authorization) {
    headers.Authorization = normalizedConfig.authorization;
  }
  if (normalizedConfig.cookie) {
    headers.Cookie = normalizedConfig.cookie;
  }
  if (normalizedConfig.contentType) {
    headers['Content-Type'] = normalizedConfig.contentType;
  }
  return headers;
}

function extractErrorMessage(responseData, response) {
  if (typeof responseData === 'string' && responseData) {
    return responseData;
  }

  if (isPlainObject(responseData)) {
    return responseData.message || responseData.msg || responseData.error || `上传失败 (${response.status})`;
  }

  return `上传失败 (${response.status})`;
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export function buildUploadFormData(file, fileMeta = {}, config = {}) {
  ensureHttpSupport();

  const normalizedConfig = normalizeUploadConfig(config);
  if (!normalizedConfig.url) {
    throw new Error('上传地址不能为空');
  }

  if (!file) {
    throw new Error('缺少待上传文件');
  }

  const context = buildUploadContext(file, fileMeta);
  const formData = new FormData();
  const entries = [];

  if (normalizedConfig.dataMode === 'formFields') {
    normalizedConfig.formFields.forEach((field) => {
      const value = resolveContextValue(field.valueType, context, field.textValue);
      appendFormEntry(formData, entries, field.key, value, field.valueType);
    });

    const hasFileField = normalizedConfig.formFields.some((field) => field.valueType === 'file');
    if (!hasFileField && normalizedConfig.fileFieldKey) {
      appendFormEntry(formData, entries, normalizedConfig.fileFieldKey, context.file, 'file');
    }
  } else {
    const templateObject = parseJsonTemplate(normalizedConfig.jsonTemplate);
    const resolvedTemplate = resolveTemplateValue(templateObject, context);

    Object.entries(resolvedTemplate).forEach(([key, value]) => {
      appendResolvedTemplate(formData, entries, key, value);
    });

    if (!templateContainsFile(templateObject) && normalizedConfig.fileFieldKey) {
      appendFormEntry(formData, entries, normalizedConfig.fileFieldKey, context.file, 'file');
    }
  }

  appendDefaultChunkEntries(formData, entries, normalizedConfig, context);

  return {
    formData,
    config: normalizedConfig,
    entries,
  };
}

export function createUploadPayloadPreview(file, fileMeta = {}, config = {}) {
  const normalizedConfig = normalizeUploadConfig(config);

  if (shouldUseChunkUpload(file, normalizedConfig)) {
    const chunkDescriptors = buildChunkDescriptors(file.size, normalizedConfig.chunkUpload.chunkSize);
    const previewDescriptor = chunkDescriptors[0];
    const previewSessionId = typeof normalizedConfig.chunkUpload.sessionId === 'string' &&
      normalizedConfig.chunkUpload.sessionId
      ? normalizedConfig.chunkUpload.sessionId
      : buildDefaultChunkSessionId(file, fileMeta, normalizedConfig);
    const previewChunkFile = createChunkFile(file, previewDescriptor);
    const previewChunkMeta = buildChunkFileMeta(file, fileMeta, previewDescriptor, previewSessionId);
    const previewConfig = normalizedConfig.chunkUpload.fileFieldKey &&
      normalizedConfig.chunkUpload.fileFieldKey !== normalizedConfig.fileFieldKey
      ? {
          ...normalizedConfig,
          fileFieldKey: normalizedConfig.chunkUpload.fileFieldKey,
        }
      : normalizedConfig;
    const { entries } = buildUploadFormData(previewChunkFile, previewChunkMeta, previewConfig);
    return {
      config: normalizedConfig,
      entries,
      chunkUpload: {
        enabled: true,
        sessionId: previewSessionId,
        totalChunks: chunkDescriptors.length,
        previewChunkIndex: previewDescriptor.chunkIndex,
        previewChunkSize: previewDescriptor.chunkSize,
      },
    };
  }

  const { entries } = buildUploadFormData(file, fileMeta, normalizedConfig);
  return {
    config: normalizedConfig,
    entries,
  };
}

async function executeUploadRequest(file, fileMeta = {}, normalizedConfig, requestOverrides = {}) {
  const { formData, entries } = requestOverrides.formData
    ? {
        formData: requestOverrides.formData,
        entries: Array.isArray(requestOverrides.entries) ? requestOverrides.entries : [],
      }
    : buildUploadFormData(file, fileMeta, normalizedConfig);
  let requestState = {
    url: requestOverrides.url || normalizedConfig.url,
    method: requestOverrides.method || normalizedConfig.method,
    headers: requestOverrides.headers || buildUploadRequestHeaders(normalizedConfig),
    body: requestOverrides.body || formData,
    file,
    fileMeta,
    entries,
    config: normalizedConfig,
    attempt: 0,
    timeoutMs: normalizeTimeoutMs(requestOverrides.timeoutMs ?? requestOverrides.timeout ?? normalizedConfig.timeoutMs),
    signal: requestOverrides.signal || normalizedConfig.signal,
    uploadMode: requestOverrides.uploadMode || 'single',
    chunkInfo: requestOverrides.chunkInfo || null,
    session: requestOverrides.session || null,
  };

  if (normalizedConfig.beforeRequest) {
    const overriddenRequest = await normalizedConfig.beforeRequest({ ...requestState });
    if (overriddenRequest && typeof overriddenRequest === 'object') {
      requestState = {
        ...requestState,
        ...overriddenRequest,
        headers: overriddenRequest.headers ? sanitizeHeaders(overriddenRequest.headers) : requestState.headers,
        timeoutMs: normalizeTimeoutMs(overriddenRequest.timeoutMs ?? overriddenRequest.timeout ?? requestState.timeoutMs),
        signal: overriddenRequest.signal || requestState.signal,
        uploadMode: overriddenRequest.uploadMode || requestState.uploadMode,
        chunkInfo: overriddenRequest.chunkInfo || requestState.chunkInfo,
        session: overriddenRequest.session || requestState.session,
      };
    }
  }

  const fetchImpl = normalizedConfig.fetchImpl || fetch;
  const retryConfig = normalizedConfig.retry || normalizeRetryConfig();
  const parseResponse = normalizedConfig.parseResponse || parseResponseBody;

  for (let attempt = 0; attempt <= retryConfig.count; attempt++) {
    requestState.attempt = attempt;

    try {
      const abortState = createRequestAbortState(requestState.signal, requestState.timeoutMs);
      let response;
      try {
        response = await fetchImpl(requestState.url, {
          method: requestState.method,
          headers: requestState.headers,
          body: requestState.body,
          signal: abortState.signal,
        });
      } catch (error) {
        abortState.cleanup();
        if (abortState.didTimeout()) {
          const timeoutError = createAbortError(`上传超时 (${requestState.timeoutMs}ms)`);
          timeoutError.isTimeout = true;
          throw timeoutError;
        }
        if (abortState.signal.aborted) {
          throw createAbortError('上传已取消');
        }
        throw error;
      }

      try {
        const responseData = await parseResponse(response, { ...requestState });
        const transformedData = normalizedConfig.transformResponse
          ? await normalizedConfig.transformResponse(responseData, response, { ...requestState })
          : responseData;

        let uploadResult = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url || requestState.url,
          data: transformedData,
          rawData: responseData,
          requestEntries: entries,
          attempts: attempt + 1,
          uploadMode: requestState.uploadMode,
        };

        if (normalizedConfig.afterResponse) {
          const overriddenResult = await normalizedConfig.afterResponse(uploadResult, response, { ...requestState });
          if (overriddenResult && typeof overriddenResult === 'object') {
            uploadResult = {
              ...uploadResult,
              ...overriddenResult,
            };
          }
        }

        if (!response.ok) {
          const error = new Error(extractErrorMessage(uploadResult.data, response));
          error.response = uploadResult;

          const shouldRetry = retryConfig.shouldRetry
            ? await retryConfig.shouldRetry(error, { ...requestState, response, uploadResult, attempt })
            : retryConfig.retryOnStatuses.includes(response.status);

          if (!shouldRetry || attempt >= retryConfig.count) {
            throw error;
          }

          await waitForRetry(getRetryDelay(retryConfig, attempt + 1));
          continue;
        }

        return uploadResult;
      } finally {
        abortState.cleanup();
      }
    } catch (error) {
      if (error?.name === 'AbortError' && !error?.isTimeout) {
        throw error;
      }

      const shouldRetry = retryConfig.shouldRetry
        ? await retryConfig.shouldRetry(error, { ...requestState, attempt })
        : false;

      if (attempt >= retryConfig.count || (!shouldRetry && error?.response)) {
        throw error;
      }

      if (attempt >= retryConfig.count) {
        throw error;
      }

      if (!error?.response && !shouldRetry && attempt < retryConfig.count) {
        await waitForRetry(getRetryDelay(retryConfig, attempt + 1));
        continue;
      }

      if (shouldRetry) {
        await waitForRetry(getRetryDelay(retryConfig, attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw new Error('上传失败');
}

async function uploadFileInChunks(file, fileMeta = {}, normalizedConfig) {
  const chunkUpload = normalizedConfig.chunkUpload;
  const chunkDescriptors = buildChunkDescriptors(file.size, chunkUpload.chunkSize);
  const defaultSessionId = buildDefaultChunkSessionId(file, fileMeta, normalizedConfig);
  let sessionId = typeof chunkUpload.sessionId === 'function'
    ? await chunkUpload.sessionId({
        file,
        fileMeta,
        config: normalizedConfig,
        chunkSize: chunkUpload.chunkSize,
        totalChunks: chunkDescriptors.length,
        defaultSessionId,
      })
    : chunkUpload.sessionId;
  sessionId = String(sessionId || defaultSessionId);

  let resumeState = chunkUpload.resume
    ? normalizeChunkResumeState(
        await chunkUpload.resumeStore.load(sessionId, {
          file,
          fileMeta,
          config: normalizedConfig,
        }),
        chunkDescriptors.length,
        {
          sessionId,
          fileName: fileMeta.sourceFileName || fileMeta.originalFileName || file?.name || '',
          fileSize: fileMeta.sourceFileSize ?? fileMeta.originalFileSize ?? file?.size ?? 0,
          chunkSize: chunkUpload.chunkSize,
          totalChunks: chunkDescriptors.length,
        }
      )
    : normalizeChunkResumeState(null, chunkDescriptors.length, {
        sessionId,
        fileName: fileMeta.sourceFileName || fileMeta.originalFileName || file?.name || '',
        fileSize: fileMeta.sourceFileSize ?? fileMeta.originalFileSize ?? file?.size ?? 0,
        chunkSize: chunkUpload.chunkSize,
        totalChunks: chunkDescriptors.length,
      });

  let uploadedChunks = normalizeChunkIndexList(resumeState.completedChunks, chunkDescriptors.length);
  let sessionMetadata = {};

  if (chunkUpload.resolveSession) {
    const resolvedSession = await chunkUpload.resolveSession({
      file,
      fileMeta,
      config: normalizedConfig,
      chunkUpload,
      chunkSize: chunkUpload.chunkSize,
      totalChunks: chunkDescriptors.length,
      sessionId,
      defaultSessionId,
      uploadedChunks: [...uploadedChunks],
      resumeState,
    });

    if (resolvedSession && typeof resolvedSession === 'object') {
      const resolvedSessionId = resolvedSession.sessionId ? String(resolvedSession.sessionId) : sessionId;
      if (resolvedSessionId !== sessionId) {
        sessionId = resolvedSessionId;
        resumeState = chunkUpload.resume
          ? normalizeChunkResumeState(
              await chunkUpload.resumeStore.load(sessionId, {
                file,
                fileMeta,
                config: normalizedConfig,
              }),
              chunkDescriptors.length,
              {
                ...resumeState,
                sessionId,
              }
            )
          : {
              ...resumeState,
              sessionId,
            };
      }

      if (Array.isArray(resolvedSession.uploadedChunks)) {
        uploadedChunks = normalizeChunkIndexList(
          [...uploadedChunks, ...resolvedSession.uploadedChunks],
          chunkDescriptors.length
        );
      }

      if (isPlainObject(resolvedSession.resumeState)) {
        resumeState = normalizeChunkResumeState(
          {
            ...resumeState,
            ...resolvedSession.resumeState,
            sessionId,
            completedChunks: [
              ...(resumeState.completedChunks || []),
              ...(resolvedSession.resumeState.completedChunks || []),
              ...uploadedChunks,
            ],
          },
          chunkDescriptors.length,
          {
            ...resumeState,
            sessionId,
          }
        );
        uploadedChunks = normalizeChunkIndexList(resumeState.completedChunks, chunkDescriptors.length);
      }

      sessionMetadata = isPlainObject(resolvedSession.metadata)
        ? resolvedSession.metadata
        : {};
    }
  }

  const uploadedChunkSet = new Set(uploadedChunks);
  const chunkResults = new Array(chunkDescriptors.length);
  const skippedChunks = [];
  let totalAttempts = 0;
  let lastSuccessfulResult = null;
  let fatalError = null;
  const chunkAbortController = new AbortController();

  const persistResumeState = async () => {
    if (!chunkUpload.resume) {
      return;
    }
    resumeState = normalizeChunkResumeState({
      ...resumeState,
      sessionId,
      completedChunks: [...uploadedChunkSet],
      metadata: sessionMetadata,
      updatedAt: Date.now(),
    }, chunkDescriptors.length, {
      sessionId,
      fileName: resumeState.fileName,
      fileSize: resumeState.fileSize,
      chunkSize: chunkUpload.chunkSize,
      totalChunks: chunkDescriptors.length,
    });
    await chunkUpload.resumeStore.save(sessionId, resumeState, {
      file,
      fileMeta,
      config: normalizedConfig,
    });
  };

  uploadedChunks.forEach((chunkIndex) => {
    const descriptor = chunkDescriptors[chunkIndex];
    if (!descriptor) {
      return;
    }
    chunkResults[chunkIndex] = {
      ...descriptor,
      skipped: true,
      resumed: true,
    };
    skippedChunks.push(chunkIndex);
  });

  if (chunkUpload.resume && uploadedChunkSet.size > 0) {
    await persistResumeState();
  }

  const queue = chunkDescriptors.filter((descriptor) => !uploadedChunkSet.has(descriptor.chunkIndex));

  const worker = async () => {
    while (queue.length > 0 && !fatalError) {
      const descriptor = queue.shift();
      if (!descriptor) {
        continue;
      }

      const chunkContext = {
        file,
        fileMeta,
        config: normalizedConfig,
        chunkUpload,
        sessionId,
        sessionMetadata,
        uploadedChunks: [...uploadedChunkSet],
        descriptor,
      };

      try {
        if (chunkUpload.shouldSkipChunk) {
          const shouldSkip = await chunkUpload.shouldSkipChunk(chunkContext);
          if (shouldSkip) {
            uploadedChunkSet.add(descriptor.chunkIndex);
            chunkResults[descriptor.chunkIndex] = {
              ...descriptor,
              skipped: true,
              resumed: true,
            };
            skippedChunks.push(descriptor.chunkIndex);
            await persistResumeState();
            continue;
          }
        }

        const chunkFile = createChunkFile(file, descriptor);
        const chunkMeta = buildChunkFileMeta(file, fileMeta, descriptor, sessionId);
        const chunkConfig = chunkUpload.fileFieldKey &&
          chunkUpload.fileFieldKey !== normalizedConfig.fileFieldKey
          ? {
              ...normalizedConfig,
              fileFieldKey: chunkUpload.fileFieldKey,
            }
          : normalizedConfig;

        const chunkResult = await executeUploadRequest(
          chunkFile,
          chunkMeta,
          chunkConfig,
          {
            signal: chunkAbortController.signal,
            uploadMode: 'chunked',
            chunkInfo: descriptor,
            session: {
              sessionId,
              totalChunks: chunkDescriptors.length,
              uploadedChunks: [...uploadedChunkSet],
              metadata: sessionMetadata,
            },
          }
        );

        totalAttempts += chunkResult.attempts || 0;
        lastSuccessfulResult = chunkResult;
        uploadedChunkSet.add(descriptor.chunkIndex);
        chunkResults[descriptor.chunkIndex] = {
          ...descriptor,
          skipped: false,
          resumed: false,
          result: chunkResult,
        };

        await persistResumeState();

        if (chunkUpload.onChunkComplete) {
          await chunkUpload.onChunkComplete({
            ...chunkContext,
            chunkFile,
            chunkMeta,
            result: chunkResult,
            uploadedChunks: [...uploadedChunkSet],
          });
        }
      } catch (error) {
        if (!fatalError) {
          fatalError = error;
          chunkAbortController.abort(error);
        }
      }
    }
  };

  await Promise.all(
    Array(Math.min(chunkUpload.concurrency, Math.max(queue.length, 1)))
      .fill(null)
      .map(() => worker())
  );

  if (fatalError) {
    throw fatalError;
  }

  let finalResult = lastSuccessfulResult || {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: normalizedConfig.url,
    data: {
      sessionId,
      totalChunks: chunkDescriptors.length,
      uploadedChunks: [...uploadedChunkSet],
    },
    rawData: null,
    requestEntries: [],
    attempts: totalAttempts,
    uploadMode: 'chunked',
  };

  if (chunkUpload.completeUpload) {
    const completionPayload = await chunkUpload.completeUpload({
      file,
      fileMeta,
      config: normalizedConfig,
      chunkUpload,
      sessionId,
      sessionMetadata,
      totalChunks: chunkDescriptors.length,
      uploadedChunks: [...uploadedChunkSet],
      skippedChunks: [...skippedChunks],
      chunkResults,
      lastChunkResult: lastSuccessfulResult,
      resumeState,
    });

    if (completionPayload && typeof completionPayload === 'object' && 'ok' in completionPayload) {
      finalResult = {
        ...finalResult,
        ...completionPayload,
      };
    } else {
      finalResult = {
        ...finalResult,
        data: completionPayload,
        rawData: completionPayload,
      };
    }
  }

  finalResult = {
    ...finalResult,
    attempts: Math.max(totalAttempts, finalResult.attempts || 0),
    uploadMode: 'chunked',
    chunked: true,
    sessionId,
    chunkCount: chunkDescriptors.length,
    uploadedChunks: [...uploadedChunkSet].sort((left, right) => left - right),
    skippedChunks: [...skippedChunks].sort((left, right) => left - right),
    chunkResults,
    resumeUsed: skippedChunks.length > 0,
    requestEntries: finalResult.requestEntries || lastSuccessfulResult?.requestEntries || [],
  };

  if (chunkUpload.resume && chunkUpload.cleanupOnSuccess) {
    await chunkUpload.resumeStore.remove(sessionId, {
      file,
      fileMeta,
      config: normalizedConfig,
    });
  }

  return finalResult;
}

export async function uploadFileWithConfig(file, fileMeta = {}, config = {}) {
  const normalizedConfig = normalizeUploadConfig(config);
  if (shouldUseChunkUpload(file, normalizedConfig)) {
    return uploadFileInChunks(file, fileMeta, normalizedConfig);
  }
  return executeUploadRequest(file, fileMeta, normalizedConfig);
}

export const uploadCompressedFile = uploadFileWithConfig;

export default {
  UPLOAD_VALUE_TYPES,
  UPLOAD_PLACEHOLDERS,
  normalizeUploadConfig,
  buildUploadContext,
  buildUploadRequestHeaders,
  buildUploadFormData,
  createUploadPayloadPreview,
  uploadFileWithConfig,
  uploadCompressedFile,
};
