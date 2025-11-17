// 重新导出共享类型
export type {
  Game,
  Character,
  WorldBookEntry,
  GameAction,
  User,
  AiConfiguration,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams
} from '@tuheg/shared-types'

// 协作相关类型
export type { Collaborator, CollaborationSession, CollaborationMessage } from './collaboration'
