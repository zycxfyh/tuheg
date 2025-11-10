// 文件路径: apps/creation-agent/src/creation.service.ts (已修复 unknown 类型)

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import type { Prisma, User } from '@prisma/client'
import {
  AiGenerationException,
  callAiWithGuard,
  type DynamicAiSchedulerService,
  PromptInjectionGuard,
  PromptManagerService,
} from '@tuheg/ai-domain'
import { getErrorMessage, getErrorStack, type EventBusService, type PrismaService } from '@tuheg/infrastructure'
import { z } from 'zod'

interface GameCreationPayload {
  userId: string
  concept: string
}

interface SagaContext {
  gameId?: string
  characterId?: string
  worldBookEntryIds?: string[]
  sagaId: string
  step: 'generating' | 'persisting' | 'completed' | 'failed'
}

const architectResponseSchema = z.object({
  gameName: z.string().describe('一个富有想象力的游戏名称'),
  character: z.object({
    name: z.string().describe('角色的名字'),
    card: z.object({
      coreIdentity: z.string().describe('角色的核心身份或概念'),
      personality: z.array(z.string()).describe('描述角色性格的关键词列表'),
      appearance: z.string().describe('角色的外貌描述'),
    }),
  }),
  worldBook: z.array(
    z.object({
      key: z.string().describe('世界书条目的唯一关键字'),
      content: z.object({
        description: z.string().describe('该条目的详细描述'),
      }),
    })
  ),
})
type ArchitectResponse = z.infer<typeof architectResponseSchema>

@Injectable()
export class CreationService {
  private readonly logger = new Logger(CreationService.name)

  constructor(
    private readonly scheduler: DynamicAiSchedulerService,
    private readonly prisma: PrismaService,
    private readonly promptManager: PromptManagerService,
    private readonly eventBus: EventBusService,
    private readonly promptInjectionGuard: PromptInjectionGuard
  ) {}

  public async createNewWorld(payload: GameCreationPayload): Promise<void> {
    const { userId, concept } = payload
    const sagaId = `creation-${userId}-${Date.now()}`
    this.logger.log(`Starting world creation saga ${sagaId} for user ${userId}`)

    const sagaContext: SagaContext = {
      sagaId,
      step: 'generating',
    }

    try {
      // Step 1: AI Generation (with compensation: none needed, just log)
      sagaContext.step = 'generating'
      await this.promptInjectionGuard.ensureSafeOrThrow(concept, { userId })
      const initialWorld = await this.generateInitialWorld(concept, { id: userId } as User)
      this.logger.log(`AI has generated initial world: "${initialWorld.gameName}"`)

      // Step 2: Database Persistence (with compensation: cleanup created entities)
      sagaContext.step = 'persisting'
      const result = await this.executeGameCreationSaga(initialWorld, userId, sagaContext)

      sagaContext.step = 'completed'
      this.logger.log(
        `Game creation saga ${sagaId} completed successfully with game ID ${result.game.id}`
      )

      // Step 3: Success notification
      await this.eventBus.publish('NOTIFY_USER', {
        userId: userId,
        event: 'creation_completed',
        data: {
          message: `New world "${result.game.name}" created successfully.`,
          gameId: result.game.id,
          sagaId,
        },
      })
    } catch (error: unknown) {
      sagaContext.step = 'failed'

      // Execute compensation actions based on saga context
      await this.executeSagaCompensation(sagaContext, userId)

      const errorMessage = getErrorMessage(error, 'An unknown error occurred during world creation')
      this.logger.error(
        `Game creation saga ${sagaId} failed for user ${userId}: ${errorMessage}`,
        getErrorStack(error),
        error instanceof AiGenerationException ? error.details : undefined
      )

      try {
        await this.eventBus.publish('NOTIFY_USER', {
          userId: userId,
          event: 'creation_failed',
          data: {
            message: 'Failed to create new world.',
            error: errorMessage,
            sagaId,
          },
        })
      } catch (eventBusError) {
        this.logger.error(
          `CRITICAL: Failed to send creation failure notification for saga ${sagaId}`,
          eventBusError
        )
      }

      throw error
    }
  }

  /**
   * 专门用于在所有重试都失败后的最终失败通知
   * 这个方法确保即使消息被发送到DLQ，用户也能收到失败通知
   */
  public async notifyCreationFailure(userId: string, error: unknown): Promise<void> {
    const errorMessage = getErrorMessage(error, 'An unknown error occurred during world creation')

    try {
      await this.eventBus.publish('NOTIFY_USER', {
        userId: userId,
        event: 'creation_failed',
        data: {
          message: 'Failed to create new world after all retry attempts.',
          error: errorMessage,
          finalFailure: true, // 标记这是最终失败，不再重试
        },
      })
      this.logger.log(`Sent final creation failure notification to user ${userId}`)
    } catch (eventBusError) {
      this.logger.error(
        `CRITICAL: Failed to send final creation failure notification to user ${userId}`,
        eventBusError
      )
    }
  }

  /**
   * Execute the game creation saga with proper transaction management
   */
  private async executeGameCreationSaga(
    initialWorld: ArchitectResponse,
    userId: string,
    sagaContext: SagaContext
  ): Promise<{ game: { id: string; name: string } }> {
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create game entity
      const game = await tx.game.create({
        data: {
          name: initialWorld.gameName,
          ownerId: userId,
        },
      })
      sagaContext.gameId = game.id

      // Create character entity
      const character = await tx.character.create({
        data: {
          gameId: game.id,
          name: initialWorld.character.name,
          card: initialWorld.character.card,
        },
      })
      sagaContext.characterId = character.id

      // Create world book entries if any
      if (initialWorld.worldBook?.length > 0) {
        const worldBookEntries = await tx.worldBookEntry.createManyAndReturn({
          data: initialWorld.worldBook.map((entry) => ({
            gameId: game.id,
            key: entry.key,
            content: entry.content,
          })),
        })
        sagaContext.worldBookEntryIds = worldBookEntries.map((entry) => entry.id)
      }

      return { game: { id: game.id, name: game.name } }
    })
  }

  /**
   * Execute compensation actions for failed saga steps
   */
  private async executeSagaCompensation(sagaContext: SagaContext, _userId: string): Promise<void> {
    try {
      this.logger.log(
        `Executing compensation for saga ${sagaContext.sagaId}, step: ${sagaContext.step}`
      )

      // Compensation logic based on saga step and created entities
      if (sagaContext.step === 'persisting' || sagaContext.step === 'completed') {
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Clean up world book entries
          if (sagaContext.worldBookEntryIds?.length) {
            await tx.worldBookEntry.deleteMany({
              where: { id: { in: sagaContext.worldBookEntryIds } },
            })
            this.logger.log(
              `Cleaned up ${sagaContext.worldBookEntryIds.length} world book entries for saga ${sagaContext.sagaId}`
            )
          }

          // Clean up character
          if (sagaContext.characterId) {
            await tx.character.delete({
              where: { id: sagaContext.characterId },
            })
            this.logger.log(
              `Cleaned up character ${sagaContext.characterId} for saga ${sagaContext.sagaId}`
            )
          }

          // Clean up game
          if (sagaContext.gameId) {
            await tx.game.delete({
              where: { id: sagaContext.gameId },
            })
            this.logger.log(`Cleaned up game ${sagaContext.gameId} for saga ${sagaContext.sagaId}`)
          }
        })

        this.logger.log(`Compensation completed for saga ${sagaContext.sagaId}`)
      } else {
        this.logger.log(
          `No compensation needed for saga ${sagaContext.sagaId} at step ${sagaContext.step}`
        )
      }
    } catch (compensationError) {
      this.logger.error(
        `CRITICAL: Compensation failed for saga ${sagaContext.sagaId}`,
        compensationError instanceof Error ? compensationError.stack : compensationError
      )
      // Don't throw compensation errors as they would mask the original error
    }
  }

  private async generateInitialWorld(concept: string, user: User): Promise<ArchitectResponse> {
    const provider = await this.scheduler.getProviderForRole(user, 'narrative_synthesis')
    const systemPrompt = this.promptManager.getPrompt('00_persona_and_framework.md')

    // 构造完整的提示文本
    const prompt = `${systemPrompt}\n# 创世任务指令\n根据以下用户概念，为一次新的游戏人生生成初始设定。\n请返回JSON格式的响应，包含worldName、worldDescription、characterName、characterDescription、initialScene字段。\n---\n用户概念: "${concept}"`

    try {
      const response = await callAiWithGuard(
        provider,
        prompt,
        architectResponseSchema,
        60000 // 60秒超时，创建世界任务较复杂
      )
      return response
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Unknown AI error')
      this.logger.error(
        `AI generation failed inside generateInitialWorld: ${errorMessage}`,
        getErrorStack(error)
      )
      throw new InternalServerErrorException(`AI failed to generate initial world: ${errorMessage}`)
    }
  }
}
