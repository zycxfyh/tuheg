import { z } from 'zod'
export declare const envSchema: z.ZodObject<
  {
    DATABASE_URL: z.ZodString
    DB_CONNECTION_LIMIT: z.ZodDefault<z.ZodNumber>
    DB_POOL_TIMEOUT: z.ZodDefault<z.ZodNumber>
    DB_IDLE_TIMEOUT: z.ZodDefault<z.ZodNumber>
    REDIS_URL: z.ZodOptional<z.ZodString>
    REDIS_HOST: z.ZodDefault<z.ZodString>
    REDIS_PORT: z.ZodDefault<z.ZodNumber>
    ENCRYPTION_KEY: z.ZodString
    ENCRYPTION_USE_SALT: z.ZodDefault<
      z.ZodPipeline<z.ZodEffects<z.ZodString, boolean, string>, z.ZodBoolean>
    >
    ENCRYPTION_ALGORITHM: z.ZodDefault<z.ZodString>
    SENTRY_DSN: z.ZodOptional<z.ZodString>
    SENTRY_ENVIRONMENT: z.ZodDefault<z.ZodString>
    SENTRY_TRACES_SAMPLE_RATE: z.ZodDefault<
      z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>
    >
    FALLBACK_API_KEY: z.ZodOptional<z.ZodString>
    FALLBACK_MODEL_ID: z.ZodDefault<z.ZodString>
    FALLBACK_BASE_URL: z.ZodOptional<z.ZodString>
    NODE_ENV: z.ZodDefault<z.ZodEnum<['development', 'production', 'test']>>
    PORT: z.ZodDefault<z.ZodNumber>
    CORS_ORIGIN: z.ZodDefault<z.ZodString>
    QDRANT_URL: z.ZodDefault<z.ZodString>
    QDRANT_API_KEY: z.ZodOptional<z.ZodString>
    CLERK_SECRET_KEY: z.ZodOptional<z.ZodString>
    CLERK_PUBLISHABLE_KEY: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    FALLBACK_MODEL_ID: string
    DATABASE_URL: string
    DB_CONNECTION_LIMIT: number
    DB_POOL_TIMEOUT: number
    DB_IDLE_TIMEOUT: number
    REDIS_HOST: string
    REDIS_PORT: number
    ENCRYPTION_KEY: string
    ENCRYPTION_USE_SALT: boolean
    ENCRYPTION_ALGORITHM: string
    SENTRY_ENVIRONMENT: string
    SENTRY_TRACES_SAMPLE_RATE: number
    NODE_ENV: 'development' | 'production' | 'test'
    PORT: number
    CORS_ORIGIN: string
    QDRANT_URL: string
    FALLBACK_API_KEY?: string | undefined
    FALLBACK_BASE_URL?: string | undefined
    REDIS_URL?: string | undefined
    SENTRY_DSN?: string | undefined
    QDRANT_API_KEY?: string | undefined
    CLERK_SECRET_KEY?: string | undefined
    CLERK_PUBLISHABLE_KEY?: string | undefined
  },
  {
    DATABASE_URL: string
    ENCRYPTION_KEY: string
    FALLBACK_API_KEY?: string | undefined
    FALLBACK_MODEL_ID?: string | undefined
    FALLBACK_BASE_URL?: string | undefined
    REDIS_URL?: string | undefined
    DB_CONNECTION_LIMIT?: number | undefined
    DB_POOL_TIMEOUT?: number | undefined
    DB_IDLE_TIMEOUT?: number | undefined
    REDIS_HOST?: string | undefined
    REDIS_PORT?: number | undefined
    ENCRYPTION_USE_SALT?: string | undefined
    ENCRYPTION_ALGORITHM?: string | undefined
    SENTRY_DSN?: string | undefined
    SENTRY_ENVIRONMENT?: string | undefined
    SENTRY_TRACES_SAMPLE_RATE?: string | undefined
    NODE_ENV?: 'development' | 'production' | 'test' | undefined
    PORT?: number | undefined
    CORS_ORIGIN?: string | undefined
    QDRANT_URL?: string | undefined
    QDRANT_API_KEY?: string | undefined
    CLERK_SECRET_KEY?: string | undefined
    CLERK_PUBLISHABLE_KEY?: string | undefined
  }
>
export type Env = z.infer<typeof envSchema>
export declare function validateEnv(): Env
//# sourceMappingURL=env.schema.d.ts.map
