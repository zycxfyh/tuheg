import { PrismaService } from '../prisma/prisma.service'
import { Memory } from '@prisma/client'
export declare class MemoryHierarchyService {
  private readonly prisma
  private readonly logger
  constructor(prisma: PrismaService)
  getMemories(gameId: string, limit?: number): Promise<Memory[]>
  createMemory(gameId: string, content: string): Promise<Memory>
  deleteMemory(memoryId: string): Promise<Memory>
  getMemoryStats(gameId: string): Promise<{
    total: number
  }>
  cleanupOldMemories(gameId: string, keepCount?: number): Promise<number>
}
//# sourceMappingURL=memory-hierarchy.service.simple.d.ts.map
