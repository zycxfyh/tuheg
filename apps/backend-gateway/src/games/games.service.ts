// 文件路径: apps/backend-gateway/src/games/games.service.ts

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Character, Game, WorldBookEntry } from '@prisma/client'

// [核心修正] 从 @tuheg/common-backend 导入所有需要的共享模块
import type {
  CacheService,
  CreateNarrativeGameDto,
  EventBusService,
  PrismaService,
  SubmitActionDto,
  UpdateCharacterDto,
} from '@tuheg/common-backend'

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * [新增] 获取游戏数据的缓存辅助方法
   * @param gameId 游戏ID
   * @param userId 用户ID（用于权限验证）
   * @returns 游戏数据
   */
  private async getGameWithCache(
    gameId: string,
    userId: string
  ): Promise<Game & { character: Character | null; worldBook: WorldBookEntry[] }> {
    const cacheKey = `game:${gameId}`

    // 先尝试从缓存获取
    const cachedGame = await this.cacheService.get<
      Game & { character: Character | null; worldBook: WorldBookEntry[] }
    >(cacheKey)
    if (cachedGame) {
      // 验证缓存中的数据权限
      if (cachedGame.ownerId !== userId) {
        throw new ForbiddenException("You don't have permission to access this game.")
      }
      return cachedGame
    }

    // 缓存未命中，从数据库查询
    const gameWithIncludes = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { character: true, worldBook: true },
    })

    if (!gameWithIncludes) {
      throw new NotFoundException(`Game with ID "${gameId}" not found.`)
    }

    // 缓存游戏数据（5分钟TTL）
    await this.cacheService.set(cacheKey, gameWithIncludes, { ttl: 300 })

    return gameWithIncludes
  }

  /**
   * [新增] 清除游戏缓存的方法
   * @param gameId 游戏ID
   */
  private async clearGameCache(gameId: string): Promise<void> {
    const cacheKey = `game:${gameId}`
    await this.cacheService.delete(cacheKey)
  }

  /**
   * @method createNarrativeDriven
   * @description [核心重构] 接收创世请求，并将其作为事件发布
   */
  public async createNarrativeDriven(
    userId: string,
    dto: CreateNarrativeGameDto
  ): Promise<{ message: string }> {
    // [核心] 发布一个“请求创建游戏”的事件
    this.eventBus.publish('GAME_CREATION_REQUESTED', {
      userId,
      concept: dto.concept,
    })

    // 立即向前端返回一个“任务已受理”的响应
    return {
      message: 'Game creation request has been accepted and is being processed.',
    }
  }

  /**
   * @method submitAction
   * @description 接收玩家行动，并将其作为事件发布到宇宙广播
   * [优化] 使用缓存减少数据库查询
   */
  public async submitAction(userId: string, gameId: string, dto: SubmitActionDto): Promise<void> {
    const gameWithIncludes = await this.getGameWithCache(gameId, userId)

    this.eventBus.publish('PLAYER_ACTION_SUBMITTED', {
      correlationId: crypto.randomUUID(),
      gameId: gameId,
      userId: userId,
      playerAction: dto,
      gameStateSnapshot: gameWithIncludes,
    })
  }

  // --- 以下为标准的CRUD方法 ---

  public async findOne(
    userId: string,
    gameId: string
  ): Promise<Game & { character: Character | null; worldBook: WorldBookEntry[] }> {
    // [优化] 使用缓存减少数据库查询
    return this.getGameWithCache(gameId, userId)
  }

  public async findAllForUser(
    userId: string
  ): Promise<{ id: string; name: string | null; updatedAt: Date }[]> {
    const cacheKey = `games:list:${userId}`

    // [优化] 先尝试从缓存获取用户游戏列表
    const cachedGames =
      await this.cacheService.get<{ id: string; name: string | null; updatedAt: Date }[]>(cacheKey)
    if (cachedGames) {
      return cachedGames
    }

    // 缓存未命中，从数据库查询
    const games = await this.prisma.game.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })

    // 缓存游戏列表（10分钟TTL，因为列表更新不频繁）
    await this.cacheService.set(cacheKey, games, { ttl: 600 })

    return games
  }

  public async delete(userId: string, gameId: string): Promise<{ message: string }> {
    const result = await this.prisma.game.deleteMany({
      where: { id: gameId, ownerId: userId },
    })

    if (result.count === 0) {
      throw new NotFoundException(
        `Game with ID "${gameId}" not found or you don't have permission to delete it.`
      )
    }

    // [优化] 删除游戏时清除相关缓存
    await this.clearGameCache(gameId)
    await this.cacheService.delete(`games:list:${userId}`)

    return { message: `Game with ID "${gameId}" deleted successfully.` }
  }

  public async updateCharacterState(
    userId: string,
    gameId: string,
    dto: UpdateCharacterDto
  ): Promise<Character> {
    // 首先验证用户是否拥有该游戏
    await this.findOne(userId, gameId)

    const updatedCharacter = await this.prisma.character.update({
      where: { gameId: gameId },
      data: dto,
    })

    // [优化] 更新角色状态时清除游戏缓存，确保后续查询获取最新数据
    await this.clearGameCache(gameId)

    return updatedCharacter
  }
}
