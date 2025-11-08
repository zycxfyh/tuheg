// 文件路径: packages/common-backend/src/ai/time-aware-vector-search.service.ts
// 职责: VCPToolBox 时间感知向量检索服务
// 借鉴思想: Time-Aware RAG，基于时间维度优化检索

import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { PrismaService } from '../prisma/prisma.service'
import type { VectorSearchResult, VectorSearchService } from './vector-search.service'

/**
 * 时间感知检索配置
 */
export interface TimeAwareSearchConfig {
  /** 时间权重衰减因子 (0-1，越大越重视时间) */
  timeWeightFactor: number
  /** 时间窗口大小（小时） */
  timeWindowHours: number
  /** 动态K值配置 */
  dynamicK: {
    enabled: boolean
    minResults: number
    maxResults: number
    timeThresholdHours: number // 时间阈值，超过此时间的结果会减少
  }
  /** 时间衰减函数类型 */
  decayFunction: 'linear' | 'exponential' | 'gaussian'
  /** 基础检索配置 */
  baseConfig: {
    limit: number
    minSimilarity: number
  }
}

/**
 * 时间感知检索结果
 */
export interface TimeAwareSearchResult extends VectorSearchResult {
  /** 时间权重分数 (0-1) */
  timeWeight: number
  /** 综合分数 (相似度 + 时间权重) */
  combinedScore: number
  /** 相对时间（小时） */
  hoursSinceCreation: number
  /** 时间衰减后的分数 */
  decayedScore: number
}

/**
 * VCPToolBox 时间感知向量检索服务
 * 实现Time-Aware RAG，基于时间维度优化检索结果
 */
@Injectable()
export class TimeAwareVectorSearchService {
  private readonly logger = new Logger(TimeAwareVectorSearchService.name)

  // 默认配置
  private readonly defaultConfig: TimeAwareSearchConfig = {
    timeWeightFactor: 0.3, // 时间权重占30%
    timeWindowHours: 168, // 一周时间窗口
    dynamicK: {
      enabled: true,
      minResults: 3,
      maxResults: 10,
      timeThresholdHours: 24, // 24小时阈值
    },
    decayFunction: 'exponential',
    baseConfig: {
      limit: 15, // 基础检索多取一些，用于时间过滤
      minSimilarity: 0.6,
    },
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly vectorSearch: VectorSearchService
  ) {}

  /**
   * [VCPToolBox核心] 执行时间感知向量检索
   * 结合语义相似度和时间因素进行智能检索
   *
   * @param queryText 查询文本
   * @param gameId 游戏ID
   * @param user 用户信息
   * @param config 时间感知配置（可选）
   * @returns 时间感知的检索结果
   */
  async searchWithTimeAwareness(
    queryText: string,
    gameId: string,
    user: any,
    config?: Partial<TimeAwareSearchConfig>
  ): Promise<TimeAwareSearchResult[]> {
    const searchConfig = { ...this.defaultConfig, ...config }
    const startTime = Date.now()

    try {
      this.logger.debug(`Starting time-aware search for query: "${queryText}"`)

      // 步骤1: 执行基础向量检索（获取更多候选结果）
      const baseResults = await this.vectorSearch.searchSimilarMemories(queryText, gameId, user, {
        limit: searchConfig.baseConfig.limit,
        minSimilarity: searchConfig.baseConfig.minSimilarity,
      })

      if (baseResults.length === 0) {
        this.logger.debug('No base results found')
        return []
      }

      this.logger.debug(`Found ${baseResults.length} base results`)

      // 步骤2: 计算时间感知分数
      const timeAwareResults = await this.calculateTimeAwareScores(baseResults, searchConfig)

      // 步骤3: 应用动态K值调整
      const finalResults = this.applyDynamicK(timeAwareResults, searchConfig)

      const duration = Date.now() - startTime
      this.logger.debug(
        `Time-aware search completed in ${duration}ms, ` + `returned ${finalResults.length} results`
      )

      return finalResults
    } catch (error) {
      this.logger.error('Time-aware search failed:', error)
      // 降级到基础向量搜索
      return this.fallbackToBaseSearch(queryText, gameId, user)
    }
  }

  /**
   * 计算时间感知分数
   */
  private async calculateTimeAwareScores(
    baseResults: VectorSearchResult[],
    config: TimeAwareSearchConfig
  ): Promise<TimeAwareSearchResult[]> {
    const now = new Date()
    const timeWindowMs = config.timeWindowHours * 60 * 60 * 1000

    return baseResults
      .map((result) => {
        const hoursSinceCreation = (now.getTime() - result.createdAt.getTime()) / (1000 * 60 * 60)
        const timeWeight = this.calculateTimeWeight(hoursSinceCreation, config)
        const decayedSimilarity = this.applyTimeDecay(result.similarity, hoursSinceCreation, config)
        const combinedScore = this.combineScores(
          result.similarity,
          timeWeight,
          config.timeWeightFactor
        )

        return {
          ...result,
          timeWeight,
          combinedScore,
          hoursSinceCreation,
          decayedScore: decayedSimilarity,
        }
      })
      .sort((a, b) => b.combinedScore - a.combinedScore) // 按综合分数排序
  }

  /**
   * 计算时间权重
   */
  private calculateTimeWeight(hoursSinceCreation: number, config: TimeAwareSearchConfig): number {
    const normalizedTime = Math.min(hoursSinceCreation / config.timeWindowHours, 1)

    switch (config.decayFunction) {
      case 'linear': {
        // 线性衰减：越新权重越高
        return 1 - normalizedTime
      }

      case 'exponential': {
        // 指数衰减：快速衰减旧内容
        return Math.exp(-2 * normalizedTime)
      }

      case 'gaussian': {
        // 高斯衰减：中间时间权重最高
        const sigma = 0.3
        return Math.exp(-((normalizedTime - 0.3) ** 2) / (2 * sigma * sigma))
      }

      default:
        return 1 - normalizedTime
    }
  }

  /**
   * 应用时间衰减到相似度分数
   */
  private applyTimeDecay(
    similarity: number,
    hoursSinceCreation: number,
    config: TimeAwareSearchConfig
  ): number {
    const timeWeight = this.calculateTimeWeight(hoursSinceCreation, config)
    return similarity * (1 - config.timeWeightFactor) + timeWeight * config.timeWeightFactor
  }

  /**
   * 组合相似度和时间权重
   */
  private combineScores(similarity: number, timeWeight: number, timeWeightFactor: number): number {
    return similarity * (1 - timeWeightFactor) + timeWeight * timeWeightFactor
  }

  /**
   * 应用动态K值调整
   */
  private applyDynamicK(
    results: TimeAwareSearchResult[],
    config: TimeAwareSearchConfig
  ): TimeAwareSearchResult[] {
    if (!config.dynamicK.enabled) {
      return results.slice(0, config.baseConfig.limit)
    }

    const { minResults, maxResults, timeThresholdHours } = config.dynamicK

    // 计算有多少结果在时间阈值内
    const recentResults = results.filter((r) => r.hoursSinceCreation <= timeThresholdHours)
    const oldResults = results.filter((r) => r.hoursSinceCreation > timeThresholdHours)

    let finalResults: TimeAwareSearchResult[] = []

    // 优先保留最近的结果
    if (recentResults.length >= minResults) {
      finalResults = recentResults.slice(0, maxResults)
    } else {
      // 如果最近结果不够，补充一些旧结果
      finalResults = [
        ...recentResults,
        ...oldResults.slice(0, minResults - recentResults.length),
      ].slice(0, maxResults)
    }

    // 确保至少返回最小数量的结果
    if (finalResults.length < minResults && results.length > finalResults.length) {
      const additional = results
        .filter((r) => !finalResults.some((fr) => fr.id === r.id))
        .slice(0, minResults - finalResults.length)
      finalResults = [...finalResults, ...additional]
    }

    return finalResults
  }

  /**
   * 降级到基础搜索
   */
  private async fallbackToBaseSearch(
    queryText: string,
    gameId: string,
    user: any
  ): Promise<TimeAwareSearchResult[]> {
    this.logger.warn('Falling back to base vector search')

    const baseResults = await this.vectorSearch.searchSimilarMemories(queryText, gameId, user)

    // 转换为时间感知格式（时间权重设为0.5）
    return baseResults.map((result) => ({
      ...result,
      timeWeight: 0.5,
      combinedScore: result.similarity * 0.5 + 0.5 * 0.5,
      hoursSinceCreation: (Date.now() - result.createdAt.getTime()) / (1000 * 60 * 60),
      decayedScore: result.similarity,
    }))
  }

  /**
   * 获取时间分布统计
   */
  async getTimeDistributionStats(gameId: string): Promise<{
    totalMemories: number
    timeBuckets: Array<{
      hoursRange: string
      count: number
      avgSimilarity?: number
    }>
    recommendations: string[]
  }> {
    const memories = await this.prisma.memory.findMany({
      where: { gameId },
      select: {
        id: true,
        createdAt: true,
        embedding: true,
      },
    })

    const now = new Date()
    const buckets = [
      { range: '0-1h', min: 0, max: 1, count: 0, similarities: [] as number[] },
      { range: '1-6h', min: 1, max: 6, count: 0, similarities: [] as number[] },
      { range: '6-24h', min: 6, max: 24, count: 0, similarities: [] as number[] },
      { range: '1-7d', min: 24, max: 168, count: 0, similarities: [] as number[] },
      { range: '7d+', min: 168, max: Infinity, count: 0, similarities: [] as number[] },
    ]

    memories.forEach((memory) => {
      const hoursSinceCreation = (now.getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60)

      const bucket = buckets.find((b) => hoursSinceCreation >= b.min && hoursSinceCreation < b.max)
      if (bucket) {
        bucket.count++
      }
    })

    const recommendations: string[] = []

    // 生成优化建议
    const recentCount = buckets[0].count + buckets[1].count + buckets[2].count
    const oldCount = buckets[3].count + buckets[4].count

    if (recentCount > oldCount * 2) {
      recommendations.push('建议增加时间衰减因子，降低新内容的权重')
    } else if (oldCount > recentCount * 2) {
      recommendations.push('建议降低时间衰减因子，增加历史内容的权重')
    }

    if (buckets[0].count === 0) {
      recommendations.push('检测到最近1小时内无新记忆，建议检查记忆创建流程')
    }

    return {
      totalMemories: memories.length,
      timeBuckets: buckets.map((b) => ({
        hoursRange: b.range,
        count: b.count,
        avgSimilarity:
          b.similarities.length > 0
            ? b.similarities.reduce((a, b) => a + b, 0) / b.similarities.length
            : undefined,
      })),
      recommendations,
    }
  }

  /**
   * 优化时间感知配置
   * 基于历史数据自动调整配置参数
   */
  async optimizeTimeConfig(gameId: string): Promise<Partial<TimeAwareSearchConfig>> {
    const stats = await this.getTimeDistributionStats(gameId)

    // 基于数据分布智能调整配置
    const recentRatio =
      (stats.timeBuckets[0].count + stats.timeBuckets[1].count) / stats.totalMemories

    const optimizedConfig: Partial<TimeAwareSearchConfig> = {}

    if (recentRatio > 0.7) {
      // 大多数内容都很新，降低时间权重
      optimizedConfig.timeWeightFactor = 0.2
      optimizedConfig.decayFunction = 'linear'
    } else if (recentRatio < 0.3) {
      // 大多数内容都很旧，增加时间权重
      optimizedConfig.timeWeightFactor = 0.4
      optimizedConfig.decayFunction = 'exponential'
    } else {
      // 分布均衡，使用默认配置
      optimizedConfig.timeWeightFactor = 0.3
      optimizedConfig.decayFunction = 'gaussian'
    }

    // 调整动态K值
    const activeBuckets = stats.timeBuckets.filter((b) => b.count > 0)
    if (activeBuckets.length > 0) {
      const avgPerBucket = stats.totalMemories / activeBuckets.length
      optimizedConfig.dynamicK = {
        enabled: true,
        minResults: Math.max(2, Math.floor(avgPerBucket * 0.3)),
        maxResults: Math.min(15, Math.floor(avgPerBucket * 0.8)),
        timeThresholdHours: 24,
      }
    }

    this.logger.debug('Optimized time-aware config:', optimizedConfig)

    return optimizedConfig
  }
}
