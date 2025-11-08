// 文件路径: packages/common-backend/src/schedule/tasks/cleanup.task.ts
// 核心理念: 定期清理过期数据

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import type { PrismaService } from '../../prisma/prisma.service'

/**
 * 装饰器：为清理任务添加统一的日志记录
 */
function withCleanupLogging(operationName: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    const logger = new Logger(target.constructor.name)

    descriptor.value = async function (...args: any[]) {
      logger.log(`Starting cleanup of ${operationName}...`)

      try {
        const result = await originalMethod.apply(this, args)
        logger.log(`Cleanup of ${operationName} completed`)
        return result
      } catch (error) {
        logger.error(`Failed to cleanup ${operationName}:`, error)
        throw error
      }
    }
  }
}

/**
 * @service CleanupTask
 * @description 清理任务
 * 定期清理过期数据、临时文件等
 */
@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * @method cleanupExpiredSessions
   * @description 清理过期的会话（每天凌晨 2 点执行）
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  @withCleanupLogging('expired sessions')
  async cleanupExpiredSessions(): Promise<void> {
    // TODO: 实现会话清理逻辑
    // const deleted = await this.prisma.session.deleteMany({
    //   where: {
    //     expiresAt: { lt: new Date() },
    //   },
    // });
  }

  /**
   * @method cleanupOldLogs
   * @description 清理旧日志（每周日凌晨 3 点执行）
   */
  @Cron(CronExpression.EVERY_WEEK)
  @withCleanupLogging('old logs')
  async cleanupOldLogs(): Promise<void> {
    // TODO: 实现日志清理逻辑
    // 删除 30 天前的日志
    // const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - 30);
    // await this.prisma.log.deleteMany({
    //   where: {
    //     createdAt: { lt: cutoffDate },
    //   },
    // });
  }

  /**
   * @method cleanupTempFiles
   * @description 清理临时文件（每小时执行）
   */
  @Cron(CronExpression.EVERY_HOUR)
  @withCleanupLogging('temporary files')
  async cleanupTempFiles(): Promise<void> {
    // TODO: 实现临时文件清理逻辑
    // 删除超过 24 小时的临时文件
  }

  /**
   * @method healthCheck
   * @description 健康检查任务（每 5 分钟执行）
   */
  @Cron('*/5 * * * *')
  async healthCheck(): Promise<void> {
    try {
      // 简单的数据库连接检查
      await this.prisma.$queryRaw`SELECT 1`
      this.logger.debug('Health check passed')
    } catch (error) {
      this.logger.error('Health check failed:', error)
    }
  }
}
