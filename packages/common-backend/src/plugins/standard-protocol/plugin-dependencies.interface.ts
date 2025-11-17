import { z } from 'zod'

/**
 * 依赖类型枚举
 */
export enum DependencyType {
  /** 插件依赖 */
  PLUGIN = 'plugin',
  /** 系统依赖 */
  SYSTEM = 'system',
  /** 运行时依赖 */
  RUNTIME = 'runtime',
  /** 可选依赖 */
  OPTIONAL = 'optional',
  /** 对等依赖 */
  PEER = 'peer'
}

/**
 * 版本约束类型
 */
export enum VersionConstraintType {
  /** 精确版本 */
  EXACT = 'exact',
  /** 范围版本 */
  RANGE = 'range',
  /** 兼容版本 */
  COMPATIBLE = 'compatible',
  /** 最新版本 */
  LATEST = 'latest'
}

/**
 * 插件依赖定义
 */
export interface PluginDependency {
  /** 依赖ID */
  id: string
  /** 依赖类型 */
  type: DependencyType
  /** 版本约束 */
  versionConstraint: string
  /** 版本约束类型 */
  constraintType: VersionConstraintType
  /** 是否必需 */
  required: boolean
  /** 描述 */
  description?: string
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 依赖关系图
 */
export interface DependencyGraph {
  /** 节点列表（插件ID） */
  nodes: string[]
  /** 边列表（依赖关系） */
  edges: Array<{
    from: string
    to: string
    type: DependencyType
    constraint: string
  }>
}

/**
 * 依赖解析结果
 */
export interface DependencyResolution {
  /** 是否成功解析 */
  resolved: boolean
  /** 解析的依赖列表 */
  resolvedDependencies: Array<{
    id: string
    version: string
    type: DependencyType
  }>
  /** 冲突列表 */
  conflicts: Array<{
    dependency: string
    conflictingVersions: string[]
    affectedPlugins: string[]
  }>
  /** 缺失的依赖 */
  missing: string[]
  /** 循环依赖 */
  cycles: string[][]
}

/**
 * 插件依赖管理器接口
 */
export interface PluginDependencyManager {
  /** 添加依赖 */
  addDependency(pluginId: string, dependency: Omit<PluginDependency, 'id'>): Promise<void>

  /** 移除依赖 */
  removeDependency(pluginId: string, dependencyId: string): Promise<void>

  /** 更新依赖 */
  updateDependency(pluginId: string, dependencyId: string, updates: Partial<PluginDependency>): Promise<void>

  /** 获取插件依赖 */
  getPluginDependencies(pluginId: string): Promise<PluginDependency[]>

  /** 解析依赖关系 */
  resolveDependencies(pluginIds: string[]): Promise<DependencyResolution>

  /** 构建依赖关系图 */
  buildDependencyGraph(pluginIds: string[]): Promise<DependencyGraph>

  /** 检查循环依赖 */
  detectCircularDependencies(pluginIds: string[]): Promise<string[][]>

  /** 验证依赖兼容性 */
  validateDependencyCompatibility(dependency: PluginDependency, availableVersions: string[]): Promise<boolean>

  /** 获取依赖统计 */
  getDependencyStats(): Promise<DependencyStats>

  /** 清理未使用的依赖 */
  cleanupUnusedDependencies(): Promise<void>
}

/**
 * 依赖统计
 */
export interface DependencyStats {
  /** 总依赖数 */
  totalDependencies: number
  /** 依赖类型分布 */
  typeDistribution: Record<DependencyType, number>
  /** 版本约束分布 */
  constraintDistribution: Record<VersionConstraintType, number>
  /** 循环依赖数量 */
  circularDependencies: number
  /** 未满足的依赖 */
  unsatisfiedDependencies: number
  /** 过时的依赖 */
  outdatedDependencies: number
}

/**
 * 依赖安装选项
 */
export interface DependencyInstallOptions {
  /** 是否强制安装 */
  force?: boolean
  /** 是否安装可选依赖 */
  installOptional?: boolean
  /** 是否安装开发依赖 */
  installDev?: boolean
  /** 是否安装对等依赖 */
  installPeer?: boolean
  /** 自定义安装源 */
  registry?: string
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 依赖安装结果
 */
export interface DependencyInstallResult {
  /** 是否成功 */
  success: boolean
  /** 安装的依赖 */
  installed: Array<{
    id: string
    version: string
    type: DependencyType
  }>
  /** 跳过的依赖 */
  skipped: Array<{
    id: string
    reason: string
  }>
  /** 失败的依赖 */
  failed: Array<{
    id: string
    error: string
  }>
  /** 警告信息 */
  warnings: string[]
}

/**
 * 依赖更新选项
 */
export interface DependencyUpdateOptions {
  /** 是否更新到最新版本 */
  updateToLatest?: boolean
  /** 是否更新主要版本 */
  allowMajorUpdates?: boolean
  /** 是否更新次要版本 */
  allowMinorUpdates?: boolean
  /** 是否更新补丁版本 */
  allowPatchUpdates?: boolean
  /** 要更新的特定依赖 */
  specificDependencies?: string[]
}

/**
 * 依赖更新结果
 */
export interface DependencyUpdateResult {
  /** 是否成功 */
  success: boolean
  /** 更新的依赖 */
  updated: Array<{
    id: string
    fromVersion: string
    toVersion: string
  }>
  /** 跳过的依赖 */
  skipped: Array<{
    id: string
    reason: string
  }>
  /** 失败的依赖 */
  failed: Array<{
    id: string
    error: string
  }>
}

/**
 * 依赖版本解析器
 */
export interface DependencyVersionResolver {
  /** 解析版本约束 */
  resolveVersionConstraint(constraint: string, constraintType: VersionConstraintType, availableVersions: string[]): string | null

  /** 检查版本兼容性 */
  checkVersionCompatibility(version1: string, version2: string, constraint: string): boolean

  /** 获取最新版本 */
  getLatestVersion(dependencyId: string): Promise<string | null>

  /** 获取版本范围 */
  getVersionRange(constraint: string, availableVersions: string[]): string[]

  /** 比较版本 */
  compareVersions(version1: string, version2: string): number
}

/**
 * 依赖Schema定义
 */
export const PluginDependencySchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/),
  type: z.nativeEnum(DependencyType),
  versionConstraint: z.string().min(1),
  constraintType: z.nativeEnum(VersionConstraintType),
  required: z.boolean().default(true),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const DependencyResolutionSchema = z.object({
  resolved: z.boolean(),
  resolvedDependencies: z.array(z.object({
    id: z.string(),
    version: z.string(),
    type: z.nativeEnum(DependencyType)
  })),
  conflicts: z.array(z.object({
    dependency: z.string(),
    conflictingVersions: z.array(z.string()),
    affectedPlugins: z.array(z.string())
  })),
  missing: z.array(z.string()),
  cycles: z.array(z.array(z.string()))
})

/**
 * 预定义的依赖关系检查规则
 */
export const DEPENDENCY_RULES = {
  /** 版本兼容性规则 */
  VERSION_COMPATIBILITY: {
    /** 主要版本不兼容 */
    MAJOR_INCOMPATIBLE: 'major_incompatible',
    /** 次要版本兼容 */
    MINOR_COMPATIBLE: 'minor_compatible',
    /** 补丁版本兼容 */
    PATCH_COMPATIBLE: 'patch_compatible'
  },

  /** 依赖类型规则 */
  TYPE_RULES: {
    /** 插件依赖只能依赖其他插件 */
    PLUGIN_ONLY_PLUGIN: 'plugin_only_plugin',
    /** 系统依赖不能被插件依赖 */
    SYSTEM_NOT_DEPENDABLE: 'system_not_dependable',
    /** 可选依赖不会阻止插件安装 */
    OPTIONAL_NON_BLOCKING: 'optional_non_blocking'
  },

  /** 循环依赖检测 */
  CIRCULAR_DEPENDENCY: {
    /** 直接循环依赖 */
    DIRECT_CYCLE: 'direct_cycle',
    /** 间接循环依赖 */
    INDIRECT_CYCLE: 'indirect_cycle',
    /** 深度限制 */
    MAX_DEPTH: 10
  }
} as const
