/**
 * 缓存服务 - 多层缓存策略优化应用性能
 */

// 缓存配置
const CACHE_CONFIG = {
  // 内存缓存
  memory: {
    maxSize: 50, // 最大缓存条目数
    ttl: 5 * 60 * 1000, // 5分钟TTL
  },

  // LocalStorage缓存
  localStorage: {
    prefix: 'tuheg_cache_',
    maxSize: 10 * 1024 * 1024, // 10MB
    ttl: 24 * 60 * 60 * 1000, // 24小时TTL
  },

  // API响应缓存
  api: {
    ttl: 10 * 60 * 1000, // 10分钟TTL
    maxAge: 5 * 60 * 1000, // 5分钟缓存新鲜度
  },
};

/**
 * 内存缓存类
 */
class MemoryCache {
  constructor(maxSize = 50, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = this.defaultTTL) {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });

    // 启动清理定时器
    setTimeout(() => this.delete(key), ttl);
  }

  /**
   * 获取缓存
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size() {
    return this.cache.size;
  }
}

/**
 * LocalStorage缓存类
 */
class LocalStorageCache {
  constructor(prefix = 'cache_', maxSize = 10 * 1024 * 1024, defaultTTL = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = this.defaultTTL) {
    try {
      const cacheKey = this.prefix + key;
      const expiry = Date.now() + ttl;
      const data = {
        value,
        expiry,
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(data);

      // 检查大小限制
      if (serialized.length > this.maxSize) {
        console.warn('Cache item too large, skipping:', key);
        return false;
      }

      localStorage.setItem(cacheKey, serialized);
      return true;
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  get(key) {
    try {
      const cacheKey = this.prefix + key;
      const serialized = localStorage.getItem(cacheKey);

      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized);

      if (Date.now() > data.expiry) {
        this.delete(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.warn('LocalStorage cache get failed:', error);
      this.delete(key);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  delete(key) {
    try {
      const cacheKey = this.prefix + key;
      localStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage cache delete failed:', error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('LocalStorage cache clear failed:', error);
      return false;
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.expiry && now > data.expiry) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // 删除损坏的数据
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('LocalStorage cleanup failed:', error);
    }
  }
}

/**
 * 多层缓存服务
 */
class CacheService {
  constructor() {
    this.memoryCache = new MemoryCache(CACHE_CONFIG.memory.maxSize, CACHE_CONFIG.memory.ttl);

    this.localStorageCache = new LocalStorageCache(
      CACHE_CONFIG.localStorage.prefix,
      CACHE_CONFIG.localStorage.maxSize,
      CACHE_CONFIG.localStorage.ttl,
    );

    // 启动定期清理
    this.startCleanupTimer();
  }

  /**
   * 获取缓存（多层策略）
   */
  get(key, options = {}) {
    const { preferMemory = true } = options;

    // 优先从内存缓存获取
    if (preferMemory) {
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue !== null) {
        return memoryValue;
      }
    }

    // 从LocalStorage获取
    const storageValue = this.localStorageCache.get(key);
    if (storageValue !== null) {
      // 同步到内存缓存
      this.memoryCache.set(key, storageValue);
      return storageValue;
    }

    return null;
  }

  /**
   * 设置缓存（多层策略）
   */
  set(key, value, options = {}) {
    const {
      ttl = CACHE_CONFIG.memory.ttl,
      persist = false, // 是否持久化到LocalStorage
      layers = ['memory', 'storage'], // 使用的缓存层
    } = options;

    // 设置内存缓存
    if (layers.includes('memory')) {
      this.memoryCache.set(key, value, ttl);
    }

    // 设置持久化缓存
    if (persist && layers.includes('storage')) {
      this.localStorageCache.set(key, value, ttl);
    }
  }

  /**
   * 删除缓存
   */
  delete(key) {
    this.memoryCache.delete(key);
    this.localStorageCache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(layer = 'all') {
    if (layer === 'all' || layer === 'memory') {
      this.memoryCache.clear();
    }

    if (layer === 'all' || layer === 'storage') {
      this.localStorageCache.clear();
    }
  }

  /**
   * API响应缓存
   */
  cacheApiResponse(url, response, options = {}) {
    const key = `api_${btoa(url)}`;
    const { ttl = CACHE_CONFIG.api.ttl } = options;

    this.set(
      key,
      {
        response,
        timestamp: Date.now(),
        url,
      },
      {
        ttl,
        persist: true,
      },
    );
  }

  /**
   * 获取API缓存响应
   */
  getApiResponse(url) {
    const key = `api_${btoa(url)}`;
    const cached = this.get(key);

    if (!cached) {
      return null;
    }

    // 检查缓存新鲜度
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_CONFIG.api.maxAge) {
      // 缓存过期但仍返回（用于离线模式）
      console.log(`API cache stale for ${url}, age: ${age}ms`);
    }

    return cached.response;
  }

  /**
   * 组件渲染缓存
   */
  cacheComponentRender(componentName, props, renderResult, ttl = 2 * 60 * 1000) {
    const key = `component_${componentName}_${JSON.stringify(props)}`;
    this.set(key, renderResult, { ttl, persist: false });
  }

  /**
   * 获取组件渲染缓存
   */
  getComponentRender(componentName, props) {
    const key = `component_${componentName}_${JSON.stringify(props)}`;
    return this.get(key);
  }

  /**
   * 启动定期清理定时器
   */
  startCleanupTimer() {
    // 每小时清理一次过期缓存
    setInterval(
      () => {
        this.localStorageCache.cleanup();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      memory: {
        size: this.memoryCache.size(),
        maxSize: CACHE_CONFIG.memory.maxSize,
      },
      storage: {
        // LocalStorage大小估算（简化版）
        estimatedSize: JSON.stringify(localStorage).length,
        maxSize: CACHE_CONFIG.localStorage.maxSize,
      },
    };
  }
}

// 创建单例实例
const cacheService = new CacheService();

export default cacheService;

// 导出便捷方法
export const getCache = (key, options) => cacheService.get(key, options);
export const setCache = (key, value, options) => cacheService.set(key, value, options);
export const deleteCache = (key) => cacheService.delete(key);
export const clearCache = (layer) => cacheService.clear(layer);
export const cacheApiResponse = (url, response, options) =>
  cacheService.cacheApiResponse(url, response, options);
export const getApiResponse = (url) => cacheService.getApiResponse(url);
export const cacheComponentRender = (componentName, props, renderResult, ttl) =>
  cacheService.cacheComponentRender(componentName, props, renderResult, ttl);
export const getComponentRender = (componentName, props) =>
  cacheService.getComponentRender(componentName, props);
export const getCacheStats = () => cacheService.getStats();
