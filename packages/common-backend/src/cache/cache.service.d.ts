import type { Cache } from 'cache-manager'
export interface CacheOptions {
  ttl?: number
  prefix?: string
}
export declare class CacheService {
  private readonly cacheManager
  private readonly logger
  constructor(cacheManager: Cache)
  get<T>(key: string, options?: CacheOptions): Promise<T | undefined>
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
  delete(key: string, prefix?: string): Promise<void>
  clear(): Promise<void>
  getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>
  private buildKey
}
//# sourceMappingURL=cache.service.d.ts.map
