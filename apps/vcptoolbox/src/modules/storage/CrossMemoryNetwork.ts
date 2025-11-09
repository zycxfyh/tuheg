// ============================================================================
// 跨记忆网络 - VCPToolBox 存储模块
// 实现Agent间的记忆共享、智能联想和知识传承
// ============================================================================

export interface MemoryEntry {
  id: string
  agentId: string
  type: 'experience' | 'knowledge' | 'event' | 'decision' | 'communication'
  content: any
  tags: string[]
  importance: number // 0-1, 重要性评分
  connections: string[] // 连接的其他记忆ID
  fingerprint: string // 内容指纹，用于相似度计算
  metadata: {
    createdAt: Date
    accessedAt: Date
    accessCount: number
    lastModified: Date
    confidence: number // 0-1, 记忆准确性
    source: string // 记忆来源
    context: Record<string, any> // 上下文信息
  }
}

export interface MemoryQuery {
  agentId?: string
  type?: MemoryEntry['type']
  tags?: string[]
  content?: string
  timeRange?: {
    start: Date
    end: Date
  }
  importance?: {
    min: number
    max: number
  }
  limit?: number
  sortBy?: 'importance' | 'recency' | 'access_count'
  fuzzy?: boolean // 是否启用模糊搜索
}

export interface MemoryNetwork {
  memories: Map<string, MemoryEntry>
  connections: Map<string, Set<string>> // 记忆间的关联网络
  fingerprints: Map<string, string> // 指纹到记忆ID的映射
  agentMemories: Map<string, Set<string>> // Agent到记忆ID的映射
}

export interface MemorySearchResult {
  memory: MemoryEntry
  score: number // 匹配度分数
  relevance: number // 相关性分数
  connections: MemoryEntry[] // 相关联的记忆
}

export class CrossMemoryNetwork {
  private network: MemoryNetwork = {
    memories: new Map(),
    connections: new Map(),
    fingerprints: new Map(),
    agentMemories: new Map(),
  }

  private similarityThreshold = 0.7
  private maxConnections = 10
  private decayRate = 0.95 // 重要性衰减率

  constructor(options?: {
    similarityThreshold?: number
    maxConnections?: number
    decayRate?: number
  }) {
    if (options) {
      this.similarityThreshold = options.similarityThreshold || this.similarityThreshold
      this.maxConnections = options.maxConnections || this.maxConnections
      this.decayRate = options.decayRate || this.decayRate
    }
  }

  // ==================== 记忆管理 ====================

  /**
   * 添加记忆
   */
  async addMemory(
    memoryData: Omit<MemoryEntry, 'id' | 'fingerprint' | 'metadata'>
  ): Promise<string> {
    const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 生成内容指纹
    const fingerprint = await this.generateFingerprint(memoryData.content)

    const memory: MemoryEntry = {
      id: memoryId,
      ...memoryData,
      fingerprint,
      metadata: {
        createdAt: new Date(),
        accessedAt: new Date(),
        accessCount: 0,
        lastModified: new Date(),
        confidence: memoryData.metadata?.confidence || 0.8,
        source: memoryData.metadata?.source || 'agent',
        context: memoryData.metadata?.context || {},
      },
    }

    // 添加到网络
    this.network.memories.set(memoryId, memory)
    this.network.fingerprints.set(fingerprint, memoryId)

    // 添加到Agent记忆集合
    if (!this.network.agentMemories.has(memory.agentId)) {
      this.network.agentMemories.set(memory.agentId, new Set())
    }
    this.network.agentMemories.get(memory.agentId)?.add(memoryId)

    // 建立自动连接
    await this.buildMemoryConnections(memoryId)

    return memoryId
  }

  /**
   * 获取记忆
   */
  getMemory(memoryId: string): MemoryEntry | undefined {
    const memory = this.network.memories.get(memoryId)
    if (memory) {
      // 更新访问信息
      memory.metadata.accessedAt = new Date()
      memory.metadata.accessCount++
    }
    return memory
  }

  /**
   * 更新记忆
   */
  updateMemory(
    memoryId: string,
    updates: Partial<Omit<MemoryEntry, 'id' | 'fingerprint' | 'metadata'>>
  ): boolean {
    const memory = this.network.memories.get(memoryId)
    if (!memory) return false

    Object.assign(memory, updates)
    memory.metadata.lastModified = new Date()

    // 重新生成指纹如果内容改变
    if (updates.content) {
      this.generateFingerprint(updates.content).then((fingerprint) => {
        this.network.fingerprints.delete(memory.fingerprint)
        memory.fingerprint = fingerprint
        this.network.fingerprints.set(fingerprint, memoryId)
      })
    }

    return true
  }

  /**
   * 删除记忆
   */
  deleteMemory(memoryId: string): boolean {
    const memory = this.network.memories.get(memoryId)
    if (!memory) return false

    // 从网络中移除
    this.network.memories.delete(memoryId)
    this.network.fingerprints.delete(memory.fingerprint)

    // 从Agent记忆集合中移除
    const agentMemories = this.network.agentMemories.get(memory.agentId)
    if (agentMemories) {
      agentMemories.delete(memoryId)
      if (agentMemories.size === 0) {
        this.network.agentMemories.delete(memory.agentId)
      }
    }

    // 移除连接关系
    this.network.connections.delete(memoryId)
    for (const connections of this.network.connections.values()) {
      connections.delete(memoryId)
    }

    return true
  }

  /**
   * 查询记忆
   */
  async queryMemories(query: MemoryQuery): Promise<MemorySearchResult[]> {
    let candidates: MemoryEntry[] = []

    // 基础过滤
    if (query.agentId) {
      const agentMemoryIds = this.network.agentMemories.get(query.agentId)
      if (agentMemoryIds) {
        candidates = Array.from(agentMemoryIds)
          .map((id) => this.network.memories.get(id))
          .filter(Boolean) as MemoryEntry[]
      }
    } else {
      candidates = Array.from(this.network.memories.values())
    }

    // 类型过滤
    if (query.type) {
      candidates = candidates.filter((mem) => mem.type === query.type)
    }

    // 时间范围过滤
    if (query.timeRange) {
      candidates = candidates.filter((mem) => {
        const createdAt = mem.metadata.createdAt
        return createdAt >= query.timeRange?.start && createdAt <= query.timeRange?.end
      })
    }

    // 重要性过滤
    if (query.importance) {
      candidates = candidates.filter(
        (mem) => mem.importance >= query.importance?.min && mem.importance <= query.importance?.max
      )
    }

    // 内容搜索
    let results: MemorySearchResult[] = []
    if (query.content) {
      if (query.fuzzy) {
        // 模糊搜索
        results = await this.fuzzySearchMemories(query.content, candidates)
      } else {
        // 精确搜索
        results = candidates
          .filter((mem) => this.containsContent(mem, query.content!))
          .map((mem) => ({
            memory: mem,
            score: 1.0,
            relevance: 0.8,
            connections: this.getConnectedMemories(mem.id),
          }))
      }
    } else {
      // 无内容搜索，返回所有候选
      results = candidates.map((mem) => ({
        memory: mem,
        score: 0.5,
        relevance: 0.5,
        connections: this.getConnectedMemories(mem.id),
      }))
    }

    // 标签过滤
    if (query.tags && query.tags.length > 0) {
      results = results.filter((result) =>
        query.tags?.some((tag) => result.memory.tags.includes(tag))
      )
    }

    // 排序
    results.sort((a, b) => {
      switch (query.sortBy) {
        case 'importance':
          return b.memory.importance - a.memory.importance
        case 'recency':
          return b.memory.metadata.createdAt.getTime() - a.memory.metadata.createdAt.getTime()
        case 'access_count':
          return b.memory.metadata.accessCount - a.memory.metadata.accessCount
        default:
          return b.score - a.score
      }
    })

    // 限制数量
    if (query.limit) {
      results = results.slice(0, query.limit)
    }

    return results
  }

  /**
   * 更新记忆重要性
   */
  updateMemoryImportance(memoryId: string, importance: number): boolean {
    const memory = this.network.memories.get(memoryId)
    if (!memory) return false

    memory.importance = Math.max(0, Math.min(1, importance))
    memory.metadata.lastModified = new Date()

    return true
  }

  // ==================== 记忆连接 ====================

  /**
   * 建立记忆连接
   */
  async buildMemoryConnections(memoryId: string): Promise<void> {
    const memory = this.network.memories.get(memoryId)
    if (!memory) return

    const connections = new Set<string>()

    // 基于相似度的自动连接
    const similarMemories = await this.findSimilarMemories(memory, this.maxConnections)
    for (const similar of similarMemories) {
      connections.add(similar.memory.id)
    }

    // 基于Agent的连接（同一Agent的历史记忆）
    const agentMemories = this.network.agentMemories.get(memory.agentId)
    if (agentMemories) {
      const recentMemories = Array.from(agentMemories)
        .map((id) => this.network.memories.get(id))
        .filter(Boolean)
        .filter((mem) => mem?.id !== memoryId)
        .sort((a, b) => b?.metadata.createdAt.getTime() - a?.metadata.createdAt.getTime())
        .slice(0, 3) as MemoryEntry[]

      for (const recent of recentMemories) {
        connections.add(recent.id)
      }
    }

    // 基于标签的连接
    for (const tag of memory.tags) {
      const taggedMemories = Array.from(this.network.memories.values())
        .filter((mem) => mem.id !== memoryId && mem.tags.includes(tag))
        .slice(0, 2)

      for (const tagged of taggedMemories) {
        connections.add(tagged.id)
      }
    }

    // 保存连接
    this.network.connections.set(memoryId, connections)

    // 更新反向连接
    for (const connectedId of connections) {
      if (!this.network.connections.has(connectedId)) {
        this.network.connections.set(connectedId, new Set())
      }
      this.network.connections.get(connectedId)?.add(memoryId)
    }

    // 更新记忆的连接列表
    memory.connections = Array.from(connections)
  }

  /**
   * 获取连接的记忆
   */
  getConnectedMemories(memoryId: string): MemoryEntry[] {
    const connections = this.network.connections.get(memoryId)
    if (!connections) return []

    return Array.from(connections)
      .map((id) => this.network.memories.get(id))
      .filter(Boolean) as MemoryEntry[]
  }

  /**
   * 查找相关记忆
   */
  async findRelatedMemories(memoryId: string, limit: number = 5): Promise<MemoryEntry[]> {
    const memory = this.network.memories.get(memoryId)
    if (!memory) return []

    const related = await this.findSimilarMemories(memory, limit)
    return related.map((r) => r.memory)
  }

  // ==================== 相似度计算 ====================

  /**
   * 生成内容指纹
   */
  private async generateFingerprint(content: any): Promise<string> {
    const contentStr = JSON.stringify(content)
    // 简单的哈希函数，实际可以使用更复杂的算法
    let hash = 0
    for (let i = 0; i < contentStr.length; i++) {
      const char = contentStr.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 计算相似度
   */
  private async calculateSimilarity(memory1: MemoryEntry, memory2: MemoryEntry): Promise<number> {
    // 多维度相似度计算
    let similarity = 0
    let factors = 0

    // 标签相似度
    if (memory1.tags.length > 0 && memory2.tags.length > 0) {
      const commonTags = memory1.tags.filter((tag) => memory2.tags.includes(tag)).length
      const totalTags = new Set([...memory1.tags, ...memory2.tags]).size
      similarity += commonTags / totalTags
      factors++
    }

    // 类型相似度
    if (memory1.type === memory2.type) {
      similarity += 0.3
    }
    factors++

    // Agent相似度
    if (memory1.agentId === memory2.agentId) {
      similarity += 0.2
    }
    factors++

    // 内容相似度（简化实现）
    if (JSON.stringify(memory1.content) === JSON.stringify(memory2.content)) {
      similarity += 0.5
    }
    factors++

    // 时间相似度（越近越相似）
    const timeDiff = Math.abs(
      memory1.metadata.createdAt.getTime() - memory2.metadata.createdAt.getTime()
    )
    const timeSimilarity = Math.max(0, 1 - timeDiff / (1000 * 60 * 60 * 24 * 30)) // 30天内
    similarity += timeSimilarity * 0.2
    factors++

    return similarity / factors
  }

  /**
   * 查找相似记忆
   */
  private async findSimilarMemories(
    memory: MemoryEntry,
    limit: number
  ): Promise<MemorySearchResult[]> {
    const similarities: MemorySearchResult[] = []

    for (const [id, otherMemory] of this.network.memories) {
      if (id === memory.id) continue

      const similarity = await this.calculateSimilarity(memory, otherMemory)
      if (similarity >= this.similarityThreshold) {
        similarities.push({
          memory: otherMemory,
          score: similarity,
          relevance: similarity,
          connections: [],
        })
      }
    }

    return similarities.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * 模糊搜索记忆
   */
  private async fuzzySearchMemories(
    query: string,
    candidates: MemoryEntry[]
  ): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = []

    for (const memory of candidates) {
      const score = this.calculateFuzzyMatch(query, memory)
      if (score > 0) {
        results.push({
          memory,
          score,
          relevance: score,
          connections: this.getConnectedMemories(memory.id),
        })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * 计算模糊匹配分数
   */
  private calculateFuzzyMatch(query: string, memory: MemoryEntry): number {
    const contentStr = JSON.stringify(memory.content).toLowerCase()
    const queryStr = query.toLowerCase()

    // 简单的字符串包含匹配
    if (contentStr.includes(queryStr)) {
      return 0.8
    }

    // 标签匹配
    const tagMatch = memory.tags.some((tag) => tag.toLowerCase().includes(queryStr))
    if (tagMatch) {
      return 0.6
    }

    // 类型匹配
    if (memory.type.toLowerCase().includes(queryStr)) {
      return 0.4
    }

    return 0
  }

  /**
   * 检查是否包含内容
   */
  private containsContent(memory: MemoryEntry, query: string): boolean {
    const contentStr = JSON.stringify(memory.content).toLowerCase()
    return (
      contentStr.includes(query.toLowerCase()) ||
      memory.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    )
  }

  // ==================== 记忆衰减 ====================

  /**
   * 应用记忆衰减
   */
  applyMemoryDecay(): void {
    const now = Date.now()

    for (const memory of this.network.memories.values()) {
      const age = now - memory.metadata.createdAt.getTime()
      const days = age / (1000 * 60 * 60 * 24)

      // 每30天衰减一次
      const decayCycles = Math.floor(days / 30)
      const decayFactor = this.decayRate ** decayCycles

      memory.importance *= decayFactor

      // 如果重要性太低，考虑删除
      if (memory.importance < 0.1) {
        this.deleteMemory(memory.id)
      }
    }
  }

  // ==================== 网络分析 ====================

  /**
   * 获取记忆网络
   */
  getMemoryNetwork(agentId?: string): {
    nodes: Array<{ id: string; type: string; importance: number }>
    edges: Array<{ source: string; target: string; weight: number }>
  } {
    const nodes: Array<{ id: string; type: string; importance: number }> = []
    const edges: Array<{ source: string; target: string; weight: number }> = []
    const processedMemories = new Set<string>()

    // 收集记忆节点
    for (const [memoryId, memory] of this.network.memories) {
      if (agentId && memory.agentId !== agentId) continue

      nodes.push({
        id: memoryId,
        type: memory.type,
        importance: memory.importance,
      })
      processedMemories.add(memoryId)
    }

    // 收集连接边
    for (const [sourceId, connections] of this.network.connections) {
      if (!processedMemories.has(sourceId)) continue

      for (const targetId of connections) {
        if (processedMemories.has(targetId)) {
          edges.push({
            source: sourceId,
            target: targetId,
            weight: 0.5, // 简化权重计算
          })
        }
      }
    }

    return { nodes, edges }
  }

  // ==================== 持久化 ====================

  /**
   * 导出记忆网络
   */
  exportMemoryNetwork(): {
    memories: MemoryEntry[]
    connections: Record<string, string[]>
  } {
    const memories = Array.from(this.network.memories.values())
    const connections: Record<string, string[]> = {}

    for (const [memoryId, connectedIds] of this.network.connections) {
      connections[memoryId] = Array.from(connectedIds)
    }

    return { memories, connections }
  }

  /**
   * 导入记忆网络
   */
  importMemoryNetwork(data: {
    memories: MemoryEntry[]
    connections: Record<string, string[]>
  }): void {
    // 清空现有网络
    this.network = {
      memories: new Map(),
      connections: new Map(),
      fingerprints: new Map(),
      agentMemories: new Map(),
    }

    // 导入记忆
    for (const memory of data.memories) {
      this.network.memories.set(memory.id, memory)
      this.network.fingerprints.set(memory.fingerprint, memory.id)

      if (!this.network.agentMemories.has(memory.agentId)) {
        this.network.agentMemories.set(memory.agentId, new Set())
      }
      this.network.agentMemories.get(memory.agentId)?.add(memory.id)
    }

    // 导入连接
    for (const [memoryId, connectedIds] of Object.entries(data.connections)) {
      this.network.connections.set(memoryId, new Set(connectedIds))
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取统计信息
   */
  getStats(): {
    totalMemories: number
    totalConnections: number
    agentCount: number
    memoryTypes: Record<string, number>
    averageImportance: number
  } {
    const memories = Array.from(this.network.memories.values())
    const memoryTypes: Record<string, number> = {}

    for (const memory of memories) {
      memoryTypes[memory.type] = (memoryTypes[memory.type] || 0) + 1
    }

    const totalConnections = Array.from(this.network.connections.values()).reduce(
      (sum, connections) => sum + connections.size,
      0
    )

    const averageImportance =
      memories.length > 0
        ? memories.reduce((sum, mem) => sum + mem.importance, 0) / memories.length
        : 0

    return {
      totalMemories: memories.length,
      totalConnections,
      agentCount: this.network.agentMemories.size,
      memoryTypes,
      averageImportance,
    }
  }
}

// 创建全局实例
export const crossMemoryNetwork = new CrossMemoryNetwork()
