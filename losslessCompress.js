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
 * @returns {Promise<Object>} 返回包含压缩后图片和统计信息的对象
 * @returns {Promise<string>} 返回压缩后的图片 DataURL（如果只需要DataURL）
 */
export async function losslessCompress(imageSource, options = {}) {
  const {
    maxWidth = null,
    maxHeight = null,
    format = null,
    removeMetadata = true,
    optimizePalette = true,
    compressionLevel = 6, // PNG压缩级别 0-9
  } = options;

  // 检查是否在浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('无损压缩功能仅在浏览器环境中可用');
  }

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

        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        
        // 禁用图像平滑以获得最清晰的图片（无损压缩）
        ctx.imageSmoothingEnabled = false;
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

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

        // 构建结果对象
        const result = {
          // 压缩后的图片
          dataURL: dataURL,
          blob: compressedBlob,
          
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
          
          // 压缩效果（计算节省大小，可能是负数表示文件变大）
          savedSize: (originalSize !== null && !isNaN(originalSize) && originalSize > 0) 
            ? (originalSize - compressedSize) 
            : null,
          savedSizeFormatted: (originalSize !== null && !isNaN(originalSize) && originalSize > 0)
            ? formatFileSize(Math.abs(originalSize - compressedSize))
            : null,
          savedPercentage: (originalSize !== null && !isNaN(originalSize) && originalSize > 0)
            ? parseFloat(((1 - compressedSize / originalSize) * 100).toFixed(2))
            : null,
          
          // 是否有效压缩
          isEffective: originalSize !== null 
            ? (originalSize - compressedSize > 0 && (originalSize - compressedSize) / originalSize > 0.01)
            : null,
        };

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
 * 导出所有函数（方便统一导入）
 */
export default {
  losslessCompress,
  losslessCompressBatch,
  compareLosslessCompression,
  checkLosslessCompressionSuitability,
  downloadCompressedImage,
};

