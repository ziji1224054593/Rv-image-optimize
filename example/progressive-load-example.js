/**
 * 渐进式图片加载功能使用示例
 * 展示如何使用 loadImagesProgressively 函数实现高并发、错误隔离的图片加载
 */

import { loadImagesProgressively, loadImagesBatch, optimizeImageUrl } from '../imageOptimize.js';

// ========== 示例 1: 基础用法 - 简单URL数组 ==========
export async function example1_BasicUsage() {
  console.log('=== 示例1: 基础用法 ===');
  
  const imageUrls = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    // ... 可以添加100张图片
  ];

  const results = await loadImagesProgressively(imageUrls, {
    concurrency: 10, // 同时加载10张图片
    timeout: 30000,   // 30秒超时
  });

  // 处理结果
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ 图片 ${index + 1} 加载成功: ${result.url}`);
    } else {
      console.error(`❌ 图片 ${index + 1} 加载失败: ${result.url}`, result.error);
    }
  });

  // 统计
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`总计: ${results.length} 张, 成功: ${successCount} 张, 失败: ${failCount} 张`);
}

// ========== 示例 2: 带优先级的加载 ==========
export async function example2_WithPriority() {
  console.log('=== 示例2: 带优先级的加载 ===');
  
  // 优先级高的图片会先加载（priority值越大优先级越高）
  const imageList = [
    { url: 'https://example.com/hero-image.jpg', priority: 10 }, // 最高优先级
    { url: 'https://example.com/banner.jpg', priority: 8 },
    { url: 'https://example.com/thumbnail1.jpg', priority: 5 },
    { url: 'https://example.com/thumbnail2.jpg', priority: 5 },
    { url: 'https://example.com/thumbnail3.jpg', priority: 5 },
    // ... 其他图片，默认优先级为0
    'https://example.com/other1.jpg',
    'https://example.com/other2.jpg',
  ];

  const results = await loadImagesProgressively(imageList, {
    concurrency: 10,
    priority: true, // 启用优先级排序
  });

  console.log('加载完成，结果按原始顺序返回');
}

// ========== 示例 3: 带进度回调 ==========
export async function example3_WithProgress() {
  console.log('=== 示例3: 带进度回调 ===');
  
  const imageUrls = Array.from({ length: 100 }, (_, i) => 
    `https://example.com/image${i + 1}.jpg`
  );

  const results = await loadImagesProgressively(imageUrls, {
    concurrency: 15, // 高并发
    onProgress: (current, total, result) => {
      const percentage = ((current / total) * 100).toFixed(1);
      console.log(`进度: ${current}/${total} (${percentage}%) - ${result.success ? '✅' : '❌'} ${result.url}`);
      
      // 可以更新UI进度条
      // updateProgressBar(percentage);
    },
    onItemComplete: (result) => {
      // 每张图片加载完成时触发
      if (result.success) {
        console.log(`图片加载完成: ${result.url}`);
        // 可以立即更新UI显示这张图片
      } else {
        console.warn(`图片加载失败: ${result.url}`, result.error?.message);
        // 可以显示错误占位符
      }
    },
  });
}

// ========== 示例 4: 错误处理和重试 ==========
export async function example4_ErrorHandling() {
  console.log('=== 示例4: 错误处理和重试 ===');
  
  const imageUrls = [
    'https://example.com/image1.jpg',
    'https://invalid-url-that-will-fail.com/image.jpg', // 会失败的URL
    'https://example.com/image3.jpg',
  ];

  const results = await loadImagesProgressively(imageUrls, {
    concurrency: 10,
    retryOnError: true,  // 启用重试
    maxRetries: 2,       // 最多重试2次
    timeout: 10000,      // 10秒超时
    onItemComplete: (result) => {
      if (!result.success) {
        console.error(`加载失败 (重试${result.retries}次):`, {
          url: result.url,
          error: result.error?.message,
          index: result.index,
        });
      }
    },
  });

  // 独立处理每张图片的错误
  results.forEach((result) => {
    if (!result.success) {
      // 每张图片的错误信息都是独立的，不会影响其他图片
      console.error(`图片 ${result.index} 错误:`, result.error);
      // 可以显示错误占位符或使用备用图片
    }
  });
}

// ========== 示例 5: 结合图片优化 ==========
export async function example5_WithOptimization() {
  console.log('=== 示例5: 结合图片优化 ===');
  
  const originalUrls = [
    'https://example.com/large-image1.jpg',
    'https://example.com/large-image2.jpg',
    // ... 更多图片
  ];

  // 先优化URL
  const optimizedUrls = originalUrls.map(url => 
    optimizeImageUrl(url, {
      width: 800,
      quality: 75,
      format: 'webp',
    })
  );

  // 然后渐进式加载优化后的图片
  const results = await loadImagesProgressively(optimizedUrls, {
    concurrency: 10,
    onProgress: (current, total) => {
      console.log(`加载进度: ${current}/${total}`);
    },
  });
}

// ========== 示例 6: 实际应用场景 - 图片画廊 ==========
export async function example6_ImageGallery() {
  console.log('=== 示例6: 图片画廊应用 ===');
  
  // 模拟100张图片
  const galleryImages = Array.from({ length: 100 }, (_, i) => ({
    url: `https://example.com/gallery/image${i + 1}.jpg`,
    priority: i < 20 ? 10 : (i < 50 ? 5 : 0), // 前20张优先级最高，21-50中等，其余低优先级
    thumbnail: `https://example.com/gallery/thumb${i + 1}.jpg`,
  }));

  // 先加载缩略图（高优先级）
  const thumbnailUrls = galleryImages.map(img => img.thumbnail);
  const thumbnailResults = await loadImagesProgressively(thumbnailUrls, {
    concurrency: 20, // 缩略图可以更高并发
    priority: true,
    onItemComplete: (result) => {
      if (result.success) {
        // 立即显示缩略图
        console.log(`缩略图加载完成: ${result.url}`);
        // updateThumbnailInUI(result.index, result.url);
      }
    },
  });

  // 然后按需加载大图（用户点击或滚动到可见区域时）
  // 这里只是示例，实际应用中可以在用户交互时触发
}

// ========== 示例 7: 批量加载（简化版） ==========
export async function example7_BatchLoad() {
  console.log('=== 示例7: 批量加载 ===');
  
  const imageUrls = Array.from({ length: 50 }, (_, i) => 
    `https://example.com/image${i + 1}.jpg`
  );

  // 使用简化版的批量加载函数
  const results = await loadImagesBatch(imageUrls, {
    concurrency: 15,
    timeout: 20000,
  });

  // 统计成功和失败的数量
  const stats = {
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    errors: results.filter(r => !r.success).map(r => ({
      url: r.url,
      error: r.error?.message,
    })),
  };

  console.log('加载统计:', stats);
  return stats;
}

// ========== 示例 8: 网络差的情况 - 低并发 + 重试 ==========
export async function example8_PoorNetwork() {
  console.log('=== 示例8: 网络差的情况 ===');
  
  const imageUrls = Array.from({ length: 100 }, (_, i) => 
    `https://example.com/image${i + 1}.jpg`
  );

  // 针对网络差的情况优化配置
  const results = await loadImagesProgressively(imageUrls, {
    concurrency: 5,        // 降低并发，避免网络拥塞
    timeout: 60000,        // 增加超时时间到60秒
    retryOnError: true,    // 启用重试
    maxRetries: 3,         // 最多重试3次
    onProgress: (current, total) => {
      // 显示加载进度，让用户知道正在加载
      console.log(`网络较慢，正在加载: ${current}/${total}`);
    },
  });

  return results;
}

// ========== 使用示例 ==========
// 在浏览器控制台或React组件中使用：

/*
// React 组件示例
import { loadImagesProgressively } from './imageOptimize.js';

function ImageGallery({ imageUrls }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadImagesProgressively(imageUrls, {
      concurrency: 10,
      onProgress: (current, total) => {
        setProgress((current / total) * 100);
      },
      onItemComplete: (result) => {
        if (result.success) {
          // 立即显示加载成功的图片
          setImages(prev => [...prev, {
            url: result.url,
            index: result.index,
            loaded: true,
          }]);
        } else {
          // 显示错误占位符
          setImages(prev => [...prev, {
            url: result.url,
            index: result.index,
            loaded: false,
            error: result.error,
          }]);
        }
      },
    }).then((results) => {
      setLoading(false);
      console.log('所有图片加载完成', results);
    });
  }, [imageUrls]);

  return (
    <div>
      {loading && <div>加载中... {progress.toFixed(1)}%</div>}
      <div className="gallery">
        {images.map((img, i) => (
          <div key={i}>
            {img.loaded ? (
              <img src={img.url} alt={`Image ${i}`} />
            ) : (
              <div className="error-placeholder">
                加载失败: {img.error?.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
*/

