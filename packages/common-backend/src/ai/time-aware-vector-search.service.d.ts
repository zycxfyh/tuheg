import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { VectorSearchService, VectorSearchResult } from './vector-search.service'
export interface TimeAwareSearchConfig {
  timeWeightFactor: number
  timeWindowHours: number
  dynamicK: {
    enabled: boolean
    minResults: number
    maxResults: number
    timeThresholdHours: number
  }
  decayFunction: 'linear' | 'exponential' | 'gaussian'
  baseConfig: {
    limit: number
    minSimilarity: number
  }
}
export interface TimeAwareSearchResult extends VectorSearchResult {
  timeWeight: number
  combinedScore: number
  hoursSinceCreation: number
  decayedScore: number
}
export declare class TimeAwareVectorSearchService {
  private readonly configService
  private readonly prisma
  private readonly vectorSearch
  private readonly logger
  private readonly defaultConfig
  constructor(
    configService: ConfigService,
    prisma: PrismaService,
    vectorSearch: VectorSearchService
  )
  searchWithTimeAwareness(
    queryText: string,
    gameId: string,
    user: any,
    config?: Partial<TimeAwareSearchConfig>
  ): Promise<TimeAwareSearchResult[]>
  private calculateTimeAwareScores
  private calculateTimeWeight
  private applyTimeDecay
  private combineScores
  private applyDynamicK
  private fallbackToBaseSearch
  getTimeDistributionStats(gameId: string): Promise<{
    totalMemories: number
    timeBuckets: Array<{
      hoursRange: string
      count: number
      avgSimilarity?: number
    }>
    recommendations: string[]
  }>
  optimizeTimeConfig(gameId: string): Promise<Partial<TimeAwareSearchConfig>>
}
//# sourceMappingURL=time-aware-vector-search.service.d.ts.map
