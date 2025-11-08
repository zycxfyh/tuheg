import {
  Game,
  CreateGameRequest,
  UpdateGameRequest,
  SubmitActionRequest,
  ActionResponse,
  ApiResponse,
} from './types.js'
import { VCPToolBoxClient } from './client.js'

/**
 * Game Management Module
 * 游戏管理模块
 */
export class GameManager {
  constructor(private client: VCPToolBoxClient) {}

  /**
   * 获取所有游戏
   */
  async getGames(params?: {
    status?: string
    ownerId?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<Game[]>> {
    return this.client.get<Game[]>('/games', params)
  }

  /**
   * 获取单个游戏
   */
  async getGame(gameId: string): Promise<ApiResponse<Game>> {
    return this.client.get<Game>(`/games/${gameId}`)
  }

  /**
   * 创建新游戏
   */
  async createGame(request: CreateGameRequest): Promise<ApiResponse<Game>> {
    const response = await this.client.post<Game>('/games', request)
    this.client.emit('gameCreated', response.data)
    return response
  }

  /**
   * 更新游戏
   */
  async updateGame(gameId: string, request: UpdateGameRequest): Promise<ApiResponse<Game>> {
    const response = await this.client.put<Game>(`/games/${gameId}`, request)
    this.client.emit('gameUpdated', response.data)
    return response
  }

  /**
   * 删除游戏
   */
  async deleteGame(gameId: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/games/${gameId}`)
  }

  /**
   * 提交游戏动作
   */
  async submitAction(request: SubmitActionRequest): Promise<ApiResponse<ActionResponse>> {
    const response = await this.client.post<ActionResponse>('/games/actions', request)
    this.client.emit('actionSubmitted', response.data)
    return response
  }

  /**
   * 获取游戏历史动作
   */
  async getGameActions(
    gameId: string,
    params?: {
      limit?: number
      offset?: number
      type?: string
    }
  ): Promise<ApiResponse<any[]>> {
    return this.client.get(`/games/${gameId}/actions`, params)
  }

  /**
   * 获取游戏状态
   */
  async getGameState(gameId: string): Promise<ApiResponse<any>> {
    return this.client.get(`/games/${gameId}/state`)
  }

  /**
   * 重置游戏状态
   */
  async resetGame(gameId: string): Promise<ApiResponse<Game>> {
    const response = await this.client.post<Game>(`/games/${gameId}/reset`)
    this.client.emit('gameUpdated', response.data)
    return response
  }

  /**
   * 导出游戏数据
   */
  async exportGame(gameId: string, format: 'json' | 'yaml' = 'json'): Promise<ApiResponse<any>> {
    return this.client.get(`/games/${gameId}/export`, { format })
  }

  /**
   * 导入游戏数据
   */
  async importGame(data: any): Promise<ApiResponse<Game>> {
    const response = await this.client.post<Game>('/games/import', data)
    this.client.emit('gameCreated', response.data)
    return response
  }

  /**
   * 复制游戏
   */
  async duplicateGame(gameId: string, name?: string): Promise<ApiResponse<Game>> {
    const response = await this.client.post<Game>(`/games/${gameId}/duplicate`, { name })
    this.client.emit('gameCreated', response.data)
    return response
  }

  /**
   * 获取游戏统计信息
   */
  async getGameStats(gameId: string): Promise<ApiResponse<any>> {
    return this.client.get(`/games/${gameId}/stats`)
  }

  /**
   * 分享游戏
   */
  async shareGame(
    gameId: string,
    settings: {
      isPublic?: boolean
      allowCopy?: boolean
      requireAuth?: boolean
    }
  ): Promise<ApiResponse<Game>> {
    const response = await this.client.put<Game>(`/games/${gameId}/share`, settings)
    this.client.emit('gameUpdated', response.data)
    return response
  }
}
