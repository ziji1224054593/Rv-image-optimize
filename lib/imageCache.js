// 图片缓存管理 - 使用 IndexedDB 存储图片数据
// key: 图片URL, value: 图片数据 (Uint8Array)

const DB_NAME = 'ImageOptimizeCache';
const DB_VERSION = 1;
const STORE_NAME = 'imageCache';

// 缓存过期时间（一个月）
const CACHE_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000;

// IndexedDB 数据库实例
let db = null;

// 初始化 IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('❌ IndexedDB 打开失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // 只在对象存储不存在时才创建
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// 从 IndexedDB 读取图片缓存
export const getImageCache = async (url) => {
  try {
    const database = await initDB();
    
    // 检查对象存储是否存在
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      return null;
    }
    
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp) < CACHE_EXPIRE_TIME) {
          // 将 ArrayBuffer 转换回 Uint8Array
          const imageData = new Uint8Array(result.data);
          resolve({
            data: imageData,
            timestamp: result.timestamp,
            mimeType: result.mimeType || 'image/jpeg'
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 从 IndexedDB 读取图片缓存失败:', error);
    return null;
  }
};

// 保存图片缓存到 IndexedDB
export const saveImageCache = async (url, imageData, mimeType = 'image/jpeg') => {
  try {
    const database = await initDB();
    
    // 检查对象存储是否存在
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      return;
    }
    
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // 准备存储的数据
    const dataToStore = {
      url,
      data: imageData.buffer, // 转换为 ArrayBuffer
      timestamp: Date.now(),
      mimeType
    };
    
    const request = store.put(dataToStore);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 保存图片缓存到 IndexedDB 失败:', error);
  }
};

// 从 IndexedDB 删除图片缓存
export const deleteImageCache = async (url) => {
  try {
    const database = await initDB();
    
    // 检查对象存储是否存在
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      return;
    }
    
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    if (url) {
      const request = store.delete(url);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      const request = store.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error('❌ 删除图片缓存失败:', error);
  }
};

// 清理过期缓存
export const cleanExpiredImageCache = async () => {
  try {
    const database = await initDB();
    
    // 检查对象存储是否存在
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      return;
    }
    
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const now = Date.now();
    
    const range = IDBKeyRange.upperBound(now - CACHE_EXPIRE_TIME);
    const request = index.openCursor(range);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 清理过期图片缓存失败:', error);
  }
};

// 获取缓存统计信息
export const getImageCacheStats = async () => {
  try {
    const database = await initDB();
    
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      return { count: 0, totalSize: 0, totalSizeMB: 0 };
    }
    
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        const totalSize = items.reduce((sum, item) => sum + (item.data ? item.data.byteLength : 0), 0);
        resolve({
          count: items.length,
          totalSize: totalSize,
          totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 获取图片缓存统计失败:', error);
    return { count: 0, totalSize: 0, totalSizeMB: 0 };
  }
};

// 将图片 URL 转换为 Blob URL（用于从缓存加载）
export const createBlobUrlFromCache = (imageData, mimeType) => {
  try {
    const blob = new Blob([imageData], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('❌ 创建 Blob URL 失败:', error);
    return null;
  }
};

// 从 URL 加载图片并缓存
export const loadImageWithCache = async (url) => {
  try {
    // 1. 清理过期缓存
    await cleanExpiredImageCache();
    
    // 2. 检查缓存
    const cached = await getImageCache(url);
    if (cached) {
      // 从缓存创建 Blob URL
      const blobUrl = createBlobUrlFromCache(cached.data, cached.mimeType);
      if (blobUrl) {
        return blobUrl;
      }
    }
    
    // 3. 从网络加载图片
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    const mimeType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // 4. 保存到缓存
    await saveImageCache(url, imageData, mimeType);
    
    // 5. 创建 Blob URL
    const blobUrl = createBlobUrlFromCache(imageData, mimeType);
    return blobUrl;
    
  } catch (error) {
    console.error('❌ 加载图片失败:', error);
    // 清除可能损坏的缓存
    await deleteImageCache(url);
    throw error;
  }
};

// 手动清理缓存函数
export const clearImageCache = async (url) => {
  await deleteImageCache(url);
};

/**
 * 渐进式加载图片并缓存（带缓存功能的渐进式加载）
 * @param {string} url - 原始图片URL
 * @param {Object} options - 配置选项（与 loadImageProgressive 相同）
 * @param {Array} options.stages - 加载阶段配置数组
 * @param {number} options.timeout - 每个阶段的超时时间（毫秒）
 * @param {boolean} options.enableCache - 是否启用缓存功能（默认true）
 * @param {Function} options.urlTransformer - URL转换函数
 * @param {Function} options.onStageComplete - 阶段完成回调 (stageIndex, stageUrl, stage) => void
 * @param {Function} options.onComplete - 全部完成回调 (finalUrl) => void
 * @param {Function} options.onError - 错误回调 (error, stageIndex) => void
 * @param {Function} options.onStageError - 阶段错误回调
 * @returns {Promise<{url: string, stages: Array, success: boolean, error: Error|null, fromCache: boolean}>}
 */
export const loadImageProgressiveWithCache = async (url, options = {}) => {
  // 动态导入 loadImageProgressive 和 optimizeImageUrl，避免循环依赖
  const { loadImageProgressive, optimizeImageUrl } = await import('./imageOptimize.js');
  
  const {
    stages = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    timeout = 30000,
    enableCache = true, // 默认启用缓存
    urlTransformer = null,
    onStageComplete = null,
    onComplete = null,
    onError = null,
    onStageError = null,
  } = options;

  if (!url) {
    const error = new Error('图片URL为空');
    if (onError) onError(error, -1);
    return {
      url: '',
      stages: [],
      success: false,
      error,
      fromCache: false,
    };
  }

  try {
    // 如果禁用缓存，直接使用 loadImageProgressive
    if (!enableCache) {
      const result = await loadImageProgressive(url, {
        stages,
        timeout,
        urlTransformer,
        onStageError,
        onStageComplete,
        onComplete,
        onError,
      });
      return {
        ...result,
        fromCache: false,
      };
    }

    // 1. 计算最终阶段的 URL（用于缓存键）
    const finalStage = stages[stages.length - 1];
    let finalUrl = url;
    
    if (urlTransformer && typeof urlTransformer === 'function') {
      // 使用自定义URL转换函数
      finalUrl = urlTransformer(url, finalStage, stages.length - 1);
    } else if (finalStage && (finalStage.width || finalStage.height)) {
      // 使用默认的优化函数
      finalUrl = optimizeImageUrl(url, {
        width: finalStage.width || null,
        height: finalStage.height || null,
        quality: finalStage.quality || 80,
        format: finalStage.format || null,
        autoFormat: finalStage.autoFormat !== false,
      });
    }

    // 2. 检查缓存
    const cached = await getImageCache(finalUrl);
    if (cached) {
      // 从缓存创建 Blob URL
      const blobUrl = createBlobUrlFromCache(cached.data, cached.mimeType);
      if (blobUrl) {
        // 缓存命中，直接返回
        if (onComplete) {
          onComplete(blobUrl);
        }
        
        // 触发所有阶段的完成回调（模拟渐进式加载完成）
        if (onStageComplete) {
          stages.forEach((stage, index) => {
            if (index === stages.length - 1) {
              // 只触发最后一个阶段的回调
              onStageComplete(index, blobUrl, stage);
            }
          });
        }
        
        return {
          url: blobUrl,
          stages: stages.map((stage, index) => ({
            url: index === stages.length - 1 ? blobUrl : '',
            stage,
            loaded: index === stages.length - 1,
          })),
          success: true,
          error: null,
          fromCache: true,
        };
      }
    }

    // 3. 缓存未命中，执行渐进式加载
    // 保存计算出的 finalUrl（用于缓存键）
    const cacheKey = finalUrl;
    
    const result = await loadImageProgressive(url, {
      stages,
      timeout,
      urlTransformer,
      onStageError,
      onStageComplete,
      onComplete: async (loadedUrl) => {
        // 保存最终图片到缓存
        // 注意：如果 loadedUrl 是 Blob URL，说明已经来自缓存，不需要再次保存
        if (!loadedUrl.startsWith('blob:')) {
          try {
            // 获取最终图片的二进制数据
            const response = await fetch(loadedUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const imageData = new Uint8Array(arrayBuffer);
              const mimeType = response.headers.get('Content-Type') || 'image/jpeg';
              
              // 保存到 IndexedDB（使用计算出的 cacheKey 作为键，而不是 loadedUrl）
              // 这样可以确保下次加载时能正确匹配缓存
              await saveImageCache(cacheKey, imageData, mimeType);
              console.log(`[渐进式加载缓存] 已保存到缓存: ${cacheKey.substring(0, 50)}...`);
            } else {
              console.warn(`[渐进式加载缓存] 响应状态码错误: ${response.status} - ${loadedUrl.substring(0, 50)}...`);
            }
          } catch (cacheError) {
            // 缓存保存失败不影响图片显示
            // 可能是 CORS 问题或其他网络错误
            console.warn(`[渐进式加载缓存] 保存缓存失败:`, cacheError.message || cacheError, loadedUrl.substring(0, 50));
          }
        } else {
          console.log(`[渐进式加载缓存] 图片来自缓存，跳过保存: ${loadedUrl.substring(0, 30)}...`);
        }
        
        // 调用原始回调（传递实际加载的 URL）
        if (onComplete) {
          onComplete(loadedUrl);
        }
      },
      onError,
    });

    return {
      ...result,
      fromCache: false,
    };
  } catch (error) {
    // 只在非 404 错误或开发环境时显示错误
    const is404 = error.message && error.message.includes('404');
    if (!is404 || process.env.NODE_ENV === 'development') {
      if (!is404) {
        console.error('❌ 渐进式加载图片失败:', error.message || error);
      }
    }
    
    if (onError) {
      onError(error, -1);
    }
    return {
      url: '',
      stages: [],
      success: false,
      error,
      fromCache: false,
    };
  }
};

