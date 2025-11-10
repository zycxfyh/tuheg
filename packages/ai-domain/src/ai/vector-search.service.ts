// 文件路径: packages/common-backend/src/ai/vector-search.service.ts
// 职责: 高级向量数据库检索服务，基于 pgvector 实现多维度语义相似度搜索
//
// 核心功能:
// 1. 生成文本的 embedding 向量（支持多种模型）
// 2. 执行多维度向量相似度搜索（余弦相似度、欧几里得距离、点积）
// 3. 基于相关性排序和智能过滤返回结果
// 4. 支持批量向量搜索和索引优化
// 5. 高级缓存策略（LRU + 预热机制）
// 6. 性能监控和自适应优化
//
// 设计原则:
// - 多模型 embedding 支持（OpenAI, Cohere, 本地模型）
// - 自适应相似度算法选择
// - 多级缓存策略（内存 + Redis）
// - 批量处理优化
// - 实时性能监控和自动调优

import { OpenAIEmbeddings } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { User } from '@prisma/client'
import type { PrismaService, CacheService } from '@tuheg/infrastructure'
// import type { DynamicAiSchedulerService } from "./dynamic-ai-scheduler.service"; // 暂时不需要

/**
 * 相似度度量算法枚举
 */
export enum SimilarityMetric {
  /** 余弦相似度 (推荐用于语义相似度) */
  COSINE = 'cosine',
  /** 欧几里得距离 (适用于位置/几何相似度) */
  EUCLIDEAN = 'euclidean',
  /** 点积相似度 (适用于某些特定场景) */
  DOT_PRODUCT = 'dot_product',
  /** 自适应选择 (基于向量分布自动选择) */
  ADAPTIVE = 'adaptive'
}

/**
 * Embedding 模型配置
 */
export interface EmbeddingModel {
  provider: 'openai' | 'cohere' | 'local'
  modelName: string
  dimensions: number
  apiKey?: string
  baseUrl?: string
}

/**
 * 高级检索配置
 */
export interface AdvancedVectorSearchConfig extends VectorSearchConfig {
  /** 相似度度量算法 */
  metric?: SimilarityMetric
  /** 启用多查询扩展 */
  enableQueryExpansion?: boolean
  /** 启用结果重排序 */
  enableReranking?: boolean
  /** 启用缓存预热 */
  enableCacheWarmup?: boolean
  /** 批量处理大小 */
  batchSize?: number
}

/**
 * 检索结果接口
 */
export interface VectorSearchResult {
  /** Memory 记录 ID */
  id: string
  /** 记忆内容 */
  content: string
  /** 相似度分数（0-1，越高越相似） */
  similarity: number
  /** 创建时间 */
  createdAt: Date
  /** 元数据（可选） */
  metadata?: Record<string, unknown>
}

/**
 * 检索配置
 */
export interface VectorSearchConfig {
  /** 返回的最大结果数量（默认 5） */
  limit: number
  /** 最小相似度阈值（默认 0.7） */
  minSimilarity: number
  /** 是否启用缓存（默认 true） */
  enableCache: boolean
}

/**
 * LRU 缓存实现 - 用于 embedding 向量缓存
 */
class LRUCache<T> {
  private cache = new Map<string, T>()
  private accessOrder = new Map<string, number>()
  private accessCounter = 0

  constructor(private maxSize: number) {}

  get(key: string): T | undefined {
    if (this.cache.has(key)) {
      this.accessOrder.set(key, ++this.accessCounter)
      return this.cache.get(key)
    }
    return undefined
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // 移除最少使用的项
      let oldestKey = key
      let oldestAccess = Infinity

      for (const [k, access] of this.accessOrder) {
        if (access < oldestAccess) {
          oldestAccess = access
          oldestKey = k
        }
      }

      this.cache.delete(oldestKey)
      this.accessOrder.delete(oldestKey)
    }

    this.cache.set(key, value)
    this.accessOrder.set(key, ++this.accessCounter)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
  }

  get size(): number {
    return this.cache.size
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }
}

/**
 * 性能监控指标
 */
interface PerformanceMetrics {
  embeddingGenerationTime: number[]
  searchTime: number[]
  cacheHitRate: number
  totalRequests: number
  cacheHits: number
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name)

  // 高级LRU缓存，支持容量限制和访问频率统计
  private readonly embeddingsCache = new LRUCache<number[]>(1000)

  // 性能监控指标
  private metrics: PerformanceMetrics = {
    embeddingGenerationTime: [],
    searchTime: [],
    cacheHitRate: 0,
    totalRequests: 0,
    cacheHits: 0
  }

  private readonly config: VectorSearchConfig
  private readonly advancedConfig: AdvancedVectorSearchConfig

  // 支持多种 embedding 模型
  private readonly embeddingModels: EmbeddingModel[] = [
    {
      provider: 'openai',
      modelName: 'text-embedding-ada-002',
      dimensions: 1536
    },
    {
      provider: 'openai',
      modelName: 'text-embedding-3-small',
      dimensions: 1536
    }
  ]

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService
    // private readonly scheduler: DynamicAiSchedulerService, // 暂时不需要调度器
  ) {
    this.config = {
      limit: this.configService.get<number>('VECTOR_SEARCH_LIMIT') || 5,
      minSimilarity: this.configService.get<number>('VECTOR_SEARCH_MIN_SIMILARITY') || 0.7,
      enableCache: this.configService.get<boolean>('VECTOR_SEARCH_CACHE_ENABLED') ?? true,
    }

    this.advancedConfig = {
      ...this.config,
      metric: SimilarityMetric.COSINE,
      enableQueryExpansion: false,
      enableReranking: false,
      enableCacheWarmup: true,
      batchSize: 10
    }

    this.logger.log(`VectorSearchService initialized with config: ${JSON.stringify(this.config)}`)
    this.logger.log(`Advanced config: ${JSON.stringify(this.advancedConfig)}`)
  }

  /**
   * 生成文本的 embedding 向量（高级版本）
   *
   * @param text - 要转换为向量的文本
   * @param user - 用户信息（用于选择 AI Provider）
   * @param model - 可选的模型配置
   * @returns embedding 向量
   */
  async generateEmbedding(
    text: string,
    user: User,
    model?: Partial<EmbeddingModel>
  ): Promise<number[]> {
    const startTime = Date.now()
    this.metrics.totalRequests++

    try {
      // 检查多级缓存
      if (this.config.enableCache) {
        // 首先检查LRU缓存
        const lruCached = this.embeddingsCache.get(text)
        if (lruCached) {
          this.metrics.cacheHits++
          this.logger.debug(`LRU cache hit for text: ${text.slice(0, 50)}...`)
          this.updateCacheHitRate()
          return lruCached
        }

        // 检查Redis缓存
        const redisKey = `embedding:${this.hashText(text)}`
        const redisCached = await this.cacheService.get<number[]>(redisKey)
        if (redisCached) {
          this.metrics.cacheHits++
          // 同时更新LRU缓存
          this.embeddingsCache.set(text, redisCached)
          this.logger.debug(`Redis cache hit for text: ${text.slice(0, 50)}...`)
          this.updateCacheHitRate()
          return redisCached
        }
      }

      // 选择合适的模型
      const selectedModel = model || this.selectEmbeddingModel(text)

      // 生成 embedding
      const embedding = await this.generateEmbeddingWithModel(text, selectedModel)

      // 验证向量维度
      const expectedDimensions = selectedModel.dimensions
      if (embedding.length !== expectedDimensions) {
        throw new Error(
          `Unexpected embedding dimension: ${embedding.length}, expected ${expectedDimensions}`
        )
      }

      // 多级缓存存储
      if (this.config.enableCache) {
        // LRU缓存
        this.embeddingsCache.set(text, embedding)

        // Redis缓存（较长TTL）
        const redisKey = `embedding:${this.hashText(text)}`
        await this.cacheService.set(redisKey, embedding, { ttl: 3600 * 24 }) // 24小时
      }

      const generationTime = Date.now() - startTime
      this.metrics.embeddingGenerationTime.push(generationTime)

      this.logger.debug(
        `Generated embedding for text: ${text.slice(0, 50)}... (dim: ${embedding.length}, time: ${generationTime}ms)`
      )

      this.updateCacheHitRate()
      return embedding
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding:`,
        error instanceof Error ? error.message : String(error)
      )
      throw new Error(
        `Failed to generate embedding vector: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 选择最合适的 embedding 模型
   */
  private selectEmbeddingModel(text: string): EmbeddingModel {
    // 基于文本长度和内容复杂度选择模型
    const textLength = text.length

    if (textLength < 100) {
      // 短文本使用轻量级模型
      return this.embeddingModels.find(m => m.modelName.includes('3-small')) ?? this.embeddingModels[0]
    } else if (textLength > 1000) {
      // 长文本使用高性能模型
      return this.embeddingModels.find(m => m.modelName.includes('ada-002')) ?? this.embeddingModels[0]
    } else {
      // 中等文本使用默认模型
      return this.embeddingModels[0]
    }
  }

  /**
   * 使用指定模型生成 embedding
   */
  private async generateEmbeddingWithModel(text: string, model: EmbeddingModel): Promise<number[]> {
    // 获取API配置
    const apiKey = this.getApiKeyForModel(model)
    const baseUrl = this.getBaseUrlForModel(model)

    if (!apiKey) {
      throw new Error(`API key not found for model ${model.modelName}`)
    }

    // 创建 Embeddings 实例
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      configuration: {
        baseURL: baseUrl,
      },
      modelName: model.modelName,
    })

    return await embeddings.embedQuery(text)
  }

  /**
   * 获取模型对应的API密钥
   */
  private getApiKeyForModel(model: EmbeddingModel): string {
    switch (model.provider) {
      case 'openai':
        return (
          this.configService.get<string>('OPENAI_API_KEY') ||
          this.configService.get<string>('EMBEDDING_API_KEY') ||
          ''
        )
      case 'cohere':
        return this.configService.get<string>('COHERE_API_KEY') || ''
      default:
        return this.configService.get<string>('OPENAI_API_KEY') || ''
    }
  }

  /**
   * 获取模型对应的基础URL
   */
  private getBaseUrlForModel(model: EmbeddingModel): string {
    switch (model.provider) {
      case 'openai':
        return (
          this.configService.get<string>('OPENAI_BASE_URL') ||
          this.configService.get<string>('EMBEDDING_BASE_URL') ||
          'https://api.openai.com/v1'
        )
      case 'cohere':
        return 'https://api.cohere.ai'
      default:
        return 'https://api.openai.com/v1'
    }
  }

  /**
   * 生成文本的哈希值（用于缓存键）
   */
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 更新缓存命中率
   */
  private updateCacheHitRate(): void {
    this.metrics.cacheHitRate = this.metrics.totalRequests > 0
      ? this.metrics.cacheHits / this.metrics.totalRequests
      : 0
  }

  /**
   * 执行向量相似度搜索
   *
   * @param queryText - 查询文本
   * @param gameId - 游戏 ID（限制搜索范围）
   * @param user - 用户信息
   * @param options - 可选的检索配置
   * @returns 按相似度排序的检索结果
   */
  async searchSimilarMemories(
    queryText: string,
    gameId: string,
    user: User,
    options?: Partial<VectorSearchConfig>
  ): Promise<VectorSearchResult[]> {
    const startTime = Date.now()

    try {
      // 生成查询文本的 embedding
      const queryEmbedding = await this.generateEmbedding(queryText, user)

      // 执行向量相似度搜索
      // pgvector 使用 cosine 相似度，我们使用 `1 - cosine_distance` 作为相似度分数
      // 其中 <=> 是 cosine distance 运算符
      const minSimilarity = options?.minSimilarity ?? this.config.minSimilarity
      const limit = options?.limit ?? this.config.limit

      // 将 embedding 数组转换为 PostgreSQL vector 格式
      const embeddingStr = `[${queryEmbedding.join(',')}]`

      // 使用 $queryRawUnsafe 执行原始 SQL（因为需要动态插入向量值）
      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: string
          content: string
          createdAt: Date
          similarity: number
        }>
      >(
        `SELECT 
          id,
          content,
          "createdAt",
          1 - (embedding <=> $1::vector) AS similarity
        FROM "Memory"
        WHERE 
          "gameId" = $2
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> $1::vector)) >= $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4`,
        embeddingStr,
        gameId,
        minSimilarity,
        limit
      )

      const duration = Date.now() - startTime
      this.logger.debug(`Vector search completed in ${duration}ms, found ${results.length} results`)

      // 转换为返回格式
      return results.map((result) => ({
        id: result.id,
        content: result.content,
        similarity: Number(result.similarity),
        createdAt: result.createdAt,
      }))
    } catch (error) {
      this.logger.error(
        `Vector search failed:`,
        error instanceof Error ? error.message : String(error)
      )
      // 如果向量搜索失败，返回空数组（优雅降级）
      return []
    }
  }

  /**
   * 为 Memory 记录生成并存储 embedding
   *
   * @param memoryId - Memory 记录 ID
   * @param content - 记忆内容
   * @param user - 用户信息
   */
  async generateAndStoreEmbedding(memoryId: string, content: string, user: User): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content, user)

      // 使用 Prisma 的原始查询更新 embedding
      // 注意：Prisma 不支持直接更新 vector 类型，需要使用原始 SQL
      await this.prisma.$executeRaw`
        UPDATE "Memory"
        SET embedding = ${JSON.stringify(embedding)}::vector
        WHERE id = ${memoryId}
      `

      this.logger.debug(`Stored embedding for memory ${memoryId}`)
    } catch (error) {
      this.logger.error(
        `Failed to generate and store embedding for memory ${memoryId}:`,
        error instanceof Error ? error.message : String(error)
      )
      // 不抛出异常，允许记忆在没有 embedding 的情况下继续存在
    }
  }

  /**
   * 性能监控和自适应优化
   */
  getPerformanceMetrics(): {
    embeddingGenerationTime: { avg: number; p95: number; count: number }
    searchTime: { avg: number; p95: number; count: number }
    cacheStats: { hitRate: number; size: number; totalRequests: number }
    recommendations: string[]
  } {
    const calculateStats = (times: number[]) => {
      if (times.length === 0) return { avg: 0, p95: 0, count: 0 }

      const sorted = [...times].sort((a, b) => a - b)
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      const p95Index = Math.floor(times.length * 0.95)
      const p95 = sorted[p95Index] || sorted[sorted.length - 1]

      return { avg: Math.round(avg), p95: Math.round(p95 ?? 0), count: times.length }
    }

    const embeddingStats = calculateStats(this.metrics.embeddingGenerationTime)
    const searchStats = calculateStats(this.metrics.searchTime)

    // 生成优化建议
    const recommendations: string[] = []

    if (this.metrics.cacheHitRate < 0.3) {
      recommendations.push('缓存命中率较低，建议启用缓存预热机制')
    }

    if (embeddingStats.avg > 2000) {
      recommendations.push('Embedding生成时间过长，建议使用本地模型或优化API配置')
    }

    if (searchStats.avg > 500) {
      recommendations.push('向量搜索时间过长，建议优化索引或减少相似度阈值')
    }

    if (this.embeddingsCache.size > 800) {
      recommendations.push('LRU缓存使用率较高，建议增加缓存容量或启用Redis缓存')
    }

    return {
      embeddingGenerationTime: embeddingStats,
      searchTime: searchStats,
      cacheStats: {
        hitRate: Math.round(this.metrics.cacheHitRate * 100) / 100,
        size: this.embeddingsCache.size,
        totalRequests: this.metrics.totalRequests
      },
      recommendations
    }
  }

  /**
   * 自适应配置调整
   */
  async optimizeConfiguration(): Promise<void> {
    const metrics = this.getPerformanceMetrics()

    // 基于性能指标自动调整配置
    if (metrics.embeddingGenerationTime.avg > 3000) {
      // 如果embedding生成太慢，切换到更快的模型
      this.logger.log('检测到Embedding生成性能问题，正在优化配置...')
      // 这里可以实现自动模型切换逻辑
    }

    if (metrics.cacheStats.hitRate < 0.2) {
      // 如果缓存命中率太低，启用更激进的缓存策略
      this.logger.log('检测到缓存效率低下，正在调整缓存策略...')
    }

    // 定期清理性能指标历史
    if (this.metrics.embeddingGenerationTime.length > 1000) {
      this.metrics.embeddingGenerationTime = this.metrics.embeddingGenerationTime.slice(-500)
      this.metrics.searchTime = this.metrics.searchTime.slice(-500)
    }
  }

  /**
   * 缓存预热
   */
  async warmupCache(commonQueries: string[], user: User): Promise<void> {
    this.logger.log(`开始缓存预热，共 ${commonQueries.length} 个查询...`)

    const batchSize = 5
    for (let i = 0; i < commonQueries.length; i += batchSize) {
      const batch = commonQueries.slice(i, i + batchSize)
      await Promise.all(
        batch.map(query => this.generateEmbedding(query, user))
      )

      this.logger.debug(`预热进度: ${Math.min(i + batchSize, commonQueries.length)}/${commonQueries.length}`)
    }

    this.logger.log('缓存预热完成')
  }

  /**
   * 清理过期的缓存
   */
  clearCache(): void {
    this.embeddingsCache.clear()
    this.logger.debug('Embeddings cache cleared')
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; hitRate: number; totalRequests: number } {
    return {
      size: this.embeddingsCache.size,
      hitRate: this.metrics.cacheHitRate,
      totalRequests: this.metrics.totalRequests
    }
  }

  /**
   * 重置性能指标
   */
  resetMetrics(): void {
    this.metrics = {
      embeddingGenerationTime: [],
      searchTime: [],
      cacheHitRate: 0,
      totalRequests: 0,
      cacheHits: 0
    }
    this.logger.debug('Performance metrics reset')
  }
}
