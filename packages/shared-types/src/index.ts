// 文件路径: packages/shared-types/src/index.ts
// 核心理念: 类型共享包的入口文件

// API 类型
export * from './api/types'

// 游戏相关类型
export interface Game {
  id: string
  name: string
  ownerId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Character {
  id: string
  gameId: string
  name: string
  description: string
  stats?: Record<string, any>
  inventory?: any[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface WorldBookEntry {
  id: string
  gameId: string
  title: string
  content: string
  category?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface GameAction {
  type: string
  payload: Record<string, unknown>
}

// 用户相关类型
export interface User {
  id: string
  email: string
  name?: string
}

// 设置相关类型（示例）
export interface AiConfiguration {
  id: string
  provider: string
  modelId: string
  baseUrl?: string
}
