import { Injectable, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import type { AiModel, ModelStatus, Prisma } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'

export interface ModelRecommendation {
  model: AiModel
  score: number
  reasons: string[]
  alternatives: AiModel[]
}

export interface ModelPerformanceData {
  latency: number
  accuracy: number
  cost: number
  reliability: number
}

@Injectable()
export class AiModelService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 模型管理 ====================

  /**
   * 注册AI模型
   */
  async registerModel(providerId: string, config: any): Promise<AiModel> {
    const model = await this.prisma.aiModel.create({
      data: {
        providerId,
        name: config.name,
        displayName: config.displayName,
        version: config.version,
        modelType: config.modelType || 'TEXT',
        capabilities: config.capabilities || [],
        contextWindow: config.contextWindow || 4096,
        maxTokens: config.maxTokens || 2048,
        pricing: config.pricing || {},
        status: 'ACTIVE',
      },
      include: { provider: true },
    })

    this.eventEmitter.emit('ai.model.registered', { model, config })
    return model
  }

  /**
   * 获取模型详情
   */
  async getModel(id: string): Promise<AiModel> {
    const model = await this.prisma.aiModel.findUnique({
      where: { id },
      include: {
        provider: true,
        configurations: {
          select: { id: true, ownerId: true },
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
   * 获取多个模型
   */
  async getModels(filters?: {
    providerId?: string
    modelType?: string
    status?: ModelStatus
    capabilities?: string[]
    limit?: number
    offset?: number
  }): Promise<AiModel[]> {
    const where: Prisma.AiModelWhereInput = {}

    if (filters?.providerId) {
      where.providerId = filters.providerId
    }

    if (filters?.modelType) {
      where.modelType = filters.modelType as any
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.capabilities && filters.capabilities.length > 0) {
      where.capabilities = {
        path: '$[*]',
        array_contains: filters.capabilities,
      }
    }

    return this.prisma.aiModel.findMany({
      where,
      include: { provider: true },
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
      orderBy: { performance: 'desc' },
    })
  }

  /**
   * 更新模型
   */
  async updateModel(
    id: string,
    updates: Partial<{
      displayName: string
      version: string
      capabilities: string[]
      contextWindow: number
      maxTokens: number
      pricing: any
      status: ModelStatus
      performance: number
      latency: number
      accuracy: number
    }>
  ): Promise<AiModel> {
    const model = await this.prisma.aiModel.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: { provider: true },
    })

    this.eventEmitter.emit('ai.model.updated', model)
    return model
  }

  /**
   * 删除模型
   */
  async deleteModel(id: string): Promise<void> {
    await this.prisma.aiModel.delete({
      where: { id },
    })

    this.eventEmitter.emit('ai.model.deleted', { id })
  }

  /**
   * 根据能力查找模型
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
      include: { provider: true },
      orderBy: { performance: 'desc' },
      take: limit,
    })
  }

  /**
   * 更新模型性能指标
   */
  async updateModelPerformance(
    id: string,
    performanceData: Partial<ModelPerformanceData>
  ): Promise<AiModel> {
    const model = await this.getModel(id)

    // 计算综合性能评分
    const newPerformance = this.calculatePerformanceScore({
      latency: performanceData.latency || model.latency,
      accuracy: performanceData.accuracy || model.accuracy,
      cost: this.calculateCostScore(model.pricing as any),
      reliability: await this.calculateReliabilityScore(id),
    })

    return this.updateModel(id, {
      performance: newPerformance,
      latency: performanceData.latency,
      accuracy: performanceData.accuracy,
    })
  }

  // ==================== 智能推荐 ====================

  /**
   * 获取模型推荐
   */
  async getRecommendations(context: {
    task?: string
    capabilities?: string[]
    maxTokens?: number
    priority?: 'cost' | 'performance' | 'balanced'
    userHistory?: string[]
    constraints?: Record<string, any>
  }): Promise<ModelRecommendation[]> {
    const {
      task,
      capabilities = [],
      priority = 'balanced',
      maxTokens,
      userHistory,
      constraints,
    } = context

    // 获取候选模型
    const candidateModels = await this.getCandidateModels(capabilities, maxTokens)

    if (candidateModels.length === 0) {
      return []
    }

    // 计算每个模型的推荐评分
    const recommendations = await Promise.all(
      candidateModels.map(async (model) => {
        const score = await this.calculateRecommendationScore(model, {
          task,
          priority,
          userHistory,
          constraints,
        })

        const reasons = this.generateRecommendationReasons(model, score, context)
        const alternatives = await this.getAlternativeModels(model, candidateModels)

        return {
          model,
          score,
          reasons,
          alternatives,
        }
      })
    )

    // 按评分排序
    recommendations.sort((a, b) => b.score - a.score)

    return recommendations
  }

  /**
   * 获取最佳模型推荐
   */
  async getBestRecommendation(context: any): Promise<ModelRecommendation | null> {
    const recommendations = await this.getRecommendations(context)
    return recommendations.length > 0 ? recommendations[0] : null
  }

  /**
   * 获取候选模型
   */
  private async getCandidateModels(capabilities: string[], maxTokens?: number): Promise<AiModel[]> {
    const where: Prisma.AiModelWhereInput = {
      status: 'ACTIVE',
    }

    if (capabilities.length > 0) {
      where.OR = capabilities.map((capability) => ({
        capabilities: {
          path: '$[*]',
          string_contains: capability,
        },
      }))
    }

    if (maxTokens) {
      where.maxTokens = {
        gte: maxTokens,
      }
    }

    return this.prisma.aiModel.findMany({
      where,
      include: { provider: true },
      orderBy: { performance: 'desc' },
      take: 20, // 限制候选数量
    })
  }

  /**
   * 计算推荐评分
   */
  private async calculateRecommendationScore(
    model: AiModel,
    context: {
      task?: string
      priority?: string
      userHistory?: string[]
      constraints?: Record<string, any>
    }
  ): Promise<number> {
    let score = model.performance * 0.4 // 基础性能评分 40%

    // 能力匹配度 20%
    const capabilityMatch = this.calculateCapabilityMatch(model, context)
    score += capabilityMatch * 0.2

    // 优先级调整 15%
    const priorityAdjustment = this.calculatePriorityAdjustment(model, context.priority)
    score += priorityAdjustment * 0.15

    // 用户历史偏好 15%
    const historyPreference = await this.calculateHistoryPreference(model, context.userHistory)
    score += historyPreference * 0.15

    // 约束符合度 10%
    const constraintCompliance = this.calculateConstraintCompliance(model, context.constraints)
    score += constraintCompliance * 0.1

    return Math.min(100, Math.max(0, score))
  }

  /**
   * 计算能力匹配度
   */
  private calculateCapabilityMatch(model: AiModel, context: any): number {
    if (!context.capabilities || context.capabilities.length === 0) {
      return 0.8 // 默认中等匹配
    }

    const modelCapabilities = model.capabilities as string[]
    const requiredCapabilities = context.capabilities

    let matchCount = 0
    for (const required of requiredCapabilities) {
      if (modelCapabilities.some((cap) => cap.includes(required))) {
        matchCount++
      }
    }

    return matchCount / requiredCapabilities.length
  }

  /**
   * 计算优先级调整
   */
  private calculatePriorityAdjustment(model: AiModel, priority?: string): number {
    if (!priority) return 0.5

    const pricing = model.pricing as any

    switch (priority) {
      case 'cost': {
        // 成本越低评分越高
        const costScore = pricing?.input ? Math.max(0, 1 - pricing.input * 100) : 0.5
        return costScore
      }

      case 'performance':
        // 性能越好评分越高
        return model.performance / 100

      case 'balanced':
      default: {
        // 平衡性能和成本
        const performance = model.performance / 100
        const cost = pricing?.input ? Math.max(0, 1 - pricing.input * 50) : 0.5
        return (performance + cost) / 2
      }
    }
  }

  /**
   * 计算历史偏好
   */
  private async calculateHistoryPreference(
    model: AiModel,
    userHistory?: string[]
  ): Promise<number> {
    if (!userHistory || userHistory.length === 0) {
      return 0.5 // 默认中等偏好
    }

    // 统计用户使用此模型的频率
    const usageCount = await this.prisma.modelUsage.count({
      where: {
        modelId: model.id,
        userId: { in: userHistory },
        status: 'SUCCESS',
      },
    })

    // 简单的频率评分
    return Math.min(1, usageCount / 10)
  }

  /**
   * 计算约束符合度
   */
  private calculateConstraintCompliance(model: AiModel, constraints?: Record<string, any>): number {
    if (!constraints) return 1

    let compliance = 1

    // 检查上下文窗口约束
    if (constraints.maxContext && model.contextWindow > constraints.maxContext) {
      compliance *= 0.5
    }

    // 检查响应时间约束
    if (constraints.maxLatency && model.latency > constraints.maxLatency) {
      compliance *= 0.7
    }

    // 检查成本约束
    if (constraints.maxCost) {
      const pricing = model.pricing as any
      if (pricing?.input && pricing.input > constraints.maxCost) {
        compliance *= 0.6
      }
    }

    return compliance
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendationReasons(model: AiModel, score: number, context: any): string[] {
    const reasons: string[] = []

    if (score > 80) {
      reasons.push('优秀性能表现')
    } else if (score > 60) {
      reasons.push('良好性能平衡')
    }

    const pricing = model.pricing as any
    if (pricing?.input && pricing.input < 0.01) {
      reasons.push('成本效益高')
    }

    if (model.latency < 2000) {
      reasons.push('响应速度快')
    }

    if (model.accuracy > 0.8) {
      reasons.push('准确性高')
    }

    if (context.capabilities) {
      const capabilities = model.capabilities as string[]
      const matched = context.capabilities.filter((cap) =>
        capabilities.some((modelCap) => modelCap.includes(cap))
      )
      if (matched.length > 0) {
        reasons.push(`匹配所需能力：${matched.join(', ')}`)
      }
    }

    return reasons
  }

  /**
   * 获取替代模型
   */
  private async getAlternativeModels(model: AiModel, allModels: AiModel[]): Promise<AiModel[]> {
    return allModels
      .filter((m) => m.id !== model.id)
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 3)
  }

  // ==================== 私有方法 ====================

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(data: ModelPerformanceData): number {
    // 加权计算综合性能
    const weights = {
      latency: 0.25, // 延迟权重
      accuracy: 0.35, // 准确性权重
      cost: 0.2, // 成本权重
      reliability: 0.2, // 可靠性权重
    }

    // 标准化各指标（0-1范围）
    const normalized = {
      latency: Math.max(0, 1 - data.latency / 10000), // 10秒以内为满分
      accuracy: data.accuracy,
      cost: Math.max(0, 1 - data.cost * 100), // 0.01以内为满分
      reliability: data.reliability,
    }

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + normalized[key as keyof typeof normalized] * weight * 100
    }, 0)
  }

  /**
   * 计算成本评分
   */
  private calculateCostScore(pricing: any): number {
    if (!pricing) return 0.5
    return pricing.input || pricing.output || 0
  }

  /**
   * 计算可靠性评分
   */
  private async calculateReliabilityScore(modelId: string): Promise<number> {
    const recentUsage = await this.prisma.modelUsage.findMany({
      where: {
        modelId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
        },
      },
      select: { status: true },
    })

    if (recentUsage.length === 0) return 0.5

    const successCount = recentUsage.filter((u) => u.status === 'SUCCESS').length
    return successCount / recentUsage.length
  }
}
