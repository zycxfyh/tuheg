import {
  type AiModelConfig,
  type AiProviderType,
  AiRequest,
  AiResponse,
  type IAiProvider,
} from '@tuheg/abstractions'

/**
 * 扩展的AI提供商接口，包含额外的方法用于提供商管理
 */
export interface IProvider extends IAiProvider {
  /**
   * 获取提供商健康状态
   */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    latency: number
    errorRate: number
  }>

  /**
   * 获取提供商使用统计
   */
  getUsageStats(): Promise<{
    requests: number
    tokens: number
    cost: number
    period: { start: Date; end: Date }
  }>

  /**
   * 验证提供商配置
   */
  validateConfiguration(): Promise<{
    valid: boolean
    errors?: string[]
  }>
}

/**
 * 提供商配置接口
 */
export interface ProviderConfig {
  /** API密钥 */
  apiKey: string

  /** API基础URL (可选，用于自定义端点) */
  baseUrl?: string

  /** 组织ID (用于OpenAI) */
  organizationId?: string

  /** 项目ID (用于某些提供商) */
  projectId?: string

  /** 请求超时时间(毫秒) */
  timeout?: number

  /** 重试配置 */
  retry?: {
    maxAttempts: number
    initialDelay: number
    maxDelay: number
    backoffMultiplier: number
  }

  /** 速率限制配置 */
  rateLimit?: {
    requestsPerMinute: number
    requestsPerHour: number
  }

  /** 缓存配置 */
  cache?: {
    enabled: boolean
    ttl: number
  }
}

/**
 * 提供商注册信息
 */
export interface ProviderRegistration {
  /** 提供商类型 */
  type: AiProviderType

  /** 提供商类 */
  providerClass: new (
    config: ProviderConfig
  ) => IProvider

  /** 支持的模型 */
  supportedModels: AiModelConfig[]

  /** 提供商元信息 */
  metadata: {
    name: string
    description: string
    website?: string
    pricingUrl?: string
  }
}

/**
 * 提供商健康检查结果
 */
export interface ProviderHealthCheck {
  /** 提供商类型 */
  provider: AiProviderType

  /** 健康状态 */
  status: 'healthy' | 'unhealthy' | 'degraded'

  /** 响应时间(毫秒) */
  latency: number

  /** 错误率 (0-1) */
  errorRate: number

  /** 最后检查时间 */
  lastChecked: Date

  /** 详细信息 */
  details?: {
    totalRequests: number
    failedRequests: number
    averageLatency: number
  }
}
