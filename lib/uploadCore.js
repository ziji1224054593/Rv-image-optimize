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
};

const EXACT_PLACEHOLDER_PATTERN = /^\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}$/;
const INLINE_PLACEHOLDER_PATTERN = /\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g;

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
    fileName: file.name,
    fileType: file.type || '',
    fileSize: file.size ?? 0,
    originalFileName,
    originalFileSize,
    compressedFileName: fileMeta.compressedFileName || file.name,
    compressedFileType: file.type || '',
    compressedFileSize: fileMeta.compressedSize ?? file.size ?? 0,
    savedSize: fileMeta.savedSize ?? '',
    savedPercentage: fileMeta.savedPercentage ?? '',
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

  return {
    formData,
    config: normalizedConfig,
    entries,
  };
}

export function createUploadPayloadPreview(file, fileMeta = {}, config = {}) {
  const { entries, config: normalizedConfig } = buildUploadFormData(file, fileMeta, config);
  return {
    config: normalizedConfig,
    entries,
  };
}

export async function uploadFileWithConfig(file, fileMeta = {}, config = {}) {
  const { formData, config: normalizedConfig, entries } = buildUploadFormData(file, fileMeta, config);
  let requestState = {
    url: normalizedConfig.url,
    method: normalizedConfig.method,
    headers: buildUploadRequestHeaders(normalizedConfig),
    body: formData,
    file,
    fileMeta,
    entries,
    config: normalizedConfig,
    attempt: 0,
    timeoutMs: normalizedConfig.timeoutMs,
    signal: normalizedConfig.signal,
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
