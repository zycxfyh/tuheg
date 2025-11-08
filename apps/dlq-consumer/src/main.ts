// DLQ Consumer Service - Monitors dead letter queues and handles failed messages

import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import * as Sentry from '@sentry/node'
import { DlqConsumerModule } from './dlq-consumer.module'

async function bootstrap() {
  const app = await NestFactory.create(DlqConsumerModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('DlqConsumerBootstrap')

  // Initialize Sentry for error reporting
  const sentryDsn = configService.get<string>('SENTRY_DSN')
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('NODE_ENV') || 'development',
    })
    logger.log('Sentry initialized for DLQ Consumer')
  }

  // Start as microservice
  await app.listen(0) // Use port 0 for microservice
  logger.log('DLQ Consumer Service started and listening for dead letter messages')
}

bootstrap().catch((error) => {
  console.error('Failed to start DLQ Consumer Service:', error)
  process.exit(1)
})
