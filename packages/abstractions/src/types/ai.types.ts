/**
 * AI提供商类型
 */
export type AiProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'custom'
  | 'mock';

/**
 * AI模型配置
 */
export interface AiModelConfig {
  /** 模型ID */
  id: string;

  /** 模型名称 */
  name: string;

  /** 提供商 */
  provider: AiProviderType;

  /** 上下文长度 */
  contextLength: number;

  /** 支持的功能 */
  capabilities: AiModelCapability[];

  /** 定价信息 */
  pricing?: {
    inputTokens: number; // 每1000个输入token的价格
    outputTokens: number; // 每1000个输出token的价格
    currency: string;
  };

  /** 是否为默认模型 */
  isDefault?: boolean;

  /** 模型状态 */
  status: 'active' | 'deprecated' | 'experimental';
}

/**
 * AI模型能力
 */
export type AiModelCapability =
  | 'text-generation'
  | 'chat'
  | 'code-generation'
  | 'image-generation'
  | 'embedding'
  | 'function-calling'
  | 'vision'
  | 'audio';

/**
 * AI请求参数
 */
export interface AiRequest {
  /** 模型名称 */
  model: string;

  /** 提示词 */
  prompt: string;

  /** 系统消息 */
  systemMessage?: string;

  /** 对话历史 */
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;

  /** 最大token数 */
  maxTokens?: number;

  /** 温度参数 */
  temperature?: number;

  /** Top-p参数 */
  topP?: number;

  /** 停止序列 */
  stop?: string[];

  /** 工具调用 */
  tools?: AiTool[];

  /** 函数调用 */
  functions?: AiFunction[];

  /** 其他参数 */
  options?: Record<string, any>;
}

/**
 * AI响应
 */
export interface AiResponse {
  /** 响应ID */
  id: string;

  /** 生成的内容 */
  content: string;

  /** 使用的模型 */
  model: string;

  /** token使用统计 */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** 完成原因 */
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'null';

  /** 工具调用结果 */
  toolCalls?: AiToolCall[];

  /** 函数调用结果 */
  functionCall?: AiFunctionCall;

  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * AI工具定义
 */
export interface AiTool {
  /** 工具类型 */
  type: 'function';

  /** 函数定义 */
  function: AiFunction;
}

/**
 * AI函数定义
 */
export interface AiFunction {
  /** 函数名称 */
  name: string;

  /** 函数描述 */
  description: string;

  /** 参数模式 */
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * AI工具调用
 */
export interface AiToolCall {
  /** 调用ID */
  id: string;

  /** 工具类型 */
  type: 'function';

  /** 函数调用 */
  function: AiFunctionCall;
}

/**
 * AI函数调用
 */
export interface AiFunctionCall {
  /** 函数名称 */
  name: string;

  /** 函数参数 */
  arguments: string;
}

/**
 * AI提供商配置
 */
export interface AiProviderConfig {
  /** API密钥 */
  apiKey: string;

  /** API基础URL */
  baseUrl?: string;

  /** 组织ID */
  organizationId?: string;

  /** 项目ID */
  projectId?: string;

  /** 超时时间(秒) */
  timeout?: number;

  /** 重试配置 */
  retry?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };

  /** 速率限制 */
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

/**
 * AI推理任务
 */
export interface AiInferenceTask {
  /** 任务ID */
  taskId: string;

  /** 任务类型 */
  taskType: 'creation' | 'logic' | 'narrative' | 'analysis' | 'generation';

  /** 优先级 */
  priority: number;

  /** 请求参数 */
  request: AiRequest;

  /** 任务状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  /** 创建时间 */
  createdAt: Date;

  /** 开始时间 */
  startedAt?: Date;

  /** 完成时间 */
  completedAt?: Date;

  /** 结果 */
  result?: AiResponse;

  /** 错误信息 */
  error?: string;

  /** 重试次数 */
  retryCount: number;

  /** 最大重试次数 */
  maxRetries: number;

  /** 超时时间 */
  timeout?: number;

  /** 相关上下文 */
  context?: Record<string, any>;
}

/**
 * AI推理统计
 */
export interface AiInferenceStats {
  /** 时间范围 */
  period: {
    start: Date;
    end: Date;
  };

  /** 总任务数 */
  totalTasks: number;

  /** 成功任务数 */
  successfulTasks: number;

  /** 失败任务数 */
  failedTasks: number;

  /** 平均响应时间 */
  averageResponseTime: number;

  /** 按提供商统计 */
  byProvider: Record<AiProviderType, {
    tasks: number;
    successRate: number;
    averageResponseTime: number;
    totalTokens: number;
    totalCost: number;
  }>;

  /** 按任务类型统计 */
  byTaskType: Record<string, {
    tasks: number;
    successRate: number;
    averageResponseTime: number;
  }>;
}

/**
 * AI提示词模板
 */
export interface AiPromptTemplate {
  /** 模板ID */
  id: string;

  /** 模板名称 */
  name: string;

  /** 模板描述 */
  description: string;

  /** 模板内容 */
  template: string;

  /** 变量定义 */
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: any;
  }>;

  /** 模板标签 */
  tags: string[];

  /** 版本 */
  version: string;

  /** 创建者 */
  createdBy: string;

  /** 创建时间 */
  createdAt: Date;

  /** 更新时间 */
  updatedAt: Date;
}
