// 导出图片优化工具函数
export {
  optimizeImageUrl,
  detectSupportedFormats,
  getBestFormat,
  detectImageFormat,
  generateSrcset,
  generateSizes,
  generateResponsiveImage,
  getOptimizedCoverUrl,
  preloadImage,
  preloadImages,
  loadImagesProgressively,
  loadImagesBatch,
  generateBlurPlaceholderUrl,
  loadImageProgressive,
  loadImagesProgressiveBatch,
  getImageSize,
  formatFileSize,
  compareImageSizes,
  detectCDN,
  compressImageInBrowser,
  dataURLToBlob,
} from '../lib/imageOptimize.js';

// 导出 LazyImage 组件
export { default as LazyImage } from './LazyImage.jsx';
export { default } from './LazyImage.jsx';

// 导出 ProgressiveImage 组件
export { default as ProgressiveImage } from './ProgressiveImage.jsx';

// 导出通用缓存相关函数
export {
  setCache,
  getCache,
  deleteCache,
  cleanExpiredCache,
  getCacheStats,
  hasCache,
  getStoreNames,
  deleteDatabase,
  getAllDatabaseNames,
  getStorageQuota,
  checkStorageQuota,
  getAllDatabasesUsage,
  // 导出默认配置常量
  DEFAULT_DB_NAME,
  DEFAULT_STORE_NAME_GENERAL,
  DEFAULT_CACHE_EXPIRE_HOURS,
  // 导出图片加载辅助函数（使用通用缓存 API）
  loadImageWithCache,
  loadImageProgressiveWithCache,
} from '../lib/imageCache.js';

// 导入样式（需要在构建时处理）
import './LazyImage.css';
