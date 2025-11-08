import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import {
  type AiModel,
  type AiProvider,
  type ApiEndpoint,
  type HttpMethod,
  ModelStatus,
  type Prisma,
  type ProviderStatus,
} from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'

export interface ProviderConfig {
  name: string
  displayName: string
  description?: string
  baseUrl: string
  apiVersion: string
  rateLimit?: number
  priority?: number
  config?: Record<string, any>
  endpoints?: ProviderEndpointConfig[]
}

export interface ProviderEndpointConfig {
  name: string
  path: string
  method: HttpMethod
  description?: string
  parameters?: Record<string, any>
  headers?: Record<string, any>
  rateLimit?: number
  timeout?: number
  retryConfig?: {
    maxRetries?: number
    backoffMultiplier?: number
    initialDelay?: number
  }
}

export interface ModelConfig {
  name: string
  displayName: string
  version: string
  modelType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'MULTIMODAL' | 'EMBEDDING'
  capabilities?: string[]
  contextWindow?: number
  maxTokens?: number
  pricing?: {
    input?: number // per 1K tokens
    output?: number // per 1K tokens
    image?: number // per image
  }
}

@Injectable()
export class AiProviderService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== AI提供商管理 ====================

  /**
   * 注册新的AI提供商
   */
  async registerProvider(config: ProviderConfig): Promise<AiProvider> {
    // 检查提供商名称是否已存在
    const existingProvider = await this.prisma.aiProvider.findUnique({
      where: { name: config.name },
    })

    if (existingProvider) {
      throw new BadRequestException('Provider name already exists')
    }

    const provider = await this.prisma.aiProvider.create({
      data: {
        name: config.name,
        displayName: config.displayName,
        description: config.description,
        baseUrl: config.baseUrl,
        apiVersion: config.apiVersion,
        rateLimit: config.rateLimit || 60,
        priority: config.priority || 1,
        config: config.config || {},
        endpoints: {
          create:
            config.endpoints?.map((endpoint) => ({
              name: endpoint.name,
              path: endpoint.path,
              method: endpoint.method,
              description: endpoint.description,
              parameters: endpoint.parameters || {},
              headers: endpoint.headers || {},
              rateLimit: endpoint.rateLimit || 60,
              timeout: endpoint.timeout || 30000,
              retryConfig: endpoint.retryConfig || {},
            })) || [],
        },
      },
      include: {
        endpoints: true,
        models: true,
      },
    })

    this.eventEmitter.emit('ai.provider.registered', provider)
    return provider
  }

  /**
   * 更新AI提供商配置
   */
  async updateProvider(id: string, updates: Partial<ProviderConfig>): Promise<AiProvider> {
    const provider = await this.prisma.aiProvider.update({
      where: { id },
      data: {
        displayName: updates.displayName,
        description: updates.description,
        baseUrl: updates.baseUrl,
        apiVersion: updates.apiVersion,
        rateLimit: updates.rateLimit,
        priority: updates.priority,
        config: updates.config,
        updatedAt: new Date(),
      },
      include: {
        endpoints: true,
        models: true,
      },
    })

    this.eventEmitter.emit('ai.provider.updated', provider)
    return provider
  }

  /**
   * 删除AI提供商
   */
  async deleteProvider(id: string): Promise<void> {
    // 检查是否有模型在使用此提供商
    const modelCount = await this.prisma.aiModel.count({
      where: { providerId: id },
    })

    if (modelCount > 0) {
      throw new BadRequestException('Cannot delete provider with active models')
    }

    await this.prisma.aiProvider.delete({
      where: { id },
    })

    this.eventEmitter.emit('ai.provider.deleted', { id })
  }

  /**
   * 获取AI提供商详情
   */
  async getProvider(id: string): Promise<AiProvider> {
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id },
      include: {
        models: {
          where: { status: 'ACTIVE' },
        },
        endpoints: true,
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    })

    if (!provider) {
      throw new NotFoundException('AI provider not found')
    }

    return provider
  }

  /**
   * 获取所有AI提供商
   */
  async getProviders(filters?: {
    status?: ProviderStatus
    includeInactive?: boolean
  }): Promise<AiProvider[]> {
    const where: Prisma.AiProviderWhereInput = {}

    if (filters?.status) {
      where.status = filters.status
    } else if (!filters?.includeInactive) {
      where.status = 'ACTIVE'
    }

    return this.prisma.aiProvider.findMany({
      where,
      include: {
        models: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            displayName: true,
            status: true,
          },
        },
        _count: {
          select: {
            models: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
    })
  }

  /**
   * 更新提供商状态
   */
  async updateProviderStatus(id: string, status: ProviderStatus): Promise<AiProvider> {
    const provider = await this.prisma.aiProvider.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })

    this.eventEmitter.emit('ai.provider.statusChanged', { provider, status })
    return provider
  }

  // ==================== AI模型管理 ====================

  /**
   * 注册AI模型
   */
  async registerModel(providerId: string, config: ModelConfig): Promise<AiModel> {
    // 验证提供商存在
    const provider = await this.getProvider(providerId)

    const model = await this.prisma.aiModel.create({
      data: {
        providerId,
        name: config.name,
        displayName: config.displayName,
        version: config.version,
        modelType: config.modelType,
        capabilities: config.capabilities || [],
        contextWindow: config.contextWindow || 4096,
        maxTokens: config.maxTokens || 2048,
        pricing: config.pricing || {},
        status: 'ACTIVE',
      },
    })

    this.eventEmitter.emit('ai.model.registered', { model, provider })
    return model
  }

  /**
   * 获取AI模型详情
   */
  async getModel(id: string): Promise<AiModel> {
    const model = await this.prisma.aiModel.findUnique({
      where: { id },
      include: {
        provider: true,
        configurations: {
          select: { id: true, ownerId: true },
        },
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            usages: true,
            configurations: true,
          },
        },
      },
    })

    if (!model) {
      throw new NotFoundException('AI model not found')
    }

    return model
  }

  /**
   * 获取提供商的所有模型
   */
  async getProviderModels(providerId: string, includeInactive = false): Promise<AiModel[]> {
    const where: Prisma.AiModelWhereInput = { providerId }

    if (!includeInactive) {
      where.status = 'ACTIVE'
    }

    return this.prisma.aiModel.findMany({
      where,
      include: {
        provider: {
          select: { name: true, displayName: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 更新模型配置
   */
  async updateModel(id: string, updates: Partial<ModelConfig>): Promise<AiModel> {
    const model = await this.prisma.aiModel.update({
      where: { id },
      data: {
        displayName: updates.displayName,
        version: updates.version,
        modelType: updates.modelType,
        capabilities: updates.capabilities,
        contextWindow: updates.contextWindow,
        maxTokens: updates.maxTokens,
        pricing: updates.pricing,
        updatedAt: new Date(),
      },
      include: { provider: true },
    })

    this.eventEmitter.emit('ai.model.updated', model)
    return model
  }

  /**
   * 删除AI模型
   */
  async deleteModel(id: string): Promise<void> {
    // 检查是否有配置在使用此模型
    const configCount = await this.prisma.aiConfiguration.count({
      where: { modelId: id },
    })

    if (configCount > 0) {
      throw new BadRequestException('Cannot delete model that is being used in configurations')
    }

    await this.prisma.aiModel.delete({
      where: { id },
    })

    this.eventEmitter.emit('ai.model.deleted', { id })
  }

  /**
   * 根据能力查找合适的模型
   */
  async findModelsByCapability(capability: string, limit = 10): Promise<AiModel[]> {
    return this.prisma.aiModel.findMany({
      where: {
        status: 'ACTIVE',
        capabilities: {
          path: '$[*]',
          string_contains: capability,
        },
      },
      include: {
        provider: {
          select: { name: true, displayName: true, status: true, priority: true },
        },
      },
      orderBy: [{ performance: 'desc' }, { provider: { priority: 'desc' } }],
      take: limit,
    })
  }

  // ==================== API端点管理 ====================

  /**
   * 获取提供商的API端点
   */
  async getProviderEndpoints(providerId: string): Promise<ApiEndpoint[]> {
    return this.prisma.apiEndpoint.findMany({
      where: { providerId },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * 更新API端点配置
   */
  async updateEndpoint(id: string, updates: Partial<ProviderEndpointConfig>): Promise<ApiEndpoint> {
    const endpoint = await this.prisma.apiEndpoint.update({
      where: { id },
      data: {
        path: updates.path,
        method: updates.method,
        description: updates.description,
        parameters: updates.parameters,
        headers: updates.headers,
        rateLimit: updates.rateLimit,
        timeout: updates.timeout,
        retryConfig: updates.retryConfig,
      },
    })

    this.eventEmitter.emit('ai.endpoint.updated', endpoint)
    return endpoint
  }

  // ==================== 提供商健康检查 ====================

  /**
   * 执行提供商健康检查
   */
  async healthCheck(providerId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    message: string
    latency: number
    uptime: number
  }> {
    const provider = await this.getProvider(providerId)

    try {
      // 简化的健康检查逻辑
      const startTime = Date.now()
      // 这里应该实际调用提供商的API进行测试
      const latency = Date.now() - startTime

      // 获取最近的指标
      const recentMetrics = await this.prisma.providerMetrics.findMany({
        where: { providerId },
        orderBy: { timestamp: 'desc' },
        take: 10,
      })

      const avgUptime =
        recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.uptime, 0) / recentMetrics.length
          : 100

      const avgErrorRate =
        recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.errors / Math.max(m.requests, 1), 0) /
            recentMetrics.length
          : 0

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      let message = 'Provider is operating normally'

      if (avgUptime < 95) {
        status = 'degraded'
        message = 'Provider uptime is below acceptable threshold'
      }

      if (avgErrorRate > 0.1) {
        status = 'unhealthy'
        message = 'Provider error rate is too high'
      }

      if (latency > 5000) {
        status = 'degraded'
        message = 'Provider response time is slow'
      }

      return {
        status,
        message,
        latency,
        uptime: avgUptime,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error.message}`,
        latency: 0,
        uptime: 0,
      }
    }
  }

  /**
   * 批量健康检查
   */
  async batchHealthCheck(): Promise<Record<string, any>> {
    const providers = await this.getProviders()
    const results: Record<string, any> = {}

    for (const provider of providers) {
      results[provider.id] = await this.healthCheck(provider.id)
    }

    return results
  }

  // ==================== 提供商统计 ====================

  /**
   * 获取提供商使用统计
   */
  async getProviderStats(providerId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    let startTime: Date

    switch (period) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const [requestCount, errorCount, avgLatency, modelStats] = await Promise.all([
      this.prisma.modelUsage.count({
        where: {
          model: { providerId },
          createdAt: { gte: startTime },
        },
      }),
      this.prisma.modelUsage.count({
        where: {
          model: { providerId },
          status: { not: 'SUCCESS' },
          createdAt: { gte: startTime },
        },
      }),
      this.prisma.modelUsage.aggregate({
        where: {
          model: { providerId },
          createdAt: { gte: startTime },
        },
        _avg: { latency: true },
      }),
      this.prisma.aiModel.groupBy({
        by: ['id'],
        where: { providerId },
        _count: { usages: true },
      }),
    ])

    const successRate = requestCount > 0 ? ((requestCount - errorCount) / requestCount) * 100 : 0

    return {
      period,
      totalRequests: requestCount,
      errorCount,
      successRate: Math.round(successRate * 100) / 100,
      averageLatency: avgLatency._avg.latency || 0,
      modelCount: modelStats.length,
      mostUsedModel: modelStats.reduce((max, current) =>
        current._count.usages > max._count.usages ? current : max
      ),
    }
  }

  // ==================== 内置提供商配置 ====================

  /**
   * 初始化内置AI提供商
   */
  async initializeBuiltInProviders(): Promise<void> {
    const builtInProviders = [
      {
        name: 'openai',
        displayName: 'OpenAI',
        description: 'OpenAI GPT系列模型提供商',
        baseUrl: 'https://api.openai.com/v1',
        apiVersion: 'v1',
        endpoints: [
          {
            name: 'chat_completions',
            path: '/chat/completions',
            method: 'POST',
            description: 'Chat completions API',
          },
          {
            name: 'embeddings',
            path: '/embeddings',
            method: 'POST',
            description: 'Embeddings API',
          },
        ],
      },
      {
        name: 'anthropic',
        displayName: 'Anthropic',
        description: 'Anthropic Claude系列模型提供商',
        baseUrl: 'https://api.anthropic.com',
        apiVersion: 'v1',
        endpoints: [
          {
            name: 'messages',
            path: '/v1/messages',
            method: 'POST',
            description: 'Messages API for Claude',
          },
        ],
      },
      {
        name: 'deepseek',
        displayName: 'DeepSeek',
        description: 'DeepSeek AI模型提供商',
        baseUrl: 'https://api.deepseek.com',
        apiVersion: 'v1',
        endpoints: [
          {
            name: 'chat_completions',
            path: '/v1/chat/completions',
            method: 'POST',
            description: 'Chat completions API',
          },
        ],
      },
    ]

    for (const providerConfig of builtInProviders) {
      try {
        await this.registerProvider(providerConfig)
      } catch (error) {
        // 忽略已存在的提供商
        if (!error.message.includes('already exists')) {
          console.error(`Failed to register provider ${providerConfig.name}:`, error)
        }
      }
    }
  }
}
