// 文件路径: packages/common-backend/src/index.ts

// Core exports
export * from './config/config.module'
export * from './config/configuration.service'
export * from './config/env.schema'
export * from './config/env-loader'
export * from './prisma/prisma.module'
export * from './prisma/prisma.service'

// AI exports (excluding problematic LangChain dependencies)
export * from './ai/ai-provider.factory'
export * from './ai/dynamic-ai-scheduler.service'
export * from './ai/json-cleaner'
export * from './ai/retry-strategy'

// Cache exports
export * from './cache/cache.decorator'
export * from './cache/cache.module'
export * from './cache/cache.service'

// Event Bus exports
export * from './event-bus/event-bus.module'
export * from './event-bus/event-bus.service'

// Exceptions exports
export * from './exceptions/ai-exception'
export * from './exceptions/rule-engine-exception'

// Health exports
export * from './health/health.module'
export * from './health/health.controller'

// DTO exports
export * from './dto/create-ai-settings.dto'
export * from './dto/create-game.dto'
export * from './dto/submit-action.dto'
export * from './dto/update-ai-settings.dto'
export * from './dto/update-character.dto'

// Pipes exports
export * from './pipes/zod-validation.pipe'

// Prompts exports
export * from './prompts/prompt-manager.module'
export * from './prompts/prompt-manager.service'

// Rate limit exports
export * from './rate-limit/rate-limit.guard'
export * from './rate-limit/rate-limit.module'
export * from './rate-limit/rate-limit.service'

// Reactive exports
export * from './reactive/event-stream'
export * from './reactive/reactive.module'

// Resilience exports
export * from './resilience/circuit-breaker.service'

// Types exports
export * from './types/index'

// Validation exports
export * from './validation/enhanced-validator'

// Observability exports
export * from './observability/observability.module'
export * from './observability/performance-monitor.service'
export * from './observability/sentry.config'
export * from './observability/sentry.module'

// Error exports
export * from './errors/error-classification'
export * from './errors/prompt-injection-detected.exception'
export * from './errors/message-handler-helper'
export * from './errors/websocket-error-helper'
