import { z } from 'zod'
import { Observable } from 'rxjs'

/**
 * 数据源类型枚举
 */
export enum DataSourceType {
  /** 用户行为数据 */
  USER_BEHAVIOR = 'user_behavior',
  /** AI交互数据 */
  AI_INTERACTION = 'ai_interaction',
  /** 系统性能数据 */
  SYSTEM_PERFORMANCE = 'system_performance',
  /** 内容数据 */
  CONTENT_DATA = 'content_data',
  /** 业务指标数据 */
  BUSINESS_METRICS = 'business_metrics',
  /** 外部API数据 */
  EXTERNAL_API = 'external_api',
}

/**
 * 数据仓库层级枚举
 */
export enum DataWarehouseLayer {
  /** 原始数据层 */
  RAW = 'raw',
  /** 清洗数据层 */
  CLEANSED = 'cleansed',
  /** 聚合数据层 */
  AGGREGATED = 'aggregated',
  /** 分析就绪层 */
  ANALYTICS_READY = 'analytics_ready',
}

/**
 * 分析类型枚举
 */
export enum AnalysisType {
  /** 用户行为分析 */
  USER_BEHAVIOR_ANALYSIS = 'user_behavior_analysis',
  /** AI内容评估 */
  AI_CONTENT_EVALUATION = 'ai_content_evaluation',
  /** 系统性能分析 */
  SYSTEM_PERFORMANCE_ANALYSIS = 'system_performance_analysis',
  /** 业务指标分析 */
  BUSINESS_METRICS_ANALYSIS = 'business_metrics_analysis',
  /** 趋势分析 */
  TREND_ANALYSIS = 'trend_analysis',
  /** 预测分析 */
  PREDICTIVE_ANALYSIS = 'predictive_analysis',
}

/**
 * 时间粒度枚举
 */
export enum TimeGranularity {
  /** 分钟级 */
  MINUTE = 'minute',
  /** 小时级 */
  HOUR = 'hour',
  /** 天级 */
  DAY = 'day',
  /** 周级 */
  WEEK = 'week',
  /** 月级 */
  MONTH = 'month',
  /** 季度级 */
  QUARTER = 'quarter',
  /** 年级 */
  YEAR = 'year',
}

/**
 * 数据管道状态枚举
 */
export enum PipelineStatus {
  /** 创建中 */
  CREATING = 'creating',
  /** 运行中 */
  RUNNING = 'running',
  /** 暂停中 */
  PAUSED = 'paused',
  /** 失败 */
  FAILED = 'failed',
  /** 完成 */
  COMPLETED = 'completed',
}

/**
 * 数据质量指标
 */
export interface DataQualityMetrics {
  /** 完整性 */
  completeness: number
  /** 准确性 */
  accuracy: number
  /** 一致性 */
  consistency: number
  /** 时效性 */
  timeliness: number
  /** 唯一性 */
  uniqueness: number
  /** 有效性 */
  validity: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 数据血缘信息
 */
export interface DataLineage {
  /** 数据源 */
  source: string
  /** 转换步骤 */
  transformations: Array<{
    step: string
    type: string
    parameters: Record<string, any>
    timestamp: Date
  }>
  /** 目标表 */
  target: string
  /** 创建时间 */
  createdAt: Date
}

/**
 * 用户行为事件
 */
export interface UserBehaviorEvent {
  /** 事件ID */
  eventId: string
  /** 用户ID */
  userId: string
  /** 租户ID */
  tenantId?: string
  /** 会话ID */
  sessionId: string
  /** 事件类型 */
  eventType: string
  /** 事件属性 */
  properties: Record<string, any>
  /** 时间戳 */
  timestamp: Date
  /** 用户代理 */
  userAgent?: string
  /** IP地址 */
  ipAddress?: string
  /** 地理位置 */
  location?: {
    country: string
    region: string
    city: string
  }
  /** 设备信息 */
  deviceInfo?: {
    type: string
    os: string
    browser: string
    screenSize: string
  }
}

/**
 * AI内容评估
 */
export interface AIContentEvaluation {
  /** 内容ID */
  contentId: string
  /** 内容类型 */
  contentType: string
  /** AI模型信息 */
  aiModel: {
    provider: string
    model: string
    version: string
  }
  /** 评估指标 */
  metrics: {
    /** 相关性 */
    relevance: number
    /** 准确性 */
    accuracy: number
    /** 创造性 */
    creativity: number
    /** 连贯性 */
    coherence: number
    /** 信息量 */
    informativeness: number
    /** 可读性 */
    readability: number
    /** 情感倾向 */
    sentiment: number
    /** 毒性评分 */
    toxicity: number
  }
  /** 评估时间 */
  evaluatedAt: Date
  /** 评估版本 */
  version: string
  /** 评估上下文 */
  context: Record<string, any>
}

/**
 * 分析查询
 */
export interface AnalyticsQuery {
  /** 查询ID */
  queryId: string
  /** 分析类型 */
  analysisType: AnalysisType
  /** 时间范围 */
  timeRange: {
    start: Date
    end: Date
    granularity: TimeGranularity
  }
  /** 过滤条件 */
  filters: Record<string, any>
  /** 分组维度 */
  dimensions: string[]
  /** 度量指标 */
  metrics: string[]
  /** 排序规则 */
  sortBy?: {
    field: string
    order: 'asc' | 'desc'
  }
  /** 分页信息 */
  pagination?: {
    page: number
    pageSize: number
  }
}

/**
 * 分析结果
 */
export interface AnalyticsResult {
  /** 查询ID */
  queryId: string
  /** 执行时间 */
  executionTime: number
  /** 数据行数 */
  rowCount: number
  /** 结果数据 */
  data: any[]
  /** 汇总统计 */
  summary: Record<string, any>
  /** 图表建议 */
  chartSuggestions: Array<{
    type: string
    title: string
    config: any
  }>
  /** 洞察发现 */
  insights: Array<{
    type: 'trend' | 'anomaly' | 'correlation' | 'prediction'
    title: string
    description: string
    confidence: number
    data: any
  }>
}

/**
 * 数据管道配置
 */
export interface DataPipelineConfig {
  /** 管道ID */
  pipelineId: string
  /** 管道名称 */
  name: string
  /** 管道描述 */
  description: string
  /** 数据源配置 */
  source: {
    type: DataSourceType
    config: Record<string, any>
  }
  /** 转换配置 */
  transformations: Array<{
    type: string
    config: Record<string, any>
  }>
  /** 目标配置 */
  destination: {
    table: string
    layer: DataWarehouseLayer
    config: Record<string, any>
  }
  /** 调度配置 */
  schedule: {
    frequency: string
    cronExpression?: string
    timezone: string
  }
  /** 监控配置 */
  monitoring: {
    enableMetrics: boolean
    alertThresholds: Record<string, number>
    notificationChannels: string[]
  }
}

/**
 * 数据管道状态
 */
export interface DataPipelineStatus {
  /** 管道ID */
  pipelineId: string
  /** 状态 */
  status: PipelineStatus
  /** 最后运行时间 */
  lastRunAt?: Date
  /** 下次运行时间 */
  nextRunAt?: Date
  /** 处理的记录数 */
  recordsProcessed: number
  /** 错误信息 */
  errorMessage?: string
  /** 性能指标 */
  metrics: {
    averageProcessingTime: number
    successRate: number
    throughput: number
  }
}

/**
 * 数据仓库管理器接口
 */
export interface DataWarehouseManager {
  /** 创建数据表 */
  createTable(
    tableName: string,
    schema: Record<string, any>,
    layer: DataWarehouseLayer
  ): Promise<void>

  /** 删除数据表 */
  dropTable(tableName: string): Promise<void>

  /** 插入数据 */
  insertData(tableName: string, data: any[]): Promise<{
    inserted: number
    failed: number
    duration: number
  }>

  /** 查询数据 */
  queryData(query: string, parameters?: any[]): Promise<any[]>

  /** 更新数据 */
  updateData(tableName: string, updates: Record<string, any>, conditions: Record<string, any>): Promise<number>

  /** 删除数据 */
  deleteData(tableName: string, conditions: Record<string, any>): Promise<number>

  /** 获取表统计信息 */
  getTableStats(tableName: string): Promise<{
    rowCount: number
    size: number
    lastUpdated: Date
    columns: Array<{
      name: string
      type: string
      nullable: boolean
    }>
  }>

  /** 优化表 */
  optimizeTable(tableName: string): Promise<{
    duration: number
    improvements: Record<string, number>
  }>

  /** 获取数据血缘 */
  getDataLineage(tableName: string): Promise<DataLineage[]>

  /** 数据质量检查 */
  checkDataQuality(tableName: string): Promise<DataQualityMetrics>
}

/**
 * 用户行为分析器接口
 */
export interface UserBehaviorAnalyzer {
  /** 记录用户行为事件 */
  trackEvent(event: UserBehaviorEvent): Promise<void>

  /** 批量记录事件 */
  trackEvents(events: UserBehaviorEvent[]): Promise<{
    tracked: number
    failed: number
  }>

  /** 获取用户行为分析 */
  analyzeUserBehavior(
    userId: string,
    timeRange: { start: Date; end: Date },
    analysisType?: string
  ): Promise<{
    userProfile: any
    behaviorPatterns: any[]
    engagementMetrics: any
    recommendations: string[]
  }>

  /** 获取群体行为分析 */
  analyzeGroupBehavior(
    filters: Record<string, any>,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    segmentAnalysis: any[]
    trendAnalysis: any[]
    cohortAnalysis: any[]
  }>

  /** 预测用户行为 */
  predictUserBehavior(
    userId: string,
    predictionType: 'churn' | 'engagement' | 'feature_adoption',
    timeWindow: number
  ): Promise<{
    prediction: any
    confidence: number
    factors: string[]
  }>

  /** 获取行为统计 */
  getBehaviorStats(
    timeRange: { start: Date; end: Date },
    granularity: TimeGranularity
  ): Promise<{
    totalEvents: number
    uniqueUsers: number
    eventsPerUser: number
    topEvents: Array<{ event: string; count: number }>
    userRetention: Record<string, number>
  }>
}

/**
 * AI内容评估器接口
 */
export interface AIContentEvaluator {
  /** 评估AI生成内容 */
  evaluateContent(content: string, metadata: Record<string, any>): Promise<AIContentEvaluation>

  /** 批量评估内容 */
  evaluateBatch(contents: Array<{ content: string; metadata: Record<string, any> }>): Promise<AIContentEvaluation[]>

  /** 比较AI模型性能 */
  compareModels(
    evaluations: AIContentEvaluation[],
    criteria: string[]
  ): Promise<{
    rankings: Array<{ model: string; score: number; rank: number }>
    insights: string[]
    recommendations: string[]
  }>

  /** 分析内容趋势 */
  analyzeContentTrends(
    evaluations: AIContentEvaluation[],
    timeRange: { start: Date; end: Date }
  ): Promise<{
    qualityTrends: any[]
    modelPerformance: any[]
    contentTypeAnalysis: any[]
  }>

  /** 生成评估报告 */
  generateEvaluationReport(
    evaluations: AIContentEvaluation[],
    reportType: 'summary' | 'detailed' | 'comparative'
  ): Promise<{
    reportId: string
    title: string
    summary: string
    sections: Array<{
      title: string
      content: any
      charts: any[]
    }>
    generatedAt: Date
  }>

  /** 获取评估统计 */
  getEvaluationStats(
    timeRange: { start: Date; end: Date }
  ): Promise<{
    totalEvaluations: number
    averageScores: Record<string, number>
    modelPerformance: Record<string, any>
    qualityDistribution: Record<string, number>
    topIssues: Array<{ issue: string; frequency: number }>
  }>
}

/**
 * 数据管道管理器接口
 */
export interface DataPipelineManager {
  /** 创建数据管道 */
  createPipeline(config: DataPipelineConfig): Promise<string>

  /** 更新管道配置 */
  updatePipeline(pipelineId: string, config: Partial<DataPipelineConfig>): Promise<void>

  /** 删除管道 */
  deletePipeline(pipelineId: string): Promise<void>

  /** 启动管道 */
  startPipeline(pipelineId: string): Promise<void>

  /** 停止管道 */
  stopPipeline(pipelineId: string): Promise<void>

  /** 获取管道状态 */
  getPipelineStatus(pipelineId: string): Promise<DataPipelineStatus>

  /** 列出所有管道 */
  listPipelines(): Promise<DataPipelineStatus[]>

  /** 执行管道 */
  executePipeline(pipelineId: string): Promise<{
    success: boolean
    recordsProcessed: number
    duration: number
    errors: string[]
  }>

  /** 监控管道性能 */
  monitorPipelines(): Observable<{
    pipelineId: string
    status: PipelineStatus
    metrics: any
  }>
}

/**
 * 分析引擎接口
 */
export interface AnalyticsEngine {
  /** 执行分析查询 */
  executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult>

  /** 创建分析仪表板 */
  createDashboard(
    name: string,
    description: string,
    queries: AnalyticsQuery[]
  ): Promise<{
    dashboardId: string
    components: Array<{
      id: string
      type: string
      title: string
      query: AnalyticsQuery
      config: any
    }>
  }>

  /** 获取预定义分析模板 */
  getAnalysisTemplates(): Promise<Array<{
    id: string
    name: string
    description: string
    category: string
    query: AnalyticsQuery
  }>>

  /** 实时数据流分析 */
  streamAnalytics(
    query: AnalyticsQuery,
    updateInterval: number
  ): Observable<AnalyticsResult>

  /** 生成分析洞察 */
  generateInsights(
    data: any[],
    analysisType: AnalysisType
  ): Promise<{
    insights: Array<{
      type: string
      title: string
      description: string
      confidence: number
      supportingData: any
    }>
    recommendations: string[]
  }>
}

/**
 * 数据仓库和分析服务接口
 */
export interface DataWarehouseAnalyticsService {
  /** 数据仓库管理 */
  getWarehouseManager(): DataWarehouseManager

  /** 用户行为分析 */
  getUserBehaviorAnalyzer(): UserBehaviorAnalyzer

  /** AI内容评估 */
  getAIContentEvaluator(): AIContentEvaluator

  /** 数据管道管理 */
  getPipelineManager(): DataPipelineManager

  /** 分析引擎 */
  getAnalyticsEngine(): AnalyticsEngine

  /** 获取服务统计 */
  getServiceStats(): {
    totalTables: number
    totalRecords: number
    activePipelines: number
    dailyEvents: number
    storageUsed: number
    lastUpdated: Date
  }

  /** 健康检查 */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    components: Record<string, boolean>
    metrics: Record<string, number>
  }>
}
