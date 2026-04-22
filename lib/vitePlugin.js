import fs from 'node:fs/promises';
import path from 'node:path';
import { compressImageBuffer } from './nodeCompress.js';
import {
  STATIC_IMAGE_PLUGIN_DEFAULT_FORMATS,
  formatFileSize,
  normalizeExtension,
  normalizeFormat,
  shouldExclude,
  optimizeSvgContent,
  runWithConcurrency,
} from './staticImagePluginShared.js';

export const VITE_STATIC_IMAGE_DEFAULT_FORMATS = STATIC_IMAGE_PLUGIN_DEFAULT_FORMATS;

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkDirectory(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDirectory(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function createBaseItem(filePath, format) {
  return {
    filePath,
    format,
    changed: false,
    originalSize: 0,
    compressedSize: 0,
    savedSize: 0,
    savedPercentage: 0,
    skippedReason: null,
    error: null,
    generatedVariants: [],
  };
}

function normalizeVariants(variants = []) {
  return (Array.isArray(variants) ? variants : [])
    .filter((variant) => variant && variant.format)
    .map((variant) => ({
      format: normalizeFormat(variant.format),
      suffix: typeof variant.suffix === 'string' ? variant.suffix : '',
      quality: variant.quality,
      compressionLevel: variant.compressionLevel,
      lossless: variant.lossless,
      minSavings: Number(variant.minSavings) || 0,
    }));
}

function buildVariantFilePath(filePath, variant) {
  const parsed = path.parse(filePath);
  const suffix = variant.suffix || `.${variant.format}`;
  const nextExtension = variant.format === 'jpeg' ? 'jpg' : variant.format;
  return path.join(parsed.dir, `${parsed.name}${suffix}.${nextExtension}`);
}

async function optimizeSvgFile(filePath, minSavings) {
  const originalBuffer = await fs.readFile(filePath);
  const originalText = originalBuffer.toString('utf8');
  const optimizedText = optimizeSvgContent(originalText);
  const optimizedBuffer = Buffer.from(optimizedText, 'utf8');
  const savedSize = originalBuffer.length - optimizedBuffer.length;
  const baseItem = createBaseItem(filePath, 'svg');

  baseItem.originalSize = originalBuffer.length;
  baseItem.compressedSize = optimizedBuffer.length;
  baseItem.savedSize = Math.max(savedSize, 0);
  baseItem.savedPercentage = originalBuffer.length
    ? Number(((baseItem.savedSize / originalBuffer.length) * 100).toFixed(2))
    : 0;

  if (savedSize <= minSavings) {
    baseItem.skippedReason = savedSize <= 0 ? '压缩后未变小' : `节省体积未达到 ${minSavings} B`;
    return baseItem;
  }

  await fs.writeFile(filePath, optimizedBuffer);
  baseItem.changed = true;
  return baseItem;
}

async function optimizeRasterFile(filePath, extension, options) {
  const originalBuffer = await fs.readFile(filePath);
  const baseItem = createBaseItem(filePath, extension);
  const result = await compressImageBuffer(originalBuffer, {
    format: normalizeFormat(extension),
    quality: options.quality,
    compressionLevel: options.compressionLevel,
    lossless: options.lossless,
    inputPath: filePath,
    outputPath: filePath,
    sourceFileName: path.basename(filePath),
    outputFileName: path.basename(filePath),
    originalSize: originalBuffer.length,
  });

  baseItem.originalSize = result.originalSize || originalBuffer.length;
  baseItem.compressedSize = result.compressedSize;
  baseItem.savedSize = Math.max(result.savedSize || 0, 0);
  baseItem.savedPercentage = result.savedPercentage || 0;

  if ((result.savedSize || 0) <= options.minSavings) {
    baseItem.skippedReason = (result.savedSize || 0) <= 0
      ? '压缩后未变小'
      : `节省体积未达到 ${options.minSavings} B`;
    return baseItem;
  }

  await fs.writeFile(filePath, result.buffer);
  baseItem.changed = true;

  for (const variant of options.variants) {
    const variantResult = await compressImageBuffer(originalBuffer, {
      format: variant.format,
      quality: variant.quality ?? options.quality,
      compressionLevel: variant.compressionLevel ?? options.compressionLevel,
      lossless: variant.lossless ?? options.lossless,
      inputPath: filePath,
      sourceFileName: path.basename(filePath),
    });
    const variantSavings = (originalBuffer.length - variantResult.compressedSize);
    const minSavings = Math.max(options.variantMinSavings, variant.minSavings || 0);
    if (variantSavings <= minSavings) {
      continue;
    }

    const variantFilePath = buildVariantFilePath(filePath, variant);
    await fs.writeFile(variantFilePath, variantResult.buffer);
    baseItem.generatedVariants.push({
      filePath: variantFilePath,
      format: variant.format,
      originalSize: originalBuffer.length,
      compressedSize: variantResult.compressedSize,
      savedSize: Math.max(variantSavings, 0),
      savedPercentage: variantResult.savedPercentage || 0,
    });
  }

  return baseItem;
}

function buildSummary(outDir, items) {
  const optimized = items.filter((item) => item.changed).length;
  const failed = items.filter((item) => item.error).length;
  const skipped = items.length - optimized - failed;
  const savedSize = items.reduce((total, item) => total + (item.changed ? item.savedSize : 0), 0);

  return {
    outDir,
    total: items.length,
    optimized,
    skipped,
    failed,
    variantsGenerated: items.reduce((count, item) => count + (item.generatedVariants?.length || 0), 0),
    savedSize,
    savedSizeFormatted: formatFileSize(savedSize),
    items,
  };
}

function logSummary(summary) {
  if (summary.total === 0) {
    console.log('[rv-image-optimize/vite-plugin] 未发现可处理的静态图片文件');
    return;
  }

  console.log(
    `[rv-image-optimize/vite-plugin] 扫描 ${summary.total} 个静态图片，优化 ${summary.optimized} 个，跳过 ${summary.skipped} 个，失败 ${summary.failed} 个，累计节省 ${summary.savedSizeFormatted}`
  );
}

export function rvImageOptimizeVitePlugin(userOptions = {}) {
  const options = {
    includeFormats: userOptions.includeFormats || VITE_STATIC_IMAGE_DEFAULT_FORMATS,
    exclude: userOptions.exclude || [],
    compressionLevel: userOptions.compressionLevel ?? 9,
    quality: userOptions.quality ?? 100,
    concurrency: Math.max(1, Number(userOptions.concurrency) || 4),
    minSavings: Math.max(0, Number(userOptions.minSavings) || 0),
    lossless: userOptions.lossless !== false,
    log: userOptions.log !== false,
    filter: typeof userOptions.filter === 'function' ? userOptions.filter : null,
    onComplete: typeof userOptions.onComplete === 'function' ? userOptions.onComplete : null,
    variants: normalizeVariants(userOptions.variants),
    variantMinSavings: Math.max(0, Number(userOptions.variantMinSavings) || 0),
    manifest: userOptions.manifest !== false,
    manifestFile: typeof userOptions.manifestFile === 'string' && userOptions.manifestFile.trim()
      ? userOptions.manifestFile.trim()
      : 'rv-image-variants.json',
  };

  const formatSet = new Set(options.includeFormats.map(normalizeExtension));
  let resolvedConfig = null;

  return {
    name: 'rv-image-optimize/vite-plugin',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config;
    },
    async closeBundle() {
      const rootDir = resolvedConfig?.root || process.cwd();
      const outDir = path.resolve(rootDir, resolvedConfig?.build?.outDir || 'dist');

      if (!(await pathExists(outDir))) {
        return;
      }

      const allFiles = await walkDirectory(outDir);
      const targetFiles = allFiles.filter((filePath) => {
        const extension = normalizeExtension(path.extname(filePath));
        if (!formatSet.has(extension)) return false;
        if (shouldExclude(filePath, options.exclude)) return false;
        if (options.filter && options.filter(filePath, extension) === false) return false;
        return true;
      });

      const items = await runWithConcurrency(targetFiles, options.concurrency, async (filePath) => {
        const extension = normalizeExtension(path.extname(filePath));

        try {
          if (extension === 'svg') {
            return await optimizeSvgFile(filePath, options.minSavings);
          }

          return await optimizeRasterFile(filePath, extension, options);
        } catch (error) {
          const item = createBaseItem(filePath, extension);
          item.error = error instanceof Error ? error.message : String(error);
          item.skippedReason = '处理失败';
          return item;
        }
      });

      const summary = buildSummary(outDir, items);

      if (options.manifest) {
        const manifest = items.reduce((result, item) => {
          if (!item.changed && (!item.generatedVariants || item.generatedVariants.length === 0)) {
            return result;
          }

          const relativePath = path.relative(outDir, item.filePath).replace(/\\/g, '/');
          result[relativePath] = {
            original: relativePath,
            variants: (item.generatedVariants || []).map((variant) => ({
              path: path.relative(outDir, variant.filePath).replace(/\\/g, '/'),
              format: variant.format,
              savedSize: variant.savedSize,
              savedPercentage: variant.savedPercentage,
            })),
          };
          return result;
        }, {});

        summary.manifestPath = path.join(outDir, options.manifestFile);
        await fs.writeFile(summary.manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      }

      if (options.log) {
        logSummary(summary);
      }

      if (options.onComplete) {
        await options.onComplete(summary);
      }
    },
  };
}

export default rvImageOptimizeVitePlugin;
