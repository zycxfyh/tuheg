// 文件路径: packages/common-backend/src/config/configuration.service.ts
// 核心理念: 类型安全的配置服务，提供便捷的配置访问接口

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from './env.schema'

/**
 * @class ConfigurationService
 * @description 类型安全的配置服务
 * 提供对所有环境变量的类型安全访问
 */
@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  // --- 数据库配置 ---
  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true })
  }

  get dbConnectionLimit(): number {
    return this.configService.get('DB_CONNECTION_LIMIT', { infer: true })
  }

  get dbPoolTimeout(): number {
    return this.configService.get('DB_POOL_TIMEOUT', { infer: true })
  }

  get dbIdleTimeout(): number {
    return this.configService.get('DB_IDLE_TIMEOUT', { infer: true })
  }

  // --- Redis 配置 ---
  get redisUrl(): string | undefined {
    return this.configService.get('REDIS_URL', { infer: true })
  }

  get redisHost(): string {
    return this.configService.get('REDIS_HOST', { infer: true })
  }

  get redisPort(): number {
    return this.configService.get('REDIS_PORT', { infer: true })
  }

  // --- 加密配置 ---
  get encryptionKey(): string {
    return this.configService.get('ENCRYPTION_KEY', { infer: true })
  }

  get encryptionSalt(): string {
    return this.configService.get('ENCRYPTION_SALT', { infer: true })
  }

  get encryptionUseSalt(): boolean {
    return this.configService.get('ENCRYPTION_USE_SALT', { infer: true })
  }

  get encryptionAlgorithm(): string {
    return this.configService.get('ENCRYPTION_ALGORITHM', { infer: true })
  }

  // --- Sentry 配置 ---
  get sentryDsn(): string | undefined {
    return this.configService.get('SENTRY_DSN', { infer: true })
  }

  get sentryEnvironment(): string {
    return this.configService.get('SENTRY_ENVIRONMENT', { infer: true })
  }

  get sentryTracesSampleRate(): number {
    return this.configService.get('SENTRY_TRACES_SAMPLE_RATE', { infer: true })
  }

  // --- AI Provider 配置 ---
  get fallbackApiKey(): string | undefined {
    return this.configService.get('FALLBACK_API_KEY', { infer: true })
  }

  get fallbackModelId(): string {
    return this.configService.get('FALLBACK_MODEL_ID', { infer: true })
  }

  get fallbackBaseUrl(): string | undefined {
    return this.configService.get('FALLBACK_BASE_URL', { infer: true })
  }

  // --- 应用配置 ---
  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', { infer: true })
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true })
  }

  get corsOrigin(): string {
    return this.configService.get('CORS_ORIGIN', { infer: true })
  }

  // --- Qdrant 配置 ---
  get qdrantUrl(): string {
    return this.configService.get('QDRANT_URL', { infer: true })
  }

  get qdrantApiKey(): string | undefined {
    return this.configService.get('QDRANT_API_KEY', { infer: true })
  }

  // --- Clerk 配置 ---
  get clerkSecretKey(): string | undefined {
    return this.configService.get('CLERK_SECRET_KEY', { infer: true })
  }

  get clerkPublishableKey(): string | undefined {
    return this.configService.get('CLERK_PUBLISHABLE_KEY', { infer: true })
  }

  get clerkWebhookSecretKey(): string | undefined {
    return this.configService.get('CLERK_WEBHOOK_SECRET_KEY', { infer: true })
  }

  // --- RabbitMQ 配置 ---
  get rabbitmqUrl(): string {
    return this.configService.get('RABBITMQ_URL', { infer: true })
  }

  // --- JWT 配置 ---
  get jwtSecret(): string | undefined {
    return this.configService.get('JWT_SECRET', { infer: true })
  }

  get jwtExpirationSeconds(): number {
    return this.configService.get('JWT_EXPIRATION_SECONDS', { infer: true })
  }

  // --- 服务端口配置 ---
  get backendGatewayPort(): number {
    return this.configService.get('BACKEND_GATEWAY_PORT', { infer: true })
  }

  get creationAgentHttpPort(): number {
    return this.configService.get('CREATION_AGENT_HTTP_PORT', { infer: true })
  }

  get logicAgentHttpPort(): number {
    return this.configService.get('LOGIC_AGENT_HTTP_PORT', { infer: true })
  }

  get narrativeAgentHttpPort(): number {
    return this.configService.get('NARRATIVE_AGENT_HTTP_PORT', { infer: true })
  }

  // --- 便捷方法 ---
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development'
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production'
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test'
  }

  /**
   * 获取配置值，如果未设置则抛出错误
   */
  getOrThrow<T extends keyof Env>(key: T): Env[T] {
    return this.configService.getOrThrow(key, { infer: true })
  }

  /**
   * 获取配置值，支持默认值
   */
  get<T extends keyof Env>(key: T, defaultValue?: Env[T]): Env[T] {
    return this.configService.get(key, defaultValue, { infer: true })
  }
}
