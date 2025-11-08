// VCPToolBox SDK 类型定义

// 重新导出核心框架类型
export type {
  VCPPlugin,
  PluginType,
  PluginContext,
  PluginCompatibility,
  PluginCapabilities,
  VCPProtocolAPI,
  VCPToolRequest,
  VCPToolResponse,
  VCPMemoryEntry,
  VCPFileHandle,
  VCPFile,
  VCPFileQuery,
  VCPAsyncTask,
  VCPAsyncTaskStatus,
  PluginAPI,
  PluginConfig,
  PluginEvents,
  PluginStorage,
  PluginUI,
  PluginLogger
} from '../PluginFramework'

// SDK特有的类型定义

// 插件项目配置
export interface PluginProjectConfig {
  name: string
  version: string
  description: string
  author: string
  license: string
  repository?: string
  homepage?: string
  keywords: string[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  vcptoolbox: {
    type: PluginType
    compatibility: PluginCompatibility
    capabilities: PluginCapabilities
  }
}

// 创建插件选项
export interface CreatePluginOptions {
  type: PluginType
  name: string
  description?: string
  author?: string
  license?: string
  template?: string
  typescript?: boolean
  tests?: boolean
  docs?: boolean
}

// 构建选项
export interface BuildOptions {
  minify?: boolean
  sourcemap?: boolean
  target?: 'es2015' | 'es2017' | 'es2019' | 'es2020'
  format?: 'esm' | 'cjs' | 'iife'
  outDir?: string
  watch?: boolean
}

// 测试选项
export interface TestOptions {
  unit?: boolean
  integration?: boolean
  e2e?: boolean
  coverage?: boolean
  watch?: boolean
  verbose?: boolean
}

// 发布选项
export interface PublishOptions {
  registry?: string
  tag?: string
  access?: 'public' | 'restricted'
  dryRun?: boolean
  force?: boolean
}

// 验证结果
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// 验证错误
export interface ValidationError {
  code: string
  message: string
  file?: string
  line?: number
  column?: number
  severity: 'error' | 'warning'
}

// 验证警告
export interface ValidationWarning {
  code: string
  message: string
  suggestion?: string
}

// 插件市场信息
export interface MarketInfo {
  name: string
  version: string
  downloads: number
  rating: number
  reviews: number
  lastUpdated: Date
  compatibleVersions: string[]
}

// 下载统计
export interface DownloadStats {
  total: number
  last24h: number
  last7d: number
  last30d: number
  versions: Record<string, number>
}

// 插件依赖关系
export interface PluginDependency {
  name: string
  version: string
  required: boolean
  description?: string
}

// 插件元数据
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  license: string
  repository?: string
  homepage?: string
  keywords: string[]
  type: PluginType
  compatibility: PluginCompatibility
  capabilities: PluginCapabilities
  dependencies: PluginDependency[]
  marketInfo?: MarketInfo
  downloadStats?: DownloadStats
  createdAt: Date
  updatedAt: Date
}

// CLI命令结果
export interface CLIResult {
  success: boolean
  message: string
  data?: any
  error?: Error
}

// 模板信息
export interface TemplateInfo {
  name: string
  description: string
  type: PluginType
  features: string[]
  files: string[]
  dependencies: string[]
}

// 开发服务器选项
export interface DevServerOptions {
  port?: number
  host?: string
  open?: boolean
  hot?: boolean
  cors?: boolean
  proxy?: Record<string, string>
}

// 调试信息
export interface DebugInfo {
  version: string
  platform: string
  nodeVersion: string
  npmVersion?: string
  yarnVersion?: string
  pnpmVersion?: string
  plugins: PluginMetadata[]
  config: Record<string, any>
}

// 错误报告
export interface ErrorReport {
  id: string
  timestamp: Date
  error: Error
  context: {
    command?: string
    plugin?: string
    version?: string
    platform: string
    stack: string
  }
  userInfo?: {
    anonymous: boolean
    userId?: string
  }
}

// 性能指标
export interface PerformanceMetrics {
  loadTime: number
  memoryUsage: number
  cpuUsage: number
  networkRequests: number
  errors: number
  warnings: number
}

// 分析报告
export interface AnalysisReport {
  plugin: PluginMetadata
  metrics: PerformanceMetrics
  recommendations: string[]
  issues: ValidationError[]
  score: number
}

// 社区信息
export interface CommunityInfo {
  stars: number
  forks: number
  issues: number
  contributors: number
  lastCommit: Date
  activity: {
    commits: number
    releases: number
    discussions: number
  }
}

// 更新信息
export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  changelog?: string
  breaking: boolean
  recommended: boolean
}

// 备份信息
export interface BackupInfo {
  id: string
  timestamp: Date
  size: number
  files: number
  checksum: string
  location: string
}

// 恢复选项
export interface RestoreOptions {
  id: string
  targetDir?: string
  overwrite?: boolean
  dryRun?: boolean
}

// 迁移信息
export interface MigrationInfo {
  fromVersion: string
  toVersion: string
  changes: {
    breaking: string[]
    features: string[]
    fixes: string[]
    deprecated: string[]
  }
  migrationGuide?: string
  autoMigrate: boolean
}

// 安全审计结果
export interface SecurityAuditResult {
  passed: boolean
  score: number
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  recommendations: string[]
  report: string
}
