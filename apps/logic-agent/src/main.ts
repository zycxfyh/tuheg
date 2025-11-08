// 文件路径: apps/logic-agent/src/main.ts (已修复类型)

import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'
import * as Sentry from '@sentry/node'
import type { Channel } from 'amqplib' // <-- [核心修正] 导入 Channel 类型
import { LogicAgentModule } from './logic-agent.module'

async function bootstrap() {
  const app = await NestFactory.create(LogicAgentModule)
  const configService = app.get(ConfigService)

  Sentry.init({
    dsn: configService.get<string>('SENTRY_DSN'),
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: `agent-logic-${process.env.NODE_ENV || 'development'}`,
  })

  const rmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')

  const RETRY_EXCHANGE = 'logic_retry_exchange'
  const RETRY_QUEUE = 'logic_retry_queue'
  const DEAD_LETTER_EXCHANGE = 'dlx'
  const DEAD_LETTER_QUEUE = 'logic_queue_dead'

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'logic_queue',
      noAck: false,
      queueOptions: {
        durable: false,
        deadLetterExchange: RETRY_EXCHANGE, // 失败时发送到重试交换
        deadLetterRoutingKey: RETRY_QUEUE,
      },
      // [核心修正] 为 channel 参数添加 Channel 类型
      setup: (channel: Channel) => {
        return Promise.all([
          // 创建重试交换和队列 (TTL: 5秒)
          channel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true }),
          channel.assertQueue(RETRY_QUEUE, {
            durable: true,
            deadLetterExchange: '', // 过期后路由回原始队列
            deadLetterRoutingKey: 'logic_queue',
            messageTtl: 5000, // 5秒TTL
          }),
          channel.bindQueue(RETRY_QUEUE, RETRY_EXCHANGE, RETRY_QUEUE),

          // 创建死信队列用于最终失败的消息
          channel.assertExchange(DEAD_LETTER_EXCHANGE, 'direct', { durable: true }),
          channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true }),
          channel.bindQueue(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, DEAD_LETTER_QUEUE),
        ])
      },
    },
  })

  // [新增] 配置HTTP服务器
  const httpPort = configService.get<number>('LOGIC_AGENT_HTTP_PORT', 8081)
  app.setGlobalPrefix('api/v1/logic') // API前缀

  try {
    await app.startAllMicroservices()
    await app.listen(httpPort)

    console.log('🚀 Logic Agent is running:')
    console.log(`   📡 Microservices: listening for tasks on the event bus`)
    console.log(`   🌐 HTTP API: http://localhost:${httpPort}/api/v1/logic`)
  } catch (err) {
    Sentry.captureException(err)
    console.error('Failed to start Logic Agent:', err)
    await Sentry.close(2000).then(() => {
      process.exit(1)
    })
  }
}

bootstrap().catch((err) => {
  Sentry.captureException(err)
  console.error('Unhandled error during bootstrap of Logic Agent:', err)
  Sentry.close(2000).then(() => {
    process.exit(1)
  })
})
