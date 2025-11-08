export * from './api/types'
export interface Game {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
export interface GameAction {
  type: string
  payload: Record<string, unknown>
}
export interface User {
  id: string
  email: string
  name?: string
}
export interface AiConfiguration {
  id: string
  provider: string
  modelId: string
  baseUrl?: string
}
//# sourceMappingURL=index.d.ts.map
