// 通用缓存管理 - 使用 IndexedDB 存储任意数据（Worker 架构，支持降级）
// 支持自定义 key/value 和缓存有效期（小时）
// 支持多数据库（库）和多表（objectStore）查询
// 优先使用 Worker 线程执行，Worker 不支持时自动降级到主线程

import { sendMessage, shouldUseWorker } from './imageCacheManager.js';
import * as mainThreadCache from './imageCache.main.js';

// 默认数据库和表名
export const DEFAULT_DB_NAME = 'ImageOptimizeCache';
export const DEFAULT_STORE_NAME_GENERAL = 'generalCache';
export const DEFAULT_CACHE_EXPIRE_HOURS = 30 * 24;

// ==================== 通用缓存 API（支持多库多表） ====================

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值（任意类型，会被序列化为 JSON）
 * @param {number} expireHours - 缓存有效期（小时），0 表示永不过期，默认使用 DEFAULT_CACHE_EXPIRE_HOURS
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @param {Object} options - 选项对象
 * @param {boolean} options.checkQuota - 是否在存储前检查配额（默认 false）
 * @param {boolean} options.autoCleanOnQuotaError - 配额不足时是否自动清理过期缓存（默认 false）
 * @returns {Promise<void>}
 */
export const setCache = async (
  key, 
  value, 
  expireHours = DEFAULT_CACHE_EXPIRE_HOURS,
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL,
  options = {}
) => {
  const { checkQuota = false, autoCleanOnQuotaError = false } = options;
  
  try {
    // 序列化值以估算大小
    let serializedValue;
    try {
      serializedValue = JSON.stringify(value);
    } catch (error) {
      throw new Error(`无法序列化值: ${error.message}`);
    }
    
    const estimatedSize = new Blob([serializedValue]).size;
    
    // 可选：在存储前检查配额
    if (checkQuota) {
      const quotaCheck = await checkStorageQuota(estimatedSize);
      if (!quotaCheck.available) {
        if (autoCleanOnQuotaError) {
          console.warn('⚠️ 存储配额不足，尝试清理过期缓存...');
          await cleanExpiredCache(dbName, storeName);
          const quotaCheckAfterClean = await checkStorageQuota(estimatedSize);
          if (!quotaCheckAfterClean.available) {
            throw new Error(`存储配额不足: ${quotaCheck.message}`);
          }
        } else {
          throw new Error(`存储配额不足: ${quotaCheck.message}`);
        }
      }
    }
    
    // 通过 Worker 或主线程设置缓存
    try {
      if (shouldUseWorker()) {
        await sendMessage('setCache', {
          key,
          value: serializedValue, // 已经序列化
          expireHours,
          dbName,
          storeName,
        });
      } else {
        // 降级到主线程
        console.log('Worker 不支持 降级到主线程');
        await mainThreadCache.mainThreadSetCache({
          key,
          value: serializedValue,
          expireHours,
          dbName,
          storeName,
        });
      }
    } catch (error) {
      if (error && error.name === 'QuotaExceededError') {
        if (autoCleanOnQuotaError) {
          try {
            console.warn('⚠️ 存储配额已满，尝试清理过期缓存后重试...');
            await cleanExpiredCache(dbName, storeName);
            // 重试
            if (shouldUseWorker()) {
              await sendMessage('setCache', {
                key,
                value: serializedValue,
                expireHours,
                dbName,
                storeName,
              });
            } else {
              await mainThreadCache.mainThreadSetCache({
                key,
                value: serializedValue,
                expireHours,
                dbName,
                storeName,
              });
            }
          } catch (retryError) {
            const quotaError = new Error('存储配额已满，即使清理过期缓存后仍无法保存');
            quotaError.name = 'QuotaExceededError';
            quotaError.originalError = retryError;
            throw quotaError;
          }
        } else {
          const quotaError = new Error('存储配额已满，无法保存缓存。建议清理过期缓存或删除不需要的数据');
          quotaError.name = 'QuotaExceededError';
          quotaError.originalError = error;
          quotaError.suggestion = '可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据';
          throw quotaError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (error && (error.name === 'QuotaExceededError' || error.message.includes('配额'))) {
      const quotaError = new Error(error.message || '存储配额已满，无法保存缓存');
      quotaError.name = 'QuotaExceededError';
      quotaError.originalError = error;
      quotaError.suggestion = '可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据';
      console.error('❌ 存储配额已满:', quotaError);
      throw quotaError;
    }
    console.error('❌ 设置缓存失败:', error);
    throw error;
  }
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @returns {Promise<any|null>} 返回缓存值，如果不存在或已过期则返回 null
 */
export const getCache = async (
  key,
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL
) => {
  try {
    let result;
    if (shouldUseWorker()) {
      result = await sendMessage('getCache', { key, dbName, storeName });
    } else {
      // 降级到主线程
      result = await mainThreadCache.mainThreadGetCache({ key, dbName, storeName });
    }
    
    // 如果已过期，自动删除
    if (result === null) {
      deleteCache(key, dbName, storeName).catch(() => {});
    }
    
    return result;
  } catch (error) {
    console.error('❌ 获取缓存失败:', error);
    return null;
  }
};

/**
 * 删除缓存
 * @param {string} key - 缓存键，如果不传则清空所有缓存
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @returns {Promise<void>}
 */
export const deleteCache = async (
  key = null,
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL
) => {
  try {
    if (shouldUseWorker()) {
      await sendMessage('deleteCache', { key, dbName, storeName });
    } else {
      // 降级到主线程
      await mainThreadCache.mainThreadDeleteCache({ key, dbName, storeName });
    }
  } catch (error) {
    console.error('❌ 删除缓存失败:', error);
    throw error;
  }
};

/**
 * 清理过期缓存
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @returns {Promise<number>} 返回清理的缓存数量
 */
export const cleanExpiredCache = async (
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL
) => {
  try {
    if (shouldUseWorker()) {
      return await sendMessage('cleanExpiredCache', { dbName, storeName });
    } else {
      // 降级到主线程
      return await mainThreadCache.mainThreadCleanExpiredCache({ dbName, storeName });
    }
  } catch (error) {
    console.error('❌ 清理过期缓存失败:', error);
    return 0;
  }
};

/**
 * 获取缓存统计信息
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @returns {Promise<{count: number, totalSize: number, totalSizeMB: number, expiredCount: number}>}
 */
export const getCacheStats = async (
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL
) => {
  try {
    if (shouldUseWorker()) {
      return await sendMessage('getCacheStats', { dbName, storeName });
    } else {
      // 降级到主线程
      return await mainThreadCache.mainThreadGetCacheStats({ dbName, storeName });
    }
  } catch (error) {
    console.error('❌ 获取缓存统计失败:', error);
    return { count: 0, totalSize: 0, totalSizeMB: 0, expiredCount: 0 };
  }
};

/**
 * 检查缓存是否存在且未过期
 * @param {string} key - 缓存键
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @returns {Promise<boolean>}
 */
export const hasCache = async (
  key,
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL
) => {
  const value = await getCache(key, dbName, storeName);
  return value !== null;
};

/**
 * 获取指定数据库的所有表名
 * @param {string} dbName - 数据库名称（库名）
 * @returns {Promise<Array<string>>}
 */
export const getStoreNames = async (dbName = DEFAULT_DB_NAME) => {
  try {
    if (shouldUseWorker()) {
      return await sendMessage('getStoreNames', { dbName });
    } else {
      // 降级到主线程
      return await mainThreadCache.mainThreadGetStoreNames({ dbName });
    }
  } catch (error) {
    console.error('❌ 获取表名失败:', error);
    return [];
  }
};

/**
 * 删除整个数据库
 * @param {string} dbName - 数据库名称（库名）
 * @returns {Promise<void>}
 */
export const deleteDatabase = async (dbName) => {
      return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          resolve();
        };
    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * 获取所有数据库名称
 * @returns {Promise<Array<string>>}
 */
export const getAllDatabaseNames = async () => {
  try {
    if (shouldUseWorker()) {
      return await sendMessage('getAllDatabaseNames', {});
    } else {
      // 降级到主线程
      return await mainThreadCache.mainThreadGetAllDatabaseNames();
    }
  } catch (error) {
    console.error('❌ 获取数据库列表失败:', error);
    return [];
  }
};

/**
 * 检查存储配额是否足够
 * @param {number} requiredSize - 需要的存储空间（字节）
 * @returns {Promise<{available: boolean, quota: number, usage: number, availableMB: number, requiredMB: number, message: string}>}
 */
export const checkStorageQuota = async (requiredSize = 0) => {
  try {
    const quotaInfo = await getStorageQuota();
    const available = quotaInfo.quota - quotaInfo.usage - requiredSize > 0;
    const availableMB = quotaInfo.availableMB - (requiredSize / 1024 / 1024);
    
    return {
      available: available,
      quota: quotaInfo.quota,
      usage: quotaInfo.usage,
      availableMB: Math.max(0, Math.round(availableMB * 100) / 100),
      requiredMB: Math.round(requiredSize / 1024 / 1024 * 100) / 100,
      usagePercent: quotaInfo.usagePercent,
      message: available 
        ? `存储空间充足，可用 ${Math.round(availableMB * 100) / 100} MB`
        : `存储空间不足，需要 ${Math.round(requiredSize / 1024 / 1024 * 100) / 100} MB，但只有 ${quotaInfo.availableMB} MB 可用`,
    };
  } catch (error) {
    console.error('❌ 检查存储配额失败:', error);
    return {
      available: false,
      quota: 0,
      usage: 0,
      availableMB: 0,
      requiredMB: Math.round(requiredSize / 1024 / 1024 * 100) / 100,
      usagePercent: 0,
      message: '无法检查存储配额',
      error: error,
    };
  }
};

/**
 * 获取存储配额和使用情况
 * @returns {Promise<{quota: number, usage: number, usageDetails: Object, quotaMB: number, usageMB: number, availableMB: number, usagePercent: number}>}
 */
export const getStorageQuota = async () => {
  try {
    if (shouldUseWorker()) {
      return await sendMessage('getStorageQuota', {});
        } else {
      // 降级到主线程
      return await mainThreadCache.mainThreadGetStorageQuota();
        }
  } catch (error) {
    console.error('❌ 获取存储配额失败:', error);
    return {
      quota: 0,
      usage: 0,
      usageDetails: {},
      quotaMB: 0,
      usageMB: 0,
      availableMB: 0,
      usagePercent: 0,
      indexedDBUsage: 0,
      indexedDBUsageMB: 0,
    };
  }
};

/**
 * 获取所有数据库的存储使用情况
 * @returns {Promise<Array<{dbName: string, stores: Array<{storeName: string, count: number, size: number, sizeMB: number}>}>>}
 */
export const getAllDatabasesUsage = async () => {
  try {
    const dbNames = await getAllDatabaseNames();
    const results = [];
    
    for (const dbName of dbNames) {
      try {
        const storeNames = await getStoreNames(dbName);
        const stores = [];
        
        for (const storeName of storeNames) {
          const stats = await getCacheStats(dbName, storeName);
          stores.push({
            storeName: storeName,
            count: stats.count,
            size: stats.totalSize,
            sizeMB: stats.totalSizeMB,
          });
        }
        
        const totalSize = stores.reduce((sum, store) => sum + store.size, 0);
        const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
        
        results.push({
          dbName: dbName,
          stores: stores,
          totalSize: totalSize,
          totalSizeMB: totalSizeMB,
        });
      } catch (error) {
        console.error(`❌ 获取数据库 ${dbName} 使用情况失败:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ 获取所有数据库使用情况失败:', error);
    return [];
  }
};

// ==================== 图片缓存 API（向后兼容） ====================


/**
 * 将图片 URL 转换为 Blob URL（用于从缓存加载）
 * @param {Uint8Array} imageData - 图片数据
 * @param {string} mimeType - MIME类型
 * @returns {string|null} Blob URL
 */
export const createBlobUrlFromCache = (imageData, mimeType) => {
  try {
    const blob = new Blob([imageData], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('❌ 创建 Blob URL 失败:', error);
    return null;
  }
};

/**
 * 从 URL 加载图片并缓存（使用通用缓存 API）
 * @param {string} url - 图片URL
 * @param {string} dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @param {number} expireHours - 缓存过期时间（小时），默认使用 DEFAULT_CACHE_EXPIRE_HOURS
 * @returns {Promise<string>} Blob URL
 */
export const loadImageWithCache = async (
  url,
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME_GENERAL,
  expireHours = DEFAULT_CACHE_EXPIRE_HOURS
) => {
  try {
    // 1. 清理过期缓存（如果失败不影响后续操作）
    try {
      await cleanExpiredCache(dbName, storeName);
    } catch (cleanError) {
      // 清理失败不影响图片加载
      console.warn('⚠️ 清理过期缓存失败:', cleanError.message);
    }
    
    // 2. 检查缓存（使用通用 API）
    const cacheKey = `image:${url}`;
    const cached = await getCache(cacheKey, dbName, storeName);
    
    if (cached && cached.data && cached.mimeType) {
      try {
        // 将 base64 字符串转换回 Uint8Array
        const base64Data = cached.data.split(',')[1] || cached.data;
        if (!base64Data || base64Data.length === 0) {
          throw new Error('缓存数据为空');
        }
        
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
      // 从缓存创建 Blob URL
        const blobUrl = createBlobUrlFromCache(bytes, cached.mimeType);
      if (blobUrl) {
        return blobUrl;
        }
      } catch (cacheError) {
        // 缓存数据损坏，删除并继续从网络加载
        console.warn('⚠️ 缓存数据损坏，删除缓存:', cacheError.message);
        await deleteCache(cacheKey, dbName, storeName).catch(() => {});
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
    
    // 4. 将图片数据转换为 base64 字符串存储（使用安全的方式处理大图片）
    let dataUrl;
    try {
      // 对于大图片，使用分块处理避免堆栈溢出
      const chunks = [];
      const chunkSize = 8192; // 8KB chunks
      for (let i = 0; i < imageData.length; i += chunkSize) {
        const chunk = imageData.slice(i, i + chunkSize);
        const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
        chunks.push(chunkString);
      }
      const binaryString = chunks.join('');
      const base64String = btoa(binaryString);
      dataUrl = `data:${mimeType};base64,${base64String}`;
    } catch (encodeError) {
      // base64 编码失败，跳过缓存保存，但不影响图片加载
      console.warn('⚠️ 图片数据编码失败，跳过缓存保存:', encodeError.message);
      dataUrl = null;
    }
    
    // 5. 保存到缓存（使用通用 API，如果编码成功）
    if (dataUrl) {
      try {
        await setCache(
          cacheKey,
          { data: dataUrl, mimeType },
          expireHours,
          dbName,
          storeName
        );
      } catch (saveError) {
        // 保存缓存失败，不影响图片加载
        console.warn('⚠️ 保存缓存失败:', saveError.message);
      }
    }
    
    // 6. 创建 Blob URL
    const blobUrl = createBlobUrlFromCache(imageData, mimeType);
    return blobUrl;
    
  } catch (error) {
    console.error('❌ 加载图片失败:', error);
    // 清除可能损坏的缓存
    const cacheKey = `image:${url}`;
    await deleteCache(cacheKey, dbName, storeName);
    throw error;
  }
};

/**
 * 渐进式加载图片并缓存（使用通用缓存 API）
 * @param {string} url - 原始图片URL
 * @param {Object} options - 配置选项（与 loadImageProgressive 相同）
 * @param {string} options.dbName - 数据库名称（库名），默认使用 DEFAULT_DB_NAME
 * @param {string} options.storeName - 对象存储名称（表名），默认使用 DEFAULT_STORE_NAME_GENERAL
 * @param {number} options.expireHours - 缓存过期时间（小时），默认使用 DEFAULT_CACHE_EXPIRE_HOURS
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
    enableCache = true,
    urlTransformer = null,
    onStageComplete = null,
    onComplete = null,
    onError = null,
    onStageError = null,
    dbName = DEFAULT_DB_NAME,
    storeName = DEFAULT_STORE_NAME_GENERAL,
    expireHours = DEFAULT_CACHE_EXPIRE_HOURS,
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
      finalUrl = urlTransformer(url, finalStage, stages.length - 1);
    } else if (finalStage && (finalStage.width || finalStage.height)) {
      finalUrl = optimizeImageUrl(url, {
        width: finalStage.width || null,
        height: finalStage.height || null,
        quality: finalStage.quality || 80,
        format: finalStage.format || null,
        autoFormat: finalStage.autoFormat !== false,
      });
    }

    // 2. 检查缓存（使用通用 API）
    const cacheKey = `image:${finalUrl}`;
    const cached = await getCache(cacheKey, dbName, storeName);
    
    if (cached && cached.data && cached.mimeType) {
      try {
        // 将 base64 字符串转换回 Uint8Array
        const base64Data = cached.data.split(',')[1] || cached.data;
        if (!base64Data || base64Data.length === 0) {
          throw new Error('缓存数据为空');
        }
        
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blobUrl = createBlobUrlFromCache(bytes, cached.mimeType);
      if (blobUrl) {
        if (onComplete) {
          onComplete(blobUrl);
        }
        
        if (onStageComplete) {
          stages.forEach((stage, index) => {
            if (index === stages.length - 1) {
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
      } catch (cacheError) {
        // 缓存数据损坏，删除并继续从网络加载
        console.warn('⚠️ 缓存数据损坏，删除缓存:', cacheError.message);
        await deleteCache(cacheKey, dbName, storeName).catch(() => {});
      }
    }

    // 3. 缓存未命中，执行渐进式加载
    const result = await loadImageProgressive(url, {
      stages,
      timeout,
      urlTransformer,
      onStageError,
      onStageComplete,
      onComplete: async (loadedUrl) => {
        if (!loadedUrl.startsWith('blob:')) {
          try {
            const response = await fetch(loadedUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const imageData = new Uint8Array(arrayBuffer);
              const mimeType = response.headers.get('Content-Type') || 'image/jpeg';
              
              // 将图片数据转换为 base64 字符串存储（使用安全的方式处理大图片）
              try {
                const chunks = [];
                const chunkSize = 8192; // 8KB chunks
                for (let i = 0; i < imageData.length; i += chunkSize) {
                  const chunk = imageData.slice(i, i + chunkSize);
                  const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
                  chunks.push(chunkString);
                }
                const binaryString = chunks.join('');
                const base64String = btoa(binaryString);
                const dataUrl = `data:${mimeType};base64,${base64String}`;
                
                // 使用通用 API 保存缓存
                await setCache(
                  cacheKey,
                  { data: dataUrl, mimeType },
                  expireHours,
                  dbName,
                  storeName
                );
              console.log(`[渐进式加载缓存] 已保存到缓存: ${cacheKey.substring(0, 50)}...`);
              } catch (cacheError) {
                // 保存缓存失败，不影响图片加载
                console.warn(`[渐进式加载缓存] 保存缓存失败:`, cacheError.message || cacheError);
              }
            }
          } catch (cacheError) {
            console.warn(`[渐进式加载缓存] 保存缓存失败:`, cacheError.message || cacheError);
          }
        }
        
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
