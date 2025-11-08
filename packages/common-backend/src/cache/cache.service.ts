// 文件路径: packages/common-backend/src/cache/cache.service.ts
// 核心理念: 多级缓存策略，支持内存和 Redis

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import type { Cache } from 'cache-manager'

/**
 * 装饰器：为方法添加统一的错误日志记录
 */
function withErrorLogging(operation: string, returnValue?: any) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    const logger = new Logger(target.constructor.name)

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        logger.error(`Failed to ${operation}:`, error)
        return returnValue
      }
    }
  }
}

/**
 * @interface CacheOptions
 * @description 缓存选项
 */
export interface CacheOptions {
  /** TTL（秒） */
  ttl?: number
  /** 缓存键前缀 */
  prefix?: string
}

/**
 * @service CacheService
 * @description 缓存服务
 * 提供统一的缓存接口，支持内存和 Redis
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * @method get
   * @description 获取缓存值
   *
   * @example
   * ```typescript
   * const value = await cacheService.get<string>('user:123');
   * ```
   */
  @withErrorLogging('get cache key', undefined)
  async get<T>(key: string, options?: CacheOptions): Promise<T | undefined> {
    const fullKey = this.buildKey(key, options?.prefix)
    const value = await this.cacheManager.get<T>(fullKey)
    return value
  }

  /**
   * @method set
   * @description 设置缓存值
   *
   * @example
   * ```typescript
   * await cacheService.set('user:123', userData, { ttl: 3600 });
   * ```
   */
  @withErrorLogging('set cache key')
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.prefix)
    const ttl = options?.ttl ? options.ttl * 1000 : undefined // 转换为毫秒
    await this.cacheManager.set(fullKey, value, ttl)
  }

  /**
   * @method delete
   * @description 删除缓存
   */
  @withErrorLogging('delete cache key')
  async delete(key: string, prefix?: string): Promise<void> {
    const fullKey = this.buildKey(key, prefix)
    await this.cacheManager.del(fullKey)
  }

  /**
   * @method clear
   * @description 清空所有缓存
   */
  @withErrorLogging('clear cache')
  async clear(): Promise<void> {
    // 使用cache-manager的store接口来清空缓存
    const store = (this.cacheManager as any).store
    if (store && typeof store.reset === 'function') {
      await store.reset()
    } else {
      // 如果没有reset方法，记录警告但不抛出错误
      this.logger.warn('Cache store does not support reset operation')
    }
  }

  /**
   * @method getOrSet
   * @description 获取缓存，如果不存在则设置
   *
   * @example
   * ```typescript
   * const user = await cacheService.getOrSet(
   *   'user:123',
   *   async () => await this.userService.findById('123'),
   *   { ttl: 3600 },
   * );
   * ```
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key, options)
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  /**
   * @method buildKey
   * @description 构建完整的缓存键
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key
  }
}
