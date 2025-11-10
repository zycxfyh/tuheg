// 文件路径: packages/common-backend/src/ai/memory-hierarchy.service.ts
// 职责: 记忆管理服务，管理游戏记忆的4种高级召回模式
// 借鉴 VCPToolBox 的4种记忆召回模式:
// 1. {{角色日记本}} - 无条件全文注入
// 2. [[角色日记本]] - RAG片段检索
// 3. <<角色日记本>> - 阈值全文注入
// 4. 《《角色日记本》》 - 阈值RAG片段检索

import { Injectable, Logger } from '@nestjs/common'
import type { Memory } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'
import type { VectorSearchService } from './vector-search.service'

/**
 * 记忆召回模式枚举
 */
export enum MemoryRecallMode {
  /** 无条件全文注入 - 直接返回所有相关记忆 */
  FULL_TEXT = 'full_text',
  /** RAG片段检索 - 基于语义相似度检索 */
  RAG_FRAGMENT = 'rag_fragment',
  /** 阈值全文注入 - 基于相似度阈值决定是否全文注入 */
  THRESHOLD_FULL = 'threshold_full',
  /** 阈值RAG片段检索 - 基于相似度阈值决定是否RAG检索 */
  THRESHOLD_RAG = 'threshold_rag',
}

/**
 * 记忆召回配置
 */
export interface MemoryRecallConfig {
  /** 召回模式 */
  mode: MemoryRecallMode
  /** 相似度阈值 (0-1) */
  similarityThreshold?: number
  /** 最大返回数量 */
  limit?: number
  /** 上下文文本 (用于语义检索) */
  contextText?: string
}

/**
 * 记忆召回结果
 */
export interface MemoryRecallResult {
  /** 召回的记忆内容 */
  memories: string[]
  /** 使用的召回模式 */
  mode: MemoryRecallMode
  /** 召回统计信息 */
  stats: {
    totalMemories: number
    returnedCount: number
    averageSimilarity?: number
  }
}

/**
 * 记忆管理服务 - VCPToolBox 4种召回模式实现
 * 提供高级的记忆操作功能
 */
@Injectable()
export class MemoryHierarchyService {
  private readonly logger = new Logger(MemoryHierarchyService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorSearch: VectorSearchService
  ) {}

  /**
   * [VCPToolBox核心] 智能记忆召回 - 支持4种召回模式
   *
   * @param gameId - 游戏 ID
   * @param config - 召回配置
   * @returns 召回结果
   */
  async recallMemories(gameId: string, config: MemoryRecallConfig): Promise<MemoryRecallResult> {
    const { mode, similarityThreshold = 0.7, limit = 10, contextText } = config

    // 获取游戏的所有记忆用于统计
    const allMemories = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
    })

    let memories: string[] = []
    let averageSimilarity = 0

    switch (mode) {
      case MemoryRecallMode.FULL_TEXT: {
        // {{角色日记本}} - 无条件全文注入
        memories = allMemories.slice(0, limit).map((m) => m.content)
        break
      }

      case MemoryRecallMode.RAG_FRAGMENT:
        {
          // [[角色日记本]] - RAG片段检索
          if (!contextText) {
            throw new Error('RAG模式需要提供上下文文本')
          }
          const ragResults = await this.vectorSearch.searchSimilarMemories(
            contextText,
            gameId,
            { id: 'system' } as any, // 简化用户对象
            { limit, minSimilarity: 0 }
          )
          memories = ragResults.map((r) => r.content)
          averageSimilarity =
            ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length || 0
        }
        break

      case MemoryRecallMode.THRESHOLD_FULL: {
        // <<角色日记本>> - 阈值全文注入
        if (!contextText) {
          throw new Error('阈值模式需要提供上下文文本')
        }
        const thresholdResults = await this.vectorSearch.searchSimilarMemories(
          contextText,
          gameId,
          { id: 'system' } as any,
          { limit: 1, minSimilarity: similarityThreshold }
        )
        if (thresholdResults.length > 0) {
          // 如果找到足够相似的记忆，返回所有记忆的全文
          memories = allMemories.slice(0, limit).map((m) => m.content)
        } else {
          // 否则返回空
          memories = []
        }
        averageSimilarity = thresholdResults[0]?.similarity
        break
      }

      case MemoryRecallMode.THRESHOLD_RAG:
        {
          // 《《角色日记本》》 - 阈值RAG片段检索
          if (!contextText) {
            throw new Error('阈值RAG模式需要提供上下文文本')
          }
          const thresholdRagResults = await this.vectorSearch.searchSimilarMemories(
            contextText,
            gameId,
            { id: 'system' } as any,
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

  /**
   * [向后兼容] 获取游戏的记忆列表
   * @deprecated 使用 recallMemories 替代
   */
  async getMemories(gameId: string, limit?: number): Promise<Memory[]> {
    return this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * [向后兼容] 获取活跃记忆 - 等价于 FULL_TEXT 模式
   * @deprecated 使用 recallMemories 替代
   */
  async getActiveMemories(gameId: string, limit: number = 20): Promise<Memory[]> {
    const _result = await this.recallMemories(gameId, {
      mode: MemoryRecallMode.FULL_TEXT,
      limit,
    })
    // 返回 Memory 对象而不是字符串数组
    const memories = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return memories
  }

  /**
   * 创建新记忆
   *
   * @param gameId - 游戏 ID
   * @param content - 记忆内容
   * @returns 创建的记忆
   */
  async createMemory(gameId: string, content: string): Promise<Memory> {
    return this.prisma.memory.create({
      data: {
        gameId,
        content,
      },
    })
  }

  /**
   * 删除记忆
   *
   * @param memoryId - 记忆 ID
   * @returns 删除的记忆
   */
  async deleteMemory(memoryId: string): Promise<Memory> {
    return this.prisma.memory.delete({
      where: { id: memoryId },
    })
  }

  /**
   * 获取记忆数量统计
   *
   * @param gameId - 游戏 ID
   * @returns 统计信息
   */
  async getMemoryStats(gameId: string): Promise<{ total: number }> {
    const count = await this.prisma.memory.count({
      where: { gameId },
    })

    return { total: count }
  }

  /**
   * [VCPToolBox核心] 解析记忆召回语法
   * 支持4种记忆召回标记的解析和替换
   *
   * @param text - 包含记忆召回标记的文本
   * @param gameId - 游戏 ID
   * @param contextText - 上下文文本（用于语义检索）
   * @returns 解析后的文本
   */
  async parseMemorySyntax(text: string, gameId: string, contextText?: string): Promise<string> {
    let result = text

    // 匹配4种记忆召回语法
    const patterns = [
      // {{角色日记本}} - 无条件全文注入
      { regex: /\{\{([^}]+)\}\}/g, mode: MemoryRecallMode.FULL_TEXT },
      // [[角色日记本]] - RAG片段检索
      { regex: /\[\[([^\]]+)\]\]/g, mode: MemoryRecallMode.RAG_FRAGMENT },
      // <<角色日记本>> - 阈值全文注入
      { regex: /<<([^>]+)>>/g, mode: MemoryRecallMode.THRESHOLD_FULL },
      // 《《角色日记本》》 - 阈值RAG片段检索
      { regex: /《《([^》]+)》》/g, mode: MemoryRecallMode.THRESHOLD_RAG },
    ]

    for (const pattern of patterns) {
      const matches = [...result.matchAll(pattern.regex)]
      for (const match of matches) {
        const memoryName = match[1]?.trim()
        const fullMatch = match[0]

        try {
          const recallResult = await this.recallMemories(gameId, {
            mode: pattern.mode,
            contextText: pattern.mode.includes('rag') ? contextText : undefined,
            limit: 5, // 默认最多返回5条记忆
          })

          // 格式化记忆内容
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
          // 如果解析失败，保持原标记不变
        }
      }
    }

    return result
  }

  /**
   * [VCPToolBox扩展] 智能记忆注入
   * 分析上下文并自动决定最合适的记忆召回策略
   *
   * @param gameId - 游戏 ID
   * @param contextText - 上下文文本
   * @param options - 选项配置
   * @returns 智能注入的记忆内容
   */
  async smartMemoryInjection(
    gameId: string,
    contextText: string,
    options?: {
      maxMemories?: number
      similarityThreshold?: number
      forceFullRecall?: boolean
    }
  ): Promise<{ content: string; strategy: string; stats: any }> {
    const { maxMemories = 3, similarityThreshold = 0.7, forceFullRecall = false } = options || {}

    // 首先尝试RAG检索
    const ragResult = await this.recallMemories(gameId, {
      mode: MemoryRecallMode.RAG_FRAGMENT,
      contextText,
      limit: maxMemories,
    })

    let content = ''
    let strategy = ''

    if (forceFullRecall || ragResult.memories.length === 0) {
      // 如果强制全文或RAG无结果，使用阈值全文模式
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
      // 使用RAG结果
      content = ragResult.memories.join('\n---\n')
      strategy = 'rag_fragment_recall'
    }

    return {
      content,
      strategy,
      stats: ragResult.stats,
    }
  }

  /**
   * 清理旧记忆（保留最近的N条）
   *
   * @param gameId - 游戏 ID
   * @param keepCount - 保留数量
   * @returns 清理的记忆数量
   */
  async cleanupOldMemories(gameId: string, keepCount: number = 100): Promise<number> {
    // 获取需要删除的记忆ID
    const memoriesToDelete = await this.prisma.memory.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      skip: keepCount,
      select: { id: true },
    })

    if (memoriesToDelete.length === 0) {
      return 0
    }

    // 批量删除
    const result = await this.prisma.memory.deleteMany({
      where: {
        id: { in: memoriesToDelete.map((m) => m.id) },
      },
    })

    this.logger.log(`Cleaned up ${result.count} old memories for game ${gameId}`)
    return result.count
  }
}
