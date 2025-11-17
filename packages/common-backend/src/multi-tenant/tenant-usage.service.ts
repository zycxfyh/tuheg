import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TenantUsage } from './tenant.service'

export interface UsageMetrics {
  tenantId: string
  metric: string
  value: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface BillingPeriod {
  startDate: Date
  endDate: Date
  tenantId: string
}

@Injectable()
export class TenantUsageService {
  private readonly logger = new Logger(TenantUsageService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * 记录使用量指标
   */
  async recordUsage(tenantId: string, metric: string, value: number, metadata?: Record<string, any>): Promise<void> {
    try {
      await this.prisma.tenantUsage.create({
        data: {
          tenantId,
          metric,
          value,
          timestamp: new Date(),
          metadata: metadata || {}
        }
      })

      this.logger.debug(`Recorded usage: ${tenantId} - ${metric} = ${value}`)
    } catch (error) {
      this.logger.error(`Failed to record usage for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * 批量记录使用量指标
   */
  async recordUsageBatch(metrics: Omit<UsageMetrics, 'timestamp'>[]): Promise<void> {
    try {
      const data = metrics.map(metric => ({
        tenantId: metric.tenantId,
        metric: metric.metric,
        value: metric.value,
        timestamp: new Date(),
        metadata: metric.metadata || {}
      }))

      await this.prisma.tenantUsage.createMany({
        data,
        skipDuplicates: true
      })

      this.logger.debug(`Recorded ${metrics.length} usage metrics`)
    } catch (error) {
      this.logger.error('Failed to record usage batch:', error)
      throw error
    }
  }

  /**
   * 获取租户使用情况
   */
  async getTenantUsage(tenantId: string, period?: BillingPeriod): Promise<TenantUsage> {
    const startDate = period?.startDate || this.getCurrentMonthStart()
    const endDate = period?.endDate || new Date()

    try {
      // 获取用户数
      const userCount = await this.prisma.tenantUser.count({
        where: {
          tenantId,
          status: 'ACTIVE'
        }
      })

      // 获取工作区数
      const workspaceCount = await this.prisma.workspace.count({
        where: { tenantId }
      })

      // 获取存储使用量（模拟计算，实际应该从文件存储服务获取）
      const storageUsage = await this.calculateStorageUsage(tenantId)

      // 获取API调用次数
      const apiCalls = await this.getUsageSum(tenantId, 'api_call', startDate, endDate)

      // 获取AI token使用量
      const aiTokens = await this.getUsageSum(tenantId, 'ai_token', startDate, endDate)

      // 获取活跃用户数（最近7天有活动的用户）
      const activeUsers = await this.getActiveUsersCount(tenantId)

      return {
        currentUsers: userCount,
        currentWorkspaces: workspaceCount,
        usedStorageGB: storageUsage,
        apiCallsThisMonth: apiCalls,
        aiTokensThisMonth: aiTokens,
        activeUsers
      }
    } catch (error) {
      this.logger.error(`Failed to get tenant usage for ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * 获取指定时间范围内的使用量总和
   */
  async getUsageSum(tenantId: string, metric: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.tenantUsage.aggregate({
      where: {
        tenantId,
        metric,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        value: true
      }
    })

    return result._sum.value || 0
  }

  /**
   * 计算存储使用量
   */
  private async calculateStorageUsage(tenantId: string): Promise<number> {
    try {
      // 这里应该从文件存储服务获取实际的存储使用量
      // 暂时返回模拟数据

      // 计算用户的游戏数据大小
      const gamesCount = await this.prisma.game.count({
        where: {
          ownerId: {
            in: await this.getTenantUserIds(tenantId)
          }
        }
      })

      // 估算存储使用量 (每个游戏约50MB)
      return gamesCount * 0.05
    } catch (error) {
      this.logger.error(`Failed to calculate storage usage for tenant ${tenantId}:`, error)
      return 0
    }
  }

  /**
   * 获取活跃用户数
   */
  private async getActiveUsersCount(tenantId: string): Promise<number> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    try {
      const activeUsers = await this.prisma.tenantUsage.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: sevenDaysAgo
          }
        },
        select: {
          metadata: true
        },
        distinct: ['metadata']
      })

      // 从metadata中提取用户ID并去重
      const userIds = new Set<string>()
      activeUsers.forEach(usage => {
        if (usage.metadata?.userId) {
          userIds.add(usage.metadata.userId)
        }
      })

      return userIds.size
    } catch (error) {
      this.logger.error(`Failed to get active users count for tenant ${tenantId}:`, error)
      return 0
    }
  }

  /**
   * 获取租户用户ID列表
   */
  private async getTenantUserIds(tenantId: string): Promise<string[]> {
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: { tenantId },
      select: { userId: true }
    })

    return tenantUsers.map(tu => tu.userId)
  }

  /**
   * 获取当月开始日期
   */
  private getCurrentMonthStart(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  /**
   * 获取租户使用量趋势
   */
  async getUsageTrends(tenantId: string, metric: string, days: number = 30): Promise<Array<{ date: string; value: number }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const usages = await this.prisma.tenantUsage.findMany({
        where: {
          tenantId,
          metric,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      })

      // 按日期聚合数据
      const dailyData = new Map<string, number>()

      usages.forEach(usage => {
        const dateKey = usage.timestamp.toISOString().split('T')[0]
        dailyData.set(dateKey, (dailyData.get(dateKey) || 0) + usage.value)
      })

      return Array.from(dailyData.entries()).map(([date, value]) => ({
        date,
        value
      }))
    } catch (error) {
      this.logger.error(`Failed to get usage trends for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * 生成账单
   */
  async generateBill(tenantId: string, period: BillingPeriod): Promise<any> {
    try {
      const usage = await this.getTenantUsage(tenantId, period)
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        throw new Error('Tenant not found')
      }

      const limits = tenant.limits as any
      const plan = tenant.plan

      // 计算费用（简化版）
      const basePrice = this.getPlanBasePrice(plan)
      const overageFees = this.calculateOverageFees(usage, limits)

      const bill = {
        tenantId,
        tenantName: tenant.name,
        period: {
          start: period.startDate,
          end: period.endDate
        },
        plan,
        usage,
        pricing: {
          basePrice,
          overageFees,
          total: basePrice + overageFees
        },
        generatedAt: new Date()
      }

      // 记录账单
      await this.prisma.tenantBill.create({
        data: {
          tenantId,
          periodStart: period.startDate,
          periodEnd: period.endDate,
          amount: bill.pricing.total,
          currency: 'USD',
          status: 'PENDING',
          details: bill
        }
      })

      return bill
    } catch (error) {
      this.logger.error(`Failed to generate bill for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * 获取套餐基础价格
   */
  private getPlanBasePrice(plan: string): number {
    const prices = {
      FREE: 0,
      STANDARD: 49,
      PROFESSIONAL: 199,
      ENTERPRISE: 999
    }
    return prices[plan] || 0
  }

  /**
   * 计算超额费用
   */
  private calculateOverageFees(usage: TenantUsage, limits: any): number {
    let fees = 0

    // 用户超额费用 ($5/用户)
    if (usage.currentUsers > limits.maxUsers) {
      fees += (usage.currentUsers - limits.maxUsers) * 5
    }

    // 存储超额费用 ($0.1/GB)
    if (usage.usedStorageGB > limits.maxStorageGB) {
      fees += (usage.usedStorageGB - limits.maxStorageGB) * 0.1
    }

    // API调用超额费用 ($0.001/次)
    if (usage.apiCallsThisMonth > limits.maxApiCallsPerMonth) {
      fees += (usage.apiCallsThisMonth - limits.maxApiCallsPerMonth) * 0.001
    }

    // AI token超额费用 ($0.0001/token)
    if (usage.aiTokensThisMonth > limits.maxAiTokensPerMonth) {
      fees += (usage.aiTokensThisMonth - limits.maxAiTokensPerMonth) * 0.0001
    }

    return Math.round(fees * 100) / 100
  }

  /**
   * 清理过期数据
   */
  async cleanupOldData(retentionDays: number = 90): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    try {
      const deletedCount = await this.prisma.tenantUsage.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })

      this.logger.log(`Cleaned up ${deletedCount.count} old usage records`)
    } catch (error) {
      this.logger.error('Failed to cleanup old usage data:', error)
      throw error
    }
  }
}
