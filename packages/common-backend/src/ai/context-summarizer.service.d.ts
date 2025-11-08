import type { ConfigService } from '@nestjs/config'
import type { User } from '@prisma/client'
import type { DynamicAiSchedulerService } from './dynamic-ai-scheduler.service'
import type { VectorSearchService } from './vector-search.service'
export interface ConversationEntry {
  role: string
  content: string
  timestamp?: Date
  metadata?: Record<string, unknown>
}
export interface SummaryResult {
  summary: string
  entryCount: number
  timestamp: Date
  keyPoints?: string[]
}
export interface CompressedContext {
  recentEntries: ConversationEntry[]
  summaries: SummaryResult[]
  estimatedTokens?: number
}
export interface SummarizationConfig {
  recentEntriesCount: number
  summaryCount: number
  entriesPerSummary: number
  enableCache: boolean
  cacheExpiryMs: number
}
export declare class ContextSummarizerService {
  private readonly configService
  private readonly scheduler
  private readonly vectorSearch
  private readonly logger
  private readonly summaryCache
  private readonly config
  constructor(
    configService: ConfigService,
    scheduler: DynamicAiSchedulerService,
    vectorSearch: VectorSearchService
  )
  compressContext(
    entries: ConversationEntry[],
    user: User,
    gameId?: string,
    currentContext?: string
  ): Promise<CompressedContext>
  private chunkEntries
  generateSummary(entries: ConversationEntry[], user: User): Promise<SummaryResult>
  private generateCacheKey
  formatCompressedContext(compressed: CompressedContext, retrievedMemories?: string[]): string
  compressAndFormatContext(
    entries: ConversationEntry[],
    user: User,
    gameId?: string,
    currentContext?: string
  ): Promise<string>
  clearExpiredCache(): void
  getCacheStats(): {
    size: number
    entries: number
  }
}
//# sourceMappingURL=context-summarizer.service.d.ts.map
