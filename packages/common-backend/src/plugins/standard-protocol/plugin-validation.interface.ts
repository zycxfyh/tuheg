import { z } from 'zod'

/**
 * 插件验证级别
 */
export enum ValidationLevel {
  /** 基本验证：检查必需字段 */
  BASIC = 'basic',
  /** 标准验证：检查类型和格式 */
  STANDARD = 'standard',
  /** 严格验证：深度验证所有内容 */
  STRICT = 'strict',
  /** 安全验证：重点检查安全风险 */
  SECURITY = 'security'
}

/**
 * 插件验证结果
 */
export interface PluginValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 验证级别 */
  level: ValidationLevel
  /** 错误列表 */
  errors: ValidationError[]
  /** 警告列表 */
  warnings: ValidationWarning[]
  /** 验证元数据 */
  metadata: {
    /** 验证时间 */
    validatedAt: Date
    /** 验证耗时（毫秒） */
    duration: number
    /** 验证器版本 */
    validatorVersion: string
  }
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误路径 */
  path: string[]
  /** 错误严重程度 */
  severity: 'error' | 'critical'
  /** 修复建议 */
  suggestion?: string
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string
  /** 警告消息 */
  message: string
  /** 警告路径 */
  path: string[]
  /** 建议修复 */
  suggestion?: string
}

/**
 * 插件验证器接口
 */
export interface PluginValidator {
  /** 验证插件清单 */
  validateManifest(manifest: any, level?: ValidationLevel): Promise<PluginValidationResult>

  /** 验证插件代码 */
  validateCode(code: string, manifest: any, level?: ValidationLevel): Promise<PluginValidationResult>

  /** 验证插件依赖 */
  validateDependencies(dependencies: Record<string, string>): Promise<PluginValidationResult>

  /** 验证插件配置 */
  validateConfig(config: any, configSchema?: any): Promise<PluginValidationResult>

  /** 获取支持的验证级别 */
  getSupportedLevels(): ValidationLevel[]

  /** 获取验证器信息 */
  getValidatorInfo(): {
    name: string
    version: string
    supportedLevels: ValidationLevel[]
  }
}

/**
 * 插件沙箱接口
 */
export interface PluginSandbox {
  /** 创建沙箱环境 */
  createSandbox(pluginId: string, options?: SandboxOptions): Promise<SandboxInstance>

  /** 销毁沙箱环境 */
  destroySandbox(pluginId: string): Promise<void>

  /** 执行代码在沙箱中 */
  executeInSandbox(pluginId: string, code: string, context?: any): Promise<any>

  /** 检查沙箱资源使用情况 */
  getSandboxStats(pluginId: string): Promise<SandboxStats>

  /** 限制沙箱资源 */
  setResourceLimits(pluginId: string, limits: ResourceLimits): Promise<void>
}

/**
 * 沙箱实例
 */
export interface SandboxInstance {
  /** 沙箱ID */
  id: string
  /** 插件ID */
  pluginId: string
  /** 创建时间 */
  createdAt: Date
  /** 状态 */
  status: 'active' | 'suspended' | 'destroyed'
  /** 资源限制 */
  limits: ResourceLimits
  /** 当前统计 */
  stats: SandboxStats
}

/**
 * 沙箱选项
 */
export interface SandboxOptions {
  /** 内存限制（字节） */
  memoryLimit?: number
  /** CPU时间限制（毫秒） */
  cpuTimeLimit?: number
  /** 网络访问权限 */
  networkAccess?: boolean
  /** 文件系统访问权限 */
  filesystemAccess?: boolean
  /** 环境变量 */
  environment?: Record<string, string>
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 资源限制
 */
export interface ResourceLimits {
  /** 最大内存使用（字节） */
  maxMemory: number
  /** 最大CPU时间（毫秒） */
  maxCpuTime: number
  /** 最大执行时间（毫秒） */
  maxExecutionTime: number
  /** 最大网络请求数 */
  maxNetworkRequests: number
  /** 最大文件系统操作数 */
  maxFilesystemOperations: number
  /** 允许的网络域 */
  allowedDomains?: string[]
  /** 允许的文件路径 */
  allowedPaths?: string[]
}

/**
 * 沙箱统计
 */
export interface SandboxStats {
  /** 内存使用（字节） */
  memoryUsed: number
  /** CPU时间使用（毫秒） */
  cpuTimeUsed: number
  /** 执行时间（毫秒） */
  executionTime: number
  /** 网络请求数 */
  networkRequests: number
  /** 文件系统操作数 */
  filesystemOperations: number
  /** 错误计数 */
  errorCount: number
  /** 最后活动时间 */
  lastActivity: Date
}

/**
 * 插件安全策略
 */
export interface PluginSecurityPolicy {
  /** 允许的API调用 */
  allowedApis: string[]
  /** 禁止的API调用 */
  forbiddenApis: string[]
  /** 允许的模块导入 */
  allowedImports: string[]
  /** 禁止的模块导入 */
  forbiddenImports: string[]
  /** 允许的网络访问模式 */
  networkPolicies: {
    /** 允许HTTP请求 */
    allowHttp: boolean
    /** 允许HTTPS请求 */
    allowHttps: boolean
    /** 允许WebSocket连接 */
    allowWebSocket: boolean
    /** 最大请求大小 */
    maxRequestSize: number
  }
  /** 文件系统策略 */
  filesystemPolicies: {
    /** 允许读取 */
    allowRead: boolean
    /** 允许写入 */
    allowWrite: boolean
    /** 允许执行 */
    allowExecute: boolean
    /** 根目录限制 */
    rootDirectory: string
  }
  /** 资源限制 */
  resourceLimits: ResourceLimits
}

/**
 * 插件清单验证Schema
 */
export const PluginManifestSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/),
  description: z.string().max(500).optional(),
  author: z.string().max(100).optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  contributes: z.record(z.any()).optional(),
  activationEvents: z.array(z.string()).optional(),
  main: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  engines: z.record(z.string()).optional(),
  os: z.array(z.string()).optional(),
  cpu: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * 插件贡献点验证Schema
 */
export const PluginContributionsSchema = z.object({
  aiProviders: z.array(z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    factory: z.function(),
    defaultConfig: z.record(z.any()).optional(),
    configSchema: z.any().optional()
  })).optional(),

  aiTools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    execute: z.function(),
    inputSchema: z.any().optional(),
    outputSchema: z.any().optional()
  })).optional(),

  commands: z.array(z.object({
    id: z.string(),
    title: z.string(),
    handler: z.function()
  })).optional(),

  views: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['tree', 'table', 'webview']),
    provider: z.function()
  })).optional(),

  themes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['light', 'dark', 'highContrast']),
    colors: z.record(z.string())
  })).optional()
})

/**
 * 插件依赖验证Schema
 */
export const PluginDependenciesSchema = z.record(
  z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/),
  z.string().regex(/^[\^~]?(\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?|\*\||\d+\.\d+\.\*|\d+\.\*\.\*|\*)$/)
)
