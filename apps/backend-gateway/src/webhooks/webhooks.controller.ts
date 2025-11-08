// 文件路径: apps/backend-gateway/src/webhooks/webhooks.controller.ts

import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common'
import type { Request } from 'express'
import type { WebhookService } from './webhook.service'

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(private readonly webhookService: WebhookService) {}

  @Post('clerk')
  async handleClerkWebhook(@Req() req: RawBodyRequest<Request>) {
    // --- 验证 Webhook 签名 ---
    // [核心] NestJS默认会解析JSON body，但svix需要原始的、未经解析的body来进行验证。
    // 我们需要在main.ts中配置json body parser来保留这个原始body。
    const payload = req.rawBody
    if (!payload) {
      throw new BadRequestException('Raw body is required for webhook verification.')
    }

    let evt: import('./webhook.service').ClerkEvent
    try {
      evt = this.webhookService.verifyWebhook(payload, req.headers as Record<string, string>)
    } catch (err) {
      this.logger.error('Clerk webhook verification failed:', err)
      throw new BadRequestException('Webhook verification failed')
    }

    this.logger.log(`Received and verified Clerk webhook event: ${evt.type}`)

    // --- 处理不同类型的事件 ---
    const { type, data } = evt

    try {
      switch (type) {
        case 'user.created': {
          const email = data.email_addresses?.[0]?.email_address
          if (!email) {
            this.logger.warn(`User created event for user ${data.id} is missing email. Skipping.`)
            break
          }
          // Note: User will be created on first login when password is set
          // Webhook only logs the event for monitoring purposes
          this.logger.log(
            `User created in Clerk: ${data.id} (${email}). Will create DB record on first login.`
          )
          break
        }

        case 'user.updated':
          // 在此处理用户信息更新的逻辑，例如邮箱变更
          break

        case 'user.deleted':
          // 在此处理用户删除的逻辑
          break
      }
    } catch (dbError) {
      this.logger.error(`Database operation failed for event ${type} and user ${data.id}`, dbError)
      // 即使数据库操作失败，也返回200 OK，防止Clerk无限重试。
      // 错误已被记录，需要人工介入。
    }

    return { status: 'ok' }
  }
}
