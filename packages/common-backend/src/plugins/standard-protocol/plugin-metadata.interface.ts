import { z } from 'zod'

/**
 * 元数据类型枚举
 */
export enum MetadataType {
  /** 字符串类型 */
  STRING = 'string',
  /** 数字类型 */
  NUMBER = 'number',
  /** 布尔类型 */
  BOOLEAN = 'boolean',
  /** 对象类型 */
  OBJECT = 'object',
  /** 数组类型 */
  ARRAY = 'array',
  /** 日期类型 */
  DATE = 'date',
  /** 版本类型 */
  VERSION = 'version',
  /** 标签类型 */
  TAGS = 'tags'
}

/**
 * 元数据字段定义
 */
export interface MetadataField {
  /** 字段名 */
  name: string
  /** 字段类型 */
  type: MetadataType
  /** 字段标题 */
  title?: string
  /** 字段描述 */
  description?: string
  /** 是否必需 */
  required?: boolean
  /** 默认值 */
  defaultValue?: any
  /** 验证规则 */
  validation?: z.ZodType<any>
  /** 字段选项（用于选择类型） */
  options?: Array<{
    label: string
    value: any
  }>
  /** 是否支持多值 */
  multiple?: boolean
  /** 字段顺序 */
  order?: number
}

/**
 * 元数据Schema定义
 */
export interface MetadataSchema {
  /** Schema ID */
  id: string
  /** Schema 名称 */
  name: string
  /** Schema 版本 */
  version: string
  /** Schema 描述 */
  description?: string
  /** 字段定义 */
  fields: MetadataField[]
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /** 插件ID */
  pluginId: string
  /** Schema ID */
  schemaId: string
  /** 元数据值 */
  values: Record<string, any>
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 版本号 */
  version: number
}

/**
 * 元数据管理系统接口
 */
export interface PluginMetadataManager {
  /** 注册元数据Schema */
  registerSchema(schema: Omit<MetadataSchema, 'createdAt' | 'updatedAt'>): Promise<void>

  /** 注销Schema */
  unregisterSchema(schemaId: string): Promise<void>

  /** 获取Schema */
  getSchema(schemaId: string): Promise<MetadataSchema | null>

  /** 列出所有Schema */
  listSchemas(): Promise<MetadataSchema[]>

  /** 验证元数据 */
  validateMetadata(schemaId: string, values: Record<string, any>): Promise<ValidationResult>

  /** 设置插件元数据 */
  setPluginMetadata(pluginId: string, schemaId: string, values: Record<string, any>): Promise<void>

  /** 获取插件元数据 */
  getPluginMetadata(pluginId: string, schemaId: string): Promise<PluginMetadata | null>

  /** 更新插件元数据 */
  updatePluginMetadata(pluginId: string, schemaId: string, values: Partial<Record<string, any>>): Promise<void>

  /** 删除插件元数据 */
  removePluginMetadata(pluginId: string, schemaId: string): Promise<void>

  /** 搜索插件元数据 */
  searchPluginMetadata(query: MetadataSearchQuery): Promise<MetadataSearchResult>

  /** 导出元数据 */
  exportMetadata(pluginIds?: string[]): Promise<MetadataExport>

  /** 导入元数据 */
  importMetadata(data: MetadataExport): Promise<void>

  /** 获取元数据统计 */
  getStats(): MetadataStats
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: Array<{
    field: string
    message: string
  }>
  /** 警告列表 */
  warnings: Array<{
    field: string
    message: string
  }>
}

/**
 * 元数据搜索查询
 */
export interface MetadataSearchQuery {
  /** Schema ID */
  schemaId?: string
  /** 字段查询 */
  fields?: Record<string, any>
  /** 插件ID列表 */
  pluginIds?: string[]
  /** 分页 */
  pagination?: {
    page: number
    limit: number
  }
  /** 排序 */
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
}

/**
 * 元数据搜索结果
 */
export interface MetadataSearchResult {
  /** 结果列表 */
  items: PluginMetadata[]
  /** 总数 */
  total: number
  /** 分页信息 */
  pagination: {
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * 元数据导出格式
 */
export interface MetadataExport {
  /** 导出版本 */
  version: string
  /** 导出时间 */
  exportedAt: Date
  /** Schema列表 */
  schemas: MetadataSchema[]
  /** 元数据列表 */
  metadata: PluginMetadata[]
}

/**
 * 元数据统计
 */
export interface MetadataStats {
  /** 总Schema数 */
  totalSchemas: number
  /** 总元数据记录数 */
  totalMetadata: number
  /** Schema使用统计 */
  schemaUsage: Record<string, number>
  /** 字段类型统计 */
  fieldTypeStats: Record<MetadataType, number>
  /** 存储大小（字节） */
  totalSize: number
}

/**
 * 预定义的插件元数据Schema
 */
export const PLUGIN_METADATA_SCHEMAS = {
  /** 基本信息Schema */
  BASIC_INFO: {
    id: 'basic-info',
    name: '基本信息',
    version: '1.0.0',
    description: '插件的基本信息元数据',
    fields: [
      {
        name: 'displayName',
        type: MetadataType.STRING,
        title: '显示名称',
        description: '插件的显示名称',
        required: true,
        order: 1
      },
      {
        name: 'description',
        type: MetadataType.STRING,
        title: '描述',
        description: '插件的详细描述',
        required: true,
        order: 2
      },
      {
        name: 'author',
        type: MetadataType.STRING,
        title: '作者',
        description: '插件作者',
        required: true,
        order: 3
      },
      {
        name: 'homepage',
        type: MetadataType.STRING,
        title: '主页',
        description: '插件主页URL',
        validation: z.string().url().optional(),
        order: 4
      },
      {
        name: 'repository',
        type: MetadataType.STRING,
        title: '代码仓库',
        description: '插件代码仓库URL',
        validation: z.string().url().optional(),
        order: 5
      },
      {
        name: 'license',
        type: MetadataType.STRING,
        title: '许可证',
        description: '插件许可证',
        order: 6
      },
      {
        name: 'tags',
        type: MetadataType.TAGS,
        title: '标签',
        description: '插件标签',
        multiple: true,
        order: 7
      }
    ]
  },

  /** AI能力Schema */
  AI_CAPABILITIES: {
    id: 'ai-capabilities',
    name: 'AI能力',
    version: '1.0.0',
    description: '插件提供的AI能力元数据',
    fields: [
      {
        name: 'supportedProviders',
        type: MetadataType.ARRAY,
        title: '支持的AI提供商',
        description: '插件支持的AI提供商列表',
        multiple: true,
        options: [
          { label: 'OpenAI', value: 'openai' },
          { label: 'Anthropic', value: 'anthropic' },
          { label: 'Google', value: 'google' },
          { label: 'DeepSeek', value: 'deepseek' },
          { label: '其他', value: 'other' }
        ],
        order: 1
      },
      {
        name: 'supportedModels',
        type: MetadataType.ARRAY,
        title: '支持的模型',
        description: '插件支持的AI模型列表',
        multiple: true,
        order: 2
      },
      {
        name: 'capabilities',
        type: MetadataType.ARRAY,
        title: '能力列表',
        description: '插件提供的AI能力',
        multiple: true,
        options: [
          { label: '文本生成', value: 'text-generation' },
          { label: '对话', value: 'conversation' },
          { label: '代码生成', value: 'code-generation' },
          { label: '图像生成', value: 'image-generation' },
          { label: '翻译', value: 'translation' },
          { label: '摘要', value: 'summarization' }
        ],
        order: 3
      },
      {
        name: 'maxTokens',
        type: MetadataType.NUMBER,
        title: '最大Token数',
        description: '插件支持的最大Token数',
        order: 4
      },
      {
        name: 'languages',
        type: MetadataType.ARRAY,
        title: '支持语言',
        description: '插件支持的语言列表',
        multiple: true,
        options: [
          { label: '中文', value: 'zh' },
          { label: '英文', value: 'en' },
          { label: '日文', value: 'ja' },
          { label: '韩文', value: 'ko' },
          { label: '其他', value: 'other' }
        ],
        order: 5
      }
    ]
  },

  /** 兼容性Schema */
  COMPATIBILITY: {
    id: 'compatibility',
    name: '兼容性',
    version: '1.0.0',
    description: '插件兼容性信息',
    fields: [
      {
        name: 'minVersion',
        type: MetadataType.VERSION,
        title: '最小版本',
        description: '插件运行所需的最小平台版本',
        required: true,
        order: 1
      },
      {
        name: 'maxVersion',
        type: MetadataType.VERSION,
        title: '最大版本',
        description: '插件兼容的最大平台版本',
        order: 2
      },
      {
        name: 'supportedPlatforms',
        type: MetadataType.ARRAY,
        title: '支持平台',
        description: '插件支持的平台',
        multiple: true,
        options: [
          { label: 'Windows', value: 'windows' },
          { label: 'macOS', value: 'macos' },
          { label: 'Linux', value: 'linux' },
          { label: 'Web', value: 'web' }
        ],
        order: 3
      },
      {
        name: 'dependencies',
        type: MetadataType.OBJECT,
        title: '依赖关系',
        description: '插件的依赖关系',
        order: 4
      },
      {
        name: 'conflicts',
        type: MetadataType.ARRAY,
        title: '冲突插件',
        description: '与此插件冲突的其他插件',
        multiple: true,
        order: 5
      }
    ]
  },

  /** 性能Schema */
  PERFORMANCE: {
    id: 'performance',
    name: '性能指标',
    version: '1.0.0',
    description: '插件性能相关元数据',
    fields: [
      {
        name: 'memoryUsage',
        type: MetadataType.NUMBER,
        title: '内存使用',
        description: '插件的平均内存使用量（MB）',
        order: 1
      },
      {
        name: 'cpuUsage',
        type: MetadataType.NUMBER,
        title: 'CPU使用率',
        description: '插件的CPU使用率（%）',
        order: 2
      },
      {
        name: 'loadTime',
        type: MetadataType.NUMBER,
        title: '加载时间',
        description: '插件的平均加载时间（毫秒）',
        order: 3
      },
      {
        name: 'responseTime',
        type: MetadataType.NUMBER,
        title: '响应时间',
        description: '插件的平均响应时间（毫秒）',
        order: 4
      },
      {
        name: 'throughput',
        type: MetadataType.NUMBER,
        title: '吞吐量',
        description: '插件每秒处理的请求数',
        order: 5
      }
    ]
  },

  /** 安全性Schema */
  SECURITY: {
    id: 'security',
    name: '安全性',
    version: '1.0.0',
    description: '插件安全性相关元数据',
    fields: [
      {
        name: 'permissions',
        type: MetadataType.ARRAY,
        title: '权限要求',
        description: '插件需要的权限列表',
        multiple: true,
        options: [
          { label: '网络访问', value: 'network' },
          { label: '文件系统', value: 'filesystem' },
          { label: '系统信息', value: 'system-info' },
          { label: '用户数据', value: 'user-data' },
          { label: '其他权限', value: 'other' }
        ],
        order: 1
      },
      {
        name: 'securityReview',
        type: MetadataType.BOOLEAN,
        title: '安全审查',
        description: '插件是否通过安全审查',
        order: 2
      },
      {
        name: 'auditLogs',
        type: MetadataType.BOOLEAN,
        title: '审计日志',
        description: '插件是否记录审计日志',
        order: 3
      },
      {
        name: 'dataEncryption',
        type: MetadataType.BOOLEAN,
        title: '数据加密',
        description: '插件是否加密敏感数据',
        order: 4
      },
      {
        name: 'lastSecurityReview',
        type: MetadataType.DATE,
        title: '最后安全审查',
        description: '最后进行安全审查的时间',
        order: 5
      }
    ]
  }
} as const
