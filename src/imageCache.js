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

