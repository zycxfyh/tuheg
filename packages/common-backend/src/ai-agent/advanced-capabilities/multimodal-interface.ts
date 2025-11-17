import { z } from 'zod'
import { Observable } from 'rxjs'

/**
 * 模态类型枚举
 */
export enum ModalityType {
  /** 文本 */
  TEXT = 'text',
  /** 图像 */
  IMAGE = 'image',
  /** 音频 */
  AUDIO = 'audio',
  /** 视频 */
  VIDEO = 'video',
  /** 结构化数据 */
  STRUCTURED_DATA = 'structured_data',
  /** 代码 */
  CODE = 'code',
  /** 文档 */
  DOCUMENT = 'document',
  /** 表格数据 */
  TABULAR = 'tabular'
}

/**
 * 模态数据格式
 */
export interface ModalityData {
  /** 模态类型 */
  type: ModalityType
  /** 数据内容 */
  content: any
  /** 元数据 */
  metadata: {
    /** MIME类型 */
    mimeType?: string
    /** 文件大小 */
    size?: number
    /** 维度信息（图像、视频等） */
    dimensions?: {
      width?: number
      height?: number
      duration?: number
      channels?: number
    }
    /** 语言信息 */
    language?: string
    /** 编码信息 */
    encoding?: string
    /** 创建时间 */
    createdAt?: Date
    /** 来源信息 */
    source?: string
  }
  /** 处理选项 */
  processingOptions?: {
    /** 预处理选项 */
    preprocessing?: Record<string, any>
    /** 特征提取选项 */
    featureExtraction?: Record<string, any>
    /** 后处理选项 */
    postprocessing?: Record<string, any>
  }
}

/**
 * 多模态输入
 */
export interface MultimodalInput {
  /** 主要模态 */
  primary: ModalityData
  /** 辅助模态列表 */
  secondary: ModalityData[]
  /** 模态间关系 */
  relationships: Array<{
    from: string
    to: string
    type: 'complements' | 'contradicts' | 'explains' | 'references'
    strength: number
  }>
  /** 上下文信息 */
  context: {
    /** 任务描述 */
    taskDescription?: string
    /** 用户偏好 */
    userPreferences?: Record<string, any>
    /** 环境信息 */
    environment?: Record<string, any>
  }
}

/**
 * 多模态输出
 */
export interface MultimodalOutput {
  /** 主要输出 */
  primary: ModalityData
  /** 辅助输出列表 */
  secondary: ModalityData[]
  /** 输出置信度 */
  confidence: number
  /** 处理元数据 */
  metadata: {
    /** 处理时间 */
    processingTime: number
    /** 使用的模态 */
    modalitiesUsed: ModalityType[]
    /** 资源使用 */
    resourceUsage: {
      memory: number
      compute: number
    }
  }
  /** 解释信息 */
  explanations?: {
    /** 推理过程 */
    reasoning: string[]
    /** 关键洞察 */
    insights: string[]
    /** 不确定性 */
    uncertainties: string[]
  }
}

/**
 * 模态处理器接口
 */
export interface ModalityProcessor {
  /** 支持的模态类型 */
  supportedModalities: ModalityType[]

  /** 处理模态数据 */
  process(data: ModalityData, context?: any): Promise<ModalityData>

  /** 验证模态数据 */
  validate(data: ModalityData): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>

  /** 提取特征 */
  extractFeatures(data: ModalityData): Promise<any>

  /** 获取处理器信息 */
  getProcessorInfo(): {
    name: string
    version: string
    capabilities: string[]
    limitations: string[]
  }
}

/**
 * 多模态融合器接口
 */
export interface MultimodalFuser {
  /** 融合多模态输入 */
  fuse(inputs: MultimodalInput): Promise<any>

  /** 解融合输出 */
  defuse(fused: any): Promise<MultimodalOutput>

  /** 学习模态关系 */
  learnRelationships(inputs: MultimodalInput[], outputs: any[]): Promise<void>

  /** 预测模态兼容性 */
  predictCompatibility(modalities: ModalityType[]): Promise<{
    compatible: boolean
    score: number
    recommendations: string[]
  }>

  /** 获取融合统计 */
  getFusionStats(): {
    totalFusions: number
    averageProcessingTime: number
    modalityCombinations: Record<string, number>
    successRate: number
  }
}

/**
 * 模态转换器接口
 */
export interface ModalityTransformer {
  /** 转换模态 */
  transform(
    input: ModalityData,
    targetType: ModalityType,
    options?: any
  ): Promise<ModalityData>

  /** 获取支持的转换 */
  getSupportedTransformations(): Array<{
    from: ModalityType
    to: ModalityType
    quality: 'lossless' | 'lossy' | 'approximate'
    processingTime: number
  }>

  /** 评估转换质量 */
  evaluateTransformation(
    original: ModalityData,
    transformed: ModalityData
  ): Promise<{
    quality: number
    losses: string[]
    recommendations: string[]
  }>
}

/**
 * 多模态推理引擎接口
 */
export interface MultimodalReasoningEngine {
  /** 执行多模态推理 */
  reason(input: MultimodalInput): Promise<MultimodalOutput>

  /** 解释推理过程 */
  explain(input: MultimodalInput, output: MultimodalOutput): Promise<{
    reasoningChain: Array<{
      step: string
      modality: ModalityType
      confidence: number
      evidence: any
    }>
    keyInsights: string[]
    alternativeInterpretations: Array<{
      interpretation: string
      probability: number
      supportingEvidence: any[]
    }>
  }>

  /** 学习推理模式 */
  learnPatterns(
    inputs: MultimodalInput[],
    outputs: MultimodalOutput[],
    feedback: any[]
  ): Promise<void>

  /** 获取推理统计 */
  getReasoningStats(): {
    totalReasonings: number
    averageConfidence: number
    modalityUsage: Record<ModalityType, number>
    reasoningPatterns: Record<string, number>
    successRate: number
  }
}

/**
 * 多模态缓存接口
 */
export interface MultimodalCache {
  /** 存储多模态结果 */
  set(key: string, input: MultimodalInput, output: MultimodalOutput, ttl?: number): Promise<void>

  /** 获取缓存结果 */
  get(key: string): Promise<MultimodalOutput | null>

  /** 检查缓存命中 */
  has(key: string): Promise<boolean>

  /** 生成缓存键 */
  generateKey(input: MultimodalInput): string

  /** 清理过期缓存 */
  cleanup(): Promise<void>

  /** 获取缓存统计 */
  getStats(): {
    totalEntries: number
    hits: number
    misses: number
    hitRate: number
    averageEntrySize: number
    totalSize: number
  }
}

/**
 * 多模态验证器接口
 */
export interface MultimodalValidator {
  /** 验证多模态输入 */
  validateInput(input: MultimodalInput): Promise<{
    valid: boolean
    errors: Array<{
      modality: ModalityType
      field: string
      message: string
    }>
    warnings: Array<{
      modality: ModalityType
      field: string
      message: string
    }>
  }>

  /** 验证多模态输出 */
  validateOutput(output: MultimodalOutput): Promise<{
    valid: boolean
    score: number
    issues: string[]
    recommendations: string[]
  }>

  /** 验证模态兼容性 */
  validateCompatibility(modalities: ModalityType[]): Promise<{
    compatible: boolean
    incompatibilities: Array<{
      modalities: ModalityType[]
      reason: string
      severity: 'error' | 'warning'
    }>
  }>

  /** 质量评估 */
  assessQuality(input: MultimodalInput, output: MultimodalOutput): Promise<{
    overallScore: number
    modalityScores: Record<ModalityType, number>
    qualityMetrics: {
      accuracy: number
      completeness: number
      consistency: number
      relevance: number
    }
    improvementAreas: string[]
  }>
}

/**
 * 多模态服务接口
 */
export interface MultimodalService {
  /** 处理多模态输入 */
  process(input: MultimodalInput): Promise<MultimodalOutput>

  /** 批量处理 */
  processBatch(inputs: MultimodalInput[]): Promise<MultimodalOutput[]>

  /** 流式处理 */
  processStream(input: Observable<MultimodalInput>): Observable<MultimodalOutput>

  /** 获取支持的模态 */
  getSupportedModalities(): ModalityType[]

  /** 获取服务统计 */
  getServiceStats(): {
    totalRequests: number
    averageProcessingTime: number
    modalityUsage: Record<ModalityType, number>
    cacheHitRate: number
    errorRate: number
  }

  /** 健康检查 */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    metrics: Record<string, number>
  }>
}
