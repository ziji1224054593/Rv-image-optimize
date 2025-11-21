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
 * CDN 处理器配置
 */
const CDN_HANDLERS = {
  // 阿里云OSS
  aliyun: {
    test: (url) => url.includes('aliyuncs.com') || url.includes('oss-'),
    process: (urlObj, options) => {
      const { width, height, quality, format } = options;
      const processParams = [];
      
      if (width || height) {
        processParams.push(`resize,w_${width || ''},h_${height || ''},m_lfit`);
      }
      if (quality) {
        processParams.push(`quality,q_${quality}`);
      }
      if (format) {
        processParams.push(`format,${format}`);
      }
      
      if (processParams.length > 0) {
        urlObj.searchParams.set('x-oss-process', processParams.join('/'));
      }
      return urlObj.toString();
    }
  },
  
  // 腾讯云COS
  tencent: {
    test: (url) => url.includes('qcloud.com') || url.includes('myqcloud.com'),
    process: (urlObj, options) => {
      const { width, height, quality, format } = options;
      const processParams = [];
      
      if (width || height) {
        processParams.push(`imageMogr2/thumbnail/${width}x${height}`);
      }
      if (quality) {
        processParams.push(`quality/${quality}`);
      }
      if (format) {
        processParams.push(`format/${format}`);
      }
      
      if (processParams.length > 0) {
        const processStr = processParams.join('|');
        const separator = urlObj.search ? '|' : '?imageMogr2/';
        return `${urlObj.toString()}${separator}${processStr}`;
      }
      return urlObj.toString();
    }
  },
  
  // 七牛云
  qiniu: {
    test: (url) => url.includes('qiniucdn.com') || url.includes('qiniu.com'),
    process: (urlObj, options) => {
      const { width, height, quality, format } = options;
      const processParams = [];
      
      if (width || height) {
        processParams.push(`imageView2/1/w/${width || ''}/h/${height || ''}`);
      }
      if (quality) {
        processParams.push(`quality/${quality}`);
      }
      if (format) {
        processParams.push(`format/${format}`);
      }
      
      if (processParams.length > 0) {
        const processStr = processParams.join('|');
        const separator = urlObj.search ? '|' : '?';
        return `${urlObj.toString()}${separator}${processStr}`;
      }
      return urlObj.toString();
    }
  },
  
  // 又拍云
  upyun: {
    test: (url) => url.includes('upaiyun.com') || url.includes('upyun.com'),
    process: (urlObj, options) => {
      const { width, height, quality, format } = options;
      const processParams = [];
      
      // 又拍云使用 /!/ 作为处理参数分隔符
      if (width || height) {
        processParams.push(`${width || ''}x${height || ''}`);
      }
      if (quality) {
        processParams.push(`quality/${quality}`);
      }
      if (format) {
        processParams.push(`format/${format}`);
      }
      
      if (processParams.length > 0) {
        // 又拍云格式：https://domain.com/path!/process
        const pathParts = urlObj.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const processedPath = pathParts.slice(0, -1).join('/') + '/!' + processParams.join('/') + '/' + lastPart;
        urlObj.pathname = processedPath;
      }
      return urlObj.toString();
    }
  },
  
  // AWS CloudFront (需要配合 Lambda@Edge 或 CloudFront Functions)
  cloudfront: {
    test: (url) => url.includes('cloudfront.net') || url.includes('.aws'),
    process: (urlObj, options) => {
      const { width, height, quality, format } = options;
      
      // CloudFront 通常使用查询参数
      if (width) urlObj.searchParams.set('w', width);
      if (height) urlObj.searchParams.set('h', height);
      if (quality) urlObj.searchParams.set('q', quality);
      if (format) urlObj.searchParams.set('f', format);
      
      return urlObj.toString();
    }
  }
};

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
  
  const {
    width = null,
    height = null,
    quality = 30,
    format = null,
    autoFormat = true, // 自动选择最佳格式
  } = options;

  try {
    // 处理相对路径或特殊 URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      // 如果是相对路径（以 / 开头），尝试构造完整的 URL
      if (url.startsWith('/')) {
        // 检测运行环境：浏览器还是 Node.js
        const baseUrl = typeof window !== 'undefined' && window.location 
          ? window.location.origin 
          : 'https://example.com'; // Node.js 环境下的默认值
        
        urlObj = new URL(url, baseUrl);
      } else {
        // 如果无法解析为 URL，直接返回原 URL（不进行优化）
        console.warn('无法解析的图片URL，跳过优化:', url);
        return url;
      }
    }
    
    // 自动格式检测和转换
    let finalFormat = format;
    if (autoFormat && !format) {
      finalFormat = getBestFormat();
    } else if (format) {
      finalFormat = getBestFormat(format);
    }
    
    // 查找匹配的 CDN 处理器
    for (const [name, handler] of Object.entries(CDN_HANDLERS)) {
      if (handler.test(url)) {
        return handler.process(urlObj, {
          width,
          height,
          quality,
          format: finalFormat
        });
      }
    }
    
    // 如果没有匹配到特定的CDN，尝试通用处理
    // 使用通用查询参数格式（注意：这些参数可能不被所有CDN支持）
    if (width) urlObj.searchParams.set('w', width);
    if (height) urlObj.searchParams.set('h', height);
    if (quality) urlObj.searchParams.set('q', quality);
    if (finalFormat) urlObj.searchParams.set('f', finalFormat);
    
    const optimizedUrl = urlObj.toString();
    
    // 如果添加了参数但URL没有变化（除了查询参数），说明可能不支持优化
    // 这里返回优化后的URL，但会在对比时检测是否真的有效
    return optimizedUrl;
  } catch (error) {
    // 如果不是有效URL或解析失败，返回原URL
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

/**
 * 渐进式加载图片（支持高并发、错误隔离、独立错误信息、模糊到清晰）
 * @param {Array<string|Object>} imageList - 图片列表，可以是URL字符串数组，或包含url和priority的对象数组
 * @param {Object} options - 配置选项
 * @param {number} options.concurrency - 并发数量（默认10，支持高并发）
 * @param {number} options.timeout - 单个图片加载超时时间（毫秒，默认30000）
 * @param {boolean} options.priority - 是否按优先级加载（默认true，priority高的先加载）
 * @param {Array} options.stages - 渐进式加载阶段配置（可选），例如：
 *   [
 *     { width: 20, quality: 20 },   // 阶段1: 极速模糊图
 *     { width: 400, quality: 50 },  // 阶段2: 中等质量
 *     { width: null, quality: 80 }  // 阶段3: 最终质量（原图）
 *   ]
 *   如果提供stages，每张图片会按阶段加载，从模糊到清晰
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
    concurrency = 10, // 默认高并发
    timeout = 30000, // 30秒超时
    priority = true, // 默认按优先级
    stages = null, // 渐进式加载阶段（可选）
    urlTransformer = null, // URL转换函数（用于自定义URL生成逻辑）
    onStageError = null, // 阶段错误回调（用于处理错误并返回降级URL）
    onProgress = null,
    onItemComplete = null,
    onItemStageComplete = null, // 阶段完成回调
    retryOnError = false,
    maxRetries = 1,
  } = options;

  // 标准化图片列表
  const normalizedList = imageList.map((item, index) => {
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

  // 结果数组，保持原始顺序
  const results = new Array(normalizedList.length);
  let completedCount = 0;
  const total = normalizedList.length;

  // 加载单个图片（支持渐进式加载）
  const loadSingleImage = async (item, retryCount = 0) => {
    const { url, index } = item;
    
    if (!url) {
      const error = new Error('图片URL为空');
      const result = {
        url: '',
        success: false,
        error,
        index,
        retries: retryCount,
      };
      results[index] = result;
      completedCount++;
      
      if (onProgress) {
        onProgress(completedCount, total, result);
      }
      if (onItemComplete) {
        onItemComplete(result);
      }
      return result;
    }

    // 如果提供了stages，使用渐进式加载
    if (stages && Array.isArray(stages) && stages.length > 0) {
      return loadImageProgressive(url, {
        stages,
        timeout,
        urlTransformer, // 传递URL转换函数
        onStageError, // 传递阶段错误回调
        onStageComplete: (stageIndex, stageUrl, stage) => {
          // 触发阶段完成回调
          if (onItemStageComplete) {
            onItemStageComplete({
              url,
              index,
              stageIndex,
              stageUrl,
              stage,
              currentStage: stageIndex + 1,
              totalStages: stages.length,
            }, stageIndex);
          }
        },
        onComplete: (finalUrl) => {
          // 全部完成
        },
        onError: (error, stageIndex) => {
          // 错误处理
        },
      }).then((progressiveResult) => {
        const result = {
          url: progressiveResult.url,
          success: progressiveResult.success,
          error: progressiveResult.error,
          index,
          retries: retryCount,
          stages: progressiveResult.stages,
        };

        results[index] = result;
        completedCount++;

        // 触发回调
        if (onProgress) {
          onProgress(completedCount, total, result);
        }
        if (onItemComplete) {
          onItemComplete(result);
        }

        return result;
      });
    }

    // 普通加载（单阶段）
    return new Promise((resolve) => {
      const img = new Image();
      let isResolved = false;
      let timeoutId = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        img.onload = null;
        img.onerror = null;
        img.src = '';
      };

      const createResult = (success, error = null) => {
        if (isResolved) return null;
        isResolved = true;
        cleanup();

        const result = {
          url,
          success,
          error,
          index,
          retries: retryCount,
        };

        results[index] = result;
        completedCount++;

        // 触发回调
        if (onProgress) {
          onProgress(completedCount, total, result);
        }
        if (onItemComplete) {
          onItemComplete(result);
        }

        return result;
      };

      // 设置超时
      timeoutId = setTimeout(() => {
        const timeoutError = new Error(`图片加载超时 (${timeout}ms)`);
        const result = createResult(false, timeoutError);
        
        // 如果启用重试且未达到最大重试次数
        if (retryOnError && retryCount < maxRetries) {
          // 延迟后重试
          setTimeout(() => {
            loadSingleImage(item, retryCount + 1).then(resolve);
          }, 1000 * (retryCount + 1)); // 递增延迟
        } else {
          resolve(result);
        }
      }, timeout);

      // 加载成功
      img.onload = () => {
        const result = createResult(true, null);
        if (result) {
          resolve(result);
        }
      };

      // 加载失败
      img.onerror = (event) => {
        const error = new Error('图片加载失败');
        error.originalEvent = event;
        const result = createResult(false, error);
        
        // 如果启用重试且未达到最大重试次数
        if (retryOnError && retryCount < maxRetries) {
          // 延迟后重试
          setTimeout(() => {
            loadSingleImage(item, retryCount + 1).then(resolve);
          }, 1000 * (retryCount + 1)); // 递增延迟
        } else {
          resolve(result);
        }
      };

      // 开始加载
      try {
        img.crossOrigin = 'anonymous'; // 允许跨域
        img.src = url;
      } catch (error) {
        const result = createResult(false, error);
        if (result) {
          resolve(result);
        }
      }
    });
  };

  // 并发控制队列
  const queue = [...normalizedList];
  const activePromises = new Set();
  const allPromises = [];

  // 处理队列
  const processQueue = async () => {
    while (queue.length > 0 || activePromises.size > 0) {
      // 如果还有任务且未达到并发限制
      while (queue.length > 0 && activePromises.size < concurrency) {
        const item = queue.shift();
        const promise = loadSingleImage(item)
          .then((result) => {
            activePromises.delete(promise);
            return result;
          })
          .catch((error) => {
            activePromises.delete(promise);
            // 即使出错也要记录结果
            const result = {
              url: item.url,
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
              index: item.index,
              retries: 0,
            };
            results[item.index] = result;
            completedCount++;
            
            if (onProgress) {
              onProgress(completedCount, total, result);
            }
            if (onItemComplete) {
              onItemComplete(result);
            }
            return result;
          });
        
        activePromises.add(promise);
        allPromises.push(promise);
      }

      // 等待至少一个任务完成
      if (activePromises.size > 0) {
        await Promise.race(Array.from(activePromises));
      }
    }
  };

  // 开始处理
  await processQueue();

  // 等待所有任务完成（包括重试的）
  await Promise.all(allPromises);

  // 返回结果（按原始索引顺序）
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

  const stageResults = [];
  let finalUrl = url;

  try {
    // 按阶段加载
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      // 生成当前阶段的URL
      let stageUrl;
      if (urlTransformer && typeof urlTransformer === 'function') {
        // 使用自定义URL转换函数
        stageUrl = urlTransformer(url, stage, i);
      } else if (i === stages.length - 1 && !stage.width && !stage.height) {
        // 最后阶段，如果没有指定尺寸，使用原图
        stageUrl = url;
      } else {
        // 使用默认的优化函数
        stageUrl = optimizeImageUrl(url, {
          width: stage.width || null,
          height: stage.height || null,
          quality: stage.quality || 80,
          format: stage.format || null,
          autoFormat: stage.autoFormat !== false,
        });
      }

      // 加载当前阶段（允许失败，继续下一阶段）
      let stageResult;
      try {

        stageResult = await new Promise((resolve, reject) => {
          const img = new Image();
          let timeoutId = null;
          let isResolved = false;

          const cleanup = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            img.onload = null;
            img.onerror = null;
            img.src = '';
          };

          timeoutId = setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              const error = new Error(`阶段 ${i + 1} 加载超时: ${stageUrl}`);
              reject(error);
            }
          }, timeout);

          img.onload = () => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              resolve({
                url: stageUrl,
                stage,
                loaded: true,
              });
            }
          };

          img.onerror = (event) => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              const error = new Error(`阶段 ${i + 1} 加载失败: ${stageUrl}`);
              error.originalEvent = event;
              reject(error);
            }
          };

          try {
            img.crossOrigin = 'anonymous';
            img.src = stageUrl;
          } catch (error) {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              reject(error);
            }
          }
        });

        // 阶段加载成功
        stageResults.push(stageResult);
        finalUrl = stageUrl;

        // 触发阶段完成回调
        if (onStageComplete) {
          onStageComplete(i, stageUrl, stage);
        }
      } catch (stageError) {
        // 阶段加载失败，尝试使用错误回调获取降级URL
        let fallbackUrl = null;
        if (onStageError && typeof onStageError === 'function') {
          try {
            fallbackUrl = onStageError(stageError, i, stageUrl, stage);
          } catch (callbackError) {
            // 回调函数执行失败，忽略
          }
        }
        
        // 如果提供了降级URL，尝试使用它
        if (fallbackUrl && typeof fallbackUrl === 'string') {
          try {
            // 尝试加载降级URL
            const fallbackResult = await new Promise((resolve, reject) => {
              const img = new Image();
              let timeoutId = null;
              let isResolved = false;

              const cleanup = () => {
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }
                img.onload = null;
                img.onerror = null;
                img.src = '';
              };

              timeoutId = setTimeout(() => {
                if (!isResolved) {
                  isResolved = true;
                  cleanup();
                  reject(new Error(`降级URL加载超时: ${fallbackUrl}`));
                }
              }, timeout);

              img.onload = () => {
                if (!isResolved) {
                  isResolved = true;
                  cleanup();
                  resolve({
                    url: fallbackUrl,
                    stage,
                    loaded: true,
                  });
                }
              };

              img.onerror = () => {
                if (!isResolved) {
                  isResolved = true;
                  cleanup();
                  reject(new Error(`降级URL加载失败: ${fallbackUrl}`));
                }
              };

              try {
                img.crossOrigin = 'anonymous';
                img.src = fallbackUrl;
              } catch (error) {
                if (!isResolved) {
                  isResolved = true;
                  cleanup();
                  reject(error);
                }
              }
            });

            // 降级URL加载成功
            stageResults.push(fallbackResult);
            finalUrl = fallbackUrl;

            // 触发阶段完成回调
            if (onStageComplete) {
              onStageComplete(i, fallbackUrl, stage);
            }

            // 跳过后续阶段，直接完成
            break;
          } catch (fallbackError) {
            // 降级URL也失败，继续正常错误处理
          }
        }
        
        // 正常错误处理
        console.warn(`⚠️ 阶段 ${i + 1} 加载失败，跳过继续下一阶段:`, stageUrl, stageError.message);
        
        stageResults.push({
          url: stageUrl,
          stage,
          loaded: false,
          error: stageError,
        });

        // 如果是最后阶段失败，使用上一个成功的URL
        if (i === stages.length - 1 && stageResults.length > 0) {
          // 找到最后一个成功的阶段
          for (let j = stageResults.length - 1; j >= 0; j--) {
            if (stageResults[j].loaded) {
              finalUrl = stageResults[j].url;
              break;
            }
          }
        }

        // 触发阶段失败回调（可选）
        if (onStageComplete) {
          onStageComplete(i, stageUrl, stage);
        }

        // 如果不是最后阶段，继续下一阶段
        // 如果是最后阶段，使用已加载的图片
        if (i < stages.length - 1) {
          // 继续下一阶段
        } else {
          // 最后阶段失败，但至少有一个阶段成功，仍然算成功
          if (stageResults.some(r => r.loaded)) {
            // 至少有一个阶段成功，继续执行
          } else {
            // 所有阶段都失败，抛出错误
            throw new Error(`所有阶段加载失败，最后一个错误: ${stageError.message}`);
          }
        }
      }

      // 如果不是最后阶段，可以添加短暂延迟，让用户看到过渡效果
      if (i < stages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 检查是否有至少一个阶段成功
    const hasSuccess = stageResults.some(r => r.loaded);
    
    if (!hasSuccess) {
      // 所有阶段都失败
      const lastError = stageResults[stageResults.length - 1]?.error || new Error('所有阶段加载失败');
      if (onError) {
        onError(lastError, stageResults.length - 1);
      }
      return {
        url: finalUrl || url,
        stages: stageResults,
        success: false,
        error: lastError,
      };
    }

    // 至少有一个阶段成功，算成功
    if (onComplete) {
      onComplete(finalUrl);
    }

    return {
      url: finalUrl,
      stages: stageResults,
      success: true,
      error: null,
    };
  } catch (error) {
    const errorIndex = stageResults.length;
    if (onError) {
      onError(error, errorIndex);
    }
    return {
      url: finalUrl || url,
      stages: stageResults,
      success: false,
      error,
    };
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
    concurrency = 5, // 渐进式加载建议较低并发，避免网络拥塞
    timeout = 30000,
    onProgress = null,
    onItemStageComplete = null,
    onItemComplete = null,
  } = options;

  // 标准化图片列表
  const normalizedList = imageList.map((item, index) => {
    if (typeof item === 'string') {
      return { url: item, index };
    }
    return {
      url: item.url || item.src || '',
      index: item.index !== undefined ? item.index : index,
    };
  });

  const results = new Array(normalizedList.length);
  let completedCount = 0;
  const total = normalizedList.length;

  // 加载单个图片的渐进式加载
  const loadSingleProgressive = async (item) => {
    const { url, index } = item;
    
    const result = await loadImageProgressive(url, {
      stages,
      timeout,
      onStageComplete: (stageIndex, stageUrl, stage) => {
        if (onItemStageComplete) {
          onItemStageComplete({
            url,
            index,
            stageIndex,
            stageUrl,
            stage,
            currentStage: stageIndex + 1,
            totalStages: stages.length,
          }, stageIndex);
        }
      },
      onComplete: (finalUrl) => {
        // 图片全部加载完成
      },
      onError: (error, stageIndex) => {
        // 错误处理
      },
    });

    results[index] = result;
    completedCount++;

    if (onProgress) {
      onProgress(completedCount, total, result);
    }
    if (onItemComplete) {
      onItemComplete(result);
    }

    return result;
  };

  // 并发控制
  const queue = [...normalizedList];
  const activePromises = new Set();
  const allPromises = [];

  const processQueue = async () => {
    while (queue.length > 0 || activePromises.size > 0) {
      while (queue.length > 0 && activePromises.size < concurrency) {
        const item = queue.shift();
        const promise = loadSingleProgressive(item)
          .then((result) => {
            activePromises.delete(promise);
            return result;
          })
          .catch((error) => {
            activePromises.delete(promise);
            const result = {
              url: item.url,
              stages: [],
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
            };
            results[item.index] = result;
            completedCount++;
            if (onProgress) {
              onProgress(completedCount, total, result);
            }
            if (onItemComplete) {
              onItemComplete(result);
            }
            return result;
          });
        
        activePromises.add(promise);
        allPromises.push(promise);
      }

      if (activePromises.size > 0) {
        await Promise.race(Array.from(activePromises));
      }
    }
  };

  await processQueue();
  await Promise.all(allPromises);

  return results;
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
 * @returns {Promise<string>} 压缩后的图片 DataURL
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
  } = options;

  // 检查是否在浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('浏览器端压缩功能仅在浏览器环境中可用');
  }

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
          // 如果 compressionLevel = 0 且不需要缩放，使用最高质量
          if (!needsScaling && blur === 0) {
            finalQuality = Math.max(quality, 0.98); // 至少 98% 质量，接近无损
          } else if (needsScaling) {
            // 如果只是缩放，使用高质量
            finalQuality = Math.max(quality, 0.92); // 至少 92% 质量
          }
        }

        // 转换为 DataURL
        const mimeType = outputFormat === 'webp' ? 'image/webp' : 
                        outputFormat === 'png' ? 'image/png' : 
                        'image/jpeg';

        const dataURL = canvas.toDataURL(mimeType, finalQuality);
        resolve(dataURL);
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
  
  for (const [name, handler] of Object.entries(CDN_HANDLERS)) {
    if (handler.test(url)) {
      return name;
    }
  }
  
  return null;
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
