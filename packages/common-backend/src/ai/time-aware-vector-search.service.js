'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var TimeAwareVectorSearchService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.TimeAwareVectorSearchService = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
const prisma_service_1 = require('../prisma/prisma.service')
const vector_search_service_1 = require('./vector-search.service')
let TimeAwareVectorSearchService =
  (TimeAwareVectorSearchService_1 = class TimeAwareVectorSearchService {
    configService
    prisma
    vectorSearch
    logger = new common_1.Logger(TimeAwareVectorSearchService_1.name)
    defaultConfig = {
      timeWeightFactor: 0.3,
      timeWindowHours: 168,
      dynamicK: {
        enabled: true,
        minResults: 3,
        maxResults: 10,
        timeThresholdHours: 24,
      },
      decayFunction: 'exponential',
      baseConfig: {
        limit: 15,
        minSimilarity: 0.6,
      },
    }
    constructor(configService, prisma, vectorSearch) {
      this.configService = configService
      this.prisma = prisma
      this.vectorSearch = vectorSearch
    }
    async searchWithTimeAwareness(queryText, gameId, user, config) {
      const searchConfig = { ...this.defaultConfig, ...config }
      const startTime = Date.now()
      try {
        this.logger.debug(`Starting time-aware search for query: "${queryText}"`)
        const baseResults = await this.vectorSearch.searchSimilarMemories(queryText, gameId, user, {
          limit: searchConfig.baseConfig.limit,
          minSimilarity: searchConfig.baseConfig.minSimilarity,
        })
        if (baseResults.length === 0) {
          this.logger.debug('No base results found')
          return []
        }
        this.logger.debug(`Found ${baseResults.length} base results`)
        const timeAwareResults = await this.calculateTimeAwareScores(baseResults, searchConfig)
        const finalResults = this.applyDynamicK(timeAwareResults, searchConfig)
        const duration = Date.now() - startTime
        this.logger.debug(
          `Time-aware search completed in ${duration}ms, ` +
            `returned ${finalResults.length} results`
        )
        return finalResults
      } catch (error) {
        this.logger.error('Time-aware search failed:', error)
        return this.fallbackToBaseSearch(queryText, gameId, user)
      }
    }
    async calculateTimeAwareScores(baseResults, config) {
      const now = new Date()
      const timeWindowMs = config.timeWindowHours * 60 * 60 * 1000
      return baseResults
        .map((result) => {
          const hoursSinceCreation = (now.getTime() - result.createdAt.getTime()) / (1000 * 60 * 60)
          const timeWeight = this.calculateTimeWeight(hoursSinceCreation, config)
          const decayedSimilarity = this.applyTimeDecay(
            result.similarity,
            hoursSinceCreation,
            config
          )
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
        .sort((a, b) => b.combinedScore - a.combinedScore)
    }
    calculateTimeWeight(hoursSinceCreation, config) {
      const normalizedTime = Math.min(hoursSinceCreation / config.timeWindowHours, 1)
      switch (config.decayFunction) {
        case 'linear': {
          return 1 - normalizedTime
        }
        case 'exponential': {
          return Math.exp(-2 * normalizedTime)
        }
        case 'gaussian': {
          const sigma = 0.3
          return Math.exp(-Math.pow(normalizedTime - 0.3, 2) / (2 * sigma * sigma))
        }
        default:
          return 1 - normalizedTime
      }
    }
    applyTimeDecay(similarity, hoursSinceCreation, config) {
      const timeWeight = this.calculateTimeWeight(hoursSinceCreation, config)
      return similarity * (1 - config.timeWeightFactor) + timeWeight * config.timeWeightFactor
    }
    combineScores(similarity, timeWeight, timeWeightFactor) {
      return similarity * (1 - timeWeightFactor) + timeWeight * timeWeightFactor
    }
    applyDynamicK(results, config) {
      if (!config.dynamicK.enabled) {
        return results.slice(0, config.baseConfig.limit)
      }
      const { minResults, maxResults, timeThresholdHours } = config.dynamicK
      const recentResults = results.filter((r) => r.hoursSinceCreation <= timeThresholdHours)
      const oldResults = results.filter((r) => r.hoursSinceCreation > timeThresholdHours)
      let finalResults = []
      if (recentResults.length >= minResults) {
        finalResults = recentResults.slice(0, maxResults)
      } else {
        finalResults = [
          ...recentResults,
          ...oldResults.slice(0, minResults - recentResults.length),
        ].slice(0, maxResults)
      }
      if (finalResults.length < minResults && results.length > finalResults.length) {
        const additional = results
          .filter((r) => !finalResults.some((fr) => fr.id === r.id))
          .slice(0, minResults - finalResults.length)
        finalResults = [...finalResults, ...additional]
      }
      return finalResults
    }
    async fallbackToBaseSearch(queryText, gameId, user) {
      this.logger.warn('Falling back to base vector search')
      const baseResults = await this.vectorSearch.searchSimilarMemories(queryText, gameId, user)
      return baseResults.map((result) => ({
        ...result,
        timeWeight: 0.5,
        combinedScore: result.similarity * 0.5 + 0.5 * 0.5,
        hoursSinceCreation: (Date.now() - result.createdAt.getTime()) / (1000 * 60 * 60),
        decayedScore: result.similarity,
      }))
    }
    async getTimeDistributionStats(gameId) {
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
        { range: '0-1h', min: 0, max: 1, count: 0, similarities: [] },
        { range: '1-6h', min: 1, max: 6, count: 0, similarities: [] },
        { range: '6-24h', min: 6, max: 24, count: 0, similarities: [] },
        { range: '1-7d', min: 24, max: 168, count: 0, similarities: [] },
        { range: '7d+', min: 168, max: Infinity, count: 0, similarities: [] },
      ]
      memories.forEach((memory) => {
        const hoursSinceCreation = (now.getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60)
        const bucket = buckets.find(
          (b) => hoursSinceCreation >= b.min && hoursSinceCreation < b.max
        )
        if (bucket) {
          bucket.count++
        }
      })
      const recommendations = []
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
    async optimizeTimeConfig(gameId) {
      const stats = await this.getTimeDistributionStats(gameId)
      const recentRatio =
        (stats.timeBuckets[0].count + stats.timeBuckets[1].count) / stats.totalMemories
      const optimizedConfig = {}
      if (recentRatio > 0.7) {
        optimizedConfig.timeWeightFactor = 0.2
        optimizedConfig.decayFunction = 'linear'
      } else if (recentRatio < 0.3) {
        optimizedConfig.timeWeightFactor = 0.4
        optimizedConfig.decayFunction = 'exponential'
      } else {
        optimizedConfig.timeWeightFactor = 0.3
        optimizedConfig.decayFunction = 'gaussian'
      }
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
  })
exports.TimeAwareVectorSearchService = TimeAwareVectorSearchService
exports.TimeAwareVectorSearchService =
  TimeAwareVectorSearchService =
  TimeAwareVectorSearchService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [
          config_1.ConfigService,
          prisma_service_1.PrismaService,
          vector_search_service_1.VectorSearchService,
        ]),
      ],
      TimeAwareVectorSearchService
    )
//# sourceMappingURL=time-aware-vector-search.service.js.map
