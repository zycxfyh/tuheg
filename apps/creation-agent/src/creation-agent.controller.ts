// 文件路径: apps/creation-agent/src/creation-agent.controller.ts

import { Body, Controller, HttpException, HttpStatus, Logger, Post } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, type RmqContext } from '@nestjs/microservices'
import { getErrorMessage } from '@tuheg/infrastructure'
import { z } from 'zod'
import type { CreationService } from './creation.service'

// [核心] 定义创世任务的数据结构
interface GameCreationPayload {
  userId: string
  // [注释] 'concept' 是从前端 CreateNarrativeGameDto 传递过来的
  concept: string
}

// [新增] HTTP API 输入验证
const CreateWorldSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  concept: z
    .string()
    .min(10, '世界概念描述至少需要10个字符')
    .max(1000, '世界概念描述不能超过1000个字符'),
})

type CreateWorldDto = z.infer<typeof CreateWorldSchema>

@Controller()
export class CreationAgentController {
  private readonly logger = new Logger(CreationAgentController.name)

  constructor(private readonly creationService: CreationService) {}

  // [新增] HTTP API: 直接创建世界
  @Post('create-world')
  async createWorld(@Body() dto: CreateWorldDto) {
    try {
      this.validateCreateWorldInput(dto)
      this.logger.log(`HTTP API: Creating world for user ${dto.userId}`)

      const result = await this.creationService.createNewWorld(dto)
      return this.buildSuccessResponse(result)
    } catch (error) {
      this.handleCreateWorldError(error, dto.userId)
    }
  }

  /**
   * 验证创建世界的输入参数
   */
  private validateCreateWorldInput(dto: CreateWorldDto): void {
    const validationResult = CreateWorldSchema.safeParse(dto)
    if (!validationResult.success) {
      throw new HttpException(
        {
          message: '输入验证失败',
          errors: validationResult.error.format(),
        },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  /**
   * 构建成功响应
   */
  private buildSuccessResponse(result: unknown) {
    return {
      success: true,
      message: '世界创建任务已开始处理',
      data: result,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 处理创建世界时的错误
   */
  private handleCreateWorldError(error: unknown, userId: string): never {
    this.logger.error(`HTTP API: Failed to create world for user ${userId}`, error)

    if (error instanceof HttpException) {
      throw error
    }

    throw new HttpException(
      {
        message: '世界创建失败',
        error: getErrorMessage(error),
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }

  // [新增] HTTP API: 获取创建状态
  @Post('creation-status')
  async getCreationStatus() {
    try {
      // 这里可以实现状态查询逻辑
      // 目前返回基础状态信息
      return {
        success: true,
        message: 'Creation Agent is running',
        status: 'ready',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          message: '获取状态失败',
          error: getErrorMessage(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // [核心] 监听由主网关 (nexus-engine) 发出的"请求创建游戏"信号
  @MessagePattern('GAME_CREATION_REQUESTED')
  async handleGameCreation(@Payload() data: GameCreationPayload, @Ctx() context: RmqContext) {
    this.logger.log(`Received game creation request for user: ${data.userId}`)
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const MAX_RETRIES = 2

    try {
      // 将任务交给“大脑”（CreationService）处理
      await this.creationService.createNewWorld(data)
      // 任务处理成功，确认消息
      channel.ack(originalMsg)
      this.logger.log(`Successfully processed creation task for user: ${data.userId}`)
    } catch (error) {
      this.logger.error(`Failed to process creation task for user ${data.userId}`, error)

      // [核心改造] 实现延迟重试机制
      const retryCount = (originalMsg.properties.headers['x-death'] || []).length
      if (retryCount < MAX_RETRIES) {
        // 发送到重试队列，实现延迟重试（5秒后重新处理）
        this.logger.warn(
          `Creation task for user ${data.userId} failed. Sending to retry queue (${retryCount + 1}/${MAX_RETRIES + 1})...`
        )
        channel.nack(originalMsg, false, false) // 触发死信路由到重试队列
      } else {
        // [核心修复] 达到最大重试次数前，确保用户收到失败通知
        try {
          await this.creationService.notifyCreationFailure(data.userId, error)
        } catch (notifyError) {
          this.logger.error(`Failed to notify user ${data.userId} of creation failure`, notifyError)
        }

        // 达到最大重试次数，将消息发送到最终死信队列
        this.logger.error(
          `Creation task for user ${data.userId} failed after ${MAX_RETRIES + 1} attempts. Sending to DLQ.`
        )
        // 手动发送到死信队列（这里需要重新发布到死信交换）
        channel.publish('dlx', 'creation_queue_dead', originalMsg.content, {
          headers: { ...originalMsg.properties.headers, finalFailure: true },
        })
        channel.ack(originalMsg)
      }
    }
  }
}
