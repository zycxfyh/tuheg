import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Webhook } from 'svix'

// 定义Clerk Webhook事件的预期载荷类型
export type ClerkEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    email_addresses?: { email_address: string }[]
    // ... 其他可能的字段
  }
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)
  private readonly webhook: Webhook

  constructor(private readonly configService: ConfigService) {
    const webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SECRET_KEY')
    if (!webhookSecret) {
      this.logger.error('CLERK_WEBHOOK_SECRET_KEY is not configured.')
      throw new Error('Server configuration error: Clerk webhook secret is missing.')
    }

    this.webhook = new Webhook(webhookSecret)
  }

  /**
   * Verify and parse a Clerk webhook payload
   */
  verifyWebhook(payload: Buffer, headers: Record<string, string>): ClerkEvent {
    const svixId = headers['svix-id']
    const svixTimestamp = headers['svix-timestamp']
    const svixSignature = headers['svix-signature']

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error('Missing Svix headers for webhook verification.')
    }

    try {
      const verifiedEvent = this.webhook.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkEvent

      this.logger.log(`Verified webhook event: ${verifiedEvent.type}`)
      return verifiedEvent
    } catch (error) {
      this.logger.error('Webhook verification failed:', error)
      throw new Error('Webhook verification failed')
    }
  }
}
