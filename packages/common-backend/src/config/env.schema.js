Object.defineProperty(exports, '__esModule', { value: true })
exports.envSchema = void 0
exports.validateEnv = validateEnv
const zod_1 = require('zod')
exports.envSchema = zod_1.z.object({
  DATABASE_URL: zod_1.z.string().url('DATABASE_URL 必须是有效的 URL'),
  DB_CONNECTION_LIMIT: zod_1.z.coerce.number().int().min(1).max(100).default(20),
  DB_POOL_TIMEOUT: zod_1.z.coerce.number().int().min(1).max(300).default(20),
  DB_IDLE_TIMEOUT: zod_1.z.coerce.number().int().min(1).max(3600).default(300),
  REDIS_URL: zod_1.z.string().url('REDIS_URL 必须是有效的 URL').optional(),
  REDIS_HOST: zod_1.z.string().default('localhost'),
  REDIS_PORT: zod_1.z.coerce.number().int().positive().default(6379),
  ENCRYPTION_KEY: zod_1.z.string().min(32, 'ENCRYPTION_KEY 至少需要 32 个字符'),
  ENCRYPTION_USE_SALT: zod_1.z
    .string()
    .transform((val) => ['true', '1', 'yes'].includes(val.toLowerCase()))
    .pipe(zod_1.z.boolean())
    .default('false'),
  ENCRYPTION_ALGORITHM: zod_1.z.string().default('aes-256-gcm'),
  SENTRY_DSN: zod_1.z.string().url('SENTRY_DSN 必须是有效的 URL').optional(),
  SENTRY_ENVIRONMENT: zod_1.z.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: zod_1.z
    .string()
    .transform((val) => Number.parseFloat(val))
    .pipe(zod_1.z.number().min(0).max(1))
    .default('1.0'),
  FALLBACK_API_KEY: zod_1.z.string().optional(),
  FALLBACK_MODEL_ID: zod_1.z.string().default('deepseek-chat'),
  FALLBACK_BASE_URL: zod_1.z.string().url().optional(),
  NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
  PORT: zod_1.z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: zod_1.z.string().url().default('http://localhost:5173'),
  QDRANT_URL: zod_1.z.string().url().default('http://localhost:6333'),
  QDRANT_API_KEY: zod_1.z.string().optional(),
  CLERK_SECRET_KEY: zod_1.z.string().optional(),
  CLERK_PUBLISHABLE_KEY: zod_1.z.string().optional(),
})
function validateEnv() {
  try {
    return exports.envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof zod_1.z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      })
      throw new Error(
        `环境变量验证失败:\n${errorMessages.join('\n')}\n\n请检查 .env 文件或环境变量配置。`
      )
    }
    throw error
  }
}
//# sourceMappingURL=env.schema.js.map
