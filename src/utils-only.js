// 只导出工具函数，不包含 React 组件
// 供 Vue、原生 JS 等非 React 项目使用

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

// 注意：不导出 React 组件（LazyImage 和 ProgressiveImage）
// 如果需要使用组件，请在 React 项目中使用，或使用工具函数自行实现

