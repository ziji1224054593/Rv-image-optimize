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
  getImageSize,
  formatFileSize,
  compareImageSizes,
  detectCDN,
  compressImageInBrowser,
  dataURLToBlob,
} from '../imageOptimize.js';

// 导出 LazyImage 组件
export { default as LazyImage } from './LazyImage.jsx';
export { default } from './LazyImage.jsx';

// 导入样式（需要在构建时处理）
import './LazyImage.css';
