// 文件路径: packages/common-backend/src/bootstrap/bootstrap.types.ts
// 通用应用启动器类型定义

import type { ModuleMetadata } from '@nestjs/common'
import type { MicroserviceOptions } from '@nestjs/microservices'

/**
 * 应用类型枚举
 */
export enum ApplicationType {
  /** 网关服务 */
  GATEWAY = 'gateway',
  /** 创建代理 */
  CREATION_AGENT = 'creation_agent',
  /** 逻辑代理 */
  LOGIC_AGENT = 'logic_agent',
  /** 叙述代理 */
  NARRATIVE_AGENT = 'narrative_agent',
  /** 工具服务 */
  TOOL_SERVICE = 'tool_service',
}

/**
 * 微服务配置
 */
export interface MicroserviceConfig {
  /** 是否启用微服务 */
  enabled: boolean
  /** 微服务选项 */
  options?: MicroserviceOptions
  /** 重试交换机名称 */
  retryExchange?: string
  /** 重试队列名称 */
  retryQueue?: string
  /** 死信交换机名称 */
  deadLetterExchange?: string
  /** 死信队列名称 */
  deadLetterQueue?: string
  /** 重试TTL (毫秒) */
  retryTtl?: number
}

/**
 * HTTP服务器配置
 */
export interface HttpServerConfig {
  /** 是否启用HTTP服务器 */
  enabled: boolean
  /** 端口号 */
  port: number
  /** API前缀 */
  prefix?: string
  /** CORS配置 */
  cors?: {
    origin?: string | string[]
    credentials?: boolean
    allowedHeaders?: string[]
  }
  /** 安全配置 */
  security?: {
    helmet?: boolean
    rateLimit?: boolean
  }
}

/**
 * 监控配置
 */
export interface MonitoringConfig {
  /** 是否启用Sentry */
  sentry?: boolean
  /** 环境标识 */
  environment?: string
  /** 应用名称 */
  serviceName?: string
}

/**
 * 应用引导配置
 */
export interface BootstrapConfig {
  /** 应用类型 */
  type: ApplicationType
  /** 模块元数据 */
  module: ModuleMetadata
  /** 微服务配置 */
  microservice?: MicroserviceConfig
  /** HTTP服务器配置 */
  httpServer?: HttpServerConfig
  /** 监控配置 */
  monitoring?: MonitoringConfig
  /** 自定义初始化函数 */
  customInit?: (app: any, configService: any) => Promise<void>
  /** 自定义清理函数 */
  customCleanup?: (app: any) => Promise<void>
}

/**
 * 启动结果
 */
export interface BootstrapResult {
  /** 应用实例 */
  app: any
  /** HTTP服务器URL (如果启用) */
  httpUrl?: string
  /** 微服务状态 */
  microserviceStarted?: boolean
}
