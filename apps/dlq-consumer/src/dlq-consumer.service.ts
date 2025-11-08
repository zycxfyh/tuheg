import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EventBusService, PrismaService } from '@tuheg/common-backend'
import * as amqp from 'amqplib'

interface DlqMessage {
  originalQueue: string
  userId?: string
  gameId?: string
  error?: string
  timestamp: Date
  retryCount: number
  sagaId?: string
}

@Injectable()
export class DlqConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DlqConsumerService.name)
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private readonly dlqConfigs = [
    { queue: 'creation_queue_dead', exchange: 'dlx', routingKey: 'creation_queue_dead' },
    { queue: 'logic_agent_dlq', exchange: 'dlx', routingKey: 'logic_agent_dlq' },
    { queue: 'narrative_agent_dlq', exchange: 'dlx', routingKey: 'narrative_agent_dlq' },
  ]

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    await this.connectToRabbitMQ()
    await this.setupDlqConsumers()
    this.logger.log('DLQ Consumer Service initialized and monitoring dead letter queues')
  }

  async onModuleDestroy() {
    await this.closeConnection()
  }

  private async connectToRabbitMQ(): Promise<void> {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'

    try {
      this.connection = await amqp.connect(rabbitmqUrl)
      this.channel = await this.connection.createChannel()
      this.logger.log('Connected to RabbitMQ for DLQ monitoring')
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error)
      throw error
    }
  }

  private async setupDlqConsumers(): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available')
    }

    for (const config of this.dlqConfigs) {
      try {
        // Declare the DLQ if it doesn't exist
        await this.channel.assertQueue(config.queue, { durable: true })

        // Set up consumer for this DLQ
        await this.channel.consume(config.queue, async (msg) => {
          if (msg) {
            await this.handleDlqMessage(config.queue, msg)
          }
        })

        this.logger.log(`Started monitoring DLQ: ${config.queue}`)
      } catch (error) {
        this.logger.error(`Failed to setup consumer for DLQ ${config.queue}:`, error)
      }
    }
  }

  private async handleDlqMessage(queueName: string, msg: amqp.ConsumeMessage): Promise<void> {
    try {
      const messageContent = this.parseMessageContent(msg)
      const dlqMessage = this.extractDlqMetadata(queueName, msg, messageContent)

      this.logger.warn(`Received failed message from ${queueName}:`, {
        sagaId: dlqMessage.sagaId,
        userId: dlqMessage.userId,
        gameId: dlqMessage.gameId,
        retryCount: dlqMessage.retryCount,
        error: dlqMessage.error,
      })

      // Send alert to monitoring system
      await this.sendAlert(dlqMessage)

      // Store failed message for manual review
      await this.storeFailedMessage(dlqMessage, messageContent, msg.properties.headers)

      // Acknowledge the message
      this.channel?.ack(msg)
    } catch (error) {
      this.logger.error(`Failed to process DLQ message from ${queueName}:`, error)
      // Don't acknowledge the message so it can be retried
    }
  }

  private parseMessageContent(msg: amqp.ConsumeMessage): any {
    try {
      return JSON.parse(msg.content.toString())
    } catch (error) {
      this.logger.warn('Failed to parse DLQ message content as JSON, treating as raw string')
      return { rawContent: msg.content.toString() }
    }
  }

  private extractDlqMetadata(
    queueName: string,
    msg: amqp.ConsumeMessage,
    content: any
  ): DlqMessage {
    const headers = msg.properties.headers || {}
    const xDeath = headers['x-death'] || []

    return {
      originalQueue: queueName,
      userId: content.userId || headers.userId,
      gameId: content.gameId || headers.gameId,
      error: headers.error || content.error || 'Unknown error',
      timestamp: new Date(),
      retryCount: xDeath.length || headers.retryCount || 0,
      sagaId: headers.sagaId || content.sagaId,
    }
  }

  private async sendAlert(dlqMessage: DlqMessage): Promise<void> {
    const alertMessage = {
      type: 'DLQ_ALERT',
      severity: 'HIGH',
      title: `Failed message in ${dlqMessage.originalQueue}`,
      description: `A message failed processing after ${dlqMessage.retryCount + 1} attempts`,
      details: {
        queue: dlqMessage.originalQueue,
        userId: dlqMessage.userId,
        gameId: dlqMessage.gameId,
        sagaId: dlqMessage.sagaId,
        error: dlqMessage.error,
        retryCount: dlqMessage.retryCount,
        timestamp: dlqMessage.timestamp,
      },
      timestamp: new Date(),
    }

    try {
      // Publish alert to monitoring system (could be Sentry, Slack, etc.)
      await this.eventBus.publish('SYSTEM_ALERT', alertMessage)

      // In a production system, you might also:
      // - Send email notifications
      // - Create tickets in issue tracking systems
      // - Send Slack/Discord messages
      // - Trigger PagerDuty alerts

      this.logger.log(`Alert sent for failed message in ${dlqMessage.originalQueue}`)
    } catch (error) {
      this.logger.error('Failed to send DLQ alert:', error)
    }
  }

  private async storeFailedMessage(
    dlqMessage: DlqMessage,
    messageBody: any,
    headers: any
  ): Promise<void> {
    try {
      // Store the failed message in the database for manual review and potential reprocessing
      const failedMessageRecord = await this.prisma.deadLetterMessage.create({
        data: {
          originalQueue: dlqMessage.originalQueue,
          userId: dlqMessage.userId,
          gameId: dlqMessage.gameId,
          sagaId: dlqMessage.sagaId,
          messageBody: messageBody || {},
          headers: headers || {},
          error: dlqMessage.error,
          errorDetails: {
            timestamp: dlqMessage.timestamp,
            retryCount: dlqMessage.retryCount,
          },
          retryCount: dlqMessage.retryCount,
          lastAttemptAt: dlqMessage.timestamp,
          status: 'PENDING_REVIEW',
          priority: this.calculatePriority(dlqMessage),
        },
      })

      this.logger.log(`Failed message stored in database with ID: ${failedMessageRecord.id}`, {
        queue: dlqMessage.originalQueue,
        sagaId: dlqMessage.sagaId,
        userId: dlqMessage.userId,
      })
    } catch (dbError) {
      this.logger.error('Failed to store DLQ message in database:', dbError)
      // Fallback to logging if database storage fails
      this.logger.warn('DLQ message not stored in database, logging instead:', {
        queue: dlqMessage.originalQueue,
        userId: dlqMessage.userId,
        gameId: dlqMessage.gameId,
        sagaId: dlqMessage.sagaId,
        error: dlqMessage.error,
        retryCount: dlqMessage.retryCount,
        timestamp: dlqMessage.timestamp,
      })
    }
  }

  private calculatePriority(dlqMessage: DlqMessage): number {
    // Higher priority for messages with user/game context
    let priority = 1

    if (dlqMessage.userId) priority += 2
    if (dlqMessage.gameId) priority += 2
    if (dlqMessage.sagaId) priority += 1

    // Lower priority for messages that have been retried many times
    if (dlqMessage.retryCount > 5) priority = Math.max(1, priority - 1)
    if (dlqMessage.retryCount > 10) priority = 1

    return priority
  }

  private async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close()
      }
      if (this.connection) {
        await this.connection.close()
      }
      this.logger.log('DLQ Consumer connection closed')
    } catch (error) {
      this.logger.error('Error closing DLQ Consumer connection:', error)
    }
  }
}
