import type { AiConfiguration, AiProvider } from '@tuheg/shared-types'
import type { Observable } from 'rxjs'

// ============================================================================
// AI 请求和响应类型 (AI Request/Response Types)
// ============================================================================

/**
 * AI 请求参数
 */
export interface AiRequest {
  /** 提示词 */
  prompt: string
  /** 系统提示 */
  systemPrompt?: string
  /** 对话历史 */
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
  }>
  /** 温度参数 (0-2) */
  temperature?: number
  /** 最大token数 */
  maxTokens?: number
  /** 停止序列 */
  stopSequences?: string[]
  /** 其他参数 */
  options?: Record<string, unknown>
}

/**
 * AI 响应结果
 */
export interface AiResponse {
  /** 生成的文本 */
  text: string
  /** 使用的token数 */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  /** 完成原因 */
  finishReason?: 'stop' | 'length' | 'content_filter'
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/**
 * AI 模型配置
 */
export interface AiModelConfig {
  /** 模型ID */
  id: string
  /** 模型名称 */
  name: string
  /** 支持的功能 */
  capabilities: {
    textGeneration: boolean
    streaming: boolean
    functionCalling: boolean
    vision?: boolean
  }
  /** 上下文长度 */
  contextLength: number
  /** 定价信息 */
  pricing?: {
    inputTokens: number
    outputTokens: number
    currency: string
  }
}

// ============================================================================
// AI 领域接口 (AI Domain Interfaces)
// ============================================================================

/**
 * AI提供商抽象接口
 * 定义了所有AI提供商必须实现的基本功能
 */
export interface IAiProvider {
  /**
   * 提供商类型标识
   */
  readonly providerType: AiProvider

  /**
   * 检查提供商是否可用
   */
  isAvailable(): Promise<boolean>

  /**
   * 生成文本响应
   * @param request AI请求参数
   */
  generateText(request: AiRequest): Promise<AiResponse>

  /**
   * 流式生成文本响应
   * @param request AI请求参数
   */
  generateTextStream(request: AiRequest): Observable<AiResponse>

  /**
   * 获取支持的模型列表
   */
  getSupportedModels(): Promise<AiModelConfig[]>

  /**
   * 估算token使用量
   * @param text 输入文本
   */
  estimateTokens(text: string): Promise<number>

  /**
   * 验证API密钥
   */
  validateApiKey(): Promise<boolean>
}

/**
 * AI提供商工厂接口
 * 负责创建和管理不同类型的AI提供商实例
 */
export interface IAiProviderFactory {
  /**
   * 创建AI提供商实例
   * @param providerType 提供商类型
   * @param config 配置参数
   */
  createProvider(providerType: AiProvider, config: AiConfiguration): IAiProvider

  /**
   * 获取所有可用的提供商类型
   */
  getAvailableProviders(): AiProvider[]

  /**
   * 根据模型名称获取最合适的提供商
   * @param modelName 模型名称
   */
  getProviderForModel(modelName: string): IAiProvider | null
}

/**
 * 对话消息类型
 */
export interface ConversationMessage {
  /** 消息角色 */
  role: 'user' | 'assistant' | 'system'
  /** 消息内容 */
  content: string
  /** 时间戳 */
  timestamp: Date
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 对话服务接口
 * 管理多轮对话的上下文和历史
 */
export interface IConversationService {
  /**
   * 创建新对话
   * @param initialContext 初始上下文
   */
  createConversation(initialContext?: Record<string, unknown>): Promise<string>

  /**
   * 添加消息到对话
   * @param conversationId 对话ID
   * @param message 消息内容
   * @param role 消息角色
   */
  addMessage(conversationId: string, message: ConversationMessage): Promise<void>

  /**
   * 获取对话历史
   * @param conversationId 对话ID
   * @param limit 限制返回的消息数量
   */
  getConversationHistory(conversationId: string, limit?: number): Promise<ConversationMessage[]>

  /**
   * 清除对话历史
   * @param conversationId 对话ID
   */
  clearConversation(conversationId: string): Promise<void>

  /**
   * 获取对话摘要
   * @param conversationId 对话ID
   */
  getConversationSummary(conversationId: string): Promise<string>
}

/**
 * 提示词模板元信息
 */
export interface PromptTemplateMetadata {
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 必需变量 */
  requiredVariables: string[]
  /** 可选变量 */
  optionalVariables: string[]
  /** 标签 */
  tags?: string[]
}

/**
 * 提示词管理接口
 * 管理AI提示词模板和变量替换
 */
export interface IPromptManager {
  /**
   * 渲染提示词模板
   * @param templateName 模板名称
   * @param variables 变量值
   */
  renderTemplate(templateName: string, variables: Record<string, unknown>): Promise<string>

  /**
   * 获取所有可用模板
   */
  getAvailableTemplates(): Promise<string[]>

  /**
   * 验证模板变量
   * @param templateName 模板名称
   * @param variables 变量值
   */
  validateTemplateVariables(
    templateName: string,
    variables: Record<string, unknown>
  ): Promise<boolean>

  /**
   * 获取模板元信息
   * @param templateName 模板名称
   */
  getTemplateMetadata(templateName: string): Promise<PromptTemplateMetadata>
}

/**
 * AI调度选项
 */
export interface AiSchedulingOptions {
  /** 偏好提供商 */
  preferredProvider?: AiProvider
  /** 后备提供商列表 */
  fallbackProviders?: AiProvider[]
  /** 超时时间(毫秒) */
  timeout?: number
  /** 优先级 */
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

/**
 * 调度统计信息
 */
export interface AiSchedulingStats {
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successfulRequests: number
  /** 失败请求数 */
  failedRequests: number
  /** 平均响应时间(毫秒) */
  averageResponseTime: number
  /** 提供商使用统计 */
  providerUsage: Record<AiProvider, number>
}

/**
 * AI调度服务接口
 * 智能调度AI请求到最合适的提供商和模型
 */
export interface IAiScheduler {
  /**
   * 调度AI请求
   * @param request AI请求
   * @param options 调度选项
   */
  scheduleRequest(request: AiRequest, options?: AiSchedulingOptions): Promise<AiResponse>

  /**
   * 批量调度多个请求
   * @param requests AI请求列表
   */
  scheduleBatch(requests: AiRequest[]): Promise<AiResponse[]>

  /**
   * 获取调度统计信息
   */
  getSchedulingStats(): Promise<AiSchedulingStats>
}
