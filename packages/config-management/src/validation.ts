import { z } from 'zod';

/**
 * 数据库配置验证模式
 */
export const databaseConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(5432),
  username: z.string().default('postgres'),
  password: z.string().optional(),
  database: z.string().default('creation_ring'),
  ssl: z.boolean().default(false),
  connectionTimeoutMillis: z.number().default(10000),
  queryTimeoutMillis: z.number().default(30000),
});

/**
 * Redis配置验证模式
 */
export const redisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(6379),
  password: z.string().optional(),
  db: z.number().default(0),
  keyPrefix: z.string().optional(),
  retryDelayOnFailover: z.number().default(100),
  maxRetriesPerRequest: z.number().default(3),
});

/**
 * AI提供商配置验证模式
 */
export const aiProviderConfigSchema = z.object({
  openai: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    organizationId: z.string().optional(),
    timeout: z.number().default(30000),
  }).optional(),
  anthropic: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    timeout: z.number().default(30000),
  }).optional(),
  google: z.object({
    apiKey: z.string().optional(),
    projectId: z.string().optional(),
    timeout: z.number().default(30000),
  }).optional(),
});

/**
 * 服务器配置验证模式
 */
export const serverConfigSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default('localhost'),
  environment: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string())]).default('*'),
    credentials: z.boolean().default(true),
  }),
  rateLimit: z.object({
    ttl: z.number().default(60),
    limit: z.number().default(100),
  }).optional(),
});

/**
 * 监控配置验证模式
 */
export const monitoringConfigSchema = z.object({
  enabled: z.boolean().default(true),
  sentry: z.object({
    dsn: z.string().optional(),
    environment: z.string().optional(),
    release: z.string().optional(),
    sampleRate: z.number().default(1.0),
  }).optional(),
  metrics: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().default(60000), // 1分钟
  }).optional(),
});

/**
 * 完整应用配置验证模式
 */
export const appConfigSchema = z.object({
  database: databaseConfigSchema,
  redis: redisConfigSchema,
  ai: aiProviderConfigSchema,
  server: serverConfigSchema,
  monitoring: monitoringConfigSchema,
});

/**
 * 验证配置并返回类型安全的结果
 */
export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Configuration validation failed${context ? ` for ${context}` : ''}: ${errorMessages.join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * 安全地验证配置，如果失败返回默认值
 */
export function validateConfigSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T,
  context?: string
): T {
  try {
    return validateConfig(schema, data, context);
  } catch (error) {
    console.warn(`Configuration validation warning${context ? ` for ${context}` : ''}:`, error.message);
    return defaultValue;
  }
}
