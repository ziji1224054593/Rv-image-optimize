// IndexedDB 主线程实现 - 当 Worker 不支持时的降级方案
// 复用 Worker 中的逻辑，但在主线程中执行

// 默认数据库和表名
const DEFAULT_DB_NAME = 'ImageOptimizeCache';
const DEFAULT_STORE_NAME_GENERAL = 'generalCache';
const DEFAULT_CACHE_EXPIRE_HOURS = 30 * 24;

// 数据库实例缓存
const dbCache = new Map();

/**
 * 初始化 IndexedDB
 */
const initDB = (dbName = DEFAULT_DB_NAME, version = 1, storeNames = []) => {
  return new Promise((resolve, reject) => {
    const cacheKey = `${dbName}_${version}`;
    if (dbCache.has(cacheKey)) {
      resolve(dbCache.get(cacheKey));
      return;
    }

    const request = indexedDB.open(dbName, version);
    
    request.onerror = () => {
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      dbCache.set(cacheKey, db);
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      storeNames.forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expireTime', 'expireTime', { unique: false });
        }
      });
      
      if (dbName === DEFAULT_DB_NAME) {
        if (!database.objectStoreNames.contains(DEFAULT_STORE_NAME_GENERAL)) {
          const generalStore = database.createObjectStore(DEFAULT_STORE_NAME_GENERAL, { keyPath: 'key' });
          generalStore.createIndex('timestamp', 'timestamp', { unique: false });
          generalStore.createIndex('expireTime', 'expireTime', { unique: false });
        }
      }
    };
  });
};

/**
 * 确保数据库和表存在
 */
const ensureDBAndStore = async (dbName, storeName) => {
  let db;
  let currentVersion = 1;
  
  try {
    // 尝试获取现有数据库版本
    if (indexedDB.databases) {
      try {
        const databases = await indexedDB.databases();
        const existingDb = databases.find(d => d.name === dbName);
        if (existingDb) {
          currentVersion = existingDb.version;
        }
      } catch (error) {
        // indexedDB.databases() 可能不支持，使用默认版本
        currentVersion = 1;
      }
    }
    
    // 尝试打开现有数据库
    try {
      db = await initDB(dbName, currentVersion, []);
      
      // 如果表不存在，升级数据库版本并创建表
      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        dbCache.delete(`${dbName}_${currentVersion}`);
        const newVersion = currentVersion + 1;
        db = await initDB(dbName, newVersion, [storeName]);
      }
    } catch (error) {
      // 打开失败，可能是数据库不存在，创建新数据库
      db = await initDB(dbName, 1, [storeName]);
    }
  } catch (error) {
    // 所有尝试都失败，最后一次尝试创建新数据库
    try {
      db = await initDB(dbName, 1, [storeName]);
    } catch (finalError) {
      // 如果还是失败，抛出错误
      throw new Error(`无法创建数据库 ${dbName}: ${finalError.message}`);
    }
  }
  
  return db;
};

/**
 * 主线程版本的缓存操作函数
 */
export const mainThreadSetCache = async (params) => {
  const { key, value, expireHours, dbName, storeName } = params;
  
  try {
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const now = Date.now();
    const expireTime = expireHours > 0 ? now + (expireHours * 60 * 60 * 1000) : null;
    
    const dataToStore = {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      timestamp: now,
      expireHours: expireHours,
      expireTime: expireTime,
    };
    
    const request = store.put(dataToStore);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = request.error;
        if (error && error.name === 'QuotaExceededError') {
          const quotaError = new Error('存储配额已满，无法保存缓存');
          quotaError.name = 'QuotaExceededError';
          quotaError.originalError = error;
          reject(quotaError);
        } else {
          reject(error);
        }
      };
    });
  } catch (error) {
    throw error;
  }
};

export const mainThreadGetCache = async (params) => {
  const { key, dbName, storeName } = params;
  
  try {
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        const now = Date.now();
        if (result.expireTime && now > result.expireTime) {
          resolve(null);
          return;
        }
        
        try {
          const value = JSON.parse(result.value);
          resolve(value);
        } catch (error) {
          // JSON 解析失败，返回 null（数据可能损坏）
          resolve(null);
        }
      };
      request.onerror = () => {
        // 查询失败，返回 null 而不是抛出错误
        resolve(null);
      };
    });
  } catch (error) {
    // 数据库不存在或其他错误，返回 null 而不是抛出错误
    return null;
  }
};

export const mainThreadDeleteCache = async (params) => {
  const { key, dbName, storeName } = params;
  
  try {
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = key ? store.delete(key) : store.clear();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw error;
  }
};

export const mainThreadCleanExpiredCache = async (params) => {
  const { dbName, storeName } = params;
  
  try {
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('expireTime');
    const now = Date.now();
    
    let deletedCount = 0;
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw error;
  }
};

export const mainThreadGetCacheStats = async (params) => {
  const { dbName, storeName } = params;
  
  try {
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        const now = Date.now();
        let totalSize = 0;
        let expiredCount = 0;
        
        items.forEach(item => {
          if (item.value) {
            totalSize += item.value.length;
          }
          if (item.expireTime && now > item.expireTime) {
            expiredCount++;
          }
        });
        
        resolve({
          count: items.length,
          totalSize: totalSize,
          totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
          expiredCount: expiredCount,
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw error;
  }
};

export const mainThreadGetStoreNames = async (params) => {
  const { dbName } = params;
  
  try {
    const database = await initDB(dbName, 1, []);
    return Array.from(database.objectStoreNames);
  } catch (error) {
    return [];
  }
};

export const mainThreadGetAllDatabaseNames = async () => {
  if (indexedDB.databases) {
    try {
      const databases = await indexedDB.databases();
      return databases.map(db => db.name);
    } catch (error) {
      return [];
    }
  } else {
    return [DEFAULT_DB_NAME];
  }
};

export const mainThreadGetStorageQuota = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const usageDetails = estimate.usageDetails || {};
      const indexedDBUsage = usageDetails.indexedDB || 0;
      
      return {
        quota: quota,
        usage: usage,
        usageDetails: usageDetails,
        quotaMB: Math.round(quota / 1024 / 1024 * 100) / 100,
        usageMB: Math.round(usage / 1024 / 1024 * 100) / 100,
        availableMB: Math.round((quota - usage) / 1024 / 1024 * 100) / 100,
        usagePercent: quota > 0 ? Math.round((usage / quota) * 100 * 100) / 100 : 0,
        indexedDBUsage: indexedDBUsage,
        indexedDBUsageMB: Math.round(indexedDBUsage / 1024 / 1024 * 100) / 100,
      };
    } catch (error) {
      return {
        quota: 0, usage: 0, usageDetails: {}, quotaMB: 0, usageMB: 0,
        availableMB: 0, usagePercent: 0, indexedDBUsage: 0, indexedDBUsageMB: 0,
      };
    }
  } else {
    return {
      quota: 0, usage: 0, usageDetails: {}, quotaMB: 0, usageMB: 0,
      availableMB: 0, usagePercent: 0, indexedDBUsage: 0, indexedDBUsageMB: 0,
      unsupported: true,
    };
  }
};

