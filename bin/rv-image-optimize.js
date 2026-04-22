#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { File } from 'node:buffer';
import {
  compressImageBuffer,
  compressImageDirectory,
  compressImageFile,
  isSupportedNodeImageFile,
} from '../dist/node-compress.es.js';
import {
  createUploadPayloadPreview,
  normalizeUploadConfig,
  uploadFileWithConfig,
} from '../dist/upload-core.es.js';

const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...args) => {
  const message = typeof warning === 'string' ? warning : warning?.message || '';
  const type = typeof args[0] === 'string' ? args[0] : warning?.name || '';
  if (type === 'ExperimentalWarning' && message.includes('buffer.File')) {
    return;
  }
  return originalEmitWarning(warning, ...args);
};

const UPLOAD_COMMAND = 'upload';
const PIPELINE_COMMAND = 'pipeline';

const COMPRESS_VALUE_OPTIONS = new Set([
  '--output',
  '--output-dir',
  '--format',
  '--quality',
  '--max-width',
  '--max-height',
  '--suffix',
  '--concurrency',
]);

const UPLOAD_VALUE_OPTIONS = new Set([
  '--config',
  '--url',
  '--method',
  '--authorization',
  '--cookie',
  '--content-type',
  '--header',
  '--data-mode',
  '--file-field-key',
  '--form-field',
  '--json-template',
  '--json-template-file',
  '--meta',
  '--meta-file',
  '--concurrency',
]);

const PIPELINE_VALUE_OPTIONS = new Set([
  ...COMPRESS_VALUE_OPTIONS,
  ...UPLOAD_VALUE_OPTIONS,
]);

function printMainHelp() {
  console.log(`
rv-image-optimize Node/CLI 工具

用法:
  rv-image-optimize <input> [options]
  rv-image-optimize upload <input> [options]
  rv-image-optimize pipeline <input> [options]

命令:
  <input>                 默认执行图片压缩
  upload                  执行文件上传 / 上传预览
  pipeline                先压缩，再按 FormData 配置上传

压缩示例:
  rv-image-optimize ./demo.jpg --format webp --quality 82
  rv-image-optimize ./images --output-dir ./compressed --format avif --quality 70 --json

上传示例:
  rv-image-optimize upload ./demo.webp --url https://example.com/upload --json
  rv-image-optimize upload ./dist --config ./upload.config.json --preview-only --json

一体化示例:
  rv-image-optimize pipeline ./images --format webp --quality 82 --config ./upload.config.json --json

更多帮助:
  rv-image-optimize --help
  rv-image-optimize upload --help
  rv-image-optimize pipeline --help
`);
}

function printCompressHelp() {
  console.log(`
rv-image-optimize Node/CLI 压缩工具

用法:
  rv-image-optimize <input> [options]

参数:
  <input>                 图片文件路径，或包含图片的目录路径

选项:
  --output <file>         单文件模式下的精确输出文件路径
  --output-dir <dir>      输出目录
  --format <fmt>          输出格式: jpeg | png | webp | avif | auto
  --quality <1-100>       压缩质量，默认 80
  --max-width <number>    最大宽度
  --max-height <number>   最大高度
  --suffix <text>         输出文件后缀，默认 .compressed
  --overwrite             覆盖已存在输出文件
  --delete-original       压缩成功后删除原图
  --replace-original      压缩成功后用压缩结果替换原图
  --flatten               目录压缩时不保留目录结构
  --no-recursive          目录压缩时不递归子目录
  --concurrency <number>  目录压缩并发数，默认 4
  --json                  输出 JSON 结果
  --help                  显示帮助

示例:
  rv-image-optimize ./demo.jpg --format webp --quality 82
  rv-image-optimize ./demo.jpg --output ./dist/demo.webp --format webp
  rv-image-optimize ./images --output-dir ./compressed --format avif --quality 70
  rv-image-optimize ./images --format webp --replace-original
`);
}

function printUploadHelp() {
  console.log(`
rv-image-optimize Upload CLI

用法:
  rv-image-optimize upload <input> [options]

参数:
  <input>                      待上传文件，或包含待上传文件的目录

选项:
  --config <file>              上传配置 JSON 文件
  --url <url>                  上传接口地址
  --method <method>            请求方法，默认 POST
  --authorization <value>      完整 Authorization 值，例如 Bearer xxx
  --cookie <value>             完整 Cookie 请求头值
  --content-type <value>       显式 Content-Type；FormData 默认建议留空
  --header <key=value>         额外请求头，可重复传入
  --data-mode <mode>           formFields | jsonTemplate
  --file-field-key <key>       当配置中未显式声明 file 字段时的兜底字段名
  --form-field <spec>          单个 form 字段，可传 key:valueType[:textValue] 或 JSON
  --json-template <json>       JSON 模板字符串
  --json-template-file <file>  JSON 模板文件
  --meta <json>                默认文件元数据 JSON
  --meta-file <file>           默认文件元数据 JSON 文件
  --no-recursive               目录模式下不递归子目录
  --concurrency <number>       目录上传并发数，默认 3
  --preview-only               仅构建请求预览，不实际发起请求
  --json                       输出 JSON 结果
  --help                       显示帮助

配置文件:
  可以直接传 uploadConfig 对象，也可以使用下列结构：
  {
    "uploadConfig": { ... },
    "fileMeta": { ... },
    "fileMetaByPath": {
      "demo.webp": { "sourceFileName": "demo.png" },
      "nested/image.webp": { "savedPercentage": 42.5 }
    }
  }

form-field 示例:
  --form-field file:file
  --form-field biz:text:review

示例:
  rv-image-optimize upload ./demo.webp --url https://example.com/upload --json
  rv-image-optimize upload ./dist --config ./upload.config.json --json
  rv-image-optimize upload ./demo.webp --url https://example.com/upload --preview-only --json
`);
}

function printPipelineHelp() {
  console.log(`
rv-image-optimize Pipeline CLI

用法:
  rv-image-optimize pipeline <input> [options]

说明:
  先压缩图片，再基于 FormData 配置上传压缩结果。
  当前只保留 FormData 请求方式，不生成 JSON / urlencoded 请求体。

参数:
  <input>                      待压缩并上传的图片文件，或包含图片的目录

压缩选项:
  --format <fmt>              输出格式: jpeg | png | webp | avif | auto
  --quality <1-100>           压缩质量，默认 80
  --max-width <number>        最大宽度
  --max-height <number>       最大高度
  --suffix <text>             压缩结果文件名后缀，默认 .compressed
  --no-recursive              目录模式下不递归子目录
  --concurrency <number>      目录处理并发数，默认 3

上传选项:
  --config <file>             上传配置 JSON 文件
  --url <url>                 上传接口地址
  --method <method>           请求方法，默认 POST
  --authorization <value>     完整 Authorization 值，例如 Bearer xxx
  --cookie <value>            完整 Cookie 请求头值
  --content-type <value>      显式 Content-Type；FormData 默认建议留空
  --header <key=value>        额外请求头，可重复传入
  --data-mode <mode>          formFields | jsonTemplate
  --file-field-key <key>      当配置中未显式声明 file 字段时的兜底字段名
  --form-field <spec>         单个 form 字段，可传 key:valueType[:textValue] 或 JSON
  --json-template <json>      JSON 模板字符串
  --json-template-file <file> JSON 模板文件
  --meta <json>               默认文件元数据 JSON
  --meta-file <file>          默认文件元数据 JSON 文件
  --preview-only              仅预览压缩结果与上传请求，不实际发请求
  --json                      输出 JSON 结果
  --help                      显示帮助

示例:
  rv-image-optimize pipeline ./demo.png --format webp --quality 82 --url https://example.com/upload --form-field file:file --json
  rv-image-optimize pipeline ./images --format webp --config ./upload.config.json --preview-only --json
`);
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function readOptionValues(args, name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name) {
      values.push(args[index + 1]);
      index += 1;
    }
  }
  return values.filter((value) => value !== undefined);
}

function hasFlag(args, name) {
  return args.includes(name);
}

function getPositionalArgs(args, valueOptions) {
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith('--')) {
      if (valueOptions.has(arg)) {
        index += 1;
      }
      continue;
    }
    positionals.push(arg);
  }
  return positionals;
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function sanitizeCompressResultForJson(result) {
  return {
    ...result,
    buffer: result?.buffer ? `<Buffer ${result.buffer.length} bytes>` : undefined,
  };
}

function printCompressedFileSummary(result) {
  console.log(`输入文件: ${result.inputPath}`);
  console.log(`输出文件: ${result.outputPath}`);
  console.log(`格式: ${result.originalFormat || 'unknown'} -> ${result.compressedFormat}`);
  console.log(`尺寸: ${result.originalWidth || '?'} x ${result.originalHeight || '?'} -> ${result.compressedWidth || '?'} x ${result.compressedHeight || '?'}`);
  console.log(`大小: ${result.originalSizeFormatted || '未知'} -> ${result.compressedSizeFormatted}`);
  if (result.savedPercentage !== null) {
    console.log(`变化: ${result.savedPercentage > 0 ? '-' : '+'}${Math.abs(result.savedPercentage)}% (${result.savedSizeFormatted})`);
  }
  if (result.replacedOriginal) {
    console.log('原图处理: 已替换原图');
  } else if (result.originalDeleted) {
    console.log('原图处理: 已删除原图');
  }
}

function printCompressedDirectorySummary(result) {
  console.log(`输入目录: ${result.inputDir}`);
  console.log(`输出目录: ${result.outputDir}`);
  console.log(`总数: ${result.total}，成功: ${result.success}，失败: ${result.failed}`);

  result.items.forEach((item) => {
    if (item.success) {
      const action = item.result.replacedOriginal
        ? '，已替换原图'
        : item.result.originalDeleted
          ? '，已删除原图'
          : '';
      console.log(`✔ ${path.basename(item.inputPath)} -> ${item.result.compressedSizeFormatted}${action}`);
    } else {
      console.log(`✖ ${path.basename(item.inputPath)} -> ${item.error}`);
    }
  });
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function redactHeaders(headers = {}) {
  return Object.entries(headers).reduce((result, [key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === 'authorization' || normalizedKey === 'cookie') {
      result[key] = '<redacted>';
      return result;
    }
    result[key] = value;
    return result;
  }, {});
}

function redactUploadConfig(config = {}) {
  return {
    ...config,
    authorization: config.authorization ? '<redacted>' : '',
    cookie: config.cookie ? '<redacted>' : '',
    headers: redactHeaders(config.headers || {}),
  };
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJsonString(rawValue, label) {
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`${label} 不是合法 JSON: ${error.message}`);
  }
}

async function readJsonFile(filePath, label) {
  const content = await fs.readFile(path.resolve(filePath), 'utf8');
  return parseJsonString(content.replace(/^\uFEFF/, ''), label);
}

function mergeObjects(baseValue, overrideValue) {
  return {
    ...(isPlainObject(baseValue) ? baseValue : {}),
    ...(isPlainObject(overrideValue) ? overrideValue : {}),
  };
}

function normalizePathKey(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .toLowerCase();
}

function parseHeaderEntry(rawValue) {
  const equalIndex = rawValue.indexOf('=');
  if (equalIndex <= 0) {
    throw new Error(`header 参数格式错误: ${rawValue}，应为 key=value`);
  }
  const key = rawValue.slice(0, equalIndex).trim();
  const value = rawValue.slice(equalIndex + 1).trim();
  if (!key) {
    throw new Error(`header 参数格式错误: ${rawValue}`);
  }
  return { key, value };
}

function parseFormFieldEntry(rawValue) {
  if (!rawValue.trim().startsWith('{')) {
    const [key, valueType = 'text', ...rest] = rawValue.split(':');
    if (!key || !valueType) {
      throw new Error('--form-field 简写格式应为 key:valueType[:textValue]');
    }
    return {
      key,
      valueType,
      textValue: rest.join(':'),
    };
  }

  const field = parseJsonString(rawValue, '--form-field');
  if (!isPlainObject(field) || !field.key) {
    throw new Error('--form-field 必须是包含 key 的 JSON 对象');
  }
  return field;
}

function resolveMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.bmp':
      return 'image/bmp';
    case '.json':
      return 'application/json';
    case '.txt':
    case '.md':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

function resolveOutputExtension(format) {
  if (format === 'jpeg') {
    return 'jpg';
  }
  return format || 'bin';
}

function buildCompressedFileName(filePath, format, suffix = '.compressed') {
  const parsed = path.parse(filePath);
  return `${parsed.name}${suffix}.${resolveOutputExtension(format)}`;
}

function buildSharedCompressOptions(args, defaultConcurrency = 4) {
  const format = readOption(args, '--format');
  const quality = readOption(args, '--quality');
  const maxWidth = readOption(args, '--max-width');
  const maxHeight = readOption(args, '--max-height');
  const suffix = readOption(args, '--suffix');
  const concurrency = readOption(args, '--concurrency');

  return {
    format: format === 'auto' ? null : format,
    quality: quality ? Number(quality) : 80,
    maxWidth: maxWidth ? Number(maxWidth) : null,
    maxHeight: maxHeight ? Number(maxHeight) : null,
    suffix: suffix || '.compressed',
    recursive: !hasFlag(args, '--no-recursive'),
    concurrency: concurrency ? Number(concurrency) : defaultConcurrency,
  };
}

async function walkFiles(directoryPath, recursive = true) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...await walkFiles(entryPath, recursive));
      }
      continue;
    }
    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function createUploadFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const [buffer, stat] = await Promise.all([
    fs.readFile(absolutePath),
    fs.stat(absolutePath),
  ]);

  return {
    file: new File([buffer], path.basename(absolutePath), {
      type: resolveMimeType(absolutePath),
      lastModified: stat.mtimeMs,
    }),
    stat,
    absolutePath,
  };
}

async function loadUploadCliConfig(args) {
  const configPath = readOption(args, '--config');
  const metaPath = readOption(args, '--meta-file');

  const configPayload = configPath
    ? await readJsonFile(configPath, '--config')
    : {};

  const rootConfig = isPlainObject(configPayload.uploadConfig)
    ? configPayload.uploadConfig
    : configPayload;
  const rootMeta = isPlainObject(configPayload.fileMeta)
    ? configPayload.fileMeta
    : {};
  const rootMetaByPath = isPlainObject(configPayload.fileMetaByPath)
    ? configPayload.fileMetaByPath
    : {};

  const inlineHeaders = readOptionValues(args, '--header');
  const headerOverrides = inlineHeaders.reduce((result, item) => {
    const { key, value } = parseHeaderEntry(item);
    result[key] = value;
    return result;
  }, {});

  const formFieldArgs = readOptionValues(args, '--form-field');
  const formFields = formFieldArgs.length > 0
    ? formFieldArgs.map(parseFormFieldEntry)
    : undefined;

  const inlineMeta = readOption(args, '--meta');
  const metaFromFile = metaPath
    ? await readJsonFile(metaPath, '--meta-file')
    : {};
  if (metaPath && !isPlainObject(metaFromFile)) {
    throw new Error('--meta-file 必须是 JSON 对象');
  }

  const parsedInlineMeta = inlineMeta
    ? parseJsonString(inlineMeta, '--meta')
    : {};
  if (inlineMeta && !isPlainObject(parsedInlineMeta)) {
    throw new Error('--meta 必须是 JSON 对象');
  }

  const jsonTemplatePath = readOption(args, '--json-template-file');
  const jsonTemplateInline = readOption(args, '--json-template');
  if (jsonTemplatePath && jsonTemplateInline) {
    throw new Error('--json-template 和 --json-template-file 不能同时使用');
  }

  const jsonTemplate = jsonTemplatePath
    ? await fs.readFile(path.resolve(jsonTemplatePath), 'utf8')
    : jsonTemplateInline;

  const cliConfig = {
    url: readOption(args, '--url'),
    method: readOption(args, '--method'),
    authorization: readOption(args, '--authorization'),
    cookie: readOption(args, '--cookie'),
    contentType: readOption(args, '--content-type'),
    dataMode: readOption(args, '--data-mode'),
    fileFieldKey: readOption(args, '--file-field-key'),
  };

  const mergedConfig = {
    ...rootConfig,
    ...Object.fromEntries(Object.entries(cliConfig).filter(([, value]) => value !== undefined)),
    headers: mergeObjects(rootConfig.headers, headerOverrides),
  };

  if (formFields) {
    mergedConfig.formFields = formFields;
  }
  if (jsonTemplate !== undefined) {
    mergedConfig.jsonTemplate = jsonTemplate;
  }

  const config = normalizeUploadConfig(mergedConfig);
  if (!config.url) {
    throw new Error('upload 命令需要提供 --url 或 --config');
  }

  return {
    config,
    previewOnly: hasFlag(args, '--preview-only'),
    asJson: hasFlag(args, '--json'),
    recursive: !hasFlag(args, '--no-recursive'),
    concurrency: Math.max(1, parseInteger(readOption(args, '--concurrency'), 3)),
    fileMeta: {
      ...rootMeta,
      ...metaFromFile,
      ...parsedInlineMeta,
    },
    fileMetaByPath: rootMetaByPath,
  };
}

function resolveFileMeta(filePath, inputRoot, defaultMeta, fileMetaByPath) {
  const absolutePath = path.resolve(filePath);
  const relativePath = inputRoot
    ? normalizePathKey(path.relative(path.resolve(inputRoot), absolutePath))
    : '';
  const basename = normalizePathKey(path.basename(absolutePath));
  const absoluteKey = normalizePathKey(absolutePath);

  let matchedMeta = {};
  for (const [candidateKey, value] of Object.entries(fileMetaByPath || {})) {
    if (!isPlainObject(value)) continue;
    const normalizedKey = normalizePathKey(candidateKey);
    if (normalizedKey === absoluteKey || normalizedKey === relativePath || normalizedKey === basename) {
      matchedMeta = value;
      break;
    }
  }

  return {
    ...defaultMeta,
    ...matchedMeta,
  };
}

function sanitizeUploadError(error) {
  return {
    message: error.message,
    response: error.response || null,
  };
}

function sanitizeUploadSuccess(uploadResult) {
  return {
    ok: uploadResult.ok,
    status: uploadResult.status,
    statusText: uploadResult.statusText,
    url: uploadResult.url,
    data: uploadResult.data,
    requestEntries: uploadResult.requestEntries,
  };
}

function printUploadItemSummary(item, previewOnly) {
  if (item.success) {
    if (previewOnly) {
      console.log(`✔ ${path.basename(item.inputPath)} -> 已生成请求预览，共 ${item.preview.entries.length} 个字段`);
      return;
    }
    console.log(`✔ ${path.basename(item.inputPath)} -> HTTP ${item.result.status}`);
    return;
  }

  console.log(`✖ ${path.basename(item.inputPath)} -> ${item.error.message}`);
}

function printUploadSummary(result, previewOnly) {
  if (result.kind === 'file') {
    printUploadItemSummary(result.item, previewOnly);
    return;
  }

  console.log(`输入目录: ${result.inputDir}`);
  console.log(`总数: ${result.total}，成功: ${result.success}，失败: ${result.failed}`);
  result.items.forEach((item) => {
    printUploadItemSummary(item, previewOnly);
  });
}

function markUploadExitCode(result) {
  if (result.kind === 'file') {
    if (!result.item.success) {
      process.exitCode = 1;
    }
    return;
  }

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

async function runUploadForFile(filePath, options) {
  const { file, stat, absolutePath } = await createUploadFile(filePath);
  const fileMeta = resolveFileMeta(absolutePath, options.inputRoot, options.fileMeta, options.fileMetaByPath);
  const mergedMeta = {
    sourceFileName: fileMeta.sourceFileName || file.name,
    sourceFileSize: fileMeta.sourceFileSize ?? stat.size,
    ...fileMeta,
  };

  if (options.previewOnly) {
    const preview = createUploadPayloadPreview(file, mergedMeta, options.config);
    return {
      inputPath: absolutePath,
      success: true,
      preview: {
        config: redactUploadConfig(preview.config),
        entries: preview.entries,
      },
    };
  }

  try {
    const uploadResult = await uploadFileWithConfig(file, mergedMeta, options.config);
    return {
      inputPath: absolutePath,
      success: true,
      result: sanitizeUploadSuccess(uploadResult),
    };
  } catch (error) {
    return {
      inputPath: absolutePath,
      success: false,
      error: sanitizeUploadError(error),
    };
  }
}

async function runUploadForDirectory(inputDir, options) {
  const absoluteInputDir = path.resolve(inputDir);
  const files = await walkFiles(absoluteInputDir, options.recursive);
  const queue = files.map((filePath) => ({ filePath }));
  const items = [];

  const worker = async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const item = await runUploadForFile(current.filePath, {
        ...options,
        inputRoot: absoluteInputDir,
      });
      items.push(item);
    }
  };

  await Promise.all(
    Array(Math.min(options.concurrency, Math.max(queue.length, 1)))
      .fill(null)
      .map(() => worker())
  );

  const success = items.filter((item) => item.success).length;
  return {
    kind: 'directory',
    inputDir: absoluteInputDir,
    total: items.length,
    success,
    failed: items.length - success,
    items,
  };
}

function sanitizePipelineCompressResult(result) {
  return {
    ...sanitizeCompressResultForJson(result),
    outputPath: null,
  };
}

async function createCompressedUploadTarget(filePath, compressOptions) {
  const absolutePath = path.resolve(filePath);
  if (!isSupportedNodeImageFile(absolutePath)) {
    throw new Error(`暂不支持的图片文件: ${absolutePath}`);
  }

  const [inputBuffer, stat] = await Promise.all([
    fs.readFile(absolutePath),
    fs.stat(absolutePath),
  ]);

  const compressedResult = await compressImageBuffer(inputBuffer, {
    ...compressOptions,
    inputPath: absolutePath,
    sourceFileName: path.basename(absolutePath),
    originalSize: stat.size,
  });

  const compressedFileName = buildCompressedFileName(
    absolutePath,
    compressedResult.compressedFormat,
    compressOptions.suffix
  );

  const compressedFile = new File([compressedResult.buffer], compressedFileName, {
    type: compressedResult.mimeType,
    lastModified: Date.now(),
  });

  return {
    inputPath: absolutePath,
    stat,
    compressedFile,
    compressedResult: {
      ...compressedResult,
      compressedFileName,
      sourceFileName: path.basename(absolutePath),
      outputPath: null,
    },
  };
}

async function runPipelineForFile(filePath, options) {
  try {
    const compressedTarget = await createCompressedUploadTarget(filePath, options.compressOptions);
    const fileMetaOverride = resolveFileMeta(
      compressedTarget.inputPath,
      options.inputRoot,
      options.fileMeta,
      options.fileMetaByPath
    );

    const uploadMeta = {
      ...compressedTarget.compressedResult,
      sourceFileName: fileMetaOverride.sourceFileName || path.basename(compressedTarget.inputPath),
      sourceFileSize: fileMetaOverride.sourceFileSize ?? compressedTarget.stat.size,
      ...fileMetaOverride,
    };

    if (options.previewOnly) {
      const preview = createUploadPayloadPreview(compressedTarget.compressedFile, uploadMeta, options.config);
      return {
        inputPath: compressedTarget.inputPath,
        success: true,
        compression: sanitizePipelineCompressResult(compressedTarget.compressedResult),
        preview: {
          config: redactUploadConfig(preview.config),
          entries: preview.entries,
        },
      };
    }

    const uploadResult = await uploadFileWithConfig(compressedTarget.compressedFile, uploadMeta, options.config);
    return {
      inputPath: compressedTarget.inputPath,
      success: true,
      compression: sanitizePipelineCompressResult(compressedTarget.compressedResult),
      result: sanitizeUploadSuccess(uploadResult),
    };
  } catch (error) {
    return {
      inputPath: path.resolve(filePath),
      success: false,
      error: sanitizeUploadError(error),
    };
  }
}

async function runPipelineForDirectory(inputDir, options) {
  const absoluteInputDir = path.resolve(inputDir);
  const files = (await walkFiles(absoluteInputDir, options.compressOptions.recursive))
    .filter((filePath) => isSupportedNodeImageFile(filePath));
  const queue = files.map((filePath) => ({ filePath }));
  const items = [];

  const worker = async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const item = await runPipelineForFile(current.filePath, {
        ...options,
        inputRoot: absoluteInputDir,
      });
      items.push(item);
    }
  };

  await Promise.all(
    Array(Math.min(options.compressOptions.concurrency, Math.max(queue.length, 1)))
      .fill(null)
      .map(() => worker())
  );

  const success = items.filter((item) => item.success).length;
  return {
    kind: 'directory',
    inputDir: absoluteInputDir,
    total: items.length,
    success,
    failed: items.length - success,
    items,
  };
}

function printPipelineItemSummary(item, previewOnly) {
  if (item.success) {
    const compressedSize = item.compression?.compressedSizeFormatted || '未知';
    if (previewOnly) {
      console.log(`✔ ${path.basename(item.inputPath)} -> 已压缩为 ${compressedSize}，已生成 ${item.preview.entries.length} 个上传字段`);
      return;
    }
    console.log(`✔ ${path.basename(item.inputPath)} -> ${compressedSize}，HTTP ${item.result.status}`);
    return;
  }

  console.log(`✖ ${path.basename(item.inputPath)} -> ${item.error.message}`);
}

function printPipelineSummary(result, previewOnly) {
  if (result.kind === 'file') {
    printPipelineItemSummary(result.item, previewOnly);
    return;
  }

  console.log(`输入目录: ${result.inputDir}`);
  console.log(`总数: ${result.total}，成功: ${result.success}，失败: ${result.failed}`);
  result.items.forEach((item) => {
    printPipelineItemSummary(item, previewOnly);
  });
}

async function runCompressCommand(args) {
  const input = getPositionalArgs(args, COMPRESS_VALUE_OPTIONS)[0];

  if (!input || hasFlag(args, '--help')) {
    printCompressHelp();
    process.exit(input ? 0 : 1);
  }

  const stats = await fs.stat(path.resolve(input));
  const output = readOption(args, '--output');
  const outputDir = readOption(args, '--output-dir');
  const asJson = hasFlag(args, '--json');
  const deleteOriginal = hasFlag(args, '--delete-original');
  const replaceOriginal = hasFlag(args, '--replace-original');
  const sharedOptions = buildSharedCompressOptions(args, 4);

  if (deleteOriginal && replaceOriginal) {
    throw new Error('--delete-original 和 --replace-original 不能同时使用');
  }
  if (replaceOriginal && output) {
    throw new Error('--replace-original 模式下不能使用 --output');
  }
  if (replaceOriginal && outputDir) {
    throw new Error('--replace-original 模式下不能使用 --output-dir');
  }
  if (replaceOriginal && readOption(args, '--suffix')) {
    throw new Error('--replace-original 模式下不能使用 --suffix');
  }

  if (stats.isFile()) {
    const result = await compressImageFile(input, {
      ...sharedOptions,
      overwrite: hasFlag(args, '--overwrite'),
      outputPath: output,
      outputDir,
      deleteOriginal,
      replaceOriginal,
    });

    if (asJson) {
      printJson(sanitizeCompressResultForJson(result));
      return;
    }

    printCompressedFileSummary(result);
    return;
  }

  if (output) {
    throw new Error('目录模式不支持 --output，请改用 --output-dir');
  }

  const result = await compressImageDirectory(input, {
    ...sharedOptions,
    overwrite: hasFlag(args, '--overwrite'),
    preserveStructure: !hasFlag(args, '--flatten'),
    outputDir,
    deleteOriginal,
    replaceOriginal,
  });
  if (asJson) {
    printJson({
      ...result,
      items: result.items.map((item) => (
        item.success
          ? { ...item, result: sanitizeCompressResultForJson(item.result) }
          : item
      )),
    });
    return;
  }

  printCompressedDirectorySummary(result);
}

async function runUploadCommand(args) {
  const input = getPositionalArgs(args, UPLOAD_VALUE_OPTIONS)[0];

  if (!input || hasFlag(args, '--help')) {
    printUploadHelp();
    process.exit(hasFlag(args, '--help') ? 0 : 1);
  }

  const config = await loadUploadCliConfig(args);
  const absoluteInput = path.resolve(input);
  const stat = await fs.stat(absoluteInput);

  let result;
  if (stat.isFile()) {
    const item = await runUploadForFile(absoluteInput, {
      ...config,
      inputRoot: path.dirname(absoluteInput),
    });
    result = {
      kind: 'file',
      item,
    };
  } else if (stat.isDirectory()) {
    result = await runUploadForDirectory(absoluteInput, config);
  } else {
    throw new Error(`不是有效文件或目录: ${absoluteInput}`);
  }

  if (config.asJson) {
    markUploadExitCode(result);
    if (result.kind === 'file') {
      printJson({
        ...result,
        config: redactUploadConfig(config.config),
      });
      return;
    }

    printJson({
      ...result,
      config: redactUploadConfig(config.config),
    });
    return;
  }

  markUploadExitCode(result);
  printUploadSummary(result, config.previewOnly);
}

async function runPipelineCommand(args) {
  const input = getPositionalArgs(args, PIPELINE_VALUE_OPTIONS)[0];

  if (!input || hasFlag(args, '--help')) {
    printPipelineHelp();
    process.exit(hasFlag(args, '--help') ? 0 : 1);
  }

  const uploadConfig = await loadUploadCliConfig(args);
  const compressOptions = buildSharedCompressOptions(args, 3);
  const absoluteInput = path.resolve(input);
  const stat = await fs.stat(absoluteInput);

  let result;
  if (stat.isFile()) {
    const item = await runPipelineForFile(absoluteInput, {
      ...uploadConfig,
      compressOptions,
      inputRoot: path.dirname(absoluteInput),
    });
    result = {
      kind: 'file',
      item,
    };
  } else if (stat.isDirectory()) {
    result = await runPipelineForDirectory(absoluteInput, {
      ...uploadConfig,
      compressOptions,
    });
  } else {
    throw new Error(`不是有效文件或目录: ${absoluteInput}`);
  }

  if (uploadConfig.asJson) {
    markUploadExitCode(result);
    printJson({
      ...result,
      compress: {
        format: compressOptions.format ?? 'auto',
        quality: compressOptions.quality,
        maxWidth: compressOptions.maxWidth,
        maxHeight: compressOptions.maxHeight,
        suffix: compressOptions.suffix,
        recursive: compressOptions.recursive,
        concurrency: compressOptions.concurrency,
      },
      upload: redactUploadConfig(uploadConfig.config),
    });
    return;
  }

  markUploadExitCode(result);
  printPipelineSummary(result, uploadConfig.previewOnly);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printMainHelp();
    process.exit(1);
  }

  if (hasFlag(args, '--help') && ![UPLOAD_COMMAND, PIPELINE_COMMAND].includes(args[0])) {
    printMainHelp();
    return;
  }

  if (args[0] === UPLOAD_COMMAND) {
    await runUploadCommand(args.slice(1));
    return;
  }

  if (args[0] === PIPELINE_COMMAND) {
    await runPipelineCommand(args.slice(1));
    return;
  }

  await runCompressCommand(args);
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
