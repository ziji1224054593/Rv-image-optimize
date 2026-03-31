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

export const WEBPACK_STATIC_IMAGE_DEFAULT_FORMATS = STATIC_IMAGE_PLUGIN_DEFAULT_FORMATS;

const PLUGIN_NAME = 'rv-image-optimize/webpack-plugin';

function createBaseItem(assetName, format) {
  return {
    assetName,
    format,
    changed: false,
    originalSize: 0,
    compressedSize: 0,
    savedSize: 0,
    savedPercentage: 0,
    skippedReason: null,
    error: null,
  };
}

function buildSummary(outputPath, items) {
  const optimized = items.filter((item) => item.changed).length;
  const failed = items.filter((item) => item.error).length;
  const skipped = items.length - optimized - failed;
  const savedSize = items.reduce((total, item) => total + (item.changed ? item.savedSize : 0), 0);

  return {
    outputPath,
    total: items.length,
    optimized,
    skipped,
    failed,
    savedSize,
    savedSizeFormatted: formatFileSize(savedSize),
    items,
  };
}

function logSummary(summary) {
  if (summary.total === 0) {
    console.log(`[${PLUGIN_NAME}] 未发现可处理的静态图片资源`);
    return;
  }

  console.log(
    `[${PLUGIN_NAME}] 扫描 ${summary.total} 个静态图片资源，优化 ${summary.optimized} 个，跳过 ${summary.skipped} 个，失败 ${summary.failed} 个，累计节省 ${summary.savedSizeFormatted}`
  );
}

function createCompatAsset(buffer) {
  return {
    source() {
      return buffer;
    },
    size() {
      return buffer.length;
    },
  };
}

function getRawSourceConstructor(compiler) {
  return compiler?.webpack?.sources?.RawSource || null;
}

function readSourceAsBuffer(source) {
  if (!source) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(source)) {
    return source;
  }

  if (typeof source.buffer === 'function') {
    const buffered = source.buffer();
    return Buffer.isBuffer(buffered) ? buffered : Buffer.from(buffered);
  }

  if (typeof source.source === 'function') {
    const raw = source.source();
    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  }

  return Buffer.from(String(source));
}

function collectAssets(compilation) {
  if (typeof compilation.getAssets === 'function') {
    return compilation.getAssets().map((asset) => ({
      name: asset.name,
      source: asset.source,
    }));
  }

  return Object.keys(compilation.assets || {}).map((assetName) => ({
    name: assetName,
    source: compilation.assets[assetName],
  }));
}

function updateAsset(compilation, compiler, assetName, buffer) {
  const RawSource = getRawSourceConstructor(compiler);
  if (typeof compilation.updateAsset === 'function' && RawSource) {
    compilation.updateAsset(assetName, new RawSource(buffer));
    return;
  }

  compilation.assets[assetName] = createCompatAsset(buffer);
}

async function optimizeSvgAsset(assetName, inputBuffer, minSavings) {
  const originalText = inputBuffer.toString('utf8');
  const optimizedText = optimizeSvgContent(originalText);
  const optimizedBuffer = Buffer.from(optimizedText, 'utf8');
  const savedSize = inputBuffer.length - optimizedBuffer.length;
  const item = createBaseItem(assetName, 'svg');

  item.originalSize = inputBuffer.length;
  item.compressedSize = optimizedBuffer.length;
  item.savedSize = Math.max(savedSize, 0);
  item.savedPercentage = inputBuffer.length
    ? Number(((item.savedSize / inputBuffer.length) * 100).toFixed(2))
    : 0;

  if (savedSize <= minSavings) {
    item.skippedReason = savedSize <= 0 ? '压缩后未变小' : `节省体积未达到 ${minSavings} B`;
    return { item, outputBuffer: null };
  }

  item.changed = true;
  return { item, outputBuffer: optimizedBuffer };
}

async function optimizeRasterAsset(assetName, extension, inputBuffer, options) {
  const item = createBaseItem(assetName, extension);
  const result = await compressImageBuffer(inputBuffer, {
    format: normalizeFormat(extension),
    quality: options.quality,
    compressionLevel: options.compressionLevel,
    lossless: options.lossless,
    inputPath: assetName,
    outputPath: assetName,
    sourceFileName: path.basename(assetName),
    outputFileName: path.basename(assetName),
    originalSize: inputBuffer.length,
  });

  item.originalSize = result.originalSize || inputBuffer.length;
  item.compressedSize = result.compressedSize;
  item.savedSize = Math.max(result.savedSize || 0, 0);
  item.savedPercentage = result.savedPercentage || 0;

  if ((result.savedSize || 0) <= options.minSavings) {
    item.skippedReason = (result.savedSize || 0) <= 0
      ? '压缩后未变小'
      : `节省体积未达到 ${options.minSavings} B`;
    return { item, outputBuffer: null };
  }

  item.changed = true;
  return { item, outputBuffer: result.buffer };
}

async function processAssets(compilation, compiler, options) {
  const formatSet = new Set(options.includeFormats.map(normalizeExtension));
  const outputPath = compiler.options?.output?.path
    ? path.resolve(compiler.options.output.path)
    : process.cwd();

  const targetAssets = collectAssets(compilation).filter(({ name }) => {
    const extension = normalizeExtension(path.extname(name));
    if (!formatSet.has(extension)) return false;
    if (shouldExclude(name, options.exclude)) return false;
    if (options.filter && options.filter(name, extension) === false) return false;
    return true;
  });

  const items = await runWithConcurrency(targetAssets, options.concurrency, async ({ name, source }) => {
    const extension = normalizeExtension(path.extname(name));

    try {
      const inputBuffer = readSourceAsBuffer(source);
      const optimized = extension === 'svg'
        ? await optimizeSvgAsset(name, inputBuffer, options.minSavings)
        : await optimizeRasterAsset(name, extension, inputBuffer, options);

      if (optimized.outputBuffer) {
        updateAsset(compilation, compiler, name, optimized.outputBuffer);
      }

      return optimized.item;
    } catch (error) {
      const item = createBaseItem(name, extension);
      item.error = error instanceof Error ? error.message : String(error);
      item.skippedReason = '处理失败';
      return item;
    }
  });

  const summary = buildSummary(outputPath, items);

  if (options.log) {
    logSummary(summary);
  }

  if (options.onComplete) {
    await options.onComplete(summary);
  }
}

export function rvImageOptimizeWebpackPlugin(userOptions = {}) {
  const options = {
    includeFormats: userOptions.includeFormats || WEBPACK_STATIC_IMAGE_DEFAULT_FORMATS,
    exclude: userOptions.exclude || [],
    compressionLevel: userOptions.compressionLevel ?? 9,
    quality: userOptions.quality ?? 100,
    concurrency: Math.max(1, Number(userOptions.concurrency) || 4),
    minSavings: Math.max(0, Number(userOptions.minSavings) || 0),
    lossless: userOptions.lossless !== false,
    log: userOptions.log !== false,
    filter: typeof userOptions.filter === 'function' ? userOptions.filter : null,
    onComplete: typeof userOptions.onComplete === 'function' ? userOptions.onComplete : null,
  };

  return {
    apply(compiler) {
      const isWebpack5 = Boolean(compiler?.webpack?.Compilation);

      if (isWebpack5) {
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
          const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE;
          compilation.hooks.processAssets.tapPromise(
            { name: PLUGIN_NAME, stage },
            async () => {
              await processAssets(compilation, compiler, options);
            }
          );
        });
        return;
      }

      compiler.hooks.emit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
        processAssets(compilation, compiler, options)
          .then(() => callback())
          .catch((error) => callback(error));
      });
    },
  };
}

export default rvImageOptimizeWebpackPlugin;
