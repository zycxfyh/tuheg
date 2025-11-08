import { Controller, Logger, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices'
import { NarrativeService } from './narrative.service'
import type { LogicCompletePayload } from '@tuheg/common-backend'
import { z } from 'zod'
import * as Sentry from '@sentry/node'

// [新增] HTTP API 输入验证
const GenerateNarrativeSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  gameId: z.string().min(1, '游戏ID不能为空'),
  context: z
    .object({
      previousEvents: z.array(z.any()).optional(),
      characterState: z.any().optional(),
      worldState: z.any().optional(),
    })
    .optional(),
})

type GenerateNarrativeDto = z.infer<typeof GenerateNarrativeSchema>

@Controller()
export class NarrativeAgentController {
  private readonly logger = new Logger(NarrativeAgentController.name)

  constructor(private readonly narrativeService: NarrativeService) {}

  // [新增] HTTP API: 直接生成叙事内容
  @Post('generate-narrative')
  async generateNarrative(@Body() dto: GenerateNarrativeDto) {
    try {
      // 验证输入
      const validationResult = GenerateNarrativeSchema.safeParse(dto)
      if (!validationResult.success) {
        throw new HttpException(
          {
            message: '输入验证失败',
            errors: validationResult.error.format(),
          },
          HttpStatus.BAD_REQUEST
        )
      }

      this.logger.log(`HTTP API: Generating narrative for game ${dto.gameId}, user ${dto.userId}`)

      // 构造叙事任务数据
      const narrativePayload: LogicCompletePayload = {
        gameId: dto.gameId,
        userId: dto.userId,
        progression: {
          directives: [], // HTTP API调用时需要从数据库或缓存获取
          narrative: '', // 将由服务生成
          options: [], // 将由服务生成
        },
      }

      // 执行叙事生成
      await this.narrativeService.processNarrative(narrativePayload)

      return {
        success: true,
        message: '叙事内容生成已开始',
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`HTTP API: Failed to generate narrative for game ${dto.gameId}`, error)
      Sentry.captureException(error)

      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        {
          message: '叙事内容生成失败',
          error: error.message || '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // [新增] HTTP API: 获取叙事生成状态
  @Post('narrative-status')
  async getNarrativeStatus() {
    try {
      return {
        success: true,
        message: 'Narrative Agent is running',
        status: 'ready',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          message: '获取状态失败',
          error: error.message || '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // [核心] 监听由 logic-agent 发出的"逻辑已完成"信号
  @MessagePattern('LOGIC_PROCESSING_COMPLETE')
  async handleLogicComplete(@Payload() data: LogicCompletePayload, @Ctx() context: RmqContext) {
    this.logger.log(`Received narrative task for game: ${data.gameId}`)
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const MAX_RETRIES = 2

    try {
      // [核心] 将任务交给“大脑”（NarrativeService）处理
      await this.narrativeService.processNarrative(data)
      channel.ack(originalMsg)
      this.logger.log(`Successfully processed narrative task for game: ${data.gameId}`)
    } catch (error) {
      this.logger.error(`Failed to process narrative task for game ${data.gameId}`, error)
      Sentry.captureException(error, { extra: { jobData: data } })

      // [核心改造] 实现延迟重试机制
      const retryCount = (originalMsg.properties.headers['x-death'] || []).length
      if (retryCount < MAX_RETRIES) {
        // 发送到重试队列，实现延迟重试（5秒后重新处理）
        this.logger.warn(
          `Narrative task for game ${data.gameId} failed. Sending to retry queue (${retryCount + 1}/${MAX_RETRIES + 1})...`
        )
        channel.nack(originalMsg, false, false) // 触发死信路由到重试队列
      } else {
        // [核心修复] 达到最大重试次数前，确保用户收到失败通知
        try {
          await this.narrativeService.notifyNarrativeFailure(data.userId, data.gameId, error)
        } catch (notifyError) {
          this.logger.error(
            `Failed to notify user ${data.userId} of narrative failure for game ${data.gameId}`,
            notifyError
          )
        }

        // 达到最大重试次数，将消息发送到最终死信队列
        this.logger.error(
          `Narrative task for game ${data.gameId} failed after ${MAX_RETRIES + 1} attempts. Sending to DLQ.`
        )
        // 手动发送到死信队列
        channel.publish('dlx', 'narrative_queue_dead', originalMsg.content, {
          headers: { ...originalMsg.properties.headers, finalFailure: true },
        })
        channel.ack(originalMsg)
      }
    }
  }
}
