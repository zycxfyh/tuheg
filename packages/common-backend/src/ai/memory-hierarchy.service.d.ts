import { PrismaService } from '../prisma/prisma.service'
import { Memory } from '@prisma/client'
import { VectorSearchService } from './vector-search.service'
export declare enum MemoryRecallMode {
  FULL_TEXT = 'full_text',
  RAG_FRAGMENT = 'rag_fragment',
  THRESHOLD_FULL = 'threshold_full',
  THRESHOLD_RAG = 'threshold_rag',
}
export interface MemoryRecallConfig {
  mode: MemoryRecallMode
  similarityThreshold?: number
  limit?: number
  contextText?: string
}
export interface MemoryRecallResult {
  memories: string[]
  mode: MemoryRecallMode
  stats: {
    totalMemories: number
    returnedCount: number
    averageSimilarity?: number
  }
}
export declare class MemoryHierarchyService {
  private readonly prisma
  private readonly vectorSearch
  private readonly logger
  constructor(prisma: PrismaService, vectorSearch: VectorSearchService)
  recallMemories(gameId: string, config: MemoryRecallConfig): Promise<MemoryRecallResult>
  getMemories(gameId: string, limit?: number): Promise<Memory[]>
  getActiveMemories(gameId: string, limit?: number): Promise<Memory[]>
  createMemory(gameId: string, content: string): Promise<Memory>
  deleteMemory(memoryId: string): Promise<Memory>
  getMemoryStats(gameId: string): Promise<{
    total: number
  }>
  parseMemorySyntax(text: string, gameId: string, contextText?: string): Promise<string>
  smartMemoryInjection(
    gameId: string,
    contextText: string,
    options?: {
      maxMemories?: number
      similarityThreshold?: number
      forceFullRecall?: boolean
    }
  ): Promise<{
    content: string
    strategy: string
    stats: any
  }>
  cleanupOldMemories(gameId: string, keepCount?: number): Promise<number>
}
//# sourceMappingURL=memory-hierarchy.service.d.ts.map
