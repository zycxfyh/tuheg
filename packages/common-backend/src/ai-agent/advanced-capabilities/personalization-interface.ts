import { z } from 'zod'
import { Observable } from 'rxjs'

/**
 * 个性化类型枚举
 */
export enum PersonalizationType {
  /** 用户偏好 */
  USER_PREFERENCES = 'user_preferences',
  /** 行为模式 */
  BEHAVIOR_PATTERNS = 'behavior_patterns',
  /** 上下文适应 */
  CONTEXT_ADAPTATION = 'context_adaptation',
  /** 任务特定 */
  TASK_SPECIFIC = 'task_specific',
  /** 领域特定 */
  DOMAIN_SPECIFIC = 'domain_specific',
  /** 情感适应 */
  EMOTIONAL_ADAPTATION = 'emotional_adaptation'
}

/**
 * 微调策略枚举
 */
export enum FineTuningStrategy {
  /** 全量微调 */
  FULL_FINETUNING = 'full_finetuning',
  /** 参数高效微调 */
  PARAMETER_EFFICIENT = 'parameter_efficient',
  /** 提示工程 */
  PROMPT_ENGINEERING = 'prompt_engineering',
  /** 适配器微调 */
  ADAPTER_FINETUNING = 'adapter_finetuning',
  /** 前缀微调 */
  PREFIX_FINETUNING = 'prefix_finetuning',
  /** 指令微调 */
  INSTRUCTION_FINETUNING = 'instruction_finetuning'
}

/**
 * 个性化配置文件
 */
export interface PersonalizationProfile {
  /** 用户ID */
  userId: string
  /** 租户ID */
  tenantId?: string
  /** 个性化类型 */
  type: PersonalizationType
  /** 配置数据 */
  config: {
    /** 偏好设置 */
    preferences: Record<string, any>
    /** 行为模式 */
    behaviorPatterns: Array<{
      pattern: string
      frequency: number
      lastObserved: Date
      confidence: number
    }>
    /** 上下文规则 */
    contextRules: Array<{
      condition: string
      action: string
      priority: number
    }>
    /** 领域知识 */
    domainKnowledge: Array<{
      domain: string
      expertise: number
      lastUpdated: Date
    }>
  }
  /** 学习数据 */
  learningData: {
    /** 交互历史 */
    interactions: Array<{
      timestamp: Date
      type: string
      input: any
      output: any
      feedback?: any
    }>
    /** 偏好历史 */
    preferences: Array<{
      key: string
      value: any
      timestamp: Date
      confidence: number
    }>
    /** 性能指标 */
    performance: {
      accuracy: number
      speed: number
      satisfaction: number
      lastUpdated: Date
    }
  }
  /** 元数据 */
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
    dataPoints: number
  }
}

/**
 * 微调数据集
 */
export interface FineTuningDataset {
  /** 数据集ID */
  id: string
  /** 数据集名称 */
  name: string
  /** 数据集描述 */
  description: string
  /** 数据格式 */
  format: 'jsonl' | 'csv' | 'txt' | 'custom'
  /** 数据样本 */
  samples: Array<{
    input: any
    output: any
    metadata?: Record<string, any>
  }>
  /** 数据集统计 */
  statistics: {
    totalSamples: number
    inputTypes: string[]
    outputTypes: string[]
    averageInputLength: number
    averageOutputLength: number
    quality: {
      completeness: number
      consistency: number
      accuracy: number
    }
  }
  /** 创建信息 */
  createdBy: string
  createdAt: Date
  /** 验证状态 */
  validated: boolean
}

/**
 * 微调任务
 */
export interface FineTuningTask {
  /** 任务ID */
  id: string
  /** 任务名称 */
  name: string
  /** 任务描述 */
  description: string
  /** 基础模型 */
  baseModel: string
  /** 微调策略 */
  strategy: FineTuningStrategy
  /** 数据集 */
  dataset: FineTuningDataset
  /** 超参数 */
  hyperparameters: {
    learningRate: number
    batchSize: number
    epochs: number
    maxLength: number
    warmupSteps?: number
    weightDecay?: number
    customParams?: Record<string, any>
  }
  /** 训练配置 */
  trainingConfig: {
    computeResources: {
      gpuCount: number
      gpuType: string
      memoryGB: number
      storageGB: number
    }
    estimatedTime: number
    costEstimate: number
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }
  /** 状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  /** 进度 */
  progress: {
    currentEpoch: number
    totalEpochs: number
    currentStep: number
    totalSteps: number
    loss?: number
    accuracy?: number
    validationScore?: number
  }
  /** 结果 */
  result?: {
    modelPath: string
    metrics: {
      finalLoss: number
      finalAccuracy: number
      validationScore: number
      trainingTime: number
      modelSize: number
    }
    artifacts: Array<{
      name: string
      path: string
      type: string
      size: number
    }>
  }
  /** 时间戳 */
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  /** 创建者 */
  createdBy: string
}

/**
 * 个性化学习器接口
 */
export interface PersonalizationLearner {
  /** 学习用户偏好 */
  learnPreferences(userId: string, interactions: any[]): Promise<PersonalizationProfile>

  /** 更新行为模式 */
  updateBehaviorPatterns(userId: string, newPatterns: any[]): Promise<void>

  /** 适应上下文 */
  adaptToContext(userId: string, context: any): Promise<{
    adaptations: Array<{
      type: string
      change: any
      confidence: number
    }>
    recommendations: string[]
  }>

  /** 生成个性化响应 */
  generatePersonalizedResponse(
    userId: string,
    input: any,
    context: any
  ): Promise<{
    response: any
    personalizationFactors: string[]
    confidence: number
  }>

  /** 获取学习统计 */
  getLearningStats(userId: string): Promise<{
    totalInteractions: number
    learnedPatterns: number
    adaptationSuccessRate: number
    personalizationEffectiveness: number
    lastUpdated: Date
  }>
}

/**
 * 微调管理器接口
 */
export interface FineTuningManager {
  /** 创建微调任务 */
  createFineTuningTask(
    name: string,
    description: string,
    baseModel: string,
    dataset: FineTuningDataset,
    strategy: FineTuningStrategy,
    hyperparameters: any,
    createdBy: string
  ): Promise<FineTuningTask>

  /** 执行微调任务 */
  executeFineTuningTask(taskId: string): Promise<void>

  /** 监控微调进度 */
  monitorFineTuningTask(taskId: string): Observable<FineTuningTask>

  /** 取消微调任务 */
  cancelFineTuningTask(taskId: string): Promise<void>

  /** 获取微调结果 */
  getFineTuningResult(taskId: string): Promise<FineTuningTask['result']>

  /** 验证微调模型 */
  validateFineTunedModel(
    modelPath: string,
    testData: any[]
  ): Promise<{
    valid: boolean
    metrics: Record<string, number>
    issues: string[]
    recommendations: string[]
  }>

  /** 部署微调模型 */
  deployFineTunedModel(
    taskId: string,
    deploymentConfig: any
  ): Promise<{
    deploymentId: string
    endpoint: string
    status: 'deploying' | 'deployed' | 'failed'
  }>

  /** 获取微调统计 */
  getFineTuningStats(): Promise<{
    totalTasks: number
    runningTasks: number
    completedTasks: number
    failedTasks: number
    averageTrainingTime: number
    averageCost: number
    modelPerformance: {
      averageAccuracy: number
      averageImprovement: number
    }
  }>
}

/**
 * 模型融合器接口
 */
export interface ModelFuser {
  /** 融合多个模型 */
  fuseModels(
    models: Array<{
      modelId: string
      weight: number
      role: 'primary' | 'secondary' | 'expert'
    }>,
    fusionStrategy: 'weighted_average' | 'expert_routing' | 'adaptive' | 'custom',
    config?: any
  ): Promise<{
    fusedModelId: string
    performance: Record<string, number>
    fusionMetadata: any
  }>

  /** 动态路由到专家模型 */
  routeToExpert(
    input: any,
    experts: Array<{
      modelId: string
      expertise: string[]
      performance: Record<string, number>
    }>
  ): Promise<{
    selectedExpert: string
    confidence: number
    reasoning: string
  }>

  /** 模型集成 */
  ensembleModels(
    models: string[],
    votingStrategy: 'majority' | 'weighted' | 'ranked' | 'custom',
    weights?: number[]
  ): Promise<{
    ensembleId: string
    performance: Record<string, number>
    diversity: number
  }>

  /** 评估融合效果 */
  evaluateFusion(
    fusedModelId: string,
    testData: any[],
    metrics: string[]
  ): Promise<{
    scores: Record<string, number>
    comparison: {
      individual: Record<string, Record<string, number>>
      fused: Record<string, number>
      improvement: Record<string, number>
    }
    analysis: string[]
  }>
}

/**
 * 上下文学习器接口
 */
export interface ContextLearner {
  /** 学习上下文模式 */
  learnContextPatterns(
    userId: string,
    contexts: Array<{
      situation: any
      response: any
      outcome: any
      timestamp: Date
    }>
  ): Promise<{
    patterns: Array<{
      pattern: string
      confidence: number
      applicability: string[]
    }>
    insights: string[]
  }>

  /** 预测上下文需求 */
  predictContextNeeds(
    userId: string,
    currentContext: any
  ): Promise<{
    predictedNeeds: string[]
    confidence: number
    recommendations: Array<{
      action: string
      expectedBenefit: number
      rationale: string
    }>
  }>

  /** 适应上下文变化 */
  adaptToContextChange(
    userId: string,
    oldContext: any,
    newContext: any,
    feedback?: any
  ): Promise<{
    adaptations: Array<{
      type: string
      change: any
      expectedImpact: number
    }>
    learning: string[]
  }>

  /** 获取上下文洞察 */
  getContextInsights(userId: string): Promise<{
    commonPatterns: Array<{
      pattern: string
      frequency: number
      effectiveness: number
    }>
    contextPreferences: Record<string, any>
    adaptationHistory: Array<{
      timestamp: Date
      adaptation: string
      impact: number
    }>
  }>
}

/**
 * 高级AI能力服务接口
 */
export interface AdvancedAICapabilitiesService {
  /** 处理多模态输入 */
  processMultimodal(input: any): Promise<any>

  /** 执行个性化推理 */
  performPersonalizedInference(
    userId: string,
    input: any,
    context?: any
  ): Promise<{
    response: any
    personalization: string[]
    confidence: number
  }>

  /** 微调模型 */
  fineTuneModel(
    baseModel: string,
    dataset: any,
    config: any
  ): Promise<{
    taskId: string
    estimatedTime: number
    estimatedCost: number
  }>

  /** 融合模型 */
  fuseModels(
    models: string[],
    strategy: string,
    config?: any
  ): Promise<{
    fusedModelId: string
    performance: Record<string, number>
  }>

  /** 学习用户上下文 */
  learnUserContext(userId: string, data: any): Promise<{
    learned: string[]
    insights: string[]
    recommendations: string[]
  }>

  /** 获取服务统计 */
  getServiceStats(): {
    multimodalRequests: number
    personalizedInferences: number
    activeFineTunings: number
    fusedModels: number
    contextLearnings: number
    averageResponseTime: number
    successRate: number
  }
}
