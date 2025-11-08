var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
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
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var MemoryHierarchyService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.MemoryHierarchyService = exports.MemoryRecallMode = void 0
const common_1 = require('@nestjs/common')
const prisma_service_1 = require('../prisma/prisma.service')
const vector_search_service_1 = require('./vector-search.service')
var MemoryRecallMode
;((MemoryRecallMode) => {
  MemoryRecallMode['FULL_TEXT'] = 'full_text'
  MemoryRecallMode['RAG_FRAGMENT'] = 'rag_fragment'
  MemoryRecallMode['THRESHOLD_FULL'] = 'threshold_full'
  MemoryRecallMode['THRESHOLD_RAG'] = 'threshold_rag'
})(MemoryRecallMode || (exports.MemoryRecallMode = MemoryRecallMode = {}))
let MemoryHierarchyService = (MemoryHierarchyService_1 = class MemoryHierarchyService {
  prisma
  vectorSearch
  logger = new common_1.Logger(MemoryHierarchyService_1.name)
  constructor(prisma, vectorSearch) {
    this.prisma = prisma
    this.vectorSearch = vectorSearch
  }
  async recallMemories(gameId, config) {
    const { mode, similarityThreshold = 0.7, limit = 10, contextText } = config
    const allMemories = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
    })
    let memories = []
    let averageSimilarity
    switch (mode) {
      case MemoryRecallMode.FULL_TEXT: {
        memories = allMemories.slice(0, limit).map((m) => m.content)
        break
      }
      case MemoryRecallMode.RAG_FRAGMENT:
        {
          if (!contextText) {
            throw new Error('RAG模式需要提供上下文文本')
          }
          const ragResults = await this.vectorSearch.searchSimilarMemories(
            contextText,
            gameId,
            { id: 'system' },
            { limit, minSimilarity: 0 }
          )
          memories = ragResults.map((r) => r.content)
          averageSimilarity =
            ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length || 0
        }
        break
      case MemoryRecallMode.THRESHOLD_FULL: {
        if (!contextText) {
          throw new Error('阈值模式需要提供上下文文本')
        }
        const thresholdResults = await this.vectorSearch.searchSimilarMemories(
          contextText,
          gameId,
          { id: 'system' },
          { limit: 1, minSimilarity: similarityThreshold }
        )
        if (thresholdResults.length > 0) {
          memories = allMemories.slice(0, limit).map((m) => m.content)
        } else {
          memories = []
        }
        averageSimilarity = thresholdResults[0]?.similarity
        break
      }
      case MemoryRecallMode.THRESHOLD_RAG:
        {
          if (!contextText) {
            throw new Error('阈值RAG模式需要提供上下文文本')
          }
          const thresholdRagResults = await this.vectorSearch.searchSimilarMemories(
            contextText,
            gameId,
            { id: 'system' },
            { limit, minSimilarity: similarityThreshold }
          )
          memories = thresholdRagResults.map((r) => r.content)
          averageSimilarity =
            thresholdRagResults.reduce((sum, r) => sum + r.similarity, 0) /
              thresholdRagResults.length || 0
        }
        break
      default:
        throw new Error(`未知的记忆召回模式: ${mode}`)
    }
    return {
      memories,
      mode,
      stats: {
        totalMemories: allMemories.length,
        returnedCount: memories.length,
        averageSimilarity,
      },
    }
  }
  async getMemories(gameId, limit) {
    return this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
  async getActiveMemories(gameId, limit = 20) {
    const result = await this.recallMemories(gameId, {
      mode: MemoryRecallMode.FULL_TEXT,
      limit,
    })
    const memories = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return memories
  }
  async createMemory(gameId, content) {
    return this.prisma.memory.create({
      data: {
        gameId,
        content,
      },
    })
  }
  async deleteMemory(memoryId) {
    return this.prisma.memory.delete({
      where: { id: memoryId },
    })
  }
  async getMemoryStats(gameId) {
    const count = await this.prisma.memory.count({
      where: { gameId },
    })
    return { total: count }
  }
  async parseMemorySyntax(text, gameId, contextText) {
    let result = text
    const patterns = [
      { regex: /\{\{([^}]+)\}\}/g, mode: MemoryRecallMode.FULL_TEXT },
      { regex: /\[\[([^\]]+)\]\]/g, mode: MemoryRecallMode.RAG_FRAGMENT },
      { regex: /<<([^>]+)>>/g, mode: MemoryRecallMode.THRESHOLD_FULL },
      { regex: /《《([^》]+)》》/g, mode: MemoryRecallMode.THRESHOLD_RAG },
    ]
    for (const pattern of patterns) {
      const matches = [...result.matchAll(pattern.regex)]
      for (const match of matches) {
        const memoryName = match[1].trim()
        const fullMatch = match[0]
        try {
          const recallResult = await this.recallMemories(gameId, {
            mode: pattern.mode,
            contextText: pattern.mode.includes('rag') ? contextText : undefined,
            limit: 5,
          })
          let replacement = ''
          if (recallResult.memories.length > 0) {
            replacement = `\n--- ${memoryName} 记忆 ---\n${recallResult.memories.join('\n---\n')}\n--- 记忆结束 ---\n`
          } else {
            replacement = `\n--- ${memoryName} 记忆 ---\n(暂无相关记忆)\n--- 记忆结束 ---\n`
          }
          result = result.replace(fullMatch, replacement)
          this.logger.debug(
            `Parsed memory syntax: ${fullMatch} -> ${recallResult.memories.length} memories recalled`
          )
        } catch (error) {
          this.logger.warn(`Failed to parse memory syntax ${fullMatch}:`, error)
        }
      }
    }
    return result
  }
  async smartMemoryInjection(gameId, contextText, options) {
    const { maxMemories = 3, similarityThreshold = 0.7, forceFullRecall = false } = options || {}
    const ragResult = await this.recallMemories(gameId, {
      mode: MemoryRecallMode.RAG_FRAGMENT,
      contextText,
      limit: maxMemories,
    })
    let content = ''
    let strategy = ''
    if (forceFullRecall || ragResult.memories.length === 0) {
      const thresholdResult = await this.recallMemories(gameId, {
        mode: MemoryRecallMode.THRESHOLD_FULL,
        contextText,
        similarityThreshold,
        limit: maxMemories,
      })
      if (thresholdResult.memories.length > 0) {
        content = thresholdResult.memories.join('\n---\n')
        strategy = 'threshold_full_recall'
      } else {
        content = '暂无高度相关的历史记忆'
        strategy = 'no_relevant_memory'
      }
    } else {
      content = ragResult.memories.join('\n---\n')
      strategy = 'rag_fragment_recall'
    }
    return {
      content,
      strategy,
      stats: ragResult.stats,
    }
  }
  async cleanupOldMemories(gameId, keepCount = 100) {
    const memoriesToDelete = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      skip: keepCount,
      select: { id: true },
    })
    if (memoriesToDelete.length === 0) {
      return 0
    }
    const result = await this.prisma.memory.deleteMany({
      where: {
        id: { in: memoriesToDelete.map((m) => m.id) },
      },
    })
    this.logger.log(`Cleaned up ${result.count} old memories for game ${gameId}`)
    return result.count
  }
})
exports.MemoryHierarchyService = MemoryHierarchyService
exports.MemoryHierarchyService =
  MemoryHierarchyService =
  MemoryHierarchyService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [
          prisma_service_1.PrismaService,
          vector_search_service_1.VectorSearchService,
        ]),
      ],
      MemoryHierarchyService
    )
//# sourceMappingURL=memory-hierarchy.service.js.map
