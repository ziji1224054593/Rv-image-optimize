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
    headers: sanitizeHeaders(config.headers),
    dataMode: config.dataMode === 'jsonTemplate' ? 'jsonTemplate' : 'formFields',
    formFields,
    jsonTemplate: typeof config.jsonTemplate === 'string'
      ? config.jsonTemplate
      : JSON.stringify(config.jsonTemplate || {}, null, 2),
    fileFieldKey: config.fileFieldKey ? String(config.fileFieldKey).trim() : 'file',
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
  const headers = buildUploadRequestHeaders(normalizedConfig);

  const response = await fetch(normalizedConfig.url, {
    method: normalizedConfig.method,
    headers,
    body: formData,
  });

  const responseData = await parseResponseBody(response);
  const uploadResult = {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || normalizedConfig.url,
    data: responseData,
    requestEntries: entries,
  };

  if (!response.ok) {
    const error = new Error(extractErrorMessage(responseData, response));
    error.response = uploadResult;
    throw error;
  }

  return uploadResult;
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
