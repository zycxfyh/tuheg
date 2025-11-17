import { z } from 'zod'
import { Observable } from 'rxjs'

/**
 * 向量数据类型枚举
 */
export enum VectorDataType {
  /** 文本向量 */
  TEXT = 'text',
  /** 图像向量 */
  IMAGE = 'image',
  /** 音频向量 */
  AUDIO = 'audio',
  /** 混合向量 */
  HYBRID = 'hybrid',
  /** 结构化数据向量 */
  STRUCTURED = 'structured',
}

/**
 * 距离度量枚举
 */
export enum DistanceMetric {
  /** 余弦相似度 */
  COSINE = 'cosine',
  /** 欧几里得距离 */
  EUCLIDEAN = 'euclidean',
  /** 内积 */
  DOT_PRODUCT = 'dot_product',
  /** 曼哈顿距离 */
  MANHATTAN = 'manhattan',
  /** 汉明距离 */
  HAMMING = 'hamming',
}

/**
 * 索引类型枚举
 */
export enum IndexType {
  /** IVF-Flat索引 */
  IVF_FLAT = 'ivf_flat',
  /** IVF-PQ索引 */
  IVF_PQ = 'ivf_pq',
  /** HNSW索引 */
  HNSW = 'hnsw',
  /** 暴力搜索 */
  BRUTE_FORCE = 'brute_force',
}

/**
 * 向量数据点
 */
export interface VectorPoint {
  /** 唯一标识符 */
  id: string
  /** 向量数据 */
  vector: number[]
  /** 元数据 */
  metadata: Record<string, any>
  /** 数据类型 */
  dataType: VectorDataType
  /** 时间戳 */
  timestamp: Date
  /** 版本号 */
  version: number
  /** 标签 */
  tags: string[]
  /** 权重 */
  weight: number
}

/**
 * 搜索查询
 */
export interface VectorSearchQuery {
  /** 查询向量 */
  queryVector: number[]
  /** 相似度阈值 */
  threshold?: number
  /** 返回结果数量 */
  limit?: number
  /** 过滤条件 */
  filters?: Record<string, any>
  /** 包含元数据 */
  includeMetadata?: boolean
  /** 包含分数 */
  includeScore?: boolean
  /** 搜索超时时间（毫秒） */
  timeout?: number
}

/**
 * 混合搜索查询
 */
export interface HybridSearchQuery extends VectorSearchQuery {
  /** 文本查询 */
  textQuery?: string
  /** 传统搜索权重 */
  textWeight?: number
  /** 向量搜索权重 */
  vectorWeight?: number
  /** 重新排序策略 */
  rerankStrategy?: 'rrf' | 'score_fusion' | 'custom'
}

/**
 * 搜索结果
 */
export interface VectorSearchResult {
  /** 结果点 */
  point: VectorPoint
  /** 相似度分数 */
  score: number
  /** 排名 */
  rank: number
  /** 额外信息 */
  metadata?: {
    /** 搜索耗时 */
    searchTime: number
    /** 候选数量 */
    candidatesCount: number
    /** 过滤数量 */
    filteredCount: number
  }
}

/**
 * 混合搜索结果
 */
export interface HybridSearchResult extends VectorSearchResult {
  /** 文本匹配分数 */
  textScore?: number
  /** 向量匹配分数 */
  vectorScore?: number
  /** 重新排序分数 */
  rerankScore?: number
  /** 匹配原因 */
  matchReasons: string[]
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 成功数量 */
  successful: number
  /** 失败数量 */
  failed: number
  /** 失败详情 */
  failures: Array<{
    id: string
    error: string
  }>
  /** 处理耗时 */
  duration: number
}

/**
 * 索引配置
 */
export interface IndexConfig {
  /** 索引类型 */
  type: IndexType
  /** 距离度量 */
  metric: DistanceMetric
  /** 参数 */
  parameters: {
    /** IVF列表数量 */
    nlist?: number
    /** PQ子量化器数量 */
    m?: number
    /** PQ位数 */
    nbits?: number
    /** HNSW最大连接数 */
    efConstruction?: number
    /** HNSW搜索连接数 */
    ef?: number
    /** HNSW层数 */
    M?: number
  }
}

/**
 * 压缩配置
 */
export interface CompressionConfig {
  /** 是否启用压缩 */
  enabled: boolean
  /** 压缩算法 */
  algorithm: 'pq' | 'opq' | 'custom'
  /** 压缩参数 */
  parameters: {
    /** PQ子量化器数量 */
    m?: number
    /** PQ位数 */
    nbits?: number
    /** 训练样本数量 */
    nSamples?: number
  }
}

/**
 * 实时更新配置
 */
export interface RealTimeConfig {
  /** 是否启用实时更新 */
  enabled: boolean
  /** 更新频率（毫秒） */
  updateInterval: number
  /** 批量大小 */
  batchSize: number
  /** 缓冲区大小 */
  bufferSize: number
  /** 更新策略 */
  strategy: 'immediate' | 'buffered' | 'scheduled'
}

/**
 * 向量数据库统计信息
 */
export interface VectorDatabaseStats {
  /** 总向量数量 */
  totalVectors: number
  /** 向量维度 */
  dimension: number
  /** 数据类型分布 */
  dataTypeDistribution: Record<VectorDataType, number>
  /** 索引信息 */
  indexInfo: {
    type: IndexType
    metric: DistanceMetric
    size: number
    buildTime: number
  }
  /** 存储信息 */
  storageInfo: {
    totalSize: number
    compressedSize: number
    compressionRatio: number
  }
  /** 性能指标 */
  performanceMetrics: {
    averageQueryTime: number
    queriesPerSecond: number
    cacheHitRate: number
    indexHitRate: number
  }
  /** 最近更新 */
  lastUpdated: Date
}

/**
 * 向量数据库接口
 */
export interface VectorDatabase {
  /** 初始化数据库 */
  initialize(config: {
    dimension: number
    metric: DistanceMetric
    index: IndexConfig
    compression: CompressionConfig
    realTime: RealTimeConfig
  }): Promise<void>

  /** 插入向量点 */
  insert(point: VectorPoint): Promise<void>

  /** 批量插入向量点 */
  insertBatch(points: VectorPoint[]): Promise<BatchOperationResult>

  /** 更新向量点 */
  update(id: string, updates: Partial<VectorPoint>): Promise<void>

  /** 删除向量点 */
  delete(id: string): Promise<void>

  /** 批量删除向量点 */
  deleteBatch(ids: string[]): Promise<BatchOperationResult>

  /** 搜索相似向量 */
  search(query: VectorSearchQuery): Promise<VectorSearchResult[]>

  /** 混合搜索 */
  hybridSearch(query: HybridSearchQuery): Promise<HybridSearchResult[]>

  /** 流式搜索 */
  streamSearch(query: VectorSearchQuery): Observable<VectorSearchResult>

  /** 获取向量点 */
  get(id: string): Promise<VectorPoint | null>

  /** 批量获取向量点 */
  getBatch(ids: string[]): Promise<VectorPoint[]>

  /** 按条件查询 */
  query(filters: Record<string, any>, limit?: number): Promise<VectorPoint[]>

  /** 构建/重建索引 */
  buildIndex(): Promise<{
    duration: number
    quality: number
    size: number
  }>

  /** 优化索引 */
  optimizeIndex(): Promise<{
    duration: number
    improvements: Record<string, number>
  }>

  /** 压缩向量数据 */
  compressVectors(config: CompressionConfig): Promise<{
    originalSize: number
    compressedSize: number
    compressionRatio: number
    qualityLoss: number
  }>

  /** 获取统计信息 */
  getStats(): Promise<VectorDatabaseStats>

  /** 导出数据 */
  exportData(format: 'json' | 'binary' | 'csv'): Promise<any>

  /** 导入数据 */
  importData(data: any, format: 'json' | 'binary' | 'csv'): Promise<BatchOperationResult>

  /** 清理过期数据 */
  cleanup(olderThan: Date): Promise<{
    deletedCount: number
    freedSpace: number
  }>

  /** 健康检查 */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    metrics: Record<string, number>
  }>
}

/**
 * 混合搜索引擎接口
 */
export interface HybridSearchEngine {
  /** 执行混合搜索 */
  search(query: HybridSearchQuery): Promise<HybridSearchResult[]>

  /** 配置搜索权重 */
  configureWeights(textWeight: number, vectorWeight: number): void

  /** 设置重新排序策略 */
  setRerankStrategy(strategy: 'rrf' | 'score_fusion' | 'custom'): void

  /** 添加搜索过滤器 */
  addFilter(filter: (result: HybridSearchResult) => boolean): void

  /** 获取搜索统计 */
  getSearchStats(): {
    totalSearches: number
    averageTextScore: number
    averageVectorScore: number
    averageRerankScore: number
    filterEfficiency: number
  }
}

/**
 * 实时更新管理器接口
 */
export interface RealTimeManager {
  /** 启用实时更新 */
  enable(): Promise<void>

  /** 禁用实时更新 */
  disable(): Promise<void>

  /** 添加更新任务 */
  enqueueUpdate(operation: {
    type: 'insert' | 'update' | 'delete'
    data: any
  }): Promise<void>

  /** 获取更新队列状态 */
  getQueueStatus(): {
    pendingUpdates: number
    processingUpdates: number
    completedUpdates: number
    failedUpdates: number
  }

  /** 获取更新统计 */
  getUpdateStats(): {
    totalUpdates: number
    averageProcessingTime: number
    successRate: number
    queueLength: number
  }
}

/**
 * 向量压缩器接口
 */
export interface VectorCompressor {
  /** 压缩向量 */
  compress(vectors: number[][]): Promise<{
    compressed: any
    compressionRatio: number
    qualityLoss: number
  }>

  /** 解压缩向量 */
  decompress(compressed: any): Promise<number[][]>

  /** 训练压缩模型 */
  train(trainingVectors: number[][], config: CompressionConfig): Promise<{
    model: any
    trainingTime: number
    accuracy: number
  }>

  /** 获取压缩统计 */
  getCompressionStats(): {
    totalVectors: number
    compressedVectors: number
    averageCompressionRatio: number
    averageQualityLoss: number
  }
}

/**
 * 向量数据库服务接口
 */
export interface VectorDatabaseService {
  /** 获取向量数据库实例 */
  getDatabase(collection: string): VectorDatabase

  /** 创建新集合 */
  createCollection(
    name: string,
    config: {
      dimension: number
      metric: DistanceMetric
      index: IndexConfig
      compression: CompressionConfig
      realTime: RealTimeConfig
    }
  ): Promise<void>

  /** 删除集合 */
  deleteCollection(name: string): Promise<void>

  /** 列出所有集合 */
  listCollections(): Promise<Array<{
    name: string
    stats: VectorDatabaseStats
  }>>

  /** 执行跨集合搜索 */
  crossCollectionSearch(
    collections: string[],
    query: HybridSearchQuery
  ): Promise<Record<string, HybridSearchResult[]>>

  /** 获取服务统计 */
  getServiceStats(): {
    totalCollections: number
    totalVectors: number
    totalStorage: number
    activeConnections: number
    uptime: number
  }
}
