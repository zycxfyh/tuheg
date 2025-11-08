import type { ConfigService } from '@nestjs/config'
import type { User } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'
export interface VectorSearchResult {
  id: string
  content: string
  similarity: number
  createdAt: Date
  metadata?: Record<string, unknown>
}
export interface VectorSearchConfig {
  limit: number
  minSimilarity: number
  enableCache: boolean
}
export declare class VectorSearchService {
  private readonly prisma
  private readonly configService
  private readonly logger
  private readonly embeddingsCache
  private readonly config
  constructor(prisma: PrismaService, configService: ConfigService)
  generateEmbedding(text: string, user: User): Promise<number[]>
  searchSimilarMemories(
    queryText: string,
    gameId: string,
    user: User,
    options?: Partial<VectorSearchConfig>
  ): Promise<VectorSearchResult[]>
  generateAndStoreEmbedding(memoryId: string, content: string, user: User): Promise<void>
  clearCache(): void
  getCacheStats(): {
    size: number
  }
}
//# sourceMappingURL=vector-search.service.d.ts.map
