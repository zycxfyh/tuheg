import { EventEmitter } from 'node:events'

// AI服务类型定义
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'local'
  model: string
  apiKey: string
  baseURL?: string
  timeout: number
  retryAttempts: number
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  costLimit: {
    maxDailyCost: number
    maxMonthlyCost: number
  }
}

export interface AIRequest {
  id: string
  type: 'creation' | 'logic' | 'narrative' | 'analysis'
  prompt: string
  context?: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  timeout?: number
  metadata: {
    userId?: string
    sessionId: string
    timestamp: number
  }
}

export interface AIResponse {
  id: string
  requestId: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  latency: number
  model: string
  finishReason: string
  metadata: Record<string, any>
}

export interface ServiceHealth {
  provider: string
  model: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  errorRate: number
  lastChecked: number
  consecutiveFailures: number
}

// AI服务管理器
export class AIServiceManager extends EventEmitter {
  private services: Map<string, AIServiceConfig> = new Map()
  private healthStatus: Map<string, ServiceHealth> = new Map()
  private requestQueue: AIRequest[] = []
  private activeRequests: Map<string, AIRequest> = new Map()
  private costTracker: Map<string, { daily: number; monthly: number }> = new Map()

  // 请求处理统计
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    totalCost: 0,
    cacheHits: 0,
    cacheMisses: 0,
  }

  constructor() {
    super()
    this.initializeServices()
    this.startHealthMonitoring()
    this.startRequestProcessing()
  }

  // 初始化AI服务配置
  private initializeServices() {
    // OpenAI服务配置
    this.services.set('openai-gpt4', {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: process.env.OPENAI_API_KEY || '',
      timeout: 30000,
      retryAttempts: 3,
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 10000,
      },
      costLimit: {
        maxDailyCost: 10,
        maxMonthlyCost: 200,
      },
    })

    // Anthropic服务配置
    this.services.set('anthropic-claude', {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      timeout: 45000,
      retryAttempts: 3,
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 20000,
      },
      costLimit: {
        maxDailyCost: 15,
        maxMonthlyCost: 300,
      },
    })

    // 本地模型服务（备选）
    this.services.set('local-llama', {
      provider: 'local',
      model: 'llama-2-70b-chat',
      apiKey: '',
      baseURL: 'http://localhost:8000',
      timeout: 60000,
      retryAttempts: 2,
      rateLimit: {
        requestsPerMinute: 10,
        tokensPerMinute: 5000,
      },
      costLimit: {
        maxDailyCost: 0,
        maxMonthlyCost: 0,
      },
    })
  }

  // 智能路由选择最佳服务
  private selectBestService(request: AIRequest): AIServiceConfig | null {
    const availableServices = Array.from(this.services.values()).filter((service) =>
      this.isServiceHealthy(service)
    )

    if (availableServices.length === 0) {
      return null
    }

    // 根据请求类型和优先级选择服务
    const scoredServices = availableServices.map((service) => ({
      service,
      score: this.calculateServiceScore(service, request),
    }))

    scoredServices.sort((a, b) => b.score - a.score)
    return scoredServices[0].service
  }

  // 计算服务评分
  private calculateServiceScore(service: AIServiceConfig, request: AIRequest): number {
    let score = 100

    // 健康状态评分
    const health = this.healthStatus.get(`${service.provider}-${service.model}`)
    if (health) {
      if (health.status === 'healthy') score += 20
      else if (health.status === 'degraded') score -= 10
      else score -= 50

      // 延迟评分
      if (health.latency < 1000) score += 10
      else if (health.latency > 5000) score -= 15
    }

    // 成本评分（优先级越高，越能接受高成本）
    const cost = this.estimateCost(service, request)
    if (request.priority === 'critical') score += 10
    else if (cost > 0.01) score -= Math.min(20, cost * 1000)

    // 模型能力匹配评分
    score += this.calculateModelFitScore(service, request)

    // 负载均衡评分
    const activeRequests = Array.from(this.activeRequests.values()).filter(
      (req) => req.type === request.type
    ).length
    score -= Math.min(15, activeRequests * 2)

    return Math.max(0, score)
  }

  // 计算模型匹配度评分
  private calculateModelFitScore(service: AIServiceConfig, request: AIRequest): number {
    const modelCapabilities = {
      'gpt-4-turbo-preview': {
        creation: 95,
        logic: 90,
        narrative: 85,
        analysis: 80,
      },
      'claude-3-opus-20240229': {
        creation: 85,
        logic: 95,
        narrative: 90,
        analysis: 85,
      },
      'llama-2-70b-chat': {
        creation: 75,
        logic: 80,
        narrative: 70,
        analysis: 75,
      },
    }

    const capabilities = modelCapabilities[service.model as keyof typeof modelCapabilities]
    return capabilities ? capabilities[request.type] - 50 : 0 // 基准分50
  }

  // 估算请求成本
  private estimateCost(service: AIServiceConfig, request: AIRequest): number {
    const costPerToken = {
      'openai-gpt4': 0.00003,
      'anthropic-claude': 0.000015,
      'local-llama': 0,
    }

    const key = `${service.provider}-${service.model.split('-')[0]}`
    const tokenEstimate = request.prompt.length / 4 // 粗略估算

    return (costPerToken[key as keyof typeof costPerToken] || 0) * tokenEstimate
  }

  // 检查服务健康状态
  private isServiceHealthy(service: AIServiceConfig): boolean {
    const health = this.healthStatus.get(`${service.provider}-${service.model}`)
    return health ? health.status !== 'unhealthy' : true
  }

  // 发送AI请求
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      this.stats.totalRequests++
      this.activeRequests.set(request.id, request)

      // 检查缓存
      const cachedResponse = await this.checkCache(request)
      if (cachedResponse) {
        this.stats.cacheHits++
        return cachedResponse
      }

      this.stats.cacheMisses++

      // 选择最佳服务
      const service = this.selectBestService(request)
      if (!service) {
        throw new Error('No healthy AI service available')
      }

      // 检查成本限制
      if (!this.checkCostLimit(service, request)) {
        throw new Error('Cost limit exceeded')
      }

      // 发送请求
      const response = await this.executeRequest(service, request)

      // 更新统计
      this.stats.successfulRequests++
      this.updateCostTracker(service, response.cost)

      // 缓存响应
      await this.cacheResponse(request, response)

      // 发出成功事件
      this.emit('requestCompleted', { request, response, latency: response.latency })

      return response
    } catch (error) {
      this.stats.failedRequests++

      // 发出失败事件
      this.emit('requestFailed', { request, error, latency: Date.now() - startTime })

      throw error
    } finally {
      this.activeRequests.delete(request.id)
    }
  }

  // 执行具体请求
  private async executeRequest(service: AIServiceConfig, request: AIRequest): Promise<AIResponse> {
    const _startTime = Date.now()

    // 这里实现具体的AI服务调用逻辑
    // 实际实现会根据不同provider调用相应的API

    switch (service.provider) {
      case 'openai':
        return await this.callOpenAI(service, request)
      case 'anthropic':
        return await this.callAnthropic(service, request)
      case 'local':
        return await this.callLocal(service, request)
      default:
        throw new Error(`Unsupported provider: ${service.provider}`)
    }
  }

  // 调用OpenAI API
  private async callOpenAI(service: AIServiceConfig, request: AIRequest): Promise<AIResponse> {
    // 实现OpenAI API调用
    // 这里是简化版本，实际实现需要完整的API调用逻辑

    const response: AIResponse = {
      id: `resp-${request.id}`,
      requestId: request.id,
      content: `OpenAI response for ${request.type}: ${request.prompt.substring(0, 100)}...`,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 150,
        totalTokens: Math.floor(request.prompt.length / 4) + 150,
      },
      cost: this.estimateCost(service, request),
      latency: 2000 + Math.random() * 1000,
      model: service.model,
      finishReason: 'stop',
      metadata: {},
    }

    return response
  }

  // 调用Anthropic API
  private async callAnthropic(service: AIServiceConfig, request: AIRequest): Promise<AIResponse> {
    // 实现Anthropic API调用
    const response: AIResponse = {
      id: `resp-${request.id}`,
      requestId: request.id,
      content: `Anthropic response for ${request.type}: ${request.prompt.substring(0, 100)}...`,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 200,
        totalTokens: Math.floor(request.prompt.length / 4) + 200,
      },
      cost: this.estimateCost(service, request),
      latency: 3000 + Math.random() * 1500,
      model: service.model,
      finishReason: 'stop',
      metadata: {},
    }

    return response
  }

  // 调用本地模型
  private async callLocal(service: AIServiceConfig, request: AIRequest): Promise<AIResponse> {
    const response: AIResponse = {
      id: `resp-${request.id}`,
      requestId: request.id,
      content: `Local model response for ${request.type}: ${request.prompt.substring(0, 100)}...`,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.floor(request.prompt.length / 4) + 100,
      },
      cost: 0,
      latency: 5000 + Math.random() * 2000,
      model: service.model,
      finishReason: 'stop',
      metadata: {},
    }

    return response
  }

  // 检查缓存
  private async checkCache(_request: AIRequest): Promise<AIResponse | null> {
    // 实现缓存检查逻辑
    // 这里可以集成Redis或其他缓存系统
    return null
  }

  // 缓存响应
  private async cacheResponse(_request: AIRequest, _response: AIResponse): Promise<void> {
    // 实现缓存存储逻辑
  }

  // 检查成本限制
  private checkCostLimit(service: AIServiceConfig, request: AIRequest): boolean {
    const key = `${service.provider}-${service.model}`
    const currentCost = this.costTracker.get(key) || { daily: 0, monthly: 0 }
    const estimatedCost = this.estimateCost(service, request)

    return (
      currentCost.daily + estimatedCost <= service.costLimit.maxDailyCost &&
      currentCost.monthly + estimatedCost <= service.costLimit.maxMonthlyCost
    )
  }

  // 更新成本跟踪
  private updateCostTracker(service: AIServiceConfig, cost: number) {
    const key = `${service.provider}-${service.model}`
    const current = this.costTracker.get(key) || { daily: 0, monthly: 0 }

    current.daily += cost
    current.monthly += cost

    this.costTracker.set(key, current)
    this.stats.totalCost += cost
  }

  // 健康监控
  private startHealthMonitoring() {
    setInterval(async () => {
      for (const [_key, service] of this.services) {
        await this.checkServiceHealth(service)
      }
    }, 30000) // 每30秒检查一次
  }

  private async checkServiceHealth(service: AIServiceConfig) {
    const key = `${service.provider}-${service.model}`
    const startTime = Date.now()

    try {
      // 发送健康检查请求
      const isHealthy = await this.performHealthCheck(service)

      const health: ServiceHealth = {
        provider: service.provider,
        model: service.model,
        status: isHealthy ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        errorRate: 0, // 计算错误率
        lastChecked: Date.now(),
        consecutiveFailures: isHealthy
          ? 0
          : (this.healthStatus.get(key)?.consecutiveFailures || 0) + 1,
      }

      // 如果连续失败太多，标记为不健康
      if (health.consecutiveFailures > 3) {
        health.status = 'unhealthy'
      } else if (health.consecutiveFailures > 1) {
        health.status = 'degraded'
      }

      this.healthStatus.set(key, health)
    } catch (_error) {
      const health: ServiceHealth = {
        provider: service.provider,
        model: service.model,
        status: 'unhealthy',
        latency: Date.now() - startTime,
        errorRate: 1,
        lastChecked: Date.now(),
        consecutiveFailures: (this.healthStatus.get(key)?.consecutiveFailures || 0) + 1,
      }

      this.healthStatus.set(key, health)
    }
  }

  private async performHealthCheck(service: AIServiceConfig): Promise<boolean> {
    // 实现具体的健康检查逻辑
    try {
      // 发送一个简单的测试请求
      const testRequest: AIRequest = {
        id: `health-${Date.now()}`,
        type: 'analysis',
        prompt: 'Hello',
        priority: 'low',
        metadata: { sessionId: 'health-check' },
      }

      await this.executeRequest(service, testRequest)
      return true
    } catch {
      return false
    }
  }

  // 请求队列处理
  private startRequestProcessing() {
    setInterval(() => {
      if (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift()
        if (request) {
          this.sendRequest(request)
        }
      }
    }, 100) // 每100ms处理一个请求
  }

  // 队列请求
  queueRequest(request: AIRequest) {
    this.requestQueue.push(request)
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      serviceHealth: Array.from(this.healthStatus.values()),
      costTracking: Array.from(this.costTracker.entries()),
    }
  }

  // 获取服务状态
  getServiceStatus() {
    return {
      services: Array.from(this.services.values()),
      health: Array.from(this.healthStatus.values()),
      activeRequests: Array.from(this.activeRequests.values()),
    }
  }
}

// 创建单例实例
export const aiServiceManager = new AIServiceManager()
