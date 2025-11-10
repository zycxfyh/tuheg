// 文件路径: packages/common-backend/src/bootstrap/app-bootstrapper.ts
// 通用NestJS应用启动器 - 消除重复的main.ts代码

import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'
import * as Sentry from '@sentry/node'
import type { Channel } from 'amqplib'
import helmet from 'helmet'
import type { NestApplication } from '@nestjs/core'

import {
  ApplicationType,
  type BootstrapConfig,
  type BootstrapResult,
  type HttpServerConfig,
  type MicroserviceConfig,
  type MonitoringConfig
} from './bootstrap.types'

/**
 * Redis Socket.IO 适配器接口（gateway特定实现应在gateway模块中）
 */
export interface RedisIoAdapterInterface {
  connectToRedis(): Promise<void>
}

/**
 * 通用NestJS应用启动器
 */
export class AppBootstrapper {
  private static readonly logger = {
    log: (message: string) => console.log(`🚀 ${message}`),
    error: (message: string, error?: any) => console.error(`❌ ${message}`, error),
    warn: (message: string) => console.warn(`⚠️ ${message}`)
  }

  /**
   * 引导应用
   */
  static async bootstrap(config: BootstrapConfig): Promise<BootstrapResult> {
    const result: BootstrapResult = { app: null as any }

    try {
      this.logger.log(`启动 ${config.type} 应用...`)

      // 创建应用实例
      const app = await NestFactory.create(config.module)
      const configService = app.get(ConfigService)
      result.app = app

      // 初始化监控
      await this.initializeMonitoring(config.monitoring, configService)

      // 配置微服务（如果启用）
      if (config.microservice?.enabled) {
        result.microserviceStarted = await this.setupMicroservice(app, config.microservice, configService)
      }

      // 配置HTTP服务器（如果启用）
      if (config.httpServer?.enabled) {
        result.httpUrl = await this.setupHttpServer(app, config.httpServer, configService, config.type)
      }

      // 执行自定义初始化
      if (config.customInit) {
        await config.customInit(app, configService)
      }

      // 启动应用
      await this.startApplication(app, config, result)

      this.logger.log(`${config.type} 应用启动成功`)
      return result

    } catch (error) {
      await this.handleBootstrapError(error, config, result.app)
      throw error
    }
  }

  /**
   * 初始化监控
   */
  private static async initializeMonitoring(
    monitoring: MonitoringConfig = {},
    configService: ConfigService
  ): Promise<void> {
    if (monitoring.sentry !== false) { // 默认启用
      const sentryDsn = configService.get<string>('SENTRY_DSN')
      if (sentryDsn) {
        Sentry.init({
          dsn: sentryDsn,
          tracesSampleRate: 1.0,
          profilesSampleRate: 1.0,
          environment: monitoring.environment || process.env.NODE_ENV || 'development',
          // 为不同应用类型设置独特的环境标签
          ...(monitoring.serviceName && { tags: {
            service: monitoring.serviceName,
            type: monitoring.environment || 'unknown'
          } })
        })
        this.logger.log('Sentry监控已初始化')
      }
    }
  }

  /**
   * 设置微服务
   */
  private static async setupMicroservice(
    app: any,
    microservice: MicroserviceConfig,
    configService: ConfigService
  ): Promise<boolean> {
    const rmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')

    const microserviceOptions: any = {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: microservice.options?.options?.queue || 'default_queue',
        noAck: false,
        queueOptions: {
          durable: false,
          deadLetterExchange: microservice.deadLetterExchange || 'dlx',
          deadLetterRoutingKey: microservice.retryQueue || 'retry_queue',
        },
        setup: microservice.options?.options?.setup || this.createDefaultChannelSetup(microservice),
      } as any,
    }

    app.connectMicroservice(microserviceOptions)

    this.logger.log('微服务配置完成')
    return true
  }

  /**
   * 创建默认的RabbitMQ通道设置
   */
  private static createDefaultChannelSetup(microservice: MicroserviceConfig) {
    return (channel: Channel) => {
      const retryExchange = microservice.retryExchange || 'retry_exchange'
      const retryQueue = microservice.retryQueue || 'retry_queue'
      const deadLetterExchange = microservice.deadLetterExchange || 'dlx'
      const deadLetterQueue = microservice.deadLetterQueue || 'dead_letter_queue'
      const retryTtl = microservice.retryTtl || 5000

      return Promise.all([
        // 创建重试交换和队列
        channel.assertExchange(retryExchange, 'direct', { durable: true }),
        channel.assertQueue(retryQueue, {
          durable: true,
          deadLetterExchange: '',
          deadLetterRoutingKey: microservice.options?.options?.queue || 'default_queue',
          messageTtl: retryTtl,
        }),
        channel.bindQueue(retryQueue, retryExchange, retryQueue),

        // 创建死信队列
        channel.assertExchange(deadLetterExchange, 'direct', { durable: true }),
        channel.assertQueue(deadLetterQueue, { durable: true }),
        channel.bindQueue(deadLetterQueue, deadLetterExchange, deadLetterQueue),
      ])
    }
  }

  /**
   * 设置HTTP服务器
   */
  private static async setupHttpServer(
    app: any,
    httpServer: HttpServerConfig,
    configService: ConfigService,
    appType: ApplicationType
  ): Promise<string> {
    // 设置API前缀
    if (httpServer.prefix) {
      app.setGlobalPrefix(httpServer.prefix)
    }

    // 配置安全中间件
    if (httpServer.security?.helmet !== false) { // 默认启用
      app.use(this.createHelmetConfig())
    }

    // 配置CORS
    const corsConfig = httpServer.cors || {}
    const corsOrigin = corsConfig.origin ||
      configService.get<string>('CORS_ORIGIN') ||
      'http://localhost:5173'

    app.enableCors({
      origin: Array.isArray(corsConfig.origin) ? corsConfig.origin : (typeof corsOrigin === 'string' ? corsOrigin.split(',') : corsOrigin),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: corsConfig.credentials ?? true,
      allowedHeaders: corsConfig.allowedHeaders || ['Content-Type', 'Authorization'],
    })

    // 注意：Redis Socket.IO适配器应在gateway模块中单独配置
    // 这里只提供通用HTTP服务器配置

    const port = httpServer.port
    const url = `http://localhost:${port}${httpServer.prefix ? httpServer.prefix : ''}`

    this.logger.log(`HTTP服务器配置完成: ${url}`)
    return url
  }

  /**
   * 创建Helmet安全配置
   */
  private static createHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  }

  /**
   * 启动应用
   */
  private static async startApplication(
    app: any,
    config: BootstrapConfig,
    result: BootstrapResult
  ): Promise<void> {
    try {
      // 启动微服务
      if (config.microservice?.enabled) {
        await app.startAllMicroservices()
        this.logger.log('📡 微服务已启动')
      }

      // 启动HTTP服务器
      if (config.httpServer?.enabled) {
        const port = config.httpServer.port
        await app.listen(port)
        this.logger.log(`🌐 HTTP服务器已启动: ${result.httpUrl}`)
      }

    } catch (error) {
      this.logger.error('应用启动失败:', error)
      throw error
    }
  }

  /**
   * 处理引导错误
   */
  private static async handleBootstrapError(error: any, config: BootstrapConfig, app?: any): Promise<void> {
    this.logger.error(`${config.type} 应用启动失败:`, error)

    // 尝试上报到Sentry
    Sentry.captureException(error)

    // 清理资源
    if (app) {
      try {
        await app.close()
      } catch (closeError) {
        this.logger.error('应用清理失败:', closeError)
      }
    }

    // 优雅关闭Sentry
    try {
      await Sentry.close(2000)
    } catch (sentryError) {
      this.logger.error('Sentry关闭失败:', sentryError)
    }
  }

  /**
   * 创建预定义配置
   */
  static createGatewayConfig(module: any): BootstrapConfig {
    return {
      type: ApplicationType.GATEWAY,
      module,
      httpServer: {
        enabled: true,
        port: 3000,
        prefix: 'api/v1',
        security: { helmet: true }
      },
      monitoring: {
        sentry: true,
        serviceName: 'backend-gateway'
      }
    }
  }

  static createCreationAgentConfig(module: any): BootstrapConfig {
    return {
      type: ApplicationType.CREATION_AGENT,
      module,
      microservice: {
        enabled: true,
        options: {
          transport: Transport.RMQ,
          options: { queue: 'creation_queue' }
        },
        retryExchange: 'creation_retry_exchange',
        retryQueue: 'creation_retry_queue',
        deadLetterExchange: 'dlx',
        deadLetterQueue: 'creation_queue_dead'
      },
      httpServer: {
        enabled: true,
        port: 8080,
        prefix: 'api/v1/creation'
      },
      monitoring: {
        sentry: true,
        serviceName: 'creation-agent'
      }
    }
  }

  static createLogicAgentConfig(module: any): BootstrapConfig {
    return {
      type: ApplicationType.LOGIC_AGENT,
      module,
      microservice: {
        enabled: true,
        options: {
          transport: Transport.RMQ,
          options: { queue: 'logic_queue' }
        },
        retryExchange: 'logic_retry_exchange',
        retryQueue: 'logic_retry_queue',
        deadLetterExchange: 'dlx',
        deadLetterQueue: 'logic_queue_dead'
      },
      httpServer: {
        enabled: true,
        port: 8081,
        prefix: 'api/v1/logic'
      },
      monitoring: {
        sentry: true,
        serviceName: 'logic-agent'
      }
    }
  }

  static createNarrativeAgentConfig(module: any): BootstrapConfig {
    return {
      type: ApplicationType.NARRATIVE_AGENT,
      module,
      microservice: {
        enabled: true,
        options: {
          transport: Transport.RMQ,
          options: { queue: 'narrative_queue' }
        } as any,
        retryExchange: 'narrative_retry_exchange',
        retryQueue: 'narrative_retry_queue',
        deadLetterExchange: 'dlx',
        deadLetterQueue: 'narrative_queue_dead'
      },
      httpServer: {
        enabled: true,
        port: 8082,
        prefix: 'api/v1/narrative'
      },
      monitoring: {
        sentry: true,
        serviceName: 'narrative-agent'
      }
    }
  }
}
