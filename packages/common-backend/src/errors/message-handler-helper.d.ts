import type { Logger } from '@nestjs/common'
import type { Channel, Message } from 'amqplib'
export type MessageHandlerResult = 'ack' | 'nack' | 'requeue'
export interface MessageHandlerContext {
  correlationId?: string
  gameId?: string
  userId?: string
  operation?: string
}
export interface MessageHandlerOptions {
  maxRetries?: number
  logDetails?: boolean
  reportToSentry?: boolean
  publishErrorEvent?: boolean
  errorEventPublisher?: (errorPayload: unknown) => void
  userId?: string
  errorEventName?: string
  serviceName?: string
  queueName?: string
}
export declare function withErrorHandling<
  T extends {
    correlationId?: string
    gameId?: string
    userId?: string
  },
>(
  handler: (data: T) => Promise<void>,
  logger: Logger,
  context?: MessageHandlerContext,
  options?: MessageHandlerOptions
): (data: T, channel: Channel, message: Message) => Promise<MessageHandlerResult>
export declare function handleRabbitMQMessage<
  T extends {
    correlationId?: string
    gameId?: string
    userId?: string
  },
>(
  handler: (data: T) => Promise<void>,
  channel: Channel,
  message: Message,
  logger: Logger,
  context?: MessageHandlerContext,
  options?: MessageHandlerOptions
): Promise<void>
export declare function withRMQErrorHandling<
  T extends {
    correlationId?: string
    gameId?: string
    userId?: string
  },
>(
  handler: (data: T) => Promise<void>,
  logger: Logger,
  context?: MessageHandlerContext,
  options?: MessageHandlerOptions
): (data: T) => Promise<MessageHandlerResult>
//# sourceMappingURL=message-handler-helper.d.ts.map
