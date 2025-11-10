import {
  type Character,
  Game,
  GameConfiguration,
  type GameStatus,
  type GameType,
  type NarrativeComplexity,
  NarrativeConfiguration,
  type NarrativeStyle,
  Player,
} from '@tuheg/shared-types'
import type { Observable } from 'rxjs'

// ============================================================================
// 游戏领域接口 (Game Domain Interfaces)
// ============================================================================

/**
 * 游戏创建请求
 */
export interface GameCreationRequest {
  /** 用户提供的游戏概念描述 */
  concept: string
  /** 游戏类型偏好 */
  genre?: GameType
  /** 目标受众 */
  targetAudience?: string
  /** 游戏复杂度级别 */
  complexityLevel?: NarrativeComplexity
  /** 附加要求 */
  requirements?: string[]
}

/**
 * 游戏创建响应
 */
export interface GameCreationResponse {
  /** 游戏ID */
  gameId: string
  /** 生成的世界设定 */
  worldSetting: WorldSetting
  /** 初始角色列表 */
  characters: Character[]
  /** 初始场景 */
  initialScene: Scene
  /** 游戏规则 */
  rules: GameRules
  /** 创建状态 */
  status: GameStatus
  /** 进度百分比 (0-100) */
  progress: number
}

// ============================================================================
// 游戏领域模型 (Game Domain Models)
// ============================================================================

/**
 * 世界设定
 */
export interface WorldSetting {
  name: string
  description: string
  lore: string
  rules: string[]
  atmosphere: string
  locations: Location[]
}

/**
 * 位置信息
 */
export interface Location {
  id: string
  name: string
  description: string
  coordinates?: { x: number; y: number }
  type: string
}

/**
 * 游戏场景
 */
export interface Scene {
  id: string
  name: string
  description: string
  characters: string[]
  interactables: Interactable[]
  exits: Exit[]
}

/**
 * 可交互对象
 */
export interface Interactable {
  id: string
  name: string
  description: string
  interactionType: string
  interactionResult?: string
}

/**
 * 场景出口
 */
export interface Exit {
  id: string
  name: string
  targetSceneId: string
  description: string
  conditions?: string[]
}

/**
 * 游戏规则
 */
export interface GameRules {
  objectives: string[]
  winConditions: string[]
  loseConditions: string[]
  specialRules: string[]
  scoringCriteria?: string[]
}

// ============================================================================
// 游戏服务接口 (Game Service Interfaces)
// ============================================================================

/**
 * 游戏创建服务接口
 */
export interface IGameCreationService {
  /** 创建新游戏 */
  createGame(request: GameCreationRequest): Promise<GameCreationResponse>
  /** 流式创建游戏 */
  createGameStream(request: GameCreationRequest): Observable<GameCreationResponse>
  /** 获取创建状态 */
  getGameCreationStatus(gameId: string): Promise<GameCreationResponse>
  /** 取消创建 */
  cancelGameCreation(gameId: string): Promise<void>
}

/**
 * 游戏逻辑服务接口
 */
export interface IGameLogicService {
  /** 处理玩家行动 */
  processPlayerAction(action: PlayerAction): Promise<LogicProcessingResult>
  /** 验证行动 */
  validateAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<{ isValid: boolean; reason?: string }>
  /** 获取游戏状态 */
  getGameState(gameId: string): Promise<GameState>
  /** 更新游戏状态 */
  updateGameState(gameId: string, updates: Partial<GameState>): Promise<GameState>
}

/**
 * 游戏叙事服务接口
 */
export interface IGameNarrativeService {
  /** 生成叙事 */
  generateNarrative(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResponse>
  /** 流式生成叙事 */
  generateNarrativeStream(
    request: NarrativeGenerationRequest
  ): Observable<NarrativeGenerationResponse>
  /** 继续叙事 */
  continueNarrative(narrativeId: string, continuation: string): Promise<NarrativeGenerationResponse>
}

/**
 * 游戏管理服务接口
 */
export interface IGameManagementService {
  /** 保存游戏 */
  saveGame(gameState: GameState): Promise<void>
  /** 加载游戏 */
  loadGame(gameId: string): Promise<GameState>
  /** 删除游戏 */
  deleteGame(gameId: string): Promise<void>
  /** 获取玩家游戏列表 */
  getPlayerGames(playerId: string): Promise<GameState[]>
  /** 导出游戏 */
  exportGame(gameId: string): Promise<string>
}

// ============================================================================
// 游戏状态和行动 (Game State and Actions)
// ============================================================================

/**
 * 玩家行动
 */
export interface PlayerAction {
  actionId: string
  playerId: string
  gameId: string
  actionType: string
  target?: string
  parameters?: Record<string, unknown>
  timestamp: Date
}

/**
 * 游戏状态
 */
export interface GameState {
  gameId: string
  currentSceneId: string
  playerState: PlayerState
  progress: number
  statistics: GameStatistics
  lastUpdated: Date
}

/**
 * 玩家状态
 */
export interface PlayerState {
  playerId: string
  location: string
  inventory: InventoryItem[]
  attributes: Record<string, unknown>
  achievements: string[]
}

/**
 * 物品信息
 */
export interface InventoryItem {
  id: string
  name: string
  description: string
  quantity: number
  properties?: Record<string, unknown>
}

/**
 * 游戏统计
 */
export interface GameStatistics {
  startTime: Date
  duration: number
  actionsCount: number
  scenesExplored: number
  itemsCollected: number
  questsCompleted: number
}

// ============================================================================
// 逻辑推理和叙事生成 (Logic and Narrative)
// ============================================================================

/**
 * 逻辑推理结果
 */
export interface LogicProcessingResult {
  inferenceId: string
  originalAction: PlayerAction
  stateChanges: StateChange[]
  triggeredEvents: GameEvent[]
  confidence: number
  processingTime: number
}

/**
 * 状态变化
 */
export interface StateChange {
  changeType: string
  targetId: string
  property: string
  oldValue: unknown
  newValue: unknown
}

/**
 * 游戏事件
 */
export interface GameEvent {
  eventId: string
  eventType: string
  eventData: Record<string, unknown>
  priority: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 叙事生成请求
 */
export interface NarrativeGenerationRequest {
  gameId: string
  currentState: GameState
  logicResult: LogicProcessingResult
  style?: NarrativeStyle
  audience?: string
}

/**
 * 叙事生成响应
 */
export interface NarrativeGenerationResponse {
  narrativeId: string
  narrative: string
  narrativeType: string
  availableActions: PlayerActionOption[]
  mood?: string
  length: number
}

/**
 * 玩家行动选项
 */
export interface PlayerActionOption {
  optionId: string
  description: string
  optionType: string
  parameters?: Record<string, unknown>
  recommended?: boolean
}
