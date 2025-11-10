// 文件路径: packages/common-backend/src/ai/dynamic-ai-scheduler.service.ts
// 职责: 智能AI调度服务，实现负载均衡、性能监控和自适应路由
//
// 核心功能:
// 1. 基于用户角色的智能AI选择
// 2. 负载均衡和性能监控
// 3. 自适应路由算法
// 4. 缓存和预热机制
// 5. 实时性能指标收集
//
// 设计原则:
// - 优先级调度 + 负载均衡
// - 性能监控驱动的路由决策
// - 缓存友好的架构设计
// - 可扩展的多策略调度

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { AiConfiguration, User } from '@prisma/client'
import type { PrismaService } from '@tuheg/infrastructure'
import type { AiProvider, AiRole } from '../types/ai-providers.types'
import type { AiProviderFactory } from './ai-provider.factory'
import type { CacheService } from '@tuheg/infrastructure'

/**
 * 调度策略枚举
 */
export enum SchedulingStrategy {
  /** 优先级调度（默认） */
  PRIORITY = 'priority',
  /** 负载均衡调度 */
  LOAD_BALANCE = 'load_balance',
  /** 性能优化调度 */
  PERFORMANCE = 'performance',
  /** 自适应调度 */
  ADAPTIVE = 'adaptive'
}

/**
 * AI提供商性能指标
 */
export interface ProviderMetrics {
  providerId: string
  responseTime: number[]
  successRate: number
  totalRequests: number
  currentLoad: number
  lastUsed: Date
  consecutiveFailures: number
}

/**
 * 调度上下文
 */
export interface SchedulingContext {
  user: User
  role: AiRole
  priority: 'high' | 'medium' | 'low'
  timeout?: number
  fallbackAllowed: boolean
}

/**
 * 调度决策结果
 */
export interface SchedulingDecision {
  provider: AiProvider
  strategy: SchedulingStrategy
  confidence: number
  estimatedLatency: number
  reasoning: string
}

@Injectable()
export class DynamicAiSchedulerService {
  private readonly logger = new Logger(DynamicAiSchedulerService.name)

  // 性能监控指标存储
  private providerMetrics = new Map<string, ProviderMetrics>()

  // 调度策略配置
  private schedulingConfig = {
    strategy: SchedulingStrategy.ADAPTIVE,
    loadThreshold: 0.8, // 负载阈值
    performanceWindow: 100, // 性能统计窗口大小
    adaptiveAdjustmentInterval: 30000, // 自适应调整间隔(30秒)
    cacheEnabled: true,
    cacheTTL: 300 // 缓存TTL(5分钟)
  }

  // 自适应调度状态
  private adaptiveState = {
    lastAdjustment: Date.now(),
    strategyWeights: {
      [SchedulingStrategy.PRIORITY]: 0.4,
      [SchedulingStrategy.LOAD_BALANCE]: 0.3,
      [SchedulingStrategy.PERFORMANCE]: 0.3
    }
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProviderFactory: AiProviderFactory,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService
  ) {
    // 初始化自适应调整定时器
    setInterval(() => {
      this.performAdaptiveAdjustment()
    }, this.schedulingConfig.adaptiveAdjustmentInterval)

    this.logger.log(`AI调度器初始化完成，策略: ${this.schedulingConfig.strategy}`)
  }

  /**
   * 智能AI调度 - 支持多策略调度和性能优化
   */
  public async getProviderForRole(user: User, role: AiRole): Promise<AiProvider> {
    const startTime = Date.now()
    const context: SchedulingContext = {
      user,
      role,
      priority: this.determinePriority(role),
      fallbackAllowed: true
    }

    this.logger.debug(`[Scheduler] 调度请求: 用户=${user.id}, 角色=${role}, 优先级=${context.priority}`)

    // 尝试缓存调度决策
    if (this.schedulingConfig.cacheEnabled) {
      const cacheKey = `scheduler:${user.id}:${role}`
      const cachedDecision = await this.cacheService.get<SchedulingDecision>(cacheKey)

      if (cachedDecision && this.isDecisionValid(cachedDecision)) {
        this.logger.debug(`[Scheduler] 使用缓存决策: ${cachedDecision.strategy}`)
        this.recordProviderUsage(cachedDecision.provider, Date.now() - startTime, true)
        return cachedDecision.provider
      }
    }

    // 执行智能调度
    const decision = await this.makeSchedulingDecision(context)

    // 缓存决策结果
    if (this.schedulingConfig.cacheEnabled) {
      const cacheKey = `scheduler:${user.id}:${role}`
      await this.cacheService.set(cacheKey, decision, { ttl: this.schedulingConfig.cacheTTL })
    }

    // 记录调度决策
    this.recordProviderUsage(decision.provider, Date.now() - startTime, true)

    this.logger.log(
      `[Scheduler] 调度完成: ${decision.strategy} -> ${decision.provider.constructor.name}, ` +
      `置信度=${decision.confidence.toFixed(2)}, 预估延迟=${decision.estimatedLatency}ms`
    )

    return decision.provider
  }

  /**
   * 制定调度决策
   */
  private async makeSchedulingDecision(context: SchedulingContext): Promise<SchedulingDecision> {
    const availableConfigs = await this.getAvailableConfigurations(context.user, context.role)

    if (availableConfigs.length === 0) {
      return this.createFallbackDecision(context)
    }

    // 根据当前策略选择调度算法
    switch (this.schedulingConfig.strategy) {
      case SchedulingStrategy.PRIORITY:
        return this.priorityScheduling(availableConfigs, context)

      case SchedulingStrategy.LOAD_BALANCE:
        return this.loadBalanceScheduling(availableConfigs, context)

      case SchedulingStrategy.PERFORMANCE:
        return this.performanceScheduling(availableConfigs, context)

      case SchedulingStrategy.ADAPTIVE:
        return this.adaptiveScheduling(availableConfigs, context)

      default:
        return this.priorityScheduling(availableConfigs, context)
    }
  }

  /**
   * 获取可用配置
   */
  private async getAvailableConfigurations(user: User, role: AiRole): Promise<AiConfiguration[]> {
    // 优先查找专用配置
    const dedicatedConfigs = await this.prisma.aiConfiguration.findMany({
      where: {
        ownerId: user.id,
        roles: {
          some: { name: role }
        }
      },
      include: { roles: true }
    })

    if (dedicatedConfigs.length > 0) {
      return dedicatedConfigs
    }

    // 查找通用配置
    const generalConfigs = await this.prisma.aiConfiguration.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'asc' }
    })

    return generalConfigs
  }

  /**
   * 优先级调度策略
   */
  private async priorityScheduling(
    configs: AiConfiguration[],
    context: SchedulingContext
  ): Promise<SchedulingDecision> {
    // 选择第一个可用配置（按创建时间排序）
    const selectedConfig = configs[0]
    const provider = this.aiProviderFactory.createProvider(selectedConfig)
    const metrics = this.getProviderMetrics(selectedConfig.id)

    return {
      provider,
      strategy: SchedulingStrategy.PRIORITY,
      confidence: 0.8,
      estimatedLatency: this.calculateEstimatedLatency(metrics),
      reasoning: `优先级调度: 选择最早创建的配置 ${selectedConfig.provider}/${selectedConfig.modelId}`
    }
  }

  /**
   * 负载均衡调度策略
   */
  private async loadBalanceScheduling(
    configs: AiConfiguration[],
    context: SchedulingContext
  ): Promise<SchedulingDecision> {
    // 选择负载最小的提供商
    let bestConfig = configs[0]
    let minLoad = Infinity

    for (const config of configs) {
      const metrics = this.getProviderMetrics(config.id)
      const load = metrics.currentLoad

      if (load < minLoad) {
        minLoad = load
        bestConfig = config
      }
    }

    const provider = this.aiProviderFactory.createProvider(bestConfig)
    const metrics = this.getProviderMetrics(bestConfig.id)

    return {
      provider,
      strategy: SchedulingStrategy.LOAD_BALANCE,
      confidence: 0.9,
      estimatedLatency: this.calculateEstimatedLatency(metrics),
      reasoning: `负载均衡: 选择负载最低的配置 ${bestConfig.provider}/${bestConfig.modelId} (负载: ${minLoad})`
    }
  }

  /**
   * 性能优化调度策略
   */
  private async performanceScheduling(
    configs: AiConfiguration[],
    context: SchedulingContext
  ): Promise<SchedulingDecision> {
    // 选择性能最好的提供商（最低响应时间，最高成功率）
    let bestConfig = configs[0]
    let bestScore = -Infinity

    for (const config of configs) {
      const metrics = this.getProviderMetrics(config.id)
      const score = this.calculatePerformanceScore(metrics)

      if (score > bestScore) {
        bestScore = score
        bestConfig = config
      }
    }

    const provider = this.aiProviderFactory.createProvider(bestConfig)
    const metrics = this.getProviderMetrics(bestConfig.id)

    return {
      provider,
      strategy: SchedulingStrategy.PERFORMANCE,
      confidence: 0.85,
      estimatedLatency: this.calculateEstimatedLatency(metrics),
      reasoning: `性能优化: 选择性能最佳的配置 ${bestConfig.provider}/${bestConfig.modelId} (分数: ${bestScore.toFixed(2)})`
    }
  }

  /**
   * 自适应调度策略
   */
  private async adaptiveScheduling(
    configs: AiConfiguration[],
    context: SchedulingContext
  ): Promise<SchedulingDecision> {
    // 基于历史性能和当前状态进行加权决策
    const candidates = await Promise.all(
      configs.map(async (config) => {
        const metrics = this.getProviderMetrics(config.id)
        const priorityScore = this.adaptiveState.strategyWeights[SchedulingStrategy.PRIORITY] *
                             this.calculatePriorityScore(config, context)
        const loadScore = this.adaptiveState.strategyWeights[SchedulingStrategy.LOAD_BALANCE] *
                         this.calculateLoadScore(metrics)
        const performanceScore = this.adaptiveState.strategyWeights[SchedulingStrategy.PERFORMANCE] *
                                this.calculatePerformanceScore(metrics)

        const totalScore = priorityScore + loadScore + performanceScore

        return {
          config,
          score: totalScore,
          metrics,
          reasoning: `优先级:${priorityScore.toFixed(2)}, 负载:${loadScore.toFixed(2)}, 性能:${performanceScore.toFixed(2)}`
        }
      })
    )

    // 选择得分最高的配置
    candidates.sort((a, b) => b.score - a.score)
    const bestCandidate = candidates[0]

    const provider = this.aiProviderFactory.createProvider(bestCandidate.config)

    return {
      provider,
      strategy: SchedulingStrategy.ADAPTIVE,
      confidence: Math.min(0.95, bestCandidate.score),
      estimatedLatency: this.calculateEstimatedLatency(bestCandidate.metrics),
      reasoning: `自适应调度: ${bestCandidate.reasoning} -> ${bestCandidate.config.provider}/${bestCandidate.config.modelId}`
    }
  }

  /**
   * 确定请求优先级
   */
  private determinePriority(role: AiRole): 'high' | 'medium' | 'low' {
    // 关键角色使用高优先级
    const highPriorityRoles = ['logic_parsing', 'narrative_synthesis', 'world_building']
    if (highPriorityRoles.includes(role)) {
      return 'high'
    }

    // 中等优先级角色
    const mediumPriorityRoles = ['character_interaction', 'content_moderation']
    if (mediumPriorityRoles.includes(role)) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * 检查决策是否仍然有效
   */
  private isDecisionValid(decision: SchedulingDecision): boolean {
    // 检查提供商是否仍然可用
    const metrics = this.getProviderMetrics(decision.provider.constructor.name)
    return metrics.consecutiveFailures < 3
  }

  /**
   * 获取提供商性能指标
   */
  private getProviderMetrics(providerId: string): ProviderMetrics {
    if (!this.providerMetrics.has(providerId)) {
      this.providerMetrics.set(providerId, {
        providerId,
        responseTime: [],
        successRate: 1.0,
        totalRequests: 0,
        currentLoad: 0,
        lastUsed: new Date(),
        consecutiveFailures: 0
      })
    }
    return this.providerMetrics.get(providerId)!
  }

  /**
   * 记录提供商使用情况
   */
  private recordProviderUsage(provider: AiProvider, responseTime: number, success: boolean): void {
    const providerId = provider.constructor.name
    const metrics = this.getProviderMetrics(providerId)

    metrics.totalRequests++
    metrics.lastUsed = new Date()

    if (success) {
      metrics.responseTime.push(responseTime)
      metrics.consecutiveFailures = 0

      // 保持性能窗口大小
      if (metrics.responseTime.length > this.schedulingConfig.performanceWindow) {
        metrics.responseTime.shift()
      }
    } else {
      metrics.consecutiveFailures++
    }

    // 更新成功率
    const totalSuccess = metrics.totalRequests - metrics.consecutiveFailures
    metrics.successRate = totalSuccess / metrics.totalRequests

    // 更新当前负载（简化的负载模型）
    metrics.currentLoad = Math.max(0, metrics.currentLoad + (success ? 0.1 : -0.05))
  }

  /**
   * 计算优先级分数
   */
  private calculatePriorityScore(config: AiConfiguration, context: SchedulingContext): number {
    let score = 0.5 // 基础分数

    // 根据配置创建时间给予优先级
    const ageInDays = (Date.now() - config.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    score += Math.max(0, 0.3 - ageInDays * 0.01) // 新配置有更高优先级

    // 高优先级请求给予额外加成
    if (context.priority === 'high') {
      score += 0.2
    } else if (context.priority === 'low') {
      score -= 0.1
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * 计算负载分数
   */
  private calculateLoadScore(metrics: ProviderMetrics): number {
    // 负载越低分数越高
    return Math.max(0, 1 - metrics.currentLoad)
  }

  /**
   * 计算性能分数
   */
  private calculatePerformanceScore(metrics: ProviderMetrics): number {
    if (metrics.responseTime.length === 0) return 0.5

    // 计算平均响应时间（归一化到0-1范围，越快越好）
    const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length
    const responseScore = Math.max(0, 1 - avgResponseTime / 5000) // 5秒以内为满分

    // 成功率分数
    const successScore = metrics.successRate

    // 连续失败惩罚
    const failurePenalty = Math.max(0, 1 - metrics.consecutiveFailures * 0.2)

    return (responseScore * 0.5 + successScore * 0.3 + failurePenalty * 0.2)
  }

  /**
   * 计算预估延迟
   */
  private calculateEstimatedLatency(metrics: ProviderMetrics): number {
    if (metrics.responseTime.length === 0) return 1000 // 默认1秒

    const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length
    const p95ResponseTime = this.calculatePercentile(metrics.responseTime, 95)

    // 使用P95作为保守估计
    return Math.round(p95ResponseTime)
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
  }

  /**
   * 创建后备决策
   */
  private createFallbackDecision(context: SchedulingContext): SchedulingDecision {
    const provider = this.createFallbackProvider()

    return {
      provider,
      strategy: SchedulingStrategy.PRIORITY,
      confidence: 0.1,
      estimatedLatency: 3000,
      reasoning: `后备调度: 无可用配置，使用系统默认提供商`
    }
  }

  /**
   * 执行自适应调整
   */
  private performAdaptiveAdjustment(): void {
    const now = Date.now()
    if (now - this.adaptiveState.lastAdjustment < this.schedulingConfig.adaptiveAdjustmentInterval) {
      return
    }

    this.adaptiveState.lastAdjustment = now

    // 基于最近的性能数据调整策略权重
    const totalRequests = Array.from(this.providerMetrics.values())
      .reduce((sum, metrics) => sum + metrics.totalRequests, 0)

    if (totalRequests < 10) return // 数据不足，跳过调整

    // 计算各策略的平均性能
    const strategyPerformance = {
      [SchedulingStrategy.PRIORITY]: 0,
      [SchedulingStrategy.LOAD_BALANCE]: 0,
      [SchedulingStrategy.PERFORMANCE]: 0
    }

    let totalWeight = 0

    for (const metrics of this.providerMetrics.values()) {
      const performance = this.calculatePerformanceScore(metrics)
      const load = metrics.currentLoad

      // 根据性能和负载调整权重
      strategyPerformance[SchedulingStrategy.PRIORITY] += 0.3
      strategyPerformance[SchedulingStrategy.LOAD_BALANCE] += Math.max(0, 1 - load)
      strategyPerformance[SchedulingStrategy.PERFORMANCE] += performance

      totalWeight += 1
    }

    // 归一化权重
    if (totalWeight > 0) {
      for (const strategy of Object.keys(strategyPerformance) as SchedulingStrategy[]) {
        this.adaptiveState.strategyWeights[strategy] = strategyPerformance[strategy] / totalWeight
      }
    }

    this.logger.debug(`自适应调整完成: ${JSON.stringify(this.adaptiveState.strategyWeights)}`)
  }

  private createFallbackProvider(): AiProvider {
    try {
      // 优先使用专门的DeepSeek配置，如果没有则使用后备配置
      const apiKey =
        this.configService.get<string>('DEEPSEEK_API_KEY') ||
        this.configService.getOrThrow<string>('FALLBACK_API_KEY')
      const modelId = this.configService.get<string>('FALLBACK_MODEL_ID', 'deepseek-chat')
      const baseUrlFromEnv =
        this.configService.get<string>('DEEPSEEK_BASE_URL') ||
        this.configService.get<string>('FALLBACK_BASE_URL')

      // [!] 核心改造 2: 模拟对象结构翻译
      // 新的 AiConfiguration 类型没有 `assignedRoles` 字段。
      // 我们创建一个不包含任何角色信息的、纯粹的配置对象。
      // 注意：这个模拟对象缺少 'roles' 属性，所以我们需要告诉 TypeScript
      // 它符合 AiConfiguration 的形状（通过类型断言 as AiConfiguration）。
      const fallbackConfig = {
        id: 'system-fallback',
        provider: 'DeepSeek',
        apiKey,
        baseUrl: baseUrlFromEnv ?? null,
        modelId,
        ownerId: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AiConfiguration // 类型断言，表示我们确信这个对象的结构是兼容的

      return this.aiProviderFactory.createProvider(fallbackConfig)
    } catch (error) {
      this.logger.error(
        'System fallback AI configuration is missing or invalid. Check your .env file for FALLBACK_... variables.',
        error
      )
      throw new Error('System default AI is not configured.')
    }
  }
}
