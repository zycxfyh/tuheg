// Infrastructure types for queue messaging

import type { Character, Game, WorldBookEntry } from '@prisma/client'

// Define SubmitActionDto locally to avoid circular dependency
export interface SubmitActionDto {
  type: string
  target?: string
  content?: string
  [key: string]: any
}

/**
 * @name GameActionJobData
 * @description "玩家行动包裹"的格式。
 * 这是从 主网关 -> 逻辑智能体 的事件载荷。
 */
export interface GameActionJobData {
  gameId: string
  userId: string
  playerAction: SubmitActionDto
  gameStateSnapshot: Game & {
    character: Character | null
    worldBook: WorldBookEntry[]
  }
  correlationId?: string
}

/**
 * @name LogicCompletePayload
 * @description "逻辑完成包裹"的格式。
 * 这是从 逻辑智能体 -> 叙事智能体 的事件载荷。
 */
export interface LogicCompletePayload {
  gameId: string
  userId: string
  playerAction: SubmitActionDto
}
