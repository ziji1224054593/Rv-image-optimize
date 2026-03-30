import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const NODE_COMPRESS_SUPPORTED_INPUT_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'avif',
  'gif',
  'tiff',
  'svg',
];

export const NODE_COMPRESS_OUTPUT_FORMATS = ['jpeg', 'png', 'webp', 'avif'];

const INPUT_EXTENSION_SET = new Set(NODE_COMPRESS_SUPPORTED_INPUT_FORMATS);

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return null;
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function normalizeInputFormat(format) {
  if (!format) return null;
  const normalized = String(format).toLowerCase();
  if (normalized === 'jpg') return 'jpeg';
  if (normalized === 'auto') return null;
  return normalized;
}

function normalizeInputExtension(filePath) {
  return path.extname(filePath).replace('.', '').toLowerCase();
}

function getOutputExtension(format) {
  if (format === 'jpeg') {
    return 'jpg';
  }
  return format;
}

function isSamePath(leftPath, rightPath) {
  if (!leftPath || !rightPath) return false;

  const normalizedLeft = path.resolve(leftPath).replace(/\//g, '\\');
  const normalizedRight = path.resolve(rightPath).replace(/\//g, '\\');

  if (process.platform === 'win32') {
    return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase();
  }

  return normalizedLeft === normalizedRight;
}

function getMimeType(format) {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

function mapEncoderEffort(level = 6) {
  const safeLevel = Math.max(0, Math.min(9, Number(level) || 6));
  return Math.max(0, Math.min(6, Math.round((safeLevel / 9) * 6)));
}

function resolveOutputFormat(metadataFormat, requestedFormat) {
  const normalizedRequested = normalizeInputFormat(requestedFormat);
  if (normalizedRequested) {
    if (!NODE_COMPRESS_OUTPUT_FORMATS.includes(normalizedRequested)) {
      throw new Error(`不支持的输出格式: ${requestedFormat}`);
    }
    return normalizedRequested;
  }

  const sourceFormat = normalizeInputFormat(metadataFormat);
  if (NODE_COMPRESS_OUTPUT_FORMATS.includes(sourceFormat)) {
    return sourceFormat;
  }

  return 'webp';
}

function applyOutputEncoder(instance, outputFormat, options) {
  const quality = Math.max(1, Math.min(100, Number(options.quality) || 80));
  const effort = mapEncoderEffort(options.compressionLevel);

  switch (outputFormat) {
    case 'jpeg':
      return instance.jpeg({
        quality,
        mozjpeg: true,
      });
    case 'png':
      return instance.png({
        compressionLevel: Math.max(0, Math.min(9, Number(options.compressionLevel) || 6)),
        progressive: true,
      });
    case 'avif':
      return instance.avif({
        quality,
        effort,
      });
    case 'webp':
    default:
      return instance.webp({
        quality,
        effort,
      });
  }
}

function normalizeResizeOptions(options = {}) {
  const maxWidth = Number(options.maxWidth) || null;
  const maxHeight = Number(options.maxHeight) || null;

  if (!maxWidth && !maxHeight) {
    return null;
  }

  return {
    width: maxWidth || null,
    height: maxHeight || null,
    fit: options.fit || 'inside',
    withoutEnlargement: options.withoutEnlargement !== false,
  };
}

async function ensureParentDir(targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function buildDefaultOutputName(inputPath, outputFormat, suffix = '.compressed') {
  const parsed = path.parse(inputPath);
  return `${parsed.name}${suffix}.${getOutputExtension(outputFormat)}`;
}

function buildReplaceOutputPath(inputPath, outputFormat) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.${getOutputExtension(outputFormat)}`);
}

function createResultSummary({
  inputPath,
  outputPath,
  sourceFileName,
  outputFileName,
  metadata,
  outputInfo,
  outputFormat,
  compressedBuffer,
}) {
  const originalSize = metadata.size ?? null;
  const compressedSize = compressedBuffer.length;
  const savedSize = originalSize !== null ? originalSize - compressedSize : null;
  const savedPercentage = originalSize
    ? Number(((1 - compressedSize / originalSize) * 100).toFixed(2))
    : null;

  return {
    buffer: compressedBuffer,
    inputPath: inputPath || null,
    outputPath: outputPath || null,
    sourceFileName,
    compressedFileName: outputFileName,
    mimeType: getMimeType(outputFormat),
    originalWidth: metadata.width ?? null,
    originalHeight: metadata.height ?? null,
    originalFormat: normalizeInputFormat(metadata.format),
    originalSize,
    originalSizeFormatted: formatFileSize(originalSize),
    compressedWidth: outputInfo.width ?? metadata.width ?? null,
    compressedHeight: outputInfo.height ?? metadata.height ?? null,
    compressedFormat: outputFormat,
    compressedSize,
    compressedSizeFormatted: formatFileSize(compressedSize),
    savedSize,
    savedSizeFormatted: savedSize !== null ? formatFileSize(Math.abs(savedSize)) : null,
    savedPercentage,
    isEffective: savedPercentage !== null ? savedPercentage > 1 : null,
  };
}

export function isSupportedNodeImageFile(filePath) {
  return INPUT_EXTENSION_SET.has(normalizeInputExtension(filePath));
}

export async function compressImageBuffer(inputBuffer, options = {}) {
  if (!inputBuffer) {
    throw new Error('缺少待压缩的图片 Buffer');
  }

  const baseInstance = sharp(inputBuffer, { animated: true, failOn: 'none' }).rotate();
  const metadata = await baseInstance.metadata();
  const outputFormat = resolveOutputFormat(metadata.format, options.format);
  const resizeOptions = normalizeResizeOptions(options);

  let pipeline = sharp(inputBuffer, { animated: true, failOn: 'none' }).rotate();
  if (resizeOptions) {
    pipeline = pipeline.resize(resizeOptions);
  }
  pipeline = applyOutputEncoder(pipeline, outputFormat, options);

  const { data: compressedBuffer, info: outputInfo } = await pipeline.toBuffer({ resolveWithObject: true });
  const info = createResultSummary({
    inputPath: options.inputPath,
    outputPath: options.outputPath,
    sourceFileName: options.sourceFileName || null,
    outputFileName: options.outputFileName || null,
    metadata: {
      ...metadata,
      size: options.originalSize ?? metadata.size ?? inputBuffer.length,
    },
    outputInfo,
    outputFormat,
    compressedBuffer,
  });

  return info;
}

export async function compressImageFile(inputPath, options = {}) {
  if (!inputPath) {
    throw new Error('inputPath 不能为空');
  }

  const absoluteInputPath = path.resolve(inputPath);
  const stat = await fs.stat(absoluteInputPath);
  if (!stat.isFile()) {
    throw new Error(`不是有效文件: ${absoluteInputPath}`);
  }
  if (!isSupportedNodeImageFile(absoluteInputPath)) {
    throw new Error(`暂不支持的图片文件: ${absoluteInputPath}`);
  }

  const outputFormat = resolveOutputFormat(normalizeInputExtension(absoluteInputPath), options.format);
  const replaceOriginal = options.replaceOriginal === true;
  const deleteOriginal = options.deleteOriginal === true;

  const outputPath = replaceOriginal
    ? buildReplaceOutputPath(absoluteInputPath, outputFormat)
    : options.outputPath
      ? path.resolve(options.outputPath)
      : path.resolve(
          options.outputDir ? path.resolve(options.outputDir) : path.dirname(absoluteInputPath),
          buildDefaultOutputName(absoluteInputPath, outputFormat, options.suffix)
        );

  if (deleteOriginal && isSamePath(outputPath, absoluteInputPath) && !replaceOriginal) {
    throw new Error('deleteOriginal 模式下，输出文件路径不能与原图相同');
  }

  if (await pathExists(outputPath)) {
    const canReuseSamePath = replaceOriginal && isSamePath(outputPath, absoluteInputPath);
    if (!canReuseSamePath && !options.overwrite) {
      throw new Error(`输出文件已存在: ${outputPath}`);
    }
  }

  const inputBuffer = await fs.readFile(absoluteInputPath);
  const result = await compressImageBuffer(inputBuffer, {
    ...options,
    inputPath: absoluteInputPath,
    outputPath,
    sourceFileName: path.basename(absoluteInputPath),
    outputFileName: path.basename(outputPath),
    originalSize: stat.size,
  });

  await ensureParentDir(outputPath);
  await fs.writeFile(outputPath, result.buffer);

  const removedOriginal = deleteOriginal || replaceOriginal;
  if (removedOriginal && !isSamePath(outputPath, absoluteInputPath)) {
    await fs.unlink(absoluteInputPath);
  }

  result.outputPath = outputPath;
  result.compressedFileName = path.basename(outputPath);
  result.originalDeleted = removedOriginal;
  result.replacedOriginal = replaceOriginal;

  return result;
}

async function walkDirectory(directoryPath, recursive) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...await walkDirectory(entryPath, recursive));
      }
      continue;
    }

    if (entry.isFile() && isSupportedNodeImageFile(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function createOutputPathForDirectory(sourcePath, sourceRoot, options) {
  const outputFormat = resolveOutputFormat(normalizeInputExtension(sourcePath), options.format);
  if (options.replaceOriginal) {
    return buildReplaceOutputPath(sourcePath, outputFormat);
  }

  const relativeDir = options.preserveStructure === false
    ? ''
    : path.relative(sourceRoot, path.dirname(sourcePath));
  const outputBaseDir = path.resolve(options.outputDir || sourceRoot);

  return path.join(
    outputBaseDir,
    relativeDir,
    buildDefaultOutputName(sourcePath, outputFormat, options.suffix)
  );
}

export async function compressImageDirectory(inputDir, options = {}) {
  if (!inputDir) {
    throw new Error('inputDir 不能为空');
  }

  const absoluteInputDir = path.resolve(inputDir);
  const stat = await fs.stat(absoluteInputDir);
  if (!stat.isDirectory()) {
    throw new Error(`不是有效目录: ${absoluteInputDir}`);
  }

  const recursive = options.recursive !== false;
  const concurrency = Math.max(1, Number(options.concurrency) || 4);
  const imageFiles = await walkDirectory(absoluteInputDir, recursive);
  const queue = imageFiles.map((filePath) => ({ filePath }));
  const items = [];

  const worker = async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const outputPath = createOutputPathForDirectory(current.filePath, absoluteInputDir, options);

      try {
        const result = await compressImageFile(current.filePath, {
          ...options,
          outputPath,
        });
        items.push({
          inputPath: current.filePath,
          outputPath,
          success: true,
          result,
        });
      } catch (error) {
        items.push({
          inputPath: current.filePath,
          outputPath,
          success: false,
          error: error.message,
        });
      }
    }
  };

  await Promise.all(
    Array(Math.min(concurrency, Math.max(queue.length, 1)))
      .fill(null)
      .map(() => worker())
  );

  const success = items.filter((item) => item.success).length;
  const failed = items.length - success;

  return {
    inputDir: absoluteInputDir,
    outputDir: path.resolve(options.outputDir || absoluteInputDir),
    total: items.length,
    success,
    failed,
    items,
  };
}

export default {
  NODE_COMPRESS_SUPPORTED_INPUT_FORMATS,
  NODE_COMPRESS_OUTPUT_FORMATS,
  isSupportedNodeImageFile,
  compressImageBuffer,
  compressImageFile,
  compressImageDirectory,
};
