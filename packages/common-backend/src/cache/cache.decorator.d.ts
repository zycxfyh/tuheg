export declare const CACHE_KEY = 'cache:key'
export declare const CACHE_TTL = 'cache:ttl'
export interface CacheDecoratorOptions {
  key?: string
  ttl?: number
  prefix?: string
}
export declare const Cache: (
  options?: CacheDecoratorOptions
) => (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => void
//# sourceMappingURL=cache.decorator.d.ts.map
