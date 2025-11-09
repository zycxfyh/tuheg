import { Injectable } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import type { ModelUsage, UsageStatus } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'

export interface UsageRecord {
  modelId: string
  userId?: string
  requestTokens: number
  responseTokens: number
  cost: number
  latency: number
  status: UsageStatus
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface PerformanceInsights {
  period: string
  topModels: Array<{
    modelId: string
    usageCount: number
    totalCost: number
    avgLatency: number
    successRate: number
  }>
  costAnalysis: {
    totalCost: number
    avgCostPerRequest: number
    costTrend: Array<{ date: string; cost: number }>
  }
  performanceTrends: {
    latencyTrend: Array<{ date: string; avgLatency: number }>
    successRateTrend: Array<{ date: string; successRate: number }>
  }
  userBehavior: {
    activeUsers: number
    avgRequestsPerUser: number
    peakUsageHours: number[]
  }
}

@Injectable()
export class AiMetricsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 使用记录 ====================

  /**
   * 记录模型使用
   */
  async recordModelUsage(userId: string, usage: UsageRecord): Promise<ModelUsage> {
    const totalTokens = usage.requestTokens + usage.responseTokens

    const usageRecord = await this.prisma.modelUsage.create({
      data: {
        modelId: usage.modelId,
        userId,
        requestTokens: usage.requestTokens,
        responseTokens: usage.responseTokens,
        totalTokens,
        cost: usage.cost,
        latency: usage.latency,
        status: usage.status,
        errorMessage: usage.errorMessage,
        metadata: usage.metadata,
      },
    })

    // 异步更新指标
    setImmediate(() => {
      this.updateMetrics(usage.modelId)
    })

    this.eventEmitter.emit('ai.usage.recorded', {
      usage: usageRecord,
      userId,
    })

    return usageRecord
  }

  /**
   * 获取模型使用统计
   */
  async getModelUsageStats(
    modelId: string,
    options: {
      period?: 'hour' | 'day' | 'week' | 'month'
      userId?: string
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    const { period = 'month', userId, startDate, endDate } = options

    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = { gte: startDate, lte: endDate }
    } else {
      const now = new Date()
      switch (period) {
        case 'hour':
          dateFilter = { gte: new Date(now.getTime() - 60 * 60 * 1000) }
          break
        case 'day':
          dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          break
        case 'week':
          dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
          break
        case 'month':
          dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
          break
      }
    }

    const where: any = {
      modelId,
      createdAt: dateFilter,
    }

    if (userId) {
      where.userId = userId
    }

    const [usageStats, costStats, performanceStats, errorStats] = await Promise.all([
      this.prisma.modelUsage.aggregate({
        where,
        _count: { id: true },
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _avg: {
          latency: true,
          requestTokens: true,
          responseTokens: true,
        },
      }),
      this.prisma.modelUsage.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { cost: true },
      }),
      this.prisma.modelUsage.findMany({
        where: { ...where, status: 'SUCCESS' },
        select: { latency: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.modelUsage.findMany({
        where: { ...where, status: { not: 'SUCCESS' } },
        select: { errorMessage: true, status: true },
      }),
    ])

    // 计算成功率
    const totalRequests = usageStats._count.id
    const successfulRequests = costStats.find((s) => s.status === 'SUCCESS')?._count.status || 0
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0

    // 分析错误类型
    const errorAnalysis = this.analyzeErrors(errorStats)

    return {
      period,
      totalRequests,
      successfulRequests,
      successRate,
      totalTokens: usageStats._sum.totalTokens || 0,
      totalCost: usageStats._sum.cost || 0,
      avgLatency: usageStats._avg.latency || 0,
      avgRequestTokens: usageStats._avg.requestTokens || 0,
      avgResponseTokens: usageStats._avg.responseTokens || 0,
      costBreakdown: costStats.map((s) => ({
        status: s.status,
        count: s._count.status,
        cost: s._sum.cost || 0,
      })),
      performance: {
        latencyTrend: this.calculateLatencyTrend(performanceStats),
        percentile95Latency: this.calculatePercentile(
          performanceStats.map((p) => p.latency),
          95
        ),
      },
      errors: errorAnalysis,
    }
  }

  /**
   * 获取提供商使用统计
   */
  async getProviderUsageStats(providerId: string, period: 'day' | 'week' | 'month' = 'month') {
    const models = await this.prisma.aiModel.findMany({
      where: { providerId },
      select: { id: true, name: true },
    })

    const modelIds = models.map((m) => m.id)

    const [usageStats, modelBreakdown] = await Promise.all([
      this.getTotalUsageStats(period, { modelIds }),
      Promise.all(modelIds.map((modelId) => this.getModelUsageStats(modelId, { period }))),
    ])

    return {
      providerId,
      period,
      totalStats: usageStats,
      modelBreakdown: models.map((model, index) => ({
        modelId: model.id,
        modelName: model.name,
        stats: modelBreakdown[index],
      })),
    }
  }

  /**
   * 获取总使用统计
   */
  async getTotalUsageStats(
    period: 'day' | 'week' | 'month' = 'month',
    filters?: { userId?: string; modelIds?: string[] }
  ) {
    let dateFilter: any = {}
    const now = new Date()

    switch (period) {
      case 'day':
        dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        break
      case 'week':
        dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        break
      case 'month':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
    }

    const where: any = { createdAt: dateFilter }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.modelIds) {
      where.modelId = { in: filters.modelIds }
    }

    const [usageStats, dailyStats, userStats] = await Promise.all([
      this.prisma.modelUsage.aggregate({
        where,
        _count: { id: true },
        _sum: { totalTokens: true, cost: true },
        _avg: { latency: true },
      }),
      this.getDailyUsageStats(where),
      this.getUserUsageStats(where),
    ])

    return {
      period,
      totalRequests: usageStats._count.id,
      totalTokens: usageStats._sum.totalTokens || 0,
      totalCost: usageStats._sum.cost || 0,
      avgLatency: usageStats._avg.latency || 0,
      dailyBreakdown: dailyStats,
      userStats,
    }
  }

  // ==================== 性能洞察 ====================

  /**
   * 生成性能洞察报告
   */
  async getPerformanceInsights(
    options: { period?: 'day' | 'week' | 'month'; modelIds?: string[]; userId?: string } = {}
  ): Promise<PerformanceInsights> {
    const { period = 'month', modelIds, userId } = options

    const [topModels, costAnalysis, performanceTrends, userBehavior] = await Promise.all([
      this.getTopPerformingModels(period, modelIds),
      this.getCostAnalysis(period, modelIds, userId),
      this.getPerformanceTrends(period, modelIds),
      this.getUserBehaviorAnalysis(period, userId),
    ])

    return {
      period,
      topModels,
      costAnalysis,
      performanceTrends,
      userBehavior,
    }
  }

  /**
   * 获取使用建议
   */
  async getUsageRecommendations(userId: string): Promise<{
    costOptimization: string[]
    performanceTips: string[]
    modelSuggestions: Array<{
      currentModel: string
      suggestedModel: string
      reason: string
      expectedBenefit: string
    }>
  }> {
    const userUsage = await this.getTotalUsageStats('month', { userId })

    const recommendations = {
      costOptimization: [] as string[],
      performanceTips: [] as string[],
      modelSuggestions: [] as any[],
    }

    // 基于使用模式生成建议
    if (userUsage.avgLatency > 3000) {
      recommendations.performanceTips.push('考虑使用响应更快的模型以提升用户体验')
    }

    if (userUsage.totalCost > 10) {
      recommendations.costOptimization.push('您的使用成本较高，建议选择更经济的模型')
    }

    // 分析用户的模型使用偏好
    const userModelUsage = await this.prisma.modelUsage.groupBy({
      by: ['modelId'],
      where: { userId },
      _count: { id: true },
      _avg: { latency: true, cost: true },
    })

    // 生成模型建议
    for (const usage of userModelUsage) {
      const model = await this.prisma.aiModel.findUnique({
        where: { id: usage.modelId },
        select: { name: true, performance: true, pricing: true },
      })

      if (model && usage._avg.cost && usage._avg.cost > 0.02) {
        recommendations.modelSuggestions.push({
          currentModel: model.name,
          suggestedModel: '更经济的替代模型',
          reason: '当前模型成本较高',
          expectedBenefit: `预计节省 ${(usage._avg.cost * 0.5).toFixed(4)} 美元/请求`,
        })
      }
    }

    return recommendations
  }

  // ==================== 指标更新 ====================

  /**
   * 更新模型指标
   */
  private async updateMetrics(modelId: string): Promise<void> {
    try {
      // 计算最近24小时的指标
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const recentUsage = await this.prisma.modelUsage.findMany({
        where: {
          modelId,
          createdAt: { gte: yesterday },
          status: 'SUCCESS',
        },
        select: {
          latency: true,
          totalTokens: true,
          cost: true,
        },
      })

      if (recentUsage.length === 0) return

      const avgLatency = recentUsage.reduce((sum, u) => sum + u.latency, 0) / recentUsage.length
      const tokenEfficiency =
        recentUsage.reduce((sum, u) => sum + u.totalTokens / u.latency, 0) / recentUsage.length
      const qualityScore = Math.max(0, Math.min(1, 1 - avgLatency / 10000)) // 基于延迟的质量评分

      await this.prisma.modelMetrics.create({
        data: {
          modelId,
          requests: recentUsage.length,
          errors: 0, // 暂时设为0
          avgLatency: Math.round(avgLatency),
          tokenEfficiency,
          qualityScore,
        },
      })

      // 更新模型的综合性能评分
      const recentMetrics = await this.prisma.modelMetrics.findMany({
        where: { modelId },
        orderBy: { timestamp: 'desc' },
        take: 10,
      })

      if (recentMetrics.length > 0) {
        const avgQualityScore =
          recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / recentMetrics.length
        await this.prisma.aiModel.update({
          where: { id: modelId },
          data: {
            performance: Math.round(avgQualityScore * 100),
            latency: Math.round(avgLatency),
            updatedAt: new Date(),
          },
        })
      }
    } catch (error) {
      console.error('Failed to update metrics:', error)
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取每日使用统计
   */
  private async getDailyUsageStats(where: any) {
    const dailyStats = await this.prisma.$queryRaw<
      Array<{ date: string; requests: number; cost: number }>
    >`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        COALESCE(SUM(cost), 0) as cost
      FROM model_usage
      WHERE ${where}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    return dailyStats.map((stat) => ({
      date: stat.date,
      requests: Number(stat.requests),
      cost: Number(stat.cost),
    }))
  }

  /**
   * 获取用户使用统计
   */
  private async getUserUsageStats(where: any) {
    const [totalUsers, userActivity] = await Promise.all([
      this.prisma.modelUsage.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.modelUsage.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
      }),
    ])

    const avgRequestsPerUser =
      userActivity.length > 0
        ? userActivity.reduce((sum, u) => sum + u._count.id, 0) / userActivity.length
        : 0

    return {
      activeUsers: totalUsers.length,
      avgRequestsPerUser: Math.round(avgRequestsPerUser * 100) / 100,
      topUsers: userActivity
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 5)
        .map((u) => ({ userId: u.userId, requestCount: u._count.id })),
    }
  }

  /**
   * 分析错误
   */
  private analyzeErrors(errorStats: any[]) {
    const errorTypes: Record<string, number> = {}

    errorStats.forEach((error) => {
      const type = error.status || 'UNKNOWN'
      errorTypes[type] = (errorTypes[type] || 0) + 1
    })

    return {
      totalErrors: errorStats.length,
      errorTypes,
      topErrorMessages: errorStats
        .filter((e) => e.errorMessage)
        .reduce(
          (acc, error) => {
            const msg = error.errorMessage
            acc[msg] = (acc[msg] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
    }
  }

  /**
   * 计算延迟趋势
   */
  private calculateLatencyTrend(
    performanceData: any[]
  ): Array<{ date: string; avgLatency: number }> {
    // 按日期分组计算平均延迟
    const dailyLatency: Record<string, number[]> = {}

    performanceData.forEach((data) => {
      const date = data.createdAt.toISOString().split('T')[0]
      if (!dailyLatency[date]) dailyLatency[date] = []
      dailyLatency[date].push(data.latency)
    })

    return Object.entries(dailyLatency)
      .map(([date, latencies]) => ({
        date,
        avgLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0

    const sorted = values.sort((a, b) => a - b)
    const index = (percentile / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)

    if (lower === upper) return sorted[lower]

    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower])
  }

  // 其他私有方法实现...
}
