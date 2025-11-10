import type { BaseEvent } from '@tuheg/shared-types'
import type { Observable } from 'rxjs'

// ============================================================================
// 缓存服务接口 (Cache Service Interfaces)
// ============================================================================

/**
 * 缓存项元数据
 */
export interface CacheItemMetadata {
  /** 创建时间 */
  createdAt: Date
  /** 过期时间 */
  expiresAt?: Date
  /** 访问次数 */
  accessCount: number
  /** 最后访问时间 */
  lastAccessedAt: Date
  /** 数据大小(字节) */
  size: number
}

/**
 * 缓存服务接口
 */
export interface ICacheService {
  /**
   * 获取缓存值
   * @param key 缓存键
   */
  get<T>(key: string): Promise<T | null>

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间(秒)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>

  /**
   * 删除缓存值
   * @param key 缓存键
   */
  delete(key: string): Promise<void>

  /**
   * 检查键是否存在
   * @param key 缓存键
   */
  exists(key: string): Promise<boolean>

  /**
   * 清空所有缓存
   */
  clear(): Promise<void>

  /**
   * 获取或设置缓存值 (原子操作)
   * @param key 缓存键
   * @param factory 值工厂函数
   * @param ttl 过期时间(秒)
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>

  /**
   * 获取缓存项元数据
   * @param key 缓存键
   */
  getMetadata(key: string): Promise<CacheItemMetadata | null>

  /**
   * 获取所有缓存键
   * @param pattern 匹配模式
   */
  getKeys(pattern?: string): Promise<string[]>

  /**
   * 获取缓存统计信息
   */
  getStats(): Promise<{
    totalKeys: number
    totalSize: number
    hitRate: number
    missRate: number
  }>
}

// ============================================================================
// 事件总线接口 (Event Bus Interfaces)
// ============================================================================

/**
 * 事件处理器函数类型
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>

/**
 * 事件订阅选项
 */
export interface EventSubscriptionOptions {
  /** 优先级 (数字越大优先级越高) */
  priority?: number
  /** 是否只处理一次 */
  once?: boolean
  /** 过滤条件 */
  filter?: (event: unknown) => boolean
  /** 错误处理 */
  onError?: (error: Error) => void
}

/**
 * 事件发布选项
 */
export interface EventPublishOptions {
  /** 延迟发布(毫秒) */
  delay?: number
  /** 过期时间 */
  expiresAt?: Date
  /** 事件源 */
  source?: string
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 事件总线接口
 */
export interface IEventBus {
  /**
   * 发布事件
   * @param event 事件对象
   * @param options 发布选项
   */
  publish<T extends BaseEvent>(event: T, options?: EventPublishOptions): Promise<void>

  /**
   * 发布事件 (异步)
   * @param event 事件对象
   * @param options 发布选项
   */
  publishAsync<T extends BaseEvent>(event: T, options?: EventPublishOptions): void

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   * @param options 订阅选项
   */
  subscribe<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): () => void

  /**
   * 订阅事件流
   * @param eventType 事件类型
   * @param options 订阅选项
   */
  subscribeStream<T = unknown>(eventType: string, options?: EventSubscriptionOptions): Observable<T>

  /**
   * 取消订阅
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  unsubscribe<T = unknown>(eventType: string, handler: EventHandler<T>): void

  /**
   * 获取事件统计信息
   */
  getStats(): Promise<{
    totalPublished: number
    totalProcessed: number
    activeSubscriptions: number
    eventTypes: string[]
  }>
}

// ============================================================================
// 消息队列接口 (Message Queue Interfaces)
// ============================================================================

/**
 * 消息发送选项
 */
export interface MessageSendOptions {
  /** 优先级 (数字越大优先级越高) */
  priority?: number
  /** 延迟发送(毫秒) */
  delay?: number
  /** 消息存活时间(毫秒) */
  ttl?: number
  /** 消息组ID */
  groupId?: string
  /** 去重ID */
  deduplicationId?: string
}

/**
 * 队列创建选项
 */
export interface QueueCreateOptions {
  /** 最大队列大小 */
  maxSize?: number
  /** 消息保留时间(毫秒) */
  messageRetention?: number
  /** 消息可见性超时时间(毫秒) */
  visibilityTimeout?: number
  /** 是否启用死信队列 */
  deadLetterEnabled?: boolean
  /** 最大重试次数 */
  maxRetries?: number
}

/**
 * 队列信息
 */
export interface QueueInfo {
  /** 消息数量 */
  messageCount: number
  /** 消费者数量 */
  consumerCount: number
  /** 队列大小 */
  size: number
  /** 创建时间 */
  createdAt: Date
  /** 最后活动时间 */
  lastActivityAt?: Date
}

/**
 * 消息队列接口
 */
export interface IMessageQueue {
  /**
   * 发送消息到队列
   * @param queueName 队列名称
   * @param message 消息内容
   * @param options 发送选项
   */
  sendMessage<T = unknown>(
    queueName: string,
    message: T,
    options?: MessageSendOptions
  ): Promise<string> // 返回消息ID

  /**
   * 批量发送消息
   * @param queueName 队列名称
   * @param messages 消息列表
   */
  sendMessages<T = unknown>(
    queueName: string,
    messages: Array<{ message: T; options?: MessageSendOptions }>
  ): Promise<string[]> // 返回消息ID列表

  /**
   * 接收消息从队列
   * @param queueName 队列名称
   * @param options 接收选项
   */
  receiveMessage<T = unknown>(
    queueName: string,
    options?: { visibilityTimeout?: number }
  ): Promise<{ message: T; receiptHandle: string; messageId: string } | null>

  /**
   * 批量接收消息
   * @param queueName 队列名称
   * @param maxMessages 最大消息数量
   */
  receiveMessages<T = unknown>(
    queueName: string,
    maxMessages: number
  ): Promise<Array<{ message: T; receiptHandle: string; messageId: string }>>

  /**
   * 删除已处理的消息
   * @param queueName 队列名称
   * @param receiptHandle 消息接收句柄
   */
  deleteMessage(queueName: string, receiptHandle: string): Promise<void>

  /**
   * 批量删除消息
   * @param queueName 队列名称
   * @param receiptHandles 消息接收句柄列表
   */
  deleteMessages(queueName: string, receiptHandles: string[]): Promise<void>

  /**
   * 更改消息可见性超时时间
   * @param queueName 队列名称
   * @param receiptHandle 消息接收句柄
   * @param visibilityTimeout 新超时时间(毫秒)
   */
  changeMessageVisibility(
    queueName: string,
    receiptHandle: string,
    visibilityTimeout: number
  ): Promise<void>

  /**
   * 创建队列
   * @param queueName 队列名称
   * @param options 队列选项
   */
  createQueue(queueName: string, options?: QueueCreateOptions): Promise<void>

  /**
   * 删除队列
   * @param queueName 队列名称
   */
  deleteQueue(queueName: string): Promise<void>

  /**
   * 获取队列信息
   * @param queueName 队列名称
   */
  getQueueInfo(queueName: string): Promise<QueueInfo>

  /**
   * 清除队列中的所有消息
   * @param queueName 队列名称
   */
  purgeQueue(queueName: string): Promise<void>
}

// ============================================================================
// 配置服务接口 (Configuration Service Interfaces)
// ============================================================================

/**
 * 配置变更监听器
 */
export type ConfigurationChangeListener<T = unknown> = (
  newValue: T,
  oldValue: T,
  key: string
) => void

/**
 * 配置服务接口
 */
export interface IConfigurationService {
  /**
   * 获取配置值
   * @param key 配置键
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T): T

  /**
   * 设置配置值
   * @param key 配置键
   * @param value 配置值
   */
  set<T>(key: string, value: T): void

  /**
   * 检查配置是否存在
   * @param key 配置键
   */
  has(key: string): boolean

  /**
   * 获取所有配置
   */
  getAll(): Record<string, unknown>

  /**
   * 监听配置变化
   * @param key 配置键
   * @param callback 回调函数
   */
  watch<T>(key: string, callback: ConfigurationChangeListener<T>): () => void

  /**
   * 重新加载配置
   */
  reload(): Promise<void>

  /**
   * 验证配置
   */
  validate(): Promise<{ valid: boolean; errors: string[] }>
}

// ============================================================================
// 数据库相关接口 (Database Interfaces)
// ============================================================================

/**
 * 查询结果
 */
export interface QueryResult<T = unknown> {
  rows: T[]
  affectedRows?: number
  insertId?: string | number
}

/**
 * 数据库连接接口
 */
export interface IDatabaseConnection {
  /** 执行查询 */
  query<T = unknown>(query: string, params?: unknown[]): Promise<T[]>
  /** 执行单个查询 */
  queryOne<T = unknown>(query: string, params?: unknown[]): Promise<T | null>
  /** 执行命令 */
  execute(command: string, params?: unknown[]): Promise<QueryResult>
  /** 开始事务 */
  beginTransaction(): Promise<void>
  /** 提交事务 */
  commit(): Promise<void>
  /** 回滚事务 */
  rollback(): Promise<void>
  /** 检查连接健康 */
  isHealthy(): Promise<boolean>
  /** 关闭连接 */
  close(): Promise<void>
}

// ============================================================================
// 向量搜索接口 (Vector Search Interfaces)
// ============================================================================

/**
 * 向量搜索结果
 */
export interface VectorSearchResult {
  id: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * 向量搜索服务接口
 */
export interface IVectorSearchService {
  /** 添加向量 */
  addVector(id: string, vector: number[], metadata?: Record<string, unknown>): Promise<void>
  /** 搜索相似向量 */
  searchSimilar(
    queryVector: number[],
    limit?: number,
    filter?: Record<string, unknown>
  ): Promise<VectorSearchResult[]>
  /** 删除向量 */
  deleteVector(id: string): Promise<void>
  /** 更新向量 */
  updateVector(id: string, vector: number[], metadata?: Record<string, unknown>): Promise<void>
  /** 获取向量 */
  getVector(id: string): Promise<{ vector: number[]; metadata?: Record<string, unknown> } | null>
}

// ============================================================================
// 文件存储接口 (File Storage Interfaces)
// ============================================================================

/**
 * 文件信息
 */
export interface FileInfo {
  size: number
  contentType: string
  lastModified: Date
  metadata?: Record<string, unknown>
}

/**
 * 文件上传选项
 */
export interface FileUploadOptions {
  contentType?: string
  metadata?: Record<string, unknown>
}

/**
 * 文件存储服务接口
 */
export interface IFileStorageService {
  /** 上传文件 */
  uploadFile(fileName: string, content: Buffer, options?: FileUploadOptions): Promise<string>
  /** 下载文件 */
  downloadFile(fileName: string): Promise<Buffer>
  /** 删除文件 */
  deleteFile(fileName: string): Promise<void>
  /** 检查文件存在 */
  fileExists(fileName: string): Promise<boolean>
  /** 获取文件信息 */
  getFileInfo(fileName: string): Promise<FileInfo>
}

// ============================================================================
// 监控和健康检查接口 (Monitoring & Health Check Interfaces)
// ============================================================================

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  checks: Record<
    string,
    {
      status: 'healthy' | 'unhealthy'
      message?: string
      responseTime?: number
    }
  >
}

/**
 * 单个健康检查函数
 */
export type HealthCheckFunction = () => Promise<{
  status: 'healthy' | 'unhealthy'
  message?: string
}>

/**
 * 监控服务接口
 */
export interface IMonitoringService {
  /** 记录指标 */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void
  /** 记录计数器 */
  incrementCounter(name: string, increment?: number, tags?: Record<string, string>): void
  /** 记录直方图 */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void
  /** 开始计时器 */
  startTimer(name: string, tags?: Record<string, string>): () => void
  /** 记录错误 */
  recordError(error: Error, context?: Record<string, unknown>): void
  /** 记录日志 */
  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): void
}

/**
 * 健康检查服务接口
 */
export interface IHealthCheckService {
  /** 执行健康检查 */
  check(): Promise<HealthCheckResult>
  /** 注册健康检查 */
  registerCheck(name: string, check: HealthCheckFunction): void
}
