// 文件路径: apps/backend/apps/logic-agent/src/logic-agent.controller.ts (已更新错误处理)

import { Controller, Logger, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices'
import { LogicService } from './logic.service'
import type { GameActionJobData } from '@tuheg/common-backend'
import { z } from 'zod'
import * as Sentry from '@sentry/node'

// [新增] HTTP API 输入验证
const ProcessActionSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  gameId: z.string().min(1, '游戏ID不能为空'),
  action: z
    .object({
      type: z.string().min(1, '行动类型不能为空'),
      payload: z.any(), // 行动数据
    })
    .optional(),
})

type ProcessActionDto = z.infer<typeof ProcessActionSchema>

@Controller()
export class LogicAgentController {
  private readonly logger = new Logger(LogicAgentController.name)

  constructor(private readonly logicService: LogicService) {}

  // [新增] HTTP API: 直接处理游戏行动
  @Post('process-action')
  async processAction(@Body() dto: ProcessActionDto) {
    try {
      // 验证输入
      const validationResult = ProcessActionSchema.safeParse(dto)
      if (!validationResult.success) {
        throw new HttpException(
          {
            message: '输入验证失败',
            errors: validationResult.error.format(),
          },
          HttpStatus.BAD_REQUEST
        )
      }

      this.logger.log(`HTTP API: Processing action for game ${dto.gameId}, user ${dto.userId}`)

      // 构造游戏行动数据
      const gameActionData: GameActionJobData = {
        correlationId: crypto.randomUUID(),
        gameId: dto.gameId,
        userId: dto.userId,
        playerAction: dto.action || { type: 'unknown', payload: {} },
        gameStateSnapshot: {}, // HTTP API调用时需要从数据库获取
      }

      // 执行逻辑处理
      await this.logicService.processLogic(gameActionData)

      return {
        success: true,
        message: '游戏行动处理已开始',
        requestId: gameActionData.correlationId,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`HTTP API: Failed to process action for game ${dto.gameId}`, error)
      Sentry.captureException(error)

      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        {
          message: '游戏行动处理失败',
          error: error.message || '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // [新增] HTTP API: 获取逻辑处理状态
  @Post('logic-status')
  async getLogicStatus() {
    try {
      return {
        success: true,
        message: 'Logic Agent is running',
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

  @MessagePattern('PLAYER_ACTION_SUBMITTED')
  async handlePlayerAction(@Payload() data: GameActionJobData, @Ctx() context: RmqContext) {
    this.logger.log(`Received task for game: ${data.gameId}`)
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const MAX_RETRIES = 2

    try {
      await this.logicService.processLogic(data)
      // 任务处理成功，确认消息
      channel.ack(originalMsg)
      this.logger.log(`Successfully processed and ACKed task for game: ${data.gameId}`)
    } catch (error) {
      this.logger.error(`Failed to process logic task for game ${data.gameId}`, error)
      Sentry.captureException(error, { extra: { jobData: data } })

      // [核心改造] 实现延迟重试机制
      const retryCount = (originalMsg.properties.headers['x-death'] || []).length
      if (retryCount < MAX_RETRIES) {
        // 发送到重试队列，实现延迟重试（5秒后重新处理）
        this.logger.warn(
          `Logic task for game ${data.gameId} failed. Sending to retry queue (${retryCount + 1}/${MAX_RETRIES + 1})...`
        )
        channel.nack(originalMsg, false, false) // 触发死信路由到重试队列
      } else {
        // 达到最大重试次数，将消息发送到最终死信队列
        this.logger.error(
          `Logic task for game ${data.gameId} failed after ${MAX_RETRIES + 1} attempts. Sending to DLQ.`
        )
        // 手动发送到死信队列
        channel.publish('dlx', 'logic_queue_dead', originalMsg.content, {
          headers: { ...originalMsg.properties.headers, finalFailure: true },
        })
        channel.ack(originalMsg)
      }
    }
  }
}
