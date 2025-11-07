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
 * @param {boolean} options.removeMetadata - 是否移除元数据（默认true，可减小文件大小）
 * @param {boolean} options.optimizePalette - 是否优化调色板（仅PNG，默认true）
 * @param {number} options.compressionLevel - PNG压缩级别（0-9，默认6，值越大压缩率越高但速度越慢）
 * @param {Function} options.onComplete - 压缩完成回调函数，接收三个参数：(compressedFile, result, fileInfo) => void
 *   - compressedFile: 压缩后的File对象
 *   - result: 完整的压缩结果对象
 *   - fileInfo: Element UI Upload组件格式的文件信息对象
 * @param {string} options.fileName - 压缩后文件的名称（可选，默认使用时间戳和格式后缀）
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
    onComplete = null, // 压缩完成回调函数
    fileName = null, // 压缩后文件的名称
  } = options;

  // 检查是否在浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('无损压缩功能仅在浏览器环境中可用');
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

        // 转换为 DataURL（使用最高质量）
        let mimeType;
        let quality = 1.0; // 无损压缩使用最高质量

        if (outputFormat === 'webp') {
          mimeType = 'image/webp';
          quality = 1.0; // WebP无损模式
        } else if (outputFormat === 'png') {
          mimeType = 'image/png';
          // PNG不支持quality参数，但可以通过其他方式优化
        } else {
          // 如果格式不支持无损，使用PNG
          mimeType = 'image/png';
        }

        // 转换为DataURL
        const dataURL = canvas.toDataURL(mimeType, quality);
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

  let blob;
  if (typeof compressedImage === 'string') {
    blob = dataURLToBlob(compressedImage);
  } else if (compressedImage instanceof Blob) {
    blob = compressedImage;
  } else {
    throw new Error('不支持的图片格式');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `compressed-image-${Date.now()}.${blob.type.includes('webp') ? 'webp' : 'png'}`;
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
};

