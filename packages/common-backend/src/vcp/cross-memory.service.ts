// ============================================================================
// 跨记忆网络服务集成
// 集成 VCPToolBox 的智能记忆共享和联想能力
// ============================================================================

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  crossMemoryNetwork,
  type MemoryEntry,
  type MemoryQuery,
  type MemorySearchResult,
} from '../../../apps/vcptoolbox/src/modules/storage/CrossMemoryNetwork'

@Injectable()
export class CrossMemoryService implements OnModuleInit {
  private readonly logger = new Logger(CrossMemoryService.name)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeMemorySystem()
    this.setupMemoryMaintenance()
    this.logger.log('跨记忆网络服务已初始化')
  }

  // ==================== 记忆系统初始化 ====================

  /**
   * 初始化记忆系统
   */
  private async initializeMemorySystem(): Promise<void> {
    // 设置记忆网络参数
    const similarityThreshold = this.configService.get('MEMORY_SIMILARITY_THRESHOLD', 0.7)
    const maxConnections = this.configService.get('MEMORY_MAX_CONNECTIONS', 10)
    const decayRate = this.configService.get('MEMORY_DECAY_RATE', 0.95)

    // 重新配置记忆网络（如果需要）
    // 注意：crossMemoryNetwork 已经在模块中初始化，这里可以设置参数

    // 创建系统初始记忆
    await this.createSystemMemories()

    this.logger.log('记忆系统参数已配置')
  }

  /**
   * 创建系统初始记忆
   */
  private async createSystemMemories(): Promise<void> {
    const systemMemories: Omit<MemoryEntry, 'id' | 'fingerprint' | 'metadata'>[] = [
      {
        agentId: 'system',
        type: 'knowledge',
        content: {
          topic: 'narrative_basics',
          information: '叙事创作的基本要素包括人物、情节、设定和主题',
        },
        tags: ['narrative', 'basics', 'knowledge', 'system'],
        importance: 0.9,
        connections: [],
      },
      {
        agentId: 'system',
        type: 'experience',
        content: {
          event: 'system_initialization',
          outcome: '记忆系统成功初始化',
          lessons: '记忆系统对于AI创作至关重要',
        },
        tags: ['system', 'initialization', 'experience'],
        importance: 0.8,
        connections: [],
      },
      {
        agentId: 'system',
        type: 'knowledge',
        content: {
          topic: 'collaboration_patterns',
          information: '有效的Agent协作需要明确的角色分工和通信协议',
        },
        tags: ['collaboration', 'patterns', 'knowledge', 'system'],
        importance: 0.85,
        connections: [],
      },
    ]

    for (const memory of systemMemories) {
      try {
        await crossMemoryNetwork.addMemory(memory)
      } catch (error) {
        this.logger.warn(`创建系统记忆失败: ${memory.content}`, error)
      }
    }

    this.logger.log('系统初始记忆已创建')
  }

  /**
   * 设置记忆维护任务
   */
  private setupMemoryMaintenance(): void {
    // 定期应用记忆衰减
    setInterval(
      () => {
        try {
          crossMemoryNetwork.applyMemoryDecay()
        } catch (error) {
          this.logger.error('记忆衰减应用失败:', error)
        }
      },
      60 * 60 * 1000
    ) // 每小时执行一次

    // 定期清理和优化记忆网络
    setInterval(
      () => {
        this.optimizeMemoryNetwork()
      },
      24 * 60 * 60 * 1000
    ) // 每天执行一次
  }

  // ==================== 记忆管理接口 ====================

  /**
   * 添加记忆
   */
  async addMemory(
    memoryData: Omit<MemoryEntry, 'id' | 'fingerprint' | 'metadata'>
  ): Promise<string> {
    try {
      const memoryId = await crossMemoryNetwork.addMemory(memoryData)
      this.logger.debug(`记忆已添加: ${memoryId}`)
      return memoryId
    } catch (error: any) {
      this.logger.error('添加记忆失败:', error)
      throw error
    }
  }

  /**
   * 获取记忆
   */
  async getMemory(memoryId: string): Promise<MemoryEntry | null> {
    try {
      return crossMemoryNetwork.getMemory(memoryId)
    } catch (error: any) {
      this.logger.warn(`获取记忆失败 ${memoryId}:`, error)
      return null
    }
  }

  /**
   * 更新记忆
   */
  async updateMemory(
    memoryId: string,
    updates: Partial<Omit<MemoryEntry, 'id' | 'fingerprint' | 'metadata'>>
  ): Promise<boolean> {
    try {
      const success = crossMemoryNetwork.updateMemory(memoryId, updates)
      if (success) {
        this.logger.debug(`记忆已更新: ${memoryId}`)
      }
      return success
    } catch (error: any) {
      this.logger.error(`更新记忆失败 ${memoryId}:`, error)
      return false
    }
  }

  /**
   * 删除记忆
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const success = crossMemoryNetwork.deleteMemory(memoryId)
      if (success) {
        this.logger.debug(`记忆已删除: ${memoryId}`)
      }
      return success
    } catch (error: any) {
      this.logger.error(`删除记忆失败 ${memoryId}:`, error)
      return false
    }
  }

  /**
   * 查询记忆
   */
  async queryMemories(query: MemoryQuery): Promise<MemorySearchResult[]> {
    try {
      return await crossMemoryNetwork.queryMemories(query)
    } catch (error: any) {
      this.logger.error('查询记忆失败:', error)
      return []
    }
  }

  /**
   * 更新记忆重要性
   */
  async updateMemoryImportance(memoryId: string, importance: number): Promise<boolean> {
    try {
      const success = crossMemoryNetwork.updateMemoryImportance(memoryId, importance)
      if (success) {
        this.logger.debug(`记忆重要性已更新: ${memoryId} = ${importance}`)
      }
      return success
    } catch (error: any) {
      this.logger.error(`更新记忆重要性失败 ${memoryId}:`, error)
      return false
    }
  }

  // ==================== 叙事专用记忆接口 ====================

  /**
   * 添加故事记忆
   */
  async addStoryMemory(
    storyId: string,
    agentId: string,
    content: any,
    type: MemoryEntry['type'] = 'experience'
  ): Promise<string> {
    const memoryData = {
      agentId,
      type,
      content: {
        storyId,
        ...content,
      },
      tags: ['story', storyId, type, agentId],
      importance: this.calculateStoryMemoryImportance(content, type),
      connections: [],
    }

    return await this.addMemory(memoryData)
  }

  /**
   * 查询故事相关记忆
   */
  async queryStoryMemories(
    storyId: string,
    agentId?: string,
    limit: number = 20
  ): Promise<MemorySearchResult[]> {
    const query: MemoryQuery = {
      tags: ['story', storyId],
      limit,
      sortBy: 'recency',
    }

    if (agentId) {
      query.agentId = agentId
    }

    return await this.queryMemories(query)
  }

  /**
   * 添加角色记忆
   */
  async addCharacterMemory(characterId: string, agentId: string, content: any): Promise<string> {
    const memoryData = {
      agentId,
      type: 'experience',
      content: {
        characterId,
        ...content,
      },
      tags: ['character', characterId, 'development', agentId],
      importance: this.calculateCharacterMemoryImportance(content),
      connections: [],
    }

    return await this.addMemory(memoryData)
  }

  /**
   * 查询角色相关记忆
   */
  async queryCharacterMemories(
    characterId: string,
    limit: number = 15
  ): Promise<MemorySearchResult[]> {
    return await this.queryMemories({
      tags: ['character', characterId],
      limit,
      sortBy: 'importance',
    })
  }

  /**
   * 添加创作模式记忆
   */
  async addCreativePattern(
    patternType: string,
    agentId: string,
    pattern: any,
    success: boolean
  ): Promise<string> {
    const memoryData = {
      agentId,
      type: success ? 'experience' : 'knowledge',
      content: {
        patternType,
        pattern,
        success,
        lessons: success ? '有效的创作模式' : '需要改进的创作模式',
      },
      tags: ['creative-pattern', patternType, success ? 'success' : 'failure', agentId],
      importance: success ? 0.8 : 0.6,
      connections: [],
    }

    return await this.addMemory(memoryData)
  }

  /**
   * 查找相似创作模式
   */
  async findSimilarCreativePatterns(
    patternType: string,
    currentPattern: any,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    // 简化的模式匹配，实际应该使用更复杂的相似度算法
    const query: MemoryQuery = {
      tags: ['creative-pattern', patternType, 'success'],
      limit,
      sortBy: 'importance',
    }

    const results = await this.queryMemories(query)

    // 进一步过滤相似模式
    return results.filter((result) => {
      const pattern = result.memory.content.pattern
      return this.calculatePatternSimilarity(currentPattern, pattern) > 0.7
    })
  }

  /**
   * 添加用户偏好记忆
   */
  async addUserPreference(
    userId: string,
    preferenceType: string,
    preference: any
  ): Promise<string> {
    const memoryData = {
      agentId: 'user-preference-agent',
      type: 'knowledge',
      content: {
        userId,
        preferenceType,
        preference,
        context: 'user_preference',
      },
      tags: ['user-preference', userId, preferenceType],
      importance: 0.9, // 用户偏好很重要
      connections: [],
    }

    return await this.addMemory(memoryData)
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(userId: string, preferenceType?: string): Promise<any[]> {
    const query: MemoryQuery = {
      tags: ['user-preference', userId],
      sortBy: 'recency',
      limit: 50,
    }

    if (preferenceType) {
      query.tags!.push(preferenceType)
    }

    const results = await this.queryMemories(query)
    return results.map((result) => ({
      type: result.memory.content.preferenceType,
      preference: result.memory.content.preference,
      timestamp: result.memory.metadata.createdAt,
      confidence: result.memory.metadata.confidence,
    }))
  }

  // ==================== 智能联想接口 ====================

  /**
   * 查找相关记忆
   */
  async findRelatedMemories(memoryId: string, limit: number = 10): Promise<MemoryEntry[]> {
    try {
      return await crossMemoryNetwork.findRelatedMemories(memoryId, limit)
    } catch (error: any) {
      this.logger.warn(`查找相关记忆失败 ${memoryId}:`, error)
      return []
    }
  }

  /**
   * 基于内容的智能搜索
   */
  async intelligentSearch(
    query: string,
    context: {
      userId?: string
      storyId?: string
      agentId?: string
      tags?: string[]
    } = {},
    limit: number = 20
  ): Promise<MemorySearchResult[]> {
    const searchQuery: MemoryQuery = {
      content: query,
      fuzzy: true,
      limit,
      sortBy: 'relevance',
    }

    // 添加上下文过滤
    if (context.userId) {
      searchQuery.tags = (searchQuery.tags || []).concat(['user', context.userId])
    }
    if (context.storyId) {
      searchQuery.tags = (searchQuery.tags || []).concat(['story', context.storyId])
    }
    if (context.agentId) {
      searchQuery.agentId = context.agentId
    }
    if (context.tags) {
      searchQuery.tags = (searchQuery.tags || []).concat(context.tags)
    }

    return await this.queryMemories(searchQuery)
  }

  /**
   * 获取创作灵感
   */
  async getCreativeInspiration(
    storyId: string,
    theme: string,
    limit: number = 10
  ): Promise<MemorySearchResult[]> {
    // 查找与主题相关的成功创作经验
    const inspirationQuery: MemoryQuery = {
      tags: ['creative-pattern', 'success'],
      content: theme,
      fuzzy: true,
      limit,
      sortBy: 'importance',
    }

    const results = await this.queryMemories(inspirationQuery)

    // 补充一些通用的创作知识
    const generalKnowledge = await this.queryMemories({
      tags: ['narrative', 'knowledge'],
      limit: 5,
    })

    return [...results, ...generalKnowledge].slice(0, limit)
  }

  // ==================== Agent协作记忆 ====================

  /**
   * 记录Agent协作经验
   */
  async recordCollaborationExperience(
    collaborationId: string,
    agents: string[],
    outcome: any
  ): Promise<string> {
    const memoryData = {
      agentId: 'collaboration-agent',
      type: 'experience',
      content: {
        collaborationId,
        agents,
        outcome,
        effectiveness: this.evaluateCollaborationEffectiveness(outcome),
        lessons: this.extractCollaborationLessons(outcome),
      },
      tags: ['collaboration', 'experience', collaborationId, ...agents],
      importance: 0.7,
      connections: [],
    }

    return await this.addMemory(memoryData)
  }

  /**
   * 获取Agent协作历史
   */
  async getCollaborationHistory(
    agentId: string,
    limit: number = 10
  ): Promise<MemorySearchResult[]> {
    return await this.queryMemories({
      tags: ['collaboration', agentId],
      limit,
      sortBy: 'recency',
    })
  }

  /**
   * 学习最优协作模式
   */
  async learnOptimalCollaborationPatterns(): Promise<any[]> {
    const successfulCollaborations = await this.queryMemories({
      tags: ['collaboration', 'experience'],
      content: 'success',
      fuzzy: true,
      limit: 50,
    })

    // 分析协作模式
    const patterns = this.analyzeCollaborationPatterns(successfulCollaborations)
    return patterns
  }

  // ==================== 辅助方法 ====================

  /**
   * 计算故事记忆重要性
   */
  private calculateStoryMemoryImportance(content: any, type: MemoryEntry['type']): number {
    let importance = 0.5

    switch (type) {
      case 'experience':
        importance = 0.7
        break
      case 'knowledge':
        importance = 0.8
        break
      case 'event':
        importance = 0.6
        break
    }

    // 根据内容调整重要性
    if (content.keyMoment) importance += 0.2
    if (content.conflict) importance += 0.1
    if (content.resolution) importance += 0.1

    return Math.min(1, importance)
  }

  /**
   * 计算角色记忆重要性
   */
  private calculateCharacterMemoryImportance(content: any): number {
    let importance = 0.6

    if (content.personalityChange) importance += 0.2
    if (content.relationshipChange) importance += 0.15
    if (content.keyDecision) importance += 0.1

    return Math.min(1, importance)
  }

  /**
   * 计算模式相似度
   */
  private calculatePatternSimilarity(pattern1: any, pattern2: any): number {
    // 简化的相似度计算
    if (JSON.stringify(pattern1) === JSON.stringify(pattern2)) return 1.0

    // 检查共同属性
    const keys1 = Object.keys(pattern1)
    const keys2 = Object.keys(pattern2)
    const commonKeys = keys1.filter((key) => keys2.includes(key))

    if (commonKeys.length === 0) return 0

    let similarity = commonKeys.length / Math.max(keys1.length, keys2.length)

    // 检查共同值
    for (const key of commonKeys) {
      if (pattern1[key] === pattern2[key]) {
        similarity += 0.1
      }
    }

    return Math.min(1, similarity)
  }

  /**
   * 评估协作有效性
   */
  private evaluateCollaborationEffectiveness(outcome: any): number {
    // 简化的有效性评估
    let effectiveness = 0.5

    if (outcome.success) effectiveness += 0.3
    if (outcome.quality > 0.8) effectiveness += 0.2
    if (outcome.timeEfficiency > 0.7) effectiveness += 0.1

    return Math.min(1, effectiveness)
  }

  /**
   * 提取协作经验教训
   */
  private extractCollaborationLessons(outcome: any): string[] {
    const lessons: string[] = []

    if (outcome.communicationIssues) {
      lessons.push('改善沟通机制')
    }
    if (outcome.roleConflicts) {
      lessons.push('明确角色分工')
    }
    if (outcome.timeDelays) {
      lessons.push('优化时间管理')
    }

    return lessons
  }

  /**
   * 分析协作模式
   */
  private analyzeCollaborationPatterns(collaborations: MemorySearchResult[]): any[] {
    // 简化的模式分析
    const patterns: any[] = []

    for (const collab of collaborations) {
      const pattern = {
        agentCount: collab.memory.content.agents?.length || 0,
        effectiveness: collab.memory.content.effectiveness || 0.5,
        keyFactors: collab.memory.content.lessons || [],
      }
      patterns.push(pattern)
    }

    return patterns.sort((a, b) => b.effectiveness - a.effectiveness)
  }

  /**
   * 优化记忆网络
   */
  private async optimizeMemoryNetwork(): Promise<void> {
    try {
      // 清理低重要性记忆
      const stats = crossMemoryNetwork.getStats()
      this.logger.debug(`记忆网络状态: ${stats.totalMemories} 记忆, ${stats.totalConnections} 连接`)

      // 这里可以添加更复杂的优化逻辑
      // 比如合并相似记忆、重建连接等
    } catch (error) {
      this.logger.error('记忆网络优化失败:', error)
    }
  }

  // ==================== 统计和监控 ====================

  /**
   * 获取记忆统计信息
   */
  getMemoryStats(): any {
    try {
      return crossMemoryNetwork.getStats()
    } catch (error) {
      this.logger.error('获取记忆统计失败:', error)
      return {
        totalMemories: 0,
        totalConnections: 0,
        agentCount: 0,
        memoryTypes: {},
        averageImportance: 0,
      }
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      const stats = this.getMemoryStats()
      return {
        status: 'healthy',
        details: stats,
      }
    } catch (error: any) {
      return {
        status: 'error',
        details: error.message,
      }
    }
  }

  /**
   * 导出记忆数据
   */
  async exportMemoryData(): Promise<any> {
    try {
      return crossMemoryNetwork.exportMemoryNetwork()
    } catch (error) {
      this.logger.error('导出记忆数据失败:', error)
      return { memories: [], connections: {} }
    }
  }

  /**
   * 导入记忆数据
   */
  async importMemoryData(data: any): Promise<void> {
    try {
      crossMemoryNetwork.importMemoryNetwork(data)
      this.logger.log('记忆数据导入成功')
    } catch (error) {
      this.logger.error('导入记忆数据失败:', error)
      throw error
    }
  }
}
