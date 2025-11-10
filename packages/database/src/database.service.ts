// ============================================================================
// 数据库抽象层 - 基于仓库模式的实现
// Database Abstraction Layer - Repository Pattern Implementation
// ============================================================================

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { IDatabaseConnection, QueryResult } from '@tuheg/abstractions'

/**
 * 数据库服务 - 实现仓库模式的数据访问层
 * Database Service - Repository Pattern Implementation
 */
@Injectable()
export class DatabaseService implements IDatabaseConnection, OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  async onModuleInit() {
    await this.connect()
  }

  async onModuleDestroy() {
    await this.close()
  }

  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      console.log('Database connected successfully')
    } catch (error) {
      console.error('Failed to connect to database:', error)
      throw error
    }
  }

  /**
   * 断开数据库连接
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * 执行原始SQL查询
   * 注意：生产环境中应谨慎使用，建议使用仓库模式
   */
  async query<T = unknown>(query: string, params?: unknown[]): Promise<T[]> {
    try {
      const result = await this.prisma.$queryRaw<T[]>(query, ...(params || []))
      return Array.isArray(result) ? result : [result]
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  /**
   * 执行单个查询
   */
  async queryOne<T = unknown>(query: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(query, params)
    return results[0] || null
  }

  /**
   * 执行命令 (INSERT, UPDATE, DELETE)
   */
  async execute(command: string, params?: unknown[]): Promise<QueryResult> {
    try {
      const result = await this.prisma.$executeRaw(command, ...(params || []))
      return {
        rows: [],
        affectedRows: typeof result === 'number' ? result : 0
      }
    } catch (error) {
      console.error('Database execute error:', error)
      throw error
    }
  }

  /**
   * 开始事务
   */
  async beginTransaction(): Promise<void> {
    // 事务应该在调用方通过Prisma的事务API处理
    throw new Error('Use Prisma transaction API instead')
  }

  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    throw new Error('Use Prisma transaction API instead')
  }

  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    throw new Error('Use Prisma transaction API instead')
  }

  /**
   * 检查连接是否健康
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 获取Prisma客户端实例（仅内部使用）
   * Get Prisma client instance (internal use only)
   */
  getPrismaClient(): PrismaClient {
    return this.prisma
  }

  /**
   * 在事务中执行操作
   * Execute operations within a transaction
   */
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn)
  }
}
