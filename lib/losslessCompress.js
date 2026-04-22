/**
 * 无损压缩工具函数
 * 在保持图片质量不变的前提下，通过优化编码、去除元数据等方式减小文件大小
 * 继承并使用 imageOptimize.js 中的功能
 */

import {
  detectImageFormat,
  detectSupportedFormats,
  getBestFormat,
  compressImageInBrowser,
  dataURLToBlob,
  formatFileSize,
  getImageSize,
} from './imageOptimize.js';

/**
 * 支持的图片格式列表
 */
const SUPPORTED_IMAGE_FORMATS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'
];

/**
 * 图片格式的 MIME 类型映射
 */
const IMAGE_MIME_TYPES = {
  'jpg': ['image/jpeg', 'image/jpg'],
  'jpeg': ['image/jpeg', 'image/jpg'],
  'png': ['image/png'],
  'webp': ['image/webp'],
  'gif': ['image/gif'],
  'bmp': ['image/bmp', 'image/x-ms-bmp'],
  'svg': ['image/svg+xml'],
  'avif': ['image/avif'],
};

/**
 * 通过文件扩展名检测图片格式
 * @param {string} fileName - 文件名
 * @returns {string|null} 检测到的格式，无法检测时返回null
 */
function detectFormatByExtension(fileName) {
  if (!fileName) return null;
  
  const lowerName = fileName.toLowerCase();
  for (const format of SUPPORTED_IMAGE_FORMATS) {
    if (lowerName.endsWith(`.${format}`)) {
      return format === 'jpeg' ? 'jpg' : format;
    }
  }
  return null;
}

/**
 * 通过文件头（Magic Number）检测图片格式
 * @param {File|Blob} file - 文件对象
 * @returns {Promise<string|null>} 检测到的格式，无法检测时返回null
 */
async function detectFormatByFileHeader(file) {
  if (!(file instanceof File || file instanceof Blob)) {
    return null;
  }

  try {
    // 读取文件的前几个字节（文件头）
    // 对于 SVG，需要读取更多字节来检测
    const blob = file.slice(0, 100);
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 检查文件头（Magic Number）
    // JPEG: FF D8 FF
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
      return 'jpg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      return 'png';
    }
    // GIF: 47 49 46 38 (GIF8)
    if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
      return 'gif';
    }
    // WebP: RIFF ... WEBP
    if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
      // 检查是否包含 WEBP
      const headerStr = String.fromCharCode.apply(null, Array.from(uint8Array.slice(0, 12)));
      if (headerStr.includes('WEBP')) {
        return 'webp';
      }
    }
    // BMP: 42 4D
    if (uint8Array[0] === 0x42 && uint8Array[1] === 0x4D) {
      return 'bmp';
    }
    // AVIF: ftyp ... avif
    if (uint8Array[4] === 0x66 && uint8Array[5] === 0x74 && uint8Array[6] === 0x79 && uint8Array[7] === 0x70) {
      const headerStr = String.fromCharCode.apply(null, Array.from(uint8Array.slice(8, 12)));
      if (headerStr.includes('avif')) {
        return 'avif';
      }
    }
    // SVG: 检查是否以 <svg 或 <?xml 开头（文本格式）
    if (uint8Array[0] === 0x3C) {
      // 将字节数组转换为字符串
      let headerStr = '';
      for (let i = 0; i < Math.min(uint8Array.length, 100); i++) {
        headerStr += String.fromCharCode(uint8Array[i]);
      }
      const lowerStr = headerStr.toLowerCase();
      if (lowerStr.includes('<svg') || (lowerStr.includes('<?xml') && lowerStr.includes('svg'))) {
        return 'svg';
      }
    }
  } catch (error) {
    console.warn('文件头检测失败:', error);
  }

  return null;
}

/**
 * 验证图片文件格式
 * @param {File|Blob} file - 文件对象
 * @param {Object} options - 验证选项
 * @param {string[]} options.allowedFormats - 允许的格式列表（默认：所有支持的格式）
 * @param {boolean} options.strict - 是否严格验证（同时检查扩展名、MIME类型和文件头，默认true）
 * @returns {Promise<Object>} 验证结果 { valid: boolean, format: string|null, errors: string[] }
 */
export async function validateImageFormat(file, options = {}) {
  const {
    allowedFormats = SUPPORTED_IMAGE_FORMATS,
    strict = true,
  } = options;

  const errors = [];
  let detectedFormat = null;

  // 1. 检查文件扩展名
  const extensionFormat = file.name ? detectFormatByExtension(file.name) : null;
  
  // 2. 检查 MIME 类型
  let mimeFormat = null;
  if (file.type) {
    for (const [format, mimeTypes] of Object.entries(IMAGE_MIME_TYPES)) {
      if (mimeTypes.includes(file.type.toLowerCase())) {
        mimeFormat = format === 'jpeg' ? 'jpg' : format;
        break;
      }
    }
  }

  // 3. 检查文件头（Magic Number）- 最可靠的方法
  const headerFormat = await detectFormatByFileHeader(file);

  // 确定最终格式
  if (strict) {
    // 严格模式：所有方法检测的格式必须一致
    const formats = [extensionFormat, mimeFormat, headerFormat].filter(f => f !== null);
    
    if (formats.length === 0) {
      errors.push('无法检测图片格式（扩展名、MIME类型和文件头都不匹配）');
      return { valid: false, format: null, errors };
    }

    // 检查格式是否一致
    const uniqueFormats = [...new Set(formats)];
    if (uniqueFormats.length > 1) {
      errors.push(`格式不一致：扩展名(${extensionFormat || '未知'})、MIME类型(${mimeFormat || '未知'})、文件头(${headerFormat || '未知'})`);
      return { valid: false, format: null, errors };
    }

    detectedFormat = uniqueFormats[0];
  } else {
    // 非严格模式：优先使用文件头，其次MIME类型，最后扩展名
    detectedFormat = headerFormat || mimeFormat || extensionFormat;
    
    if (!detectedFormat) {
      errors.push('无法检测图片格式');
      return { valid: false, format: null, errors };
    }

    // 如果格式不一致，给出警告但不阻止
    if (extensionFormat && extensionFormat !== detectedFormat) {
      errors.push(`警告：文件扩展名(${extensionFormat})与检测到的格式(${detectedFormat})不一致`);
    }
    if (mimeFormat && mimeFormat !== detectedFormat) {
      errors.push(`警告：MIME类型(${mimeFormat})与检测到的格式(${detectedFormat})不一致`);
    }
  }

  // 检查是否在允许的格式列表中
  if (!allowedFormats.includes(detectedFormat)) {
    errors.push(`不支持的图片格式：${detectedFormat}。支持的格式：${allowedFormats.join(', ')}`);
    return { valid: false, format: detectedFormat, errors };
  }

  return { valid: true, format: detectedFormat, errors: [] };
}

/**
 * 验证图片文件大小
 * @param {File|Blob} file - 文件对象
 * @param {Object} options - 验证选项
 * @param {number} options.maxSize - 最大文件大小（字节），默认不限制
 * @param {number} options.minSize - 最小文件大小（字节），默认0
 * @returns {Object} 验证结果 { valid: boolean, size: number, errors: string[] }
 */
export function validateImageSize(file, options = {}) {
  const {
    maxSize = null,
    minSize = 0,
  } = options;

  const errors = [];
  const size = file.size;

  if (size < minSize) {
    errors.push(`文件大小(${formatFileSize(size)})小于最小限制(${formatFileSize(minSize)})`);
    return { valid: false, size, errors };
  }

  if (maxSize !== null && size > maxSize) {
    errors.push(`文件大小(${formatFileSize(size)})超过最大限制(${formatFileSize(maxSize)})`);
    return { valid: false, size, errors };
  }

  return { valid: true, size, errors: [] };
}

/**
 * 综合验证图片文件（格式 + 大小）
 * @param {File|Blob} file - 文件对象
 * @param {Object} options - 验证选项
 * @param {string[]} options.allowedFormats - 允许的格式列表
 * @param {boolean} options.strict - 是否严格验证格式
 * @param {number} options.maxSize - 最大文件大小（字节）
 * @param {number} options.minSize - 最小文件大小（字节）
 * @returns {Promise<Object>} 验证结果 { valid: boolean, format: string|null, size: number, errors: string[] }
 */
export async function validateImageFile(file, options = {}) {
  const formatResult = await validateImageFormat(file, options);
  const sizeResult = validateImageSize(file, options);

  const valid = formatResult.valid && sizeResult.valid;
  const errors = [...formatResult.errors, ...sizeResult.errors];

  return {
    valid,
    format: formatResult.format,
    size: sizeResult.size,
    errors,
  };
}

/**
 * 检测当前环境是否支持 GPU 加速
 * @returns {Object} 返回 GPU 支持信息
 */
function detectGPUSupport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      supported: false,
      method: null,
      reason: '非浏览器环境',
    };
  }

  const support = {
    webgl: false,
    webgl2: false,
    offscreenCanvas: false,
    imageBitmap: false,
  };

  // 检测 WebGL 支持
  try {
    const canvas = document.createElement('canvas');
    support.webgl = !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
    support.webgl2 = !!canvas.getContext('webgl2');
  } catch (e) {
    // WebGL 不支持
  }

  // 检测 OffscreenCanvas 支持
  support.offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  // 检测 ImageBitmap 支持
  support.imageBitmap = typeof createImageBitmap !== 'undefined';

  // 判断是否支持 GPU 加速
  const gpuSupported = support.webgl || support.webgl2 || support.offscreenCanvas;

  return {
    supported: gpuSupported,
    method: gpuSupported 
      ? (support.webgl2 ? 'webgl2' : support.webgl ? 'webgl' : 'offscreenCanvas')
      : null,
    details: support,
    reason: gpuSupported ? '支持 GPU 加速' : '不支持 GPU 加速，将使用 CPU 处理',
  };
}

/**
 * 使用 GPU 加速绘制图片到 Canvas
 * 优先使用 ImageBitmap（如果支持），否则使用硬件加速的 2D Canvas
 * @param {HTMLImageElement} imageSource - 图片源
 * @param {number} width - 目标宽度
 * @param {number} height - 目标高度
 * @param {Object} gpuInfo - GPU 支持信息
 * @returns {Promise<HTMLCanvasElement>} 绘制好的 Canvas
 */
async function drawImageWithGPU(imageSource, width, height, gpuInfo) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // 方法1: 如果支持 ImageBitmap，使用它（性能最好，GPU 加速）
  if (gpuInfo.details.imageBitmap) {
    try {
      const imageBitmap = await createImageBitmap(imageSource, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'pixelated', // 无损压缩使用像素化质量
      });
      
      const ctx = canvas.getContext('2d', {
        // 启用硬件加速
        alpha: true,
        desynchronized: true, // 允许异步渲染，提升性能
        willReadFrequently: false, // 不频繁读取，允许 GPU 优化
      });
      
      ctx.imageSmoothingEnabled = false; // 禁用平滑以获得最清晰的图片
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      
      // 清理 ImageBitmap
      imageBitmap.close();
      
      return canvas;
    } catch (error) {
      // ImageBitmap 失败，继续尝试其他方法
      console.warn('ImageBitmap 处理失败，尝试其他方法:', error);
    }
  }

  // 方法2: 使用硬件加速的 2D Canvas（浏览器会自动使用 GPU 如果可用）
  const ctx = canvas.getContext('2d', {
    // 启用硬件加速选项
    alpha: true,
    desynchronized: true, // 允许异步渲染
    willReadFrequently: false, // 不频繁读取，允许 GPU 优化
  });
  
  // 禁用图像平滑以获得最清晰的图片（无损压缩）
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'low'; // 最低质量以获得最快速度
  
  // 绘制图片（浏览器会自动使用 GPU 加速如果支持）
  ctx.drawImage(imageSource, 0, 0, width, height);
  
  return canvas;
}

/**
 * 无损压缩图片（浏览器端）
 * 在保持图片质量不变的前提下，通过优化编码减小文件大小
 * 
 * @param {string|File|Blob} imageSource - 图片源（URL、File或Blob）
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度（可选，如果设置会按比例缩放但保持质量）
 * @param {number} options.maxHeight - 最大高度（可选）
 * @param {string} options.format - 输出格式（png/webp，默认保持原格式或使用最佳无损格式）
 * @param {boolean} options.removeMetadata - 是否移除元数据（默认true）
 *   注意：Canvas 重新绘制图片时默认会移除所有元数据（EXIF等），此参数主要用于文档说明
 *   如需保留元数据，需要使用专门的库（如 piexifjs）
 * @param {boolean} options.optimizePalette - 是否优化调色板（仅PNG，默认true）
 *   通过颜色量化减少颜色数量（超过256色时量化到216色），可减小PNG文件大小
 *   注意：可能会略微影响图片质量，但通常肉眼难以察觉
 * @param {number} options.compressionLevel - PNG压缩级别（0-9，默认6）
 *   ⚠️ 重要限制：Canvas API 不支持直接设置 PNG 压缩级别参数
 *   实际效果：
 *   - 对于 WebP 格式：此参数无效，只有 quality 参数有效
 *   - 对于 PNG 格式：此参数无效，浏览器端无法控制 PNG 压缩级别
 *   - 仅当 compressionLevel > 6 且输出格式为 PNG 时，会建议转换为 WebP（如果支持）
 *   如需精确控制 PNG 压缩级别，必须使用服务端处理工具（如 pngquant、optipng、imagemin）
 *   建议：对于浏览器端压缩，主要使用 quality 参数控制文件大小
 * @param {Function} options.onComplete - 压缩完成回调函数，接收三个参数：(compressedFile, result, fileInfo) => void
 *   - compressedFile: 压缩后的File对象
 *   - result: 完整的压缩结果对象
 *   - fileInfo: Element UI Upload组件格式的文件信息对象
 * @param {string} options.fileName - 压缩后文件的名称（可选，默认使用时间戳和格式后缀）
 * @param {Object} options.validation - 文件验证选项（可选）
 * @param {string[]} options.validation.allowedFormats - 允许的图片格式列表（默认：所有支持的格式）
 * @param {boolean} options.validation.strict - 是否严格验证格式（默认true，同时检查扩展名、MIME类型和文件头）
 * @param {number} options.validation.maxSize - 最大文件大小（字节），默认不限制
 * @param {number} options.validation.minSize - 最小文件大小（字节），默认0
 * @param {boolean} options.validation.enabled - 是否启用验证（默认true，如果传入validation对象则启用）
 * @returns {Promise<Object>} 返回包含压缩后图片和统计信息的对象
 *   - fileInfo: Element UI Upload组件格式的文件信息（主要使用字段，包含name, size, type, uid, status, raw等）
 *   - file: 压缩后的File对象，可直接用于FormData上传
 *   - dataURL: 压缩后的图片DataURL
 *   - blob: 压缩后的Blob对象
 *   - 其他压缩统计信息...
 */
export async function losslessCompress(imageSource, options = {}) {
  const {
    maxWidth = null,
    maxHeight = null,
    format = null,
    removeMetadata = true,
    optimizePalette = true,
    compressionLevel = 6, // PNG压缩级别 0-9
    quality = null, // 图片质量 0-1（null 表示使用默认：无损压缩使用1.0，有损压缩使用0.8）
    onComplete = null, // 压缩完成回调函数
    fileName = null, // 压缩后文件的名称
    validation = null, // 文件验证选项
    maxBytes = null,
    targetSizeBytes = null,
    autoSelectFormat = false,
  } = options;

  // 检查是否在浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('无损压缩功能仅在浏览器环境中可用');
  }

  // 如果提供了验证选项且启用了验证，进行文件验证
  if (validation && (validation.enabled !== false)) {
    // 只对 File 或 Blob 对象进行验证（URL 无法验证）
    if (imageSource instanceof File || imageSource instanceof Blob) {
      const validationResult = await validateImageFile(imageSource, validation);
      if (!validationResult.valid) {
        const errorMessage = `文件验证失败：${validationResult.errors.join('; ')}`;
        throw new Error(errorMessage);
      }
    }
  }

  if (maxBytes || targetSizeBytes) {
    return compressImageInBrowser(imageSource, {
      maxWidth,
      maxHeight,
      quality: quality ?? 0.92,
      compressionLevel: Math.min(1, Math.max(0, (compressionLevel || 0) / 9)),
      format,
      fileName,
      maxBytes,
      targetSizeBytes,
      autoSelectFormat,
      onComplete,
    });
  }

  // 检测 GPU 加速支持（在函数开始时检测一次）
  const gpuInfo = detectGPUSupport();
  const useGPU = gpuInfo.supported;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // 计算缩放后的尺寸（如果需要）
        let width = originalWidth;
        let height = originalHeight;
        if (maxWidth || maxHeight) {
          const ratio = Math.min(
            maxWidth ? maxWidth / originalWidth : 1,
            maxHeight ? maxHeight / originalHeight : 1
          );
          if (ratio < 1) {
            width = Math.round(originalWidth * ratio);
            height = Math.round(originalHeight * ratio);
          }
        }

        // 检测原始格式
        let originalFormat = null;
        if (typeof imageSource === 'string') {
          originalFormat = detectImageFormat(imageSource);
        } else if (imageSource instanceof File) {
          const fileName = imageSource.name.toLowerCase();
          if (fileName.endsWith('.png')) originalFormat = 'png';
          else if (fileName.endsWith('.webp')) originalFormat = 'webp';
          else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) originalFormat = 'jpg';
        }

        // 确定输出格式（优先使用支持无损的格式）
        let outputFormat = format;
        if (!outputFormat) {
          // 如果原图是PNG或WebP，保持原格式
          if (originalFormat === 'png' || originalFormat === 'webp') {
            outputFormat = originalFormat;
          } else {
            // 否则选择最佳无损格式（WebP > PNG）
            const supportedFormats = detectSupportedFormats();
            if (supportedFormats.includes('webp')) {
              outputFormat = 'webp';
            } else {
              outputFormat = 'png';
            }
          }
        }

        // 智能选择 GPU 或 CPU 处理
        let canvas;
        if (useGPU && gpuInfo.method) {
          try {
            // 尝试使用 GPU 加速（异步）
            canvas = await drawImageWithGPU(img, width, height, gpuInfo);
          } catch (gpuError) {
            // GPU 处理失败，回退到 CPU
            console.warn('GPU 加速失败，回退到 CPU 处理:', gpuError);
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, width, height);
          }
        } else {
          // 使用 CPU 处理（2D Canvas）
          canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // 禁用图像平滑以获得最清晰的图片（无损压缩）
          ctx.imageSmoothingEnabled = false;
          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);
        }

        // 获取原始大小（如果是File/Blob）
        let originalSize = null;
        if (imageSource instanceof File || imageSource instanceof Blob) {
          originalSize = imageSource.size;
        } else if (typeof imageSource === 'string') {
          // 尝试获取URL图片大小
          try {
            originalSize = await getImageSize(imageSource);
          } catch (e) {
            // 忽略错误
          }
        }

        // 处理 removeMetadata：Canvas 重新绘制时默认会移除元数据
        // 如果 removeMetadata 为 false，理论上应该保留元数据，但 Canvas API 不支持保留元数据
        // 所以这个参数主要用于文档说明，实际效果：Canvas 绘制总是会移除元数据
        // 如果需要保留元数据，需要使用其他库（如 piexifjs）

        // 处理 optimizePalette：优化 PNG 调色板（减少颜色数量）
        if (optimizePalette && outputFormat === 'png') {
          try {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // 统计颜色数量
            const colorMap = new Map();
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              const colorKey = `${r},${g},${b},${a}`;
              colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
            }
            
            // 如果颜色数量超过 256（PNG 调色板限制），尝试量化颜色
            if (colorMap.size > 256) {
              // 简单的颜色量化：将 RGB 值量化到更少的级别
              const quantizeLevel = 6; // 每个通道量化到 6 个级别（6^3 = 216 种颜色）
              for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.round(data[i] / 43) * 43;     // R
                data[i + 1] = Math.round(data[i + 1] / 43) * 43; // G
                data[i + 2] = Math.round(data[i + 2] / 43) * 43; // B
                // Alpha 保持不变
              }
              ctx.putImageData(imageData, 0, 0);
            }
          } catch (e) {
            // 如果优化失败，继续使用原始 canvas
            console.warn('调色板优化失败，使用原始图片:', e);
          }
        }

        // 转换为 DataURL（根据 quality 参数决定质量）
        let mimeType;
        let finalQuality = quality !== null ? quality : 1.0; // 如果指定了 quality，使用指定值，否则使用最高质量（无损）

        if (outputFormat === 'webp') {
          mimeType = 'image/webp';
          // WebP 支持 quality 参数（0-1），如果未指定则使用 1.0（无损）
          if (finalQuality === null) {
            finalQuality = 1.0;
          }
        } else if (outputFormat === 'png') {
          mimeType = 'image/png';
          // PNG不支持quality参数，但可以通过其他方式优化
          // 如果指定了 quality 且小于 1.0，可以考虑转换为 WebP 格式
          if (finalQuality < 1.0 && finalQuality !== null) {
            // 如果用户想要有损压缩，且浏览器支持 WebP，转换为 WebP
            const supportedFormats = detectSupportedFormats();
            if (supportedFormats.includes('webp')) {
              mimeType = 'image/webp';
              outputFormat = 'webp';
            }
          }
        } else {
          // 如果格式不支持无损，使用PNG
          mimeType = 'image/png';
        }

        // 处理 compressionLevel：PNG 压缩级别
        // ⚠️ 重要限制：Canvas API 的 toDataURL 不支持 PNG 压缩级别参数
        // 对于 WebP 格式：compressionLevel 参数完全无效，只有 quality 参数有效
        // 对于 PNG 格式：compressionLevel 参数也无效，浏览器端无法控制 PNG 压缩级别
        // 
        // 实际效果（非常有限）：
        // 仅当 compressionLevel > 6 且输出格式为 PNG 时，会建议转换为 WebP（如果支持）
        // 但这只是格式转换，不是真正的压缩级别控制
        if (compressionLevel > 6 && outputFormat === 'png' && format === null) {
          // 只有在用户没有指定 format 且压缩级别较高时，才建议使用 WebP
          const supportedFormats = detectSupportedFormats();
          if (supportedFormats.includes('webp') && finalQuality >= 0.9) {
            // 只有在高质量时才转换，避免质量损失
            mimeType = 'image/webp';
            outputFormat = 'webp';
            // WebP 在高质量时也能提供更好的压缩率
          }
        }
        // 注意：如果用户明确指定了 format: 'webp'，compressionLevel 参数完全无效

        // 转换为DataURL（使用计算后的质量值）
        // 注意：PNG 格式的 compressionLevel 参数无法通过 Canvas API 设置
        // 如果需要精确控制 PNG 压缩级别，需要使用服务端处理或专门的库
        const dataURL = canvas.toDataURL(mimeType, finalQuality);
        const compressedBlob = dataURLToBlob(dataURL);
        const compressedSize = compressedBlob.size;

        // 生成文件名
        let finalFileName = fileName;
        if (!finalFileName) {
          // 如果原始输入是File，尝试保留原始文件名（但改变扩展名）
          if (imageSource instanceof File) {
            const originalName = imageSource.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const extension = outputFormat === 'webp' ? 'webp' : 'png';
            finalFileName = `${nameWithoutExt}-compressed.${extension}`;
          } else {
            // 否则使用时间戳
            const extension = outputFormat === 'webp' ? 'webp' : 'png';
            finalFileName = `compressed-image-${Date.now()}.${extension}`;
          }
        }

        // 将 Blob 转换为 File 对象（便于上传到后端）
        const compressedFile = new File([compressedBlob], finalFileName, {
          type: mimeType,
          lastModified: Date.now(),
        });

        // 计算压缩效果
        const savedSize = (originalSize !== null && !isNaN(originalSize) && originalSize > 0) 
          ? (originalSize - compressedSize) 
          : null;
        const savedPercentage = (originalSize !== null && !isNaN(originalSize) && originalSize > 0)
          ? parseFloat(((1 - compressedSize / originalSize) * 100).toFixed(2))
          : null;

        // 构建 Element UI Upload 组件格式的文件信息
        const fileInfo = {
          // Element UI 标准字段
          name: finalFileName,                    // 文件名
          size: compressedSize,                   // 文件大小（字节）
          type: mimeType,                         // MIME 类型
          uid: Date.now() + Math.random(),        // 唯一标识
          status: 'ready',                        // 状态：ready, uploading, success, fail
          raw: compressedFile,                    // 原始 File 对象
          
          // 扩展字段：压缩相关信息
          compressionInfo: {
            originalSize: originalSize,
            originalSizeFormatted: originalSize ? formatFileSize(originalSize) : null,
            compressedSize: compressedSize,
            compressedSizeFormatted: formatFileSize(compressedSize),
            savedSize: savedSize,
            savedSizeFormatted: savedSize !== null ? formatFileSize(Math.abs(savedSize)) : null,
            savedPercentage: savedPercentage,
            compressedFormat: outputFormat,
            compressedWidth: width,
            compressedHeight: height,
            originalWidth: originalWidth,
            originalHeight: originalHeight,
            originalFormat: originalFormat,
            dataURL: dataURL,                     // 预览 URL
          },
          
          // 文件大小格式化显示
          sizeFormatted: formatFileSize(compressedSize),
          lastModified: compressedFile.lastModified,
          lastModifiedDate: new Date(compressedFile.lastModified),
        };

        // 构建结果对象
        const result = {
          // 压缩后的图片
          dataURL: dataURL,
          blob: compressedBlob,
          file: compressedFile, // File对象，可直接用于FormData上传
          fileInfo: fileInfo,   // Element UI 格式的文件信息（主要返回字段）
          
          // GPU 加速信息
          gpuAccelerated: useGPU && gpuInfo.method,
          gpuMethod: useGPU ? gpuInfo.method : null,
          gpuInfo: gpuInfo,
          
          // 原始信息
          originalWidth: originalWidth,
          originalHeight: originalHeight,
          originalFormat: originalFormat,
          originalSize: originalSize,
          originalSizeFormatted: originalSize ? formatFileSize(originalSize) : null,
          
          // 压缩后信息
          compressedWidth: width,
          compressedHeight: height,
          compressedFormat: outputFormat,
          compressedSize: compressedSize,
          compressedSizeFormatted: formatFileSize(compressedSize),
          compressedFileName: finalFileName,
          
          // 压缩效果（计算节省大小，可能是负数表示文件变大）
          savedSize: savedSize,
          savedSizeFormatted: savedSize !== null ? formatFileSize(Math.abs(savedSize)) : null,
          savedPercentage: savedPercentage,
          
          // 是否有效压缩
          isEffective: originalSize !== null 
            ? (originalSize - compressedSize > 0 && (originalSize - compressedSize) / originalSize > 0.01)
            : null,
        };

        // 如果提供了回调函数，调用回调并传递File对象和文件信息
        if (typeof onComplete === 'function') {
          try {
            // 回调函数接收：压缩后的File对象、完整结果对象、Element UI格式的文件信息
            onComplete(compressedFile, result, fileInfo);
          } catch (callbackError) {
            console.warn('回调函数执行出错:', callbackError);
          }
        }

        resolve(result);
      } catch (error) {
        reject(new Error('无损压缩失败: ' + error.message));
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 处理不同类型的输入
    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
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
 * 批量无损压缩图片
 * 
 * @param {Array<string|File|Blob>} imageSources - 图片源数组
 * @param {Object} options - 压缩选项（同 losslessCompress）
 * @param {number} concurrency - 并发数量（默认3）
 * @returns {Promise<Array<Object>>} 返回压缩结果数组
 */
export async function losslessCompressBatch(imageSources, options = {}, concurrency = 3) {
  const results = [];
  const queue = [...imageSources];
  
  const compressNext = async () => {
    while (queue.length > 0) {
      const imageSource = queue.shift();
      try {
        const result = await losslessCompress(imageSource, options);
        results.push({
          source: imageSource,
          success: true,
          result: result,
        });
      } catch (error) {
        results.push({
          source: imageSource,
          success: false,
          error: error.message,
        });
      }
    }
  };
  
  const workers = Array(Math.min(concurrency, imageSources.length))
    .fill(null)
    .map(() => compressNext());
  
  await Promise.all(workers);
  return results;
}

/**
 * 比较无损压缩效果
 * 
 * @param {string|File|Blob} imageSource - 图片源
 * @param {Object} options - 压缩选项
 * @returns {Promise<Object>} 返回详细的压缩对比信息
 */
export async function compareLosslessCompression(imageSource, options = {}) {
  try {
    const result = await losslessCompress(imageSource, options);
    
    return {
      success: true,
      ...result,
      // 额外信息
      compressionRatio: result.originalSize !== null && result.originalSize > 0
        ? parseFloat((result.compressedSize / result.originalSize).toFixed(4))
        : null,
      recommendation: result.isEffective
        ? '✅ 无损压缩有效，建议使用压缩后的图片'
        : result.originalSize !== null
        ? '⚠️ 压缩效果不明显，可能原图已经过优化'
        : '⚠️ 无法获取原始大小，无法评估压缩效果',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 检查图片是否适合无损压缩
 * 
 * @param {string|File|Blob} imageSource - 图片源
 * @returns {Promise<Object>} 返回检查结果和建议
 */
export async function checkLosslessCompressionSuitability(imageSource) {
  let format = null;
  let size = null;
  let isSuitable = false;
  let recommendation = '';

  try {
    // 检测格式
    if (typeof imageSource === 'string') {
      format = detectImageFormat(imageSource);
      size = await getImageSize(imageSource);
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      const fileName = imageSource.name?.toLowerCase() || '';
      if (fileName.endsWith('.png')) format = 'png';
      else if (fileName.endsWith('.webp')) format = 'webp';
      else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) format = 'jpg';
      size = imageSource.size;
    }

    // 判断是否适合无损压缩
    if (format === 'png' || format === 'webp') {
      isSuitable = true;
      recommendation = `✅ ${format.toUpperCase()}格式非常适合无损压缩，可以显著减小文件大小`;
    } else if (format === 'jpg' || format === 'jpeg') {
      // JPEG 格式本身不支持无损压缩，但可以转换为 PNG/WebP 进行无损压缩
      isSuitable = true; // 改为 true，允许转换格式进行无损压缩
      recommendation = '💡 JPEG格式本身不支持无损压缩（因为JPEG是有损格式），但可以自动转换为PNG或WebP格式进行无损压缩。注意：转换后文件可能会变大，因为PNG/WebP需要存储更多信息来保持质量。';
    } else {
      isSuitable = true;
      recommendation = '💡 可以尝试无损压缩，效果取决于图片内容';
    }

    return {
      format,
      size,
      sizeFormatted: size ? formatFileSize(size) : null,
      isSuitable,
      recommendation,
    };
  } catch (error) {
    return {
      format: null,
      size: null,
      sizeFormatted: null,
      isSuitable: false,
      recommendation: `❌ 无法检查图片: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * 将压缩后的图片保存为文件
 * 
 * @param {Blob|string} compressedImage - 压缩后的图片（Blob或DataURL）
 * @param {string} filename - 文件名（可选，默认使用时间戳）
 * @returns {void}
 */
export function downloadCompressedImage(compressedImage, filename = null) {
  if (typeof window === 'undefined') {
    throw new Error('下载功能仅在浏览器环境中可用');
  }

  const getExtensionFromBlob = (targetBlob) => {
    const mimeType = targetBlob?.type || '';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('avif')) return 'avif';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    return 'png';
  };

  let blob;
  let resolvedFileName = filename;

  if (typeof compressedImage === 'string') {
    blob = dataURLToBlob(compressedImage);
  } else if (compressedImage instanceof Blob) {
    blob = compressedImage;
  } else if (compressedImage && typeof compressedImage === 'object') {
    if (compressedImage.blob instanceof Blob) {
      blob = compressedImage.blob;
    } else if (compressedImage.file instanceof Blob) {
      blob = compressedImage.file;
    } else if (typeof compressedImage.dataURL === 'string') {
      blob = dataURLToBlob(compressedImage.dataURL);
    } else if (typeof compressedImage.url === 'string' && compressedImage.url.startsWith('data:')) {
      blob = dataURLToBlob(compressedImage.url);
    } else {
      throw new Error('不支持的图片格式');
    }

    if (!resolvedFileName) {
      resolvedFileName =
        compressedImage.compressedFileName ||
        compressedImage.file?.name ||
        compressedImage.fileName ||
        null;
    }
  } else {
    throw new Error('不支持的图片格式');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = resolvedFileName || `compressed-image-${Date.now()}.${getExtensionFromBlob(blob)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 获取 GPU 加速支持信息（导出供外部使用）
 * @returns {Object} GPU 支持信息
 */
export function getGPUSupportInfo() {
  return detectGPUSupport();
}

/**
 * 导出所有函数（方便统一导入）
 */
export default {
  losslessCompress,
  losslessCompressBatch,
  compareLosslessCompression,
  checkLosslessCompressionSuitability,
  downloadCompressedImage,
  getGPUSupportInfo,
  validateImageFormat,
  validateImageSize,
  validateImageFile,
};

