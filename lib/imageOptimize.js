import {
  DEFAULT_SIGNED_QUERY_KEYS,
  clearCustomImageUrlHandlers,
  createImageUrlHandler,
  detectImageUrlHandler,
  listImageUrlHandlers,
  optimizeImageUrlWithEngine,
  registerImageUrlHandler,
  registerImageUrlHandlers,
} from './urlOptimizerEngine.js';

export {
  DEFAULT_SIGNED_QUERY_KEYS,
  clearCustomImageUrlHandlers,
  createImageUrlHandler,
  listImageUrlHandlers,
  registerImageUrlHandler,
  registerImageUrlHandlers,
};

/**
 * 图片优化工具函数
 * 用于压缩和优化图片URL，减少加载压力
 * 支持多种主流CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront
 */

/**
 * 检测浏览器支持的图片格式
 * @returns {string[]} 支持的格式数组，按优先级排序
 */
export function detectSupportedFormats() {
  const formats = [];
  
  // 检测运行环境：浏览器还是 Node.js
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  
  if (isBrowser) {
    // 检测 WebP 支持
    const webpSupported = (() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch (e) {
        return false;
      }
    })();
    
    // 检测 AVIF 支持（现代浏览器）
    const avifSupported = (() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      } catch (e) {
        return false;
      }
    })();
    
    if (avifSupported) formats.push('avif');
    if (webpSupported) formats.push('webp');
  }
  
  // 总是支持的格式
  formats.push('jpg', 'jpeg', 'png');
  
  return formats;
}

/**
 * 获取最佳图片格式（根据浏览器支持自动选择）
 * @param {string} preferredFormat - 首选格式（webp/avif/jpg/png）
 * @returns {string} 最佳支持的格式
 */
export function getBestFormat(preferredFormat = null) {
  const supportedFormats = detectSupportedFormats();
  
  if (preferredFormat) {
    // 检查首选格式是否支持
    const normalized = preferredFormat.toLowerCase().replace('jpeg', 'jpg');
    if (supportedFormats.includes(normalized)) {
      return normalized;
    }
  }
  
  // 返回最佳支持的格式（优先级：avif > webp > jpg）
  return supportedFormats[0] || 'jpg';
}

/**
 * 检测图片URL的当前格式
 * @param {string} url - 图片URL
 * @returns {string|null} 检测到的格式（jpg/png/webp等），无法检测时返回null
 */
export function detectImageFormat(url) {
  if (!url) return null;
  
  // 从URL路径或查询参数中提取格式
  const urlLower = url.toLowerCase();
  const formatMatch = urlLower.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i);
  if (formatMatch) {
    const format = formatMatch[1].toLowerCase();
    return format === 'jpeg' ? 'jpg' : format;
  }
  
  // 从查询参数中检测格式
  try {
    const urlObj = new URL(url);
    const formatParam = urlObj.searchParams.get('format') || 
                       urlObj.searchParams.get('f') ||
                       urlObj.searchParams.get('image_format');
    if (formatParam) {
      return formatParam.toLowerCase().replace('jpeg', 'jpg');
    }
  } catch (e) {
    // URL解析失败，忽略
  }
  
  return null;
}

/**
 * 压缩图片URL（适用于支持URL参数的CDN或图片服务）
 * @param {string} url - 原始图片URL
 * @param {Object} options - 压缩选项
 * @param {number} options.width - 目标宽度（像素）
 * @param {number} options.height - 目标高度（像素）
 * @param {number} options.quality - 图片质量（0-100，默认 30）
 * @param {string} options.format - 输出格式（webp/jpg/png/avif，默认自动检测浏览器支持）
 * @param {boolean} options.autoFormat - 是否自动选择最佳格式（默认true）
 * @returns {string} 优化后的图片URL
 */
export function optimizeImageUrl(url, options = {}) {
  if (!url) return url;

  try {
    return optimizeImageUrlWithEngine(url, options, { getBestFormat });
  } catch (error) {
    console.warn('图片URL优化失败:', error);
    return url;
  }
}

/**
 * 生成响应式图片的 srcset 字符串
 * @param {string} url - 原始图片URL
 * @param {Object} options - 配置选项
 * @param {number[]} options.widths - 宽度数组，例如 [320, 640, 960, 1280]（默认自动生成）
 * @param {number} options.aspectRatio - 宽高比（可选，用于计算高度）
 * @param {number} options.quality - 图片质量（0-100，默认80）
 * @param {string} options.format - 输出格式（webp/jpg/png/avif，默认自动）
 * @param {boolean} options.autoFormat - 是否自动选择最佳格式（默认true）
 * @returns {string} srcset 字符串，例如 "url1 320w, url2 640w, url3 960w"
 */
export function generateSrcset(url, options = {}) {
  if (!url) return '';
  
  const {
    widths = null, // 默认自动生成
    aspectRatio = null,
    quality = 80,
    format = null,
    autoFormat = true,
  } = options;
  
  // 如果没有指定宽度，使用常用的响应式断点
  const defaultWidths = [320, 640, 960, 1280, 1920];
  const targetWidths = widths || defaultWidths;
  
  // 生成不同尺寸的URL
  const srcsetEntries = targetWidths.map(width => {
    const optimizedUrl = optimizeImageUrl(url, {
      width,
      height: aspectRatio ? Math.round(width / aspectRatio) : null,
      quality,
      format,
      autoFormat,
    });
    return `${optimizedUrl} ${width}w`;
  });
  
  return srcsetEntries.join(', ');
}

/**
 * 生成响应式图片的 sizes 属性值
 * @param {Object} options - 配置选项
 * @param {string|string[]} options.breakpoints - 媒体查询断点和对应的尺寸，例如 ["(max-width: 640px) 100vw", "(max-width: 1024px) 50vw", "33vw"]
 * @returns {string} sizes 属性值
 */
export function generateSizes(options = {}) {
  const {
    breakpoints = [
      '(max-width: 640px) 100vw',
      '(max-width: 1024px) 50vw',
      '33vw'
    ]
  } = options;
  
  if (Array.isArray(breakpoints)) {
    return breakpoints.join(', ');
  }
  
  return breakpoints;
}

/**
 * 生成完整的响应式图片属性对象
 * @param {string} url - 原始图片URL
 * @param {Object} options - 配置选项
 * @param {number[]} options.widths - 宽度数组
 * @param {number} options.aspectRatio - 宽高比
 * @param {number} options.quality - 图片质量
 * @param {string} options.format - 输出格式
 * @param {boolean} options.autoFormat - 是否自动选择最佳格式
 * @param {string|string[]} options.sizes - sizes 属性值或配置对象
 * @param {string} options.fallbackWidth - 默认图片宽度（用于 src 属性）
 * @returns {Object} 包含 src, srcset, sizes 的对象
 */
export function generateResponsiveImage(url, options = {}) {
  if (!url) return { src: '', srcset: '', sizes: '' };
  
  const {
    widths = null,
    aspectRatio = null,
    quality = 80,
    format = null,
    autoFormat = true,
    sizes = null,
    fallbackWidth = 960, // 默认回退宽度
  } = options;
  
  // 生成 srcset
  const srcset = generateSrcset(url, {
    widths,
    aspectRatio,
    quality,
    format,
    autoFormat,
  });
  
  // 生成 sizes
  const sizesAttr = sizes 
    ? (typeof sizes === 'string' ? sizes : generateSizes(sizes))
    : generateSizes();
  
  // 生成默认 src（使用回退宽度）
  const src = optimizeImageUrl(url, {
    width: fallbackWidth,
    height: aspectRatio ? Math.round(fallbackWidth / aspectRatio) : null,
    quality,
    format,
    autoFormat,
  });
  
  return {
    src,
    srcset,
    sizes: sizesAttr,
  };
}

/**
 * 获取视频封面的优化URL
 * @param {string} coverUrl - 封面图片URL
 * @returns {string} 优化后的URL
 */
export function getOptimizedCoverUrl(coverUrl) {
  return optimizeImageUrl(coverUrl, {
    width: 240,   // 根据实际显示尺寸调整
    height: 320,
    quality: 75,
  });
}

/**
 * 预加载图片
 * @param {string} url - 图片URL
 * @returns {Promise<boolean>} 加载是否成功
 */
export function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * 批量预加载图片
 * @param {string[]} urls - 图片URL数组
 * @param {number} concurrency - 并发数量（默认3）
 * @returns {Promise<Array<{url: string, success: boolean}>>}
 */
export async function preloadImages(urls, concurrency = 3) {
  const results = [];
  const queue = [...urls];
  
  const loadNext = async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      const success = await preloadImage(url);
      results.push({ url, success });
    }
  };
  
  const workers = Array(Math.min(concurrency, urls.length))
    .fill(null)
    .map(() => loadNext());
  
  await Promise.all(workers);
  return results;
}

const progressiveInFlightRequests = new Map();

function createAbortError(message = '图片加载已取消') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal, message) {
  if (signal?.aborted) {
    throw createAbortError(message);
  }
}

function waitWithSignal(delayMs, signal) {
  if (!delayMs) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener?.('abort', handleAbort);
      resolve();
    }, delayMs);

    const handleAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener?.('abort', handleAbort);
      reject(createAbortError());
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
}

function loadImageElement(url, { timeout = 30000, signal = null, stageIndex = -1 } = {}) {
  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    const img = new Image();
    let timeoutId = null;
    let settled = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      img.onload = null;
      img.onerror = null;
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      img.src = '';
    };

    const finish = (handler, payload) => {
      if (settled) return;
      settled = true;
      cleanup();
      handler(payload);
    };

    const handleAbort = () => {
      finish(reject, createAbortError(stageIndex >= 0 ? `阶段 ${stageIndex + 1} 加载已取消` : '图片加载已取消'));
    };

    timeoutId = setTimeout(() => {
      finish(reject, new Error(stageIndex >= 0 ? `阶段 ${stageIndex + 1} 加载超时: ${url}` : `图片加载超时 (${timeout}ms)`));
    }, timeout);

    img.onload = () => {
      finish(resolve, { url, loaded: true });
    };

    img.onerror = (event) => {
      const error = new Error(stageIndex >= 0 ? `阶段 ${stageIndex + 1} 加载失败` : '图片加载失败');
      error.originalEvent = event;
      error.stageUrl = url;
      error.stageIndex = stageIndex;
      finish(reject, error);
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    try {
      img.crossOrigin = 'anonymous';
      img.src = url;
    } catch (error) {
      finish(reject, error);
    }
  });
}

function cloneProgressiveResult(result) {
  if (!result || typeof result !== 'object') {
    return result;
  }

  return {
    ...result,
    stages: Array.isArray(result.stages)
      ? result.stages.map((stageResult) => ({ ...stageResult }))
      : [],
  };
}

function buildStableStageSignature(stages = []) {
  return JSON.stringify(
    (Array.isArray(stages) ? stages : []).map((stage = {}) => ({
      width: stage.width ?? null,
      height: stage.height ?? null,
      quality: stage.quality ?? null,
      format: stage.format ?? null,
      autoFormat: stage.autoFormat ?? null,
      blur: stage.blur ?? null,
    }))
  );
}

function buildProgressiveRequestKey(url, options = {}) {
  if (options.dedupeKey) {
    return String(options.dedupeKey);
  }

  if (typeof options.urlTransformer === 'function') {
    return null;
  }

  return JSON.stringify({
    url,
    timeout: options.timeout ?? 30000,
    stages: buildStableStageSignature(options.stages),
    enableCache: options.enableCache ?? false,
  });
}

function replayProgressiveCallbacks(result, options = {}) {
  const clonedResult = cloneProgressiveResult(result);
  if (!clonedResult) {
    return clonedResult;
  }

  if (Array.isArray(clonedResult.stages) && typeof options.onStageComplete === 'function') {
    clonedResult.stages.forEach((stageResult, stageIndex) => {
      if (stageResult.loaded) {
        invokeSafeImageCallback(
          options.onStageComplete,
          [stageIndex, stageResult.url, stageResult.stage],
          'onStageComplete'
        );
      }
    });
  }

  if (clonedResult.success) {
    if (typeof options.onComplete === 'function') {
      invokeSafeImageCallback(options.onComplete, [clonedResult.url], 'onComplete');
    }
  } else if (clonedResult.error && typeof options.onError === 'function') {
    invokeSafeImageCallback(
      options.onError,
      [clonedResult.error, clonedResult.stages.length - 1],
      'onError'
    );
  }

  return clonedResult;
}

function invokeSafeImageCallback(callback, args, label) {
  if (typeof callback !== 'function') {
    return;
  }

  try {
    const result = callback(...args);
    if (result && typeof result.then === 'function') {
      result.catch((error) => {
        console.warn(`[imageOptimize] ${label} 回调执行失败:`, error);
      });
    }
  } catch (error) {
    console.warn(`[imageOptimize] ${label} 回调执行失败:`, error);
  }
}

/**
 * 渐进式加载图片（支持高并发、错误隔离、独立错误信息、模糊到清晰）
 * @param {Array<string|Object>} imageList - 图片列表，可以是URL字符串数组，或包含url和priority的对象数组
 * @param {Object} options - 配置选项
 * @param {number} options.concurrency - 并发数量（默认10）
 *   注意：此参数控制同时加载的图片数量，不是总请求数
 *   - 如果30张图片，每张3阶段，总请求数 = 30 × 3 = 90个（顺序执行）
 *   - 但 concurrency: 10 意味着最多同时10张图片在加载
 *   - 每张图片的多个阶段是顺序执行的，不会同时发起多个请求
 *   - 实际并发请求数 = concurrency（最多10个），避免浏览器连接队列阻塞
 *   - 建议值：5-10（网络较好），3-5（网络较差）
 * @param {number} options.timeout - 单个图片加载超时时间（毫秒，默认30000）
 * @param {boolean} options.priority - 是否按优先级加载（默认true，priority高的先加载）
 * @param {Array} options.stages - 渐进式加载阶段配置（可选），例如：
 *   [
 *     { width: 20, quality: 20 },   // 阶段1: 极速模糊图
 *     { width: 400, quality: 50 },  // 阶段2: 中等质量
 *     { width: null, quality: 80 }  // 阶段3: 最终质量（原图）
 *   ]
 *   如果提供stages，每张图片会按阶段顺序加载，从模糊到清晰
 *   注意：每张图片的多个阶段是顺序执行的，不会并发请求
 * @param {Function} options.onProgress - 进度回调函数 (current, total, result) => void
 * @param {Function} options.onItemComplete - 单个图片加载完成回调 (result) => void
 * @param {Function} options.onItemStageComplete - 单个图片的阶段完成回调 (result, stageIndex) => void
 *   result包含: { url, index, stageIndex, stageUrl, stage, currentStage, totalStages }
 * @param {boolean} options.retryOnError - 是否在失败时重试（默认false）
 * @param {number} options.maxRetries - 最大重试次数（默认1）
 * @returns {Promise<Array<{url: string, success: boolean, error: Error|null, index: number, retries: number, stages?: Array}>}
 */
export async function loadImagesProgressively(imageList, options = {}) {
  const {
    concurrency = 10,
    timeout = 30000,
    priority = true,
    stages = null,
    enableCache = true,
    urlTransformer = null,
    onStageError = null,
    onProgress = null,
    onItemComplete = null,
    onItemStageComplete = null,
    retryOnError = false,
    maxRetries = 1,
    signal = null,
    dedupe = true,
  } = options;

  const normalizedList = (imageList || []).map((item, index) => {
    if (typeof item === 'string') {
      return { url: item, priority: 0, index };
    }
    return {
      url: item.url || item.src || '',
      priority: item.priority || 0,
      index: item.index !== undefined ? item.index : index,
    };
  });

  // 按优先级排序（priority值越大优先级越高）
  if (priority) {
    normalizedList.sort((a, b) => b.priority - a.priority);
  }

  const results = new Array(normalizedList.length);
  let completedCount = 0;
  const total = normalizedList.length;
  const batchInFlight = new Map();

  const finalizeItemResult = (result) => {
    results[result.index] = result;
    completedCount += 1;
    if (onProgress) {
      invokeSafeImageCallback(onProgress, [completedCount, total, result], 'onProgress');
    }
    if (onItemComplete) {
      invokeSafeImageCallback(onItemComplete, [result], 'onItemComplete');
    }
    return result;
  };

  const buildBatchKey = (url) => {
    if (!dedupe) return null;
    if (Array.isArray(stages) && stages.length > 0) {
      return buildProgressiveRequestKey(url, {
        stages,
        timeout,
        enableCache,
        urlTransformer,
      });
    }
    return JSON.stringify({ url, timeout });
  };

  const loadSingleImage = async (item) => {
    const { url, index } = item;

    if (!url) {
      return finalizeItemResult({
        url: '',
        success: false,
        error: new Error('图片URL为空'),
        index,
        retries: 0,
      });
    }

    const batchKey = buildBatchKey(url);
    if (batchKey && batchInFlight.has(batchKey)) {
      const sharedResult = await batchInFlight.get(batchKey);
      if (Array.isArray(stages) && stages.length > 0 && onItemStageComplete) {
        (sharedResult?.stages || []).forEach((stageResult, stageIndex) => {
          if (stageResult.loaded) {
            invokeSafeImageCallback(onItemStageComplete, [{
              url,
              index,
              stageIndex,
              stageUrl: stageResult.url,
              stage: stageResult.stage,
              currentStage: stageIndex + 1,
              totalStages: stages.length,
            }, stageIndex], 'onItemStageComplete');
          }
        });
      }
      return finalizeItemResult({
        ...cloneProgressiveResult(sharedResult),
        index,
      });
    }

    const runner = (async () => {
      if (Array.isArray(stages) && stages.length > 0) {
        const { loadImageProgressiveWithCache } = await import('./imageCache.js');
        return loadImageProgressiveWithCache(url, {
          stages,
          timeout,
          enableCache,
          urlTransformer,
          onStageError,
          signal,
          dedupe,
          onStageComplete: (stageIndex, stageUrl, stage) => {
            if (onItemStageComplete) {
              invokeSafeImageCallback(onItemStageComplete, [{
                url,
                index,
                stageIndex,
                stageUrl,
                stage,
                currentStage: stageIndex + 1,
                totalStages: stages.length,
              }, stageIndex], 'onItemStageComplete');
            }
          },
        });
      }

      let retries = 0;
      while (true) {
        try {
          throwIfAborted(signal);
          await loadImageElement(url, { timeout, signal });
          return {
            url,
            success: true,
            error: null,
            retries,
          };
        } catch (error) {
          if (error?.name === 'AbortError') {
            return {
              url,
              success: false,
              error,
              aborted: true,
              retries,
            };
          }

          if (!retryOnError || retries >= maxRetries) {
            return {
              url,
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
              retries,
            };
          }

          retries += 1;
          await waitWithSignal(1000 * retries, signal);
        }
      }
    })();

    if (batchKey) {
      batchInFlight.set(batchKey, runner);
    }

    try {
      const sharedResult = await runner;
      const result = {
        ...cloneProgressiveResult(sharedResult),
        index,
        retries: sharedResult?.retries ?? 0,
      };
      return finalizeItemResult(result);
    } finally {
      if (batchKey) {
        batchInFlight.delete(batchKey);
      }
    }
  };

  const queue = [...normalizedList];
  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;

      try {
        await loadSingleImage(item);
      } catch (error) {
        finalizeItemResult({
          url: item.url,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          index: item.index,
          retries: 0,
        });
      }
    }
  };

  await Promise.all(
    Array(Math.min(Math.max(concurrency, 1), Math.max(queue.length, 1)))
      .fill(null)
      .map(() => worker())
  );

  return results;
}

/**
 * 批量加载图片（简化版，基于渐进式加载）
 * @param {string[]} urls - 图片URL数组
 * @param {Object} options - 配置选项（同 loadImagesProgressively）
 * @returns {Promise<Array<{url: string, success: boolean, error: Error|null}>>}
 */
export async function loadImagesBatch(urls, options = {}) {
  return loadImagesProgressively(urls, {
    priority: false, // 批量加载不需要优先级
    ...options,
  });
}

/**
 * 生成模糊占位符图片URL（用于渐进式加载）
 * @param {string} url - 原始图片URL
 * @param {Object} options - 配置选项
 * @param {number} options.width - 占位符宽度（默认20）
 * @param {number} options.height - 占位符高度（可选，默认按比例）
 * @param {number} options.quality - 图片质量（0-100，默认20）
 * @param {number} options.blur - 模糊程度（0-10，默认10）
 * @returns {string} 模糊占位符图片URL
 */
export function generateBlurPlaceholderUrl(url, options = {}) {
  if (!url) return url;
  
  const {
    width = 20,
    height = null,
    quality = 20,
    blur = 10,
  } = options;

  // 使用 optimizeImageUrl 生成极小模糊图
  return optimizeImageUrl(url, {
    width,
    height,
    quality,
    format: 'jpg', // 使用 jpg 格式，文件更小
  });
}

/**
 * 渐进式加载单张图片（模糊到清晰，支持多阶段）
 * @param {string} url - 原始图片URL
 * @param {Object} options - 配置选项
 * @param {Array} options.stages - 加载阶段配置数组，例如：
 *   [
 *     { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
 *     { width: 400, quality: 50, blur: 3 },  // 阶段2: 中等质量
 *     { width: 1200, quality: 80, blur: 0 } // 阶段3: 最终质量
 *   ]
 * @param {number} options.timeout - 每个阶段的超时时间（毫秒，默认30000）
 * @param {Function} options.urlTransformer - URL转换函数 (url, stage, stageIndex) => string，用于自定义URL生成逻辑
 * @param {Function} options.onStageComplete - 阶段完成回调 (stageIndex, imageUrl, stage) => void
 * @param {Function} options.onStageError - 阶段错误回调 (error, stageIndex, stageUrl, stage) => string|null，返回降级URL或null
 * @param {Function} options.onComplete - 全部完成回调 (finalUrl) => void
 * @param {Function} options.onError - 错误回调 (error, stageIndex) => void
 * @returns {Promise<{url: string, stages: Array<{url: string, stage: Object, loaded: boolean}>, success: boolean, error: Error|null}>}
 */
export async function loadImageProgressive(url, options = {}) {
  const {
    stages = [
      { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
      { width: 400, quality: 50, blur: 3 },   // 阶段2: 中等质量
      { width: null, quality: 80, blur: 0 }   // 阶段3: 最终质量（原图）
    ],
    timeout = 30000,
    urlTransformer = null,
    onStageComplete = null,
    onStageError = null,
    onComplete = null,
    onError = null,
    signal = null,
    dedupe = true,
    stageDelay = 100,
    dedupeKey = null,
  } = options;

  if (!url) {
    const error = new Error('图片URL为空');
    if (onError) onError(error, -1);
    return {
      url: '',
      stages: [],
      success: false,
      error,
    };
  }

  const requestKey = dedupe ? buildProgressiveRequestKey(url, {
    stages,
    timeout,
    urlTransformer,
    dedupeKey,
  }) : null;

  if (requestKey && progressiveInFlightRequests.has(requestKey)) {
    const sharedResult = await progressiveInFlightRequests.get(requestKey);
    return replayProgressiveCallbacks(sharedResult, options);
  }

  const runner = (async () => {
    const stageResults = [];
    let finalUrl = url;

    try {
      for (let i = 0; i < stages.length; i++) {
        throwIfAborted(signal);
        const stage = stages[i];
        let stageUrl;

        if (urlTransformer && typeof urlTransformer === 'function') {
          stageUrl = urlTransformer(url, stage, i);
        } else if (i === stages.length - 1 && !stage.width && !stage.height) {
          stageUrl = url;
        } else {
          stageUrl = optimizeImageUrl(url, {
            width: stage.width || null,
            height: stage.height || null,
            quality: stage.quality || 80,
            format: stage.format || null,
            autoFormat: stage.autoFormat !== false,
          });
        }

        try {
          await loadImageElement(stageUrl, { timeout, signal, stageIndex: i });
          const stageResult = {
            url: stageUrl,
            stage,
            loaded: true,
          };
          stageResults.push(stageResult);
          finalUrl = stageUrl;

          if (onStageComplete) {
            invokeSafeImageCallback(onStageComplete, [i, stageUrl, stage], 'onStageComplete');
          }
        } catch (stageError) {
          if (stageError?.name === 'AbortError') {
            throw stageError;
          }

          let fallbackUrl = null;
          if (typeof onStageError === 'function') {
            try {
              fallbackUrl = onStageError(stageError, i, stageUrl, stage);
            } catch (callbackError) {
              fallbackUrl = null;
            }
          }

          if (fallbackUrl && typeof fallbackUrl === 'string') {
            try {
              await loadImageElement(fallbackUrl, { timeout, signal, stageIndex: i });
              const fallbackResult = {
                url: fallbackUrl,
                stage,
                loaded: true,
              };
              stageResults.push(fallbackResult);
              finalUrl = fallbackUrl;
              if (onStageComplete) {
                invokeSafeImageCallback(onStageComplete, [i, fallbackUrl, stage], 'onStageComplete');
              }
              break;
            } catch (fallbackError) {
              stageError = fallbackError;
            }
          }

          const is404 = stageError.message.includes('404') ||
            (stageError.originalEvent && stageError.originalEvent.type === 'error');
          if (!is404 || process.env.NODE_ENV === 'development') {
            if (!is404) {
              console.warn(`⚠️ 阶段 ${i + 1} 加载失败，跳过继续下一阶段:`, stageError.message);
            }
          }

          stageResults.push({
            url: stageUrl,
            stage,
            loaded: false,
            error: stageError,
          });

          if (i === stages.length - 1 && stageResults.some((result) => result.loaded)) {
            finalUrl = stageResults.filter((result) => result.loaded).slice(-1)[0]?.url || finalUrl;
          }
        }

        if (i < stages.length - 1) {
          await waitWithSignal(stageDelay, signal);
        }
      }

      const hasSuccess = stageResults.some((result) => result.loaded);
      if (!hasSuccess) {
        const lastError = stageResults[stageResults.length - 1]?.error || new Error('所有阶段加载失败');
        if (onError) {
          invokeSafeImageCallback(onError, [lastError, stageResults.length - 1], 'onError');
        }
        return {
          url: finalUrl || url,
          stages: stageResults,
          success: false,
          error: lastError,
        };
      }

      if (onComplete) {
        invokeSafeImageCallback(onComplete, [finalUrl], 'onComplete');
      }

      return {
        url: finalUrl,
        stages: stageResults,
        success: true,
        error: null,
      };
    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        invokeSafeImageCallback(onError, [resolvedError, stageResults.length], 'onError');
      }
      return {
        url: finalUrl || url,
        stages: stageResults,
        success: false,
        error: resolvedError,
        aborted: resolvedError.name === 'AbortError',
      };
    }
  })();

  if (requestKey) {
    progressiveInFlightRequests.set(requestKey, runner);
  }

  try {
    return cloneProgressiveResult(await runner);
  } finally {
    if (requestKey) {
      progressiveInFlightRequests.delete(requestKey);
    }
  }
}

/**
 * 批量渐进式加载图片（模糊到清晰）
 * @param {Array<string|Object>} imageList - 图片列表
 * @param {Object} options - 配置选项
 * @param {Array} options.stages - 加载阶段配置（同 loadImageProgressive）
 * @param {number} options.concurrency - 并发数量（默认5，渐进式加载建议较低并发）
 * @param {number} options.timeout - 每个阶段的超时时间（默认30000）
 * @param {Function} options.onProgress - 进度回调 (current, total, result) => void
 * @param {Function} options.onItemStageComplete - 单个图片的阶段完成回调 (result, stageIndex) => void
 * @param {Function} options.onItemComplete - 单个图片全部完成回调 (result) => void
 * @returns {Promise<Array>} 加载结果数组
 */
export async function loadImagesProgressiveBatch(imageList, options = {}) {
  const {
    stages = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    concurrency = 5,
    timeout = 30000,
    onProgress = null,
    onItemStageComplete = null,
    onItemComplete = null,
    signal = null,
    dedupe = true,
  } = options;

  return loadImagesProgressively(imageList, {
    stages,
    concurrency,
    timeout,
    priority: false,
    enableCache: false,
    onProgress,
    onItemStageComplete,
    onItemComplete,
    signal,
    dedupe,
  });
}

/**
 * 在浏览器端压缩图片
 * @param {string|File|Blob} imageSource - 图片源（URL、File或Blob）
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度
 * @param {number} options.maxHeight - 最大高度
 * @param {number} options.quality - 图片质量（0-1，默认0.8）
 * @param {number} options.compressionLevel - 压缩程度（0-1，默认0.5，0=不压缩，1=最大压缩）
 * @param {number} options.blur - 模糊程度（0-10，默认0，值越大越模糊）
 * @param {boolean} options.smooth - 是否启用图像平滑（默认true）
 * @param {string} options.format - 输出格式（webp/jpeg/png，默认自动选择）
 * @param {string} options.fileName - 压缩后输出文件名，可选
 * @returns {Promise<{
 *   file: File,
 *   blob: Blob,
 *   url: string,
 *   dataURL: string,
 *   originalSize: number,
 *   compressedSize: number,
 *   savedSize: number,
 *   savedPercentage: number,
 *   compressedFileName: string,
 *   compressedFormat: string,
 *   originalWidth: number,
 *   originalHeight: number,
 *   compressedWidth: number,
 *   compressedHeight: number,
 *   mimeType: string,
 *   sourceFileName: string,
 * }>} 压缩结果对象，可直接用于预览、统计与上传
 */
export async function compressImageInBrowser(imageSource, options = {}) {
  const {
    maxWidth = null,
    maxHeight = null,
    quality = 0.8,
    compressionLevel = 0.5, // 压缩程度 0-1
    blur = 0, // 模糊程度 0-10
    smooth = true, // 图像平滑
    format = null,
    fileName = null,
    maxBytes = null,
    targetSizeBytes = null,
    candidateFormats = null,
    autoSelectFormat = false,
    minQuality = 0.45,
    maxIterations = 6,
  } = options;

  // 检查是否在浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('浏览器端压缩功能仅在浏览器环境中可用');
  }

  const buildSourceFileName = () => {
    if (typeof fileName === 'string' && fileName.trim()) {
      return fileName.trim();
    }

    if (imageSource instanceof File && imageSource.name) {
      return imageSource.name;
    }

    if (typeof imageSource === 'string') {
      try {
        const urlObj = new URL(imageSource, window.location.href);
        const lastSegment = urlObj.pathname.split('/').pop();
        if (lastSegment) {
          return lastSegment;
        }
      } catch (error) {
        // 忽略 URL 解析错误，回退到默认文件名
      }
    }

    return 'compressed-image';
  };

  const getOutputExtension = (outputFormat, mimeType) => {
    if (outputFormat === 'jpeg' || outputFormat === 'jpg') return 'jpg';
    if (outputFormat === 'png') return 'png';
    if (outputFormat === 'webp') return 'webp';
    if (outputFormat === 'avif') return 'avif';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/avif') return 'avif';
    return 'jpg';
  };

  const buildOutputFileName = (sourceFileName, outputFormat, mimeType) => {
    if (typeof fileName === 'string' && fileName.trim()) {
      return fileName.trim();
    }

    const extension = getOutputExtension(outputFormat, mimeType);
    const sanitizedName = sourceFileName || 'compressed-image';
    const baseName = sanitizedName.replace(/\.[^.]+$/, '') || 'compressed-image';
    return `${baseName}-compressed.${extension}`;
  };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域图片

    img.onload = () => {
      try {
        let { width: originalWidth, height: originalHeight } = img;

        // 计算缩放后的尺寸
        let width = originalWidth;
        let height = originalHeight;
        let needsScalingByMaxSize = false;
        if (maxWidth || maxHeight) {
          const ratio = Math.min(
            maxWidth ? maxWidth / originalWidth : 1,
            maxHeight ? maxHeight / originalHeight : 1
          );
          if (ratio < 1) {
            width = Math.round(originalWidth * ratio);
            height = Math.round(originalHeight * ratio);
            needsScalingByMaxSize = true;
          }
        }

        // 根据压缩程度调整尺寸（进一步缩小以减少文件大小）
        let finalWidth = width;
        let finalHeight = height;
        if (compressionLevel > 0) {
          // compressionLevel 0-1: 0=不压缩尺寸，1=压缩到25%
          const sizeRatio = 1 - (compressionLevel * 0.75); // 最大压缩到原来的25%
          finalWidth = Math.round(width * sizeRatio);
          finalHeight = Math.round(height * sizeRatio);
        }

        // 检查是否需要任何处理
        const needsScaling = finalWidth !== originalWidth || finalHeight !== originalHeight;
        const needsAnyProcessing = needsScaling || compressionLevel > 0 || blur > 0;
        
        // 如果完全不需要任何处理，直接返回原图（避免 Canvas 转换带来的质量损失）
        if (!needsAnyProcessing) {
          // 如果原图是 URL，直接返回原图
          if (typeof imageSource === 'string') {
            resolve(imageSource);
            return;
          }
          // 如果是 File/Blob，仍需要转换为 DataURL 才能显示，但会使用最高质量
        }
        
        // 创建 canvas 进行处理
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // 绘制图片到 canvas
        const ctx = canvas.getContext('2d');
        
        // 设置图像平滑
        // 如果不需要缩放，禁用平滑以避免不必要的插值
        // 如果需要缩放，使用高质量平滑
        if (needsScaling) {
          ctx.imageSmoothingEnabled = smooth;
          ctx.imageSmoothingQuality = smooth ? 'high' : 'low';
        } else {
          // 不需要缩放时，禁用平滑以获得最清晰的图片
          ctx.imageSmoothingEnabled = false;
        }
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        // 应用模糊效果（如果需要）
        if (blur > 0) {
          // 使用 canvas filter 实现模糊（现代浏览器支持）
          const blurCanvas = document.createElement('canvas');
          const blurCtx = blurCanvas.getContext('2d');
          blurCanvas.width = finalWidth;
          blurCanvas.height = finalHeight;
          
          // 先绘制到临时 canvas
          blurCtx.drawImage(img, 0, 0, finalWidth, finalHeight);
          
          // 尝试使用 filter 属性（现代浏览器）
          if (blurCtx.filter !== undefined) {
            try {
              blurCtx.filter = `blur(${blur}px)`;
              blurCtx.drawImage(blurCanvas, 0, 0);
              blurCtx.filter = 'none';
              // 将模糊后的结果绘制回主 canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(blurCanvas, 0, 0);
            } catch (e) {
              // 如果 filter 失败，使用降级方案
              applyBlurFallback(ctx, blurCanvas, finalWidth, finalHeight, blur);
            }
          } else {
            // 浏览器不支持 filter，使用降级方案
            applyBlurFallback(ctx, blurCanvas, finalWidth, finalHeight, blur);
          }
        }

        // 确定输出格式
        let outputFormat = format;
        if (!outputFormat) {
          // 如果不需要压缩且不需要缩放，尽量保持原始格式
          const needsCompression = compressionLevel > 0 || blur > 0 || needsScaling;
          if (!needsCompression) {
            // 检测原始图片格式
            const detectedFormat = detectImageFormat(imageSource);
            if (detectedFormat && ['jpg', 'jpeg', 'png'].includes(detectedFormat)) {
              outputFormat = detectedFormat === 'jpeg' ? 'jpeg' : detectedFormat;
            } else {
              // 如果无法检测或需要压缩，使用 WebP（如果支持）
              const supportedFormats = detectSupportedFormats();
              outputFormat = supportedFormats.includes('webp') ? 'webp' : 'jpeg';
            }
          } else {
            // 需要压缩时，优先选择 WebP
            const supportedFormats = detectSupportedFormats();
            outputFormat = supportedFormats.includes('webp') ? 'webp' : 'jpeg';
          }
        }

        // 根据压缩程度调整质量
        // compressionLevel 越高，质量越低
        let finalQuality = quality;
        if (compressionLevel > 0) {
          // 质量随压缩程度降低：compressionLevel=1 时，质量降低到原来的 30%
          finalQuality = quality * (1 - compressionLevel * 0.7);
          finalQuality = Math.max(0.1, Math.min(1, finalQuality)); // 限制在 0.1-1 之间
        } else {
          // compressionLevel = 0 时，直接使用用户指定的 quality，不做强制限制
          // 这样用户可以完全控制质量参数
          finalQuality = Math.max(0.1, Math.min(1, quality)); // 只限制在有效范围内
        }

        const requestedMaxBytes = Number(maxBytes) || Number(targetSizeBytes) || null;
        const sourceFormat = typeof imageSource === 'string'
          ? detectImageFormat(imageSource)
          : null;

        const resolveMimeType = (nextFormat) => {
          if (nextFormat === 'webp') return 'image/webp';
          if (nextFormat === 'png') return 'image/png';
          if (nextFormat === 'avif') return 'image/avif';
          return 'image/jpeg';
        };

        const supportedFormats = detectSupportedFormats();
        const formatCandidates = (() => {
          const normalized = (candidateFormats || []).map((item) => String(item).toLowerCase().replace('jpeg', 'jpg'));
          if (normalized.length > 0) {
            return [...new Set(normalized)];
          }

          if (!requestedMaxBytes && !autoSelectFormat) {
            return [outputFormat];
          }

          return [...new Set([
            outputFormat,
            sourceFormat,
            supportedFormats.includes('avif') ? 'avif' : null,
            supportedFormats.includes('webp') ? 'webp' : null,
            'jpg',
            'png',
          ].filter(Boolean))];
        })();

        const renderCandidate = (nextFormat, nextQuality, scaleRatio = 1) => {
          const scaledWidth = Math.max(1, Math.round(finalWidth * scaleRatio));
          const scaledHeight = Math.max(1, Math.round(finalHeight * scaleRatio));
          const targetCanvas = (scaleRatio === 1)
            ? canvas
            : (() => {
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = scaledWidth;
              scaledCanvas.height = scaledHeight;
              const scaledContext = scaledCanvas.getContext('2d');
              scaledContext.imageSmoothingEnabled = smooth;
              scaledContext.imageSmoothingQuality = smooth ? 'high' : 'low';
              scaledContext.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
              return scaledCanvas;
            })();

          const mimeType = resolveMimeType(nextFormat);
          const dataURL = targetCanvas.toDataURL(mimeType, nextQuality);
          const blob = dataURLToBlob(dataURL);

          return {
            dataURL,
            blob,
            mimeType,
            outputFormat: nextFormat,
            width: targetCanvas.width,
            height: targetCanvas.height,
            quality: nextQuality,
          };
        };

        let selectedCandidate = renderCandidate(outputFormat, finalQuality, 1);
        if (requestedMaxBytes) {
          let bestWithinBudget = null;
          let smallestCandidate = selectedCandidate;
          const scaleSteps = [1, 0.92, 0.84, 0.76, 0.68, 0.6];

          for (const candidateFormat of formatCandidates) {
            const supportsQuality = !['png'].includes(candidateFormat);
            for (const scaleRatio of scaleSteps) {
              if (!supportsQuality) {
                const pngCandidate = renderCandidate(candidateFormat, 1, scaleRatio);
                if (pngCandidate.blob.size < smallestCandidate.blob.size) {
                  smallestCandidate = pngCandidate;
                }
                if (pngCandidate.blob.size <= requestedMaxBytes) {
                  if (!bestWithinBudget || pngCandidate.blob.size > bestWithinBudget.blob.size) {
                    bestWithinBudget = pngCandidate;
                  }
                  break;
                }
                continue;
              }

              let high = Math.max(minQuality, Math.min(1, finalQuality));
              let low = Math.max(0.1, Math.min(minQuality, high));
              let bestForScale = renderCandidate(candidateFormat, high, scaleRatio);

              if (bestForScale.blob.size <= requestedMaxBytes) {
                if (!bestWithinBudget || bestForScale.blob.size > bestWithinBudget.blob.size) {
                  bestWithinBudget = bestForScale;
                }
              } else {
                for (let iteration = 0; iteration < maxIterations; iteration++) {
                  const nextQuality = Number(((high + low) / 2).toFixed(3));
                  const nextCandidate = renderCandidate(candidateFormat, nextQuality, scaleRatio);
                  if (nextCandidate.blob.size < smallestCandidate.blob.size) {
                    smallestCandidate = nextCandidate;
                  }
                  bestForScale = nextCandidate;

                  if (nextCandidate.blob.size <= requestedMaxBytes) {
                    low = nextQuality;
                    if (!bestWithinBudget || nextCandidate.blob.size > bestWithinBudget.blob.size) {
                      bestWithinBudget = nextCandidate;
                    }
                  } else {
                    high = nextQuality;
                  }
                }
              }

              if (bestForScale.blob.size < smallestCandidate.blob.size) {
                smallestCandidate = bestForScale;
              }
            }
          }

          selectedCandidate = bestWithinBudget || smallestCandidate;
        }

        const {
          dataURL,
          blob,
          mimeType,
          outputFormat: selectedFormat,
          width: selectedWidth,
          height: selectedHeight,
        } = selectedCandidate;
        const sourceFileName = buildSourceFileName();
        const compressedFileName = buildOutputFileName(sourceFileName, selectedFormat, mimeType);
        const compressedFile = new File([blob], compressedFileName, {
          type: mimeType,
          lastModified: Date.now(),
        });

        const originalSize =
          imageSource instanceof File || imageSource instanceof Blob
            ? imageSource.size
            : blob.size;
        const compressedSize = blob.size;
        const savedSize = originalSize - compressedSize;
        const savedPercentage =
          originalSize > 0
            ? Math.round(((savedSize / originalSize) * 100) * 100) / 100
            : 0;

        resolve({
          file: compressedFile,
          blob,
          url: dataURL,
          dataURL,
          originalSize,
          compressedSize,
          savedSize,
          savedPercentage,
          compressedFileName,
          compressedFormat: selectedFormat,
          originalWidth,
          originalHeight,
          compressedWidth: selectedWidth,
          compressedHeight: selectedHeight,
          mimeType,
          sourceFileName,
          targetSizeBytes: requestedMaxBytes,
          metTargetSize: requestedMaxBytes ? blob.size <= requestedMaxBytes : null,
        });
      } catch (error) {
        reject(new Error('图片压缩失败: ' + error.message));
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 处理不同类型的输入
    if (typeof imageSource === 'string') {
      // URL 字符串
      img.src = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      // File 或 Blob 对象
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error('不支持的图片源类型'));
    }
  });
}

/**
 * 模糊效果降级方案（通过缩放实现）
 * @param {CanvasRenderingContext2D} ctx - 主 canvas 上下文
 * @param {HTMLCanvasElement} sourceCanvas - 源 canvas
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} blur - 模糊程度
 */
function applyBlurFallback(ctx, sourceCanvas, width, height, blur) {
  // 通过缩小放大实现模糊效果（降级方案）
  const blurSteps = Math.min(Math.ceil(blur / 2), 5); // 限制步数，避免性能问题
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  // 第一次：缩小
  const scale = Math.max(0.3, 1 - (blur / 10)); // 根据模糊程度计算缩放比例
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  tempCtx.drawImage(sourceCanvas, 0, 0, width, height, 0, 0, scaledWidth, scaledHeight);
  
  // 第二次：放大回原尺寸（产生模糊效果）
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, width, height);
}

/**
 * 将 DataURL 转换为 Blob
 * @param {string} dataURL - DataURL 字符串
 * @returns {Blob} Blob 对象
 */
export function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * 获取图片大小（字节）
 * @param {string} url - 图片URL
 * @returns {Promise<number|null>} 图片大小（字节），获取失败返回null
 */
export async function getImageSize(url) {
  if (!url) return null;
  
  try {
    // 处理 Blob URL：直接使用 GET 请求获取 Blob
    if (url.startsWith('blob:')) {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob.size;
    }
    
    // 处理 Data URL：解析并计算大小
    if (url.startsWith('data:')) {
      // Data URL 格式: data:[<mediatype>][;base64],<data>
      const base64Data = url.split(',')[1];
      if (base64Data) {
        // Base64 编码的数据大小约为原始数据的 4/3
        // 但这里我们计算实际解码后的大小
        const binaryString = atob(base64Data);
        return new Blob([binaryString]).size;
      }
      return null;
    }
    
    // 处理普通 HTTP/HTTPS URL
    // 方法1: 使用 HEAD 请求获取 Content-Length
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('Content-Length');
      
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
    } catch (headError) {
      // HEAD 请求失败（某些服务器不支持），继续使用 GET 请求
    }
    
    // 方法2: 如果 HEAD 请求没有 Content-Length 或失败，使用 GET 请求
    const getResponse = await fetch(url);
    const blob = await getResponse.blob();
    return blob.size;
  } catch (error) {
    // 静默处理错误，不输出警告（避免 Blob URL 等特殊 URL 的误报）
    return null;
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return '未知';
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检测URL是否匹配支持的CDN
 * @param {string} url - 图片URL
 * @returns {string|null} 匹配的CDN名称，未匹配返回null
 */
export function detectCDN(url) {
  if (!url) return null;
  return detectImageUrlHandler(url) || null;
}

/**
 * 获取优化前后的图片大小对比
 * @param {string} originalUrl - 原始图片URL
 * @param {string} optimizedUrl - 优化后的图片URL
 * @returns {Promise<Object>} 包含原始大小、优化后大小、节省大小等信息的对象
 */
export async function compareImageSizes(originalUrl, optimizedUrl) {
  const [originalSize, optimizedSize] = await Promise.all([
    getImageSize(originalUrl),
    getImageSize(optimizedUrl),
  ]);
  
  let savedSize = null;
  let savedPercentage = null;
  let isOptimizationEffective = false;
  let warningMessage = null;
  
  if (originalSize !== null && optimizedSize !== null) {
    savedSize = originalSize - optimizedSize;
    savedPercentage = parseFloat(((savedSize / originalSize) * 100).toFixed(2));
    
    // 判断优化是否有效（节省大小超过1%或至少节省1KB）
    isOptimizationEffective = savedSize > 1024 || savedPercentage > 1;
    
    // 如果优化无效，检查是否匹配支持的CDN
    if (!isOptimizationEffective && savedSize === 0) {
      const cdn = detectCDN(originalUrl);
      if (!cdn) {
        warningMessage = `⚠️ 该图片URL不是支持的CDN，通用查询参数可能无效。支持的CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront。`;
      } else {
        warningMessage = `⚠️ 优化参数可能无效，图片大小未发生变化。请检查CDN配置是否正确。`;
      }
    } else if (!isOptimizationEffective && savedSize > 0 && savedPercentage <= 1) {
      warningMessage = `⚠️ 优化效果不明显（仅节省 ${savedPercentage}%），可能优化参数未生效。`;
    }
  }
  
  return {
    originalUrl,
    optimizedUrl,
    originalSize,
    optimizedSize,
    savedSize,
    savedPercentage,
    isOptimizationEffective,
    warningMessage,
    originalSizeFormatted: formatFileSize(originalSize),
    optimizedSizeFormatted: formatFileSize(optimizedSize),
    savedSizeFormatted: formatFileSize(savedSize),
    cdn: detectCDN(originalUrl),
  };
}
