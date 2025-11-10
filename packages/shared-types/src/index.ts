// ============================================================================
// 创世星环 - 共享类型定义
// Creation Ring - Shared Types Definition
// ============================================================================

// API 相关类型
export * from './api/types'

// ============================================================================
// 基础类型定义 (Foundation Types)
// ============================================================================

/**
 * 通用标识符类型
 */
export type ID = string | number

/**
 * 时间戳类型
 */
export type Timestamp = string | Date | number

/**
 * 通用状态枚举
 */
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted',
}

// ============================================================================
// 实体基础类型 (Entity Base Types)
// ============================================================================

/**
 * 基础实体接口
 */
export interface BaseEntity {
  /** 唯一标识符 */
  id: ID
  /** 创建时间 */
  createdAt: Timestamp
  /** 更新时间 */
  updatedAt: Timestamp
  /** 状态 */
  status?: Status
}

/**
 * 可审计的实体接口
 */
export interface AuditableEntity extends BaseEntity {
  /** 创建者 */
  createdBy?: ID
  /** 更新者 */
  updatedBy?: ID
  /** 版本号 */
  version?: number
}

// ============================================================================
// 用户相关类型 (User Types)
// ============================================================================

/**
 * 用户基础信息
 */
export interface User extends BaseEntity {
  /** 邮箱地址 */
  email: string
  /** 用户名 */
  username?: string
  /** 显示名称 */
  displayName?: string
  /** 头像URL */
  avatar?: string
  /** 用户角色 */
  roles?: UserRole[]
  /** 用户偏好设置 */
  preferences?: UserPreferences
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  /** 语言 */
  language?: string
  /** 时区 */
  timezone?: string
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto'
  /** 通知设置 */
  notifications?: NotificationSettings
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  /** 邮件通知 */
  email?: boolean
  /** 推送通知 */
  push?: boolean
  /** 短信通知 */
  sms?: boolean
}

// ============================================================================
// 游戏相关类型 (Game Types)
// ============================================================================

/**
 * 游戏实体
 */
export interface Game extends AuditableEntity {
  /** 游戏名称 */
  name: string
  /** 游戏描述 */
  description?: string
  /** 游戏类型 */
  type: GameType
  /** 游戏配置 */
  configuration: GameConfiguration
  /** 游戏状态 */
  gameStatus: GameStatus
  /** 玩家列表 */
  players?: Player[]
  /** 当前回合 */
  currentTurn?: number
  /** 最大玩家数 */
  maxPlayers?: number
  /** 游戏标签 */
  tags?: string[]
}

/**
 * 游戏类型枚举
 */
export enum GameType {
  NARRATIVE_DRIVEN = 'narrative_driven',
  INTERACTIVE_STORY = 'interactive_story',
  ROLE_PLAYING = 'role_playing',
  ADVENTURE = 'adventure',
}

/**
 * 游戏状态枚举
 */
export enum GameStatus {
  CREATING = 'creating',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 游戏配置
 */
export interface GameConfiguration {
  /** AI 设置 */
  ai?: AiConfiguration
  /** 叙事设置 */
  narrative?: NarrativeConfiguration
  /** 游戏规则 */
  rules?: GameRules
  /** 自定义设置 */
  custom?: Record<string, unknown>
}

/**
 * 玩家信息
 */
export interface Player extends BaseEntity {
  /** 用户ID */
  userId: ID
  /** 玩家角色 */
  character?: Character
  /** 加入时间 */
  joinedAt: Timestamp
  /** 最后活动时间 */
  lastActiveAt?: Timestamp
  /** 玩家状态 */
  playerStatus: PlayerStatus
}

/**
 * 玩家状态枚举
 */
export enum PlayerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONNECTED = 'disconnected',
  BANNED = 'banned',
}

/**
 * 角色信息
 */
export interface Character {
  /** 角色ID */
  id: ID
  /** 角色名称 */
  name: string
  /** 角色描述 */
  description?: string
  /** 角色属性 */
  attributes?: Record<string, unknown>
  /** 角色头像 */
  avatar?: string
}

// ============================================================================
// AI相关类型 (AI Types)
// ============================================================================

/**
 * AI配置
 */
export interface AiConfiguration {
  /** 提供商 */
  provider: AiProvider
  /** 模型ID */
  modelId: string
  /** API密钥 */
  apiKey?: string
  /** 基础URL */
  baseUrl?: string
  /** 温度参数 */
  temperature?: number
  /** 最大token数 */
  maxTokens?: number
  /** 其他配置 */
  options?: Record<string, unknown>
}

/**
 * AI提供商枚举
 */
export enum AiProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  DEEPSEEK = 'deepseek',
  CUSTOM = 'custom',
}

/**
 * 游戏规则
 */
export interface GameRules {
  /** 最大回合数 */
  maxTurns?: number
  /** 时间限制 */
  timeLimit?: number
  /** 规则描述 */
  description?: string
  /** 自定义规则 */
  customRules?: Record<string, unknown>
}

/**
 * 叙事配置
 */
export interface NarrativeConfiguration {
  /** 叙事风格 */
  style?: NarrativeStyle
  /** 复杂度级别 */
  complexity?: NarrativeComplexity
  /** 主题标签 */
  themes?: string[]
  /** 自定义配置 */
  custom?: Record<string, unknown>
}

/**
 * 叙事风格枚举
 */
export enum NarrativeStyle {
  FANTASY = 'fantasy',
  SCI_FI = 'sci_fi',
  MODERN = 'modern',
  HISTORICAL = 'historical',
  CUSTOM = 'custom',
}

/**
 * 叙事复杂度枚举
 */
export enum NarrativeComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  ADVANCED = 'advanced',
}

// ============================================================================
// 事件相关类型 (Event Types)
// ============================================================================

/**
 * 基础事件接口
 */
export interface BaseEvent {
  /** 事件ID */
  eventId: ID
  /** 事件类型 */
  eventType: string
  /** 事件时间 */
  timestamp: Timestamp
  /** 事件源 */
  source: string
  /** 事件版本 */
  version?: string
}

/**
 * 游戏事件
 */
export interface GameEvent extends BaseEvent {
  /** 游戏ID */
  gameId: ID
  /** 玩家ID */
  playerId?: ID
  /** 事件数据 */
  data: Record<string, unknown>
}

// ============================================================================
// 工具类型 (Utility Types)
// ============================================================================

/**
 * 可选属性类型
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 非空类型
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * API响应数据类型
 */
export type ApiData<T> = T extends { data: infer D } ? D : T

/**
 * 分页查询参数
 */
export interface QueryParams extends PaginationParams {
  /** 搜索关键词 */
  search?: string
  /** 过滤条件 */
  filters?: Record<string, unknown>
  /** 包含关联数据 */
  includes?: string[]
}

/**
 * 排序选项
 */
export interface SortOption {
  /** 排序字段 */
  field: string
  /** 排序方向 */
  order: 'asc' | 'desc'
}
