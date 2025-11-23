// IndexedDB Worker 管理器 - 管理 Worker 生命周期和消息通信

let worker = null;
let workerUrl = null;
let pendingMessages = new Map();
let messageIdCounter = 0;
let isInitialized = false;

/**
 * 获取 Worker 代码（内联方式，避免文件路径问题）
 */
const getWorkerCode = () => {
    // 这里返回 Worker 代码字符串
    // 由于代码较长，我们使用动态导入的方式
    // 在实际使用中，Worker 代码会被内联到 Blob 中
    return `
// 默认数据库和表名
const DEFAULT_DB_NAME = 'ImageOptimizeCache';
const DEFAULT_STORE_NAME_GENERAL = 'generalCache';
const DEFAULT_CACHE_EXPIRE_HOURS = 30 * 24;

// 数据库实例缓存
const dbCache = new Map();

const initDB = (dbName = DEFAULT_DB_NAME, version = 1, storeNames = []) => {
  return new Promise((resolve, reject) => {
    const cacheKey = \`\${dbName}_\${version}\`;
    if (dbCache.has(cacheKey)) {
      resolve(dbCache.get(cacheKey));
      return;
    }
    const request = indexedDB.open(dbName, version);
    request.onerror = () => reject(request.error);
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
        dbCache.delete(\`\${dbName}_\${currentVersion}\`);
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
      throw new Error(\`无法创建数据库 \${dbName}: \${finalError.message}\`);
    }
  }
  
  return db;
};

const handlers = {
  setCache: async (params) => {
    const { key, value, expireHours, dbName, storeName } = params;
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
          reject(quotaError);
        } else {
          reject(error);
        }
      };
    });
  },
  getCache: async (params) => {
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
      // 这样第一次打开项目时不会报错
      return null;
    }
  },
  deleteCache: async (params) => {
    const { key, dbName, storeName } = params;
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = key ? store.delete(key) : store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  cleanExpiredCache: async (params) => {
    const { dbName, storeName } = params;
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
  },
  getCacheStats: async (params) => {
    const { dbName, storeName } = params;
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
  },
  getStoreNames: async (params) => {
    const { dbName } = params;
    try {
      const database = await initDB(dbName, 1, []);
      return Array.from(database.objectStoreNames);
    } catch (error) {
      return [];
    }
  },
  getAllDatabaseNames: async () => {
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
  },
  getStorageQuota: async () => {
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
  },
};

self.addEventListener('message', async (event) => {
  const { id, action, params } = event.data;
  try {
    const handler = handlers[action];
    if (!handler) {
      throw new Error(\`未知的操作: \${action}\`);
    }
    const result = await handler(params);
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
});

self.postMessage({ type: 'ready' });
  `;
};

/**
 * 初始化 Worker
 */
const initWorker = () => {
    if (worker) {
        return Promise.resolve();
    }

    // 如果 Worker 不支持，直接返回（不抛出错误，让降级逻辑处理）
    if (typeof Worker === 'undefined') {
        return Promise.resolve(); // 不创建 Worker，让 shouldUseWorker() 返回 false
    }

    return new Promise((resolve, reject) => {
        try {
            // 创建 Worker（使用内联 Blob URL）
            const workerCode = `
// IndexedDB Worker - 内联版本
${getWorkerCode()}
        `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
            worker = new Worker(workerUrl);

            // 监听 Worker 消息
            worker.onmessage = (event) => {
                const { id, success, result, error, type } = event.data;

                if (type === 'ready') {
                    isInitialized = true;
                    resolve();
                    return;
                }

                const pending = pendingMessages.get(id);
                if (pending) {
                    pendingMessages.delete(id);
                    if (success) {
                        pending.resolve(result);
                    } else {
                        const err = new Error(error.message);
                        err.name = error.name;
                        err.stack = error.stack;
                        pending.reject(err);
                    }
                }
            };

            // 监听 Worker 错误
            worker.onerror = (error) => {
                console.error('❌ Worker 错误:', error);
                // 通知所有待处理的消息
                pendingMessages.forEach((pending) => {
                    pending.reject(error);
                });
                pendingMessages.clear();
                reject(error);
            };

            // 如果 Worker 已经初始化，直接 resolve
            if (isInitialized) {
                resolve();
            }
        } catch (error) {
            console.error('❌ 初始化 Worker 失败:', error);
            reject(error);
        }
    });
};

/**
 * 发送消息到 Worker
 */
const sendMessage = async (action, params = {}) => {
    // 如果 Worker 不支持，不应该调用 sendMessage
    // 这个函数只应该在 shouldUseWorker() 返回 true 时调用
    if (!shouldUseWorker()) {
        throw new Error('Worker 不支持，应该使用主线程实现');
    }

    // 确保 Worker 已初始化
    await initWorker();

    // 如果 Worker 初始化失败（不支持），抛出错误
    if (!worker) {
        throw new Error('Worker 初始化失败');
    }

    return new Promise((resolve, reject) => {
        const id = ++messageIdCounter;

        // 存储待处理的消息
        pendingMessages.set(id, { resolve, reject });

        // 检查是否有 ArrayBuffer 需要传输（Transferable Objects）
        const transferList = [];
        if (params.imageData && params.imageData instanceof ArrayBuffer) {
            transferList.push(params.imageData);
        } else if (params.imageData && params.imageData.buffer instanceof ArrayBuffer) {
            transferList.push(params.imageData.buffer);
        }

        // 发送消息到 Worker（使用 Transferable Objects 优化性能）
        if (transferList.length > 0) {
            worker.postMessage({ id, action, params }, transferList);
        } else {
            worker.postMessage({ id, action, params });
        }

        // 设置超时（30秒）
        setTimeout(() => {
            if (pendingMessages.has(id)) {
                pendingMessages.delete(id);
                reject(new Error(`操作超时: ${action}`));
            }
        }, 30000);
    });
};

/**
 * 销毁 Worker
 */
const destroyWorker = () => {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
    }
    pendingMessages.clear();
    isInitialized = false;
};

/**
 * 检查 Worker 是否可用
 */
const isWorkerSupported = () => {
    return typeof Worker !== 'undefined';
};

/**
 * 降级到主线程模式（如果 Worker 不可用）
 */
let useMainThread = false;

const setUseMainThread = (value) => {
    useMainThread = value;
};

const shouldUseWorker = () => {
    return isWorkerSupported() && !useMainThread;
};

export {
    initWorker,
    sendMessage,
    destroyWorker,
    isWorkerSupported,
    setUseMainThread,
    shouldUseWorker,
};

