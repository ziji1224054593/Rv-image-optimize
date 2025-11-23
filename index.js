// index.js
import { optimizeImageUrl } from './lib/imageOptimize.js';

const imageUrl = 'https://img.alicdn.com/imgextra/i1/O1CN01aO443I1lKv78s46Zw_!!6000000003037-2-tps-1080-1440.png';

const optimizedUrl = optimizeImageUrl(imageUrl, {
  width: 800,
  quality: 85,
  autoFormat: true
});
console.log('优化后的URL:', optimizedUrl);