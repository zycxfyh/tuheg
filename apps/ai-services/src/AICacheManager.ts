import { createHash } from 'crypto'

// 缓存条目
export interface CacheEntry {
  id: string
  key: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  model: string
  createdAt: number
  lastAccessed: number
  accessCount: number
  ttl: number // Time to live in milliseconds
  metadata: {
    requestType: string
    promptHash: string
    contextHash?: string
    similarity?: number
  }
}

// 缓存策略配置
export interface CacheConfig {
  maxSize: number // 最大缓存条目数
  defaultTTL: number // 默认生存时间 (毫秒)
  compressionEnabled: boolean
  semanticSimilarity: boolean
  adaptiveTTL: boolean // 自适应TTL
  storageBackend: 'memory' | 'redis' | 'file'
}

// 语义相似性配置
export interface SimilarityConfig {
  threshold: number // 相似度阈值 (0-1)
  algorithm: 'cosine' | 'jaccard' | 'levenshtein'
  embeddingModel?: string
}

// AI缓存管理器
export class AICacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private similarityConfig: SimilarityConfig
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    semanticMatches: 0,
    compressionSavings: 0,
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 10000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24小时
      compressionEnabled: true,
      semanticSimilarity: true,
      adaptiveTTL: true,
      storageBackend: 'memory',
      ...config,
    }

    this.similarityConfig = {
      threshold: 0.85,
      algorithm: 'cosine',
    }

    this.loadPersistedCache()
    this.startCleanupTimer()
  }

  // 生成缓存键
  private generateCacheKey(prompt: string, context?: Record<string, any>): string {
    const data = context ? `${prompt}|${JSON.stringify(context)}` : prompt
    return createHash('sha256').update(data).digest('hex')
  }

  // 生成提示哈希（用于相似性匹配）
  private generatePromptHash(prompt: string): string {
    // 简化提示以提高匹配效率
    const simplified = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return createHash('md5').update(simplified).digest('hex')
  }

  // 计算相似度
  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    switch (this.similarityConfig.algorithm) {
      case 'cosine':
        return this.cosineSimilarity(text1, text2)
      case 'jaccard':
        return this.jaccardSimilarity(text1, text2)
      case 'levenshtein':
        return this.levenshteinSimilarity(text1, text2)
      default:
        return 0
    }
  }

  // 余弦相似度
  private cosineSimilarity(text1: string, text2: string): number {
    const vec1 = this.textToVector(text1)
    const vec2 = this.textToVector(text2)
    return this.cosine(vec1, vec2)
  }

  // Jaccard相似度
  private jaccardSimilarity(text1: string, text2: string): number {
    const set1 = new Set(text1.toLowerCase().split(/\s+/))
    const set2 = new Set(text2.toLowerCase().split(/\s+/))
    const intersection = new Set([...set1].filter((x) => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }

  // Levenshtein相似度
  private levenshteinSimilarity(text1: string, text2: string): number {
    const longer = text1.length > text2.length ? text1 : text2
    const shorter = text1.length > text2.length ? text2 : text1
    const longerLength = longer.length

    if (longerLength === 0) return 1.0

    const distance = this.levenshteinDistance(longer, shorter)
    return (longerLength - distance) / longerLength
  }

  // 计算Levenshtein距离
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  // 文本转向量（简化版）
  private textToVector(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/)
    const vector: number[] = []

    // 使用简单的词频向量
    const wordFreq: Record<string, number> = {}
    words.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })

    // 转换为向量（这里使用固定词汇表的前100个词）
    const vocab = this.getVocabulary()
    vocab.forEach((word) => {
      vector.push(wordFreq[word] || 0)
    })

    return vector
  }

  // 计算余弦相似度
  private cosine(vec1: number[], vec2: number[]): number {
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  // 获取词汇表（简化版）
  private getVocabulary(): string[] {
    // 在实际实现中，这应该从训练数据中提取
    return [
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'an',
      'a',
      'that',
      'this',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'world',
      'story',
      'character',
      'plot',
      'scene',
      'dialogue',
      'narrative',
      'fiction',
      'fantasy',
      'magic',
      'hero',
      'villain',
      'quest',
      'adventure',
      'kingdom',
      'castle',
    ]
  }

  // 获取缓存
  async get(prompt: string, context?: Record<string, any>): Promise<CacheEntry | null> {
    this.stats.totalRequests++

    const key = this.generateCacheKey(prompt, context)
    let entry = this.cache.get(key)

    // 如果直接匹配失败，尝试语义相似性匹配
    if (!entry && this.config.semanticSimilarity) {
      entry = await this.findSimilarEntry(prompt)
    }

    if (entry) {
      // 检查是否过期
      if (Date.now() - entry.createdAt > entry.ttl) {
        this.cache.delete(entry.key)
        this.stats.evictions++
        return null
      }

      // 更新访问统计
      entry.lastAccessed = Date.now()
      entry.accessCount++

      // 自适应TTL：频繁访问的条目延长生存时间
      if (this.config.adaptiveTTL && entry.accessCount > 10) {
        entry.ttl = Math.min(entry.ttl * 1.5, this.config.defaultTTL * 7)
      }

      this.stats.hits++
      return entry
    }

    this.stats.misses++
    return null
  }

  // 查找相似条目
  private async findSimilarEntry(prompt: string): Promise<CacheEntry | null> {
    const promptHash = this.generatePromptHash(prompt)
    let bestMatch: CacheEntry | null = null
    let bestSimilarity = 0

    for (const entry of this.cache.values()) {
      // 快速检查：相同的提示哈希
      if (entry.metadata.promptHash === promptHash) {
        return entry
      }

      // 计算相似度
      const similarity = await this.calculateSimilarity(prompt, entry.metadata.promptHash)
      if (similarity > this.similarityConfig.threshold && similarity > bestSimilarity) {
        bestMatch = entry
        bestSimilarity = similarity
      }
    }

    if (bestMatch) {
      bestMatch.metadata.similarity = bestSimilarity
      this.stats.semanticMatches++
    }

    return bestMatch
  }

  // 设置缓存
  async set(
    prompt: string,
    content: string,
    usage: CacheEntry['usage'],
    cost: number,
    model: string,
    context?: Record<string, any>,
    requestType: string = 'general'
  ): Promise<void> {
    const key = this.generateCacheKey(prompt, context)
    const promptHash = this.generatePromptHash(prompt)

    const entry: CacheEntry = {
      id: `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      key,
      content: this.config.compressionEnabled ? this.compress(content) : content,
      usage,
      cost,
      model,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: this.config.defaultTTL,
      metadata: {
        requestType,
        promptHash,
        contextHash: context
          ? createHash('md5').update(JSON.stringify(context)).digest('hex')
          : undefined,
      },
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldEntries()
    }

    this.cache.set(key, entry)
    this.persistCache()
  }

  // 压缩内容（简化版）
  private compress(content: string): string {
    // 在实际实现中，这里应该使用真正的压缩算法
    // 这里只是一个简化的示例
    if (content.length < 1000) return content

    this.stats.compressionSavings += content.length - content.substring(0, 1000).length
    return content.substring(0, 1000) + '...[compressed]'
  }

  // 解压缩内容
  private decompress(content: string): string {
    if (content.endsWith('...[compressed]')) {
      // 在实际实现中，这里应该从压缩数据恢复
      return content
    }
    return content
  }

  // 清除过期条目
  private evictOldEntries(): void {
    const entries = Array.from(this.cache.entries())

    // 按访问频率和时间排序
    entries.sort((a, b) => {
      const scoreA = a[1].accessCount * 0.7 + (Date.now() - a[1].lastAccessed) * 0.3
      const scoreB = b[1].accessCount * 0.7 + (Date.now() - b[1].lastAccessed) * 0.3
      return scoreA - scoreB
    })

    // 删除最不常用的条目
    const toEvict = Math.ceil(this.config.maxSize * 0.1) // 删除10%
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
      this.stats.evictions++
    }
  }

  // 清理过期条目
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key)
      this.stats.evictions++
    })
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    setInterval(
      () => {
        this.cleanup()
      },
      60 * 60 * 1000
    ) // 每小时清理一次
  }

  // 持久化缓存
  private persistCache(): void {
    if (this.config.storageBackend === 'memory') return

    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      }

      if (this.config.storageBackend === 'redis') {
        // 实现Redis存储
        // redisClient.set('ai-cache', JSON.stringify(cacheData))
      } else if (this.config.storageBackend === 'file') {
        // 实现文件存储
        // fs.writeFileSync('ai-cache.json', JSON.stringify(cacheData))
      }
    } catch (error) {
      console.warn('Failed to persist cache:', error)
    }
  }

  // 加载持久化缓存
  private loadPersistedCache(): void {
    if (this.config.storageBackend === 'memory') return

    try {
      let cacheData: any = null

      if (this.config.storageBackend === 'redis') {
        // 实现Redis加载
        // cacheData = JSON.parse(await redisClient.get('ai-cache'))
      } else if (this.config.storageBackend === 'file') {
        // 实现文件加载
        // cacheData = JSON.parse(fs.readFileSync('ai-cache.json', 'utf8'))
      }

      if (cacheData && cacheData.entries) {
        this.cache = new Map(cacheData.entries)
        if (cacheData.stats) {
          this.stats = { ...this.stats, ...cacheData.stats }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted cache:', error)
    }
  }

  // 获取缓存统计
  getStats() {
    const hitRate =
      this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      semanticMatches: this.stats.semanticMatches,
    }
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      semanticMatches: 0,
      compressionSavings: 0,
    }
    this.persistCache()
  }

  // 获取缓存条目
  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  // 更新配置
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// 创建单例实例
export const aiCacheManager = new AICacheManager({
  maxSize: 5000,
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7天
  semanticSimilarity: true,
  adaptiveTTL: true,
})
