import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLog, AuditRiskLevel, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AuditLogData {
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  tenantId?: string;
  details?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  riskLevel?: AuditRiskLevel;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  complianceTags?: string[];
}

export interface AuditQuery {
  tenantId?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  riskLevel?: AuditRiskLevel;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  period: string;
  totalEvents: number;
  eventsByRisk: Record<AuditRiskLevel, number>;
  eventsByAction: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByResource: Record<string, number>;
  suspiciousActivities: AuditLog[];
  complianceViolations: AuditLog[];
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== 审计日志记录 ====================

  /**
   * 创建审计日志
   */
  async createAuditLog(data: AuditLogData): Promise<AuditLog> {
    // 自动检测风险等级（如果未提供）
    const riskLevel = data.riskLevel || this.detectRiskLevel(data);

    const auditLog = await this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        userId: data.userId,
        details: data.details || {},
        oldValues: data.oldValues || {},
        newValues: data.newValues || {},
        riskLevel,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        sessionId: data.sessionId,
        complianceTags: data.complianceTags || []
      }
    });

    // 触发审计事件
    this.eventEmitter.emit('audit.logCreated', auditLog);

    // 检查是否需要实时警报
    if (this.shouldTriggerAlert(auditLog)) {
      this.eventEmitter.emit('audit.alert', auditLog);
    }

    return auditLog;
  }

  /**
   * 批量创建审计日志
   */
  async createAuditLogs(logs: AuditLogData[]): Promise<AuditLog[]> {
    const auditLogs: AuditLog[] = [];

    for (const logData of logs) {
      const auditLog = await this.createAuditLog(logData);
      auditLogs.push(auditLog);
    }

    return auditLogs;
  }

  /**
   * 获取审计日志
   */
  async getAuditLogs(query: AuditQuery): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }

    if (query.resourceId) {
      where.resourceId = query.resourceId;
    }

    if (query.riskLevel) {
      where.riskLevel = query.riskLevel;
    }

    if (query.ipAddress) {
      where.ipAddress = query.ipAddress;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }

  /**
   * 获取单个审计日志详情
   */
  async getAuditLog(id: string): Promise<AuditLog> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id }
    });

    if (!auditLog) {
      throw new Error('Audit log not found');
    }

    return auditLog;
  }

  // ==================== 审计报告生成 ====================

  /**
   * 生成审计报告
   */
  async generateAuditReport(
    tenantId: string,
    period: 'day' | 'week' | 'month' = 'month',
    options?: {
      includeSuspicious?: boolean;
      includeCompliance?: boolean;
    }
  ): Promise<AuditReport> {
    const { includeSuspicious = true, includeCompliance = true } = options || {};

    // 计算时间范围
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // 获取统计数据
    const [
      totalEvents,
      eventsByRisk,
      eventsByAction,
      eventsByUser,
      eventsByResource,
      suspiciousActivities,
      complianceViolations
    ] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.getEventsByRiskLevel(tenantId, startDate, endDate),
      this.getEventsByAction(tenantId, startDate, endDate),
      this.getEventsByUser(tenantId, startDate, endDate),
      this.getEventsByResource(tenantId, startDate, endDate),
      includeSuspicious ? this.getSuspiciousActivities(tenantId, startDate, endDate) : Promise.resolve([]),
      includeCompliance ? this.getComplianceViolations(tenantId, startDate, endDate) : Promise.resolve([])
    ]);

    return {
      period,
      totalEvents,
      eventsByRisk,
      eventsByAction,
      eventsByUser,
      eventsByResource,
      suspiciousActivities,
      complianceViolations
    };
  }

  /**
   * 生成用户活动报告
   */
  async generateUserActivityReport(
    userId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    userId: string;
    period: string;
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByResource: Record<string, number>;
    riskDistribution: Record<AuditRiskLevel, number>;
    timeline: Array<{
      date: string;
      actions: number;
      riskScore: number;
    }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const [
      totalActions,
      actionsByType,
      actionsByResource,
      riskDistribution,
      timeline
    ] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.getUserActionsByType(userId, startDate, endDate),
      this.getUserActionsByResource(userId, startDate, endDate),
      this.getUserRiskDistribution(userId, startDate, endDate),
      this.getUserActivityTimeline(userId, startDate, endDate)
    ]);

    return {
      userId,
      period,
      totalActions,
      actionsByType,
      actionsByResource,
      riskDistribution,
      timeline
    };
  }

  // ==================== 合规性审计 ====================

  /**
   * 执行合规性审计
   */
  async performComplianceAudit(
    tenantId: string,
    complianceType: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOC2'
  ): Promise<{
    compliant: boolean;
    score: number;
    findings: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      description: string;
      evidence: AuditLog[];
      recommendation: string;
    }>;
    recommendations: string[];
  }> {
    const findings: any[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // 根据合规类型执行不同的检查
    switch (complianceType) {
      case 'GDPR':
        const gdprResults = await this.auditGDPRCompliance(tenantId);
        findings.push(...gdprResults.findings);
        recommendations.push(...gdprResults.recommendations);
        score -= gdprResults.penaltyScore;
        break;

      case 'CCPA':
        const ccpaResults = await this.auditCCPACompliance(tenantId);
        findings.push(...ccpaResults.findings);
        recommendations.push(...ccpaResults.recommendations);
        score -= ccpaResults.penaltyScore;
        break;

      case 'HIPAA':
        const hipaaResults = await this.auditHIPAACompliance(tenantId);
        findings.push(...hipaaResults.findings);
        recommendations.push(...hipaaResults.recommendations);
        score -= hipaaResults.penaltyScore;
        break;

      case 'SOC2':
        const soc2Results = await this.auditSOC2Compliance(tenantId);
        findings.push(...soc2Results.findings);
        recommendations.push(...soc2Results.recommendations);
        score -= soc2Results.penaltyScore;
        break;
    }

    return {
      compliant: score >= 80, // 80分以上视为合规
      score: Math.max(0, score),
      findings,
      recommendations
    };
  }

  // ==================== 实时监控 ====================

  /**
   * 监控可疑活动
   */
  async monitorSuspiciousActivities(
    tenantId: string,
    timeWindow: number = 3600000 // 1小时
  ): Promise<AuditLog[]> {
    const since = new Date(Date.now() - timeWindow);

    // 查找高风险活动
    const suspiciousLogs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        riskLevel: { in: ['HIGH', 'CRITICAL'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 检测异常模式
    const anomalyLogs = await this.detectAnomalies(tenantId, since);

    return [...suspiciousLogs, ...anomalyLogs];
  }

  /**
   * 检测异常模式
   */
  private async detectAnomalies(tenantId: string, since: Date): Promise<AuditLog[]> {
    const anomalies: AuditLog[] = [];

    // 检测暴力登录尝试
    const failedLogins = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: 'auth.login.failed',
        createdAt: { gte: since }
      }
    });

    // 分组统计失败登录
    const loginAttempts = this.groupByIP(failedLogins);
    for (const [ip, logs] of loginAttempts.entries()) {
      if (logs.length > 5) { // 5次失败登录
        anomalies.push(...logs);
      }
    }

    // 检测异常数据访问
    const dataAccessLogs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        resourceType: 'data',
        createdAt: { gte: since }
      }
    });

    // 检测异常的数据导出量
    const exportLogs = dataAccessLogs.filter(log =>
      log.action.includes('export') || log.action.includes('download')
    );

    if (exportLogs.length > 10) { // 异常多的数据导出
      anomalies.push(...exportLogs.slice(-5)); // 只保留最新的5条
    }

    return anomalies;
  }

  // ==================== 数据清理 ====================

  /**
   * 清理旧的审计日志
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        riskLevel: { not: 'CRITICAL' } // 保留关键日志
      }
    });

    return result.count;
  }

  /**
   * 导出审计日志
   */
  async exportAuditLogs(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { logs } = await this.getAuditLogs({ ...query, limit: 10000 });

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  // ==================== 私有方法 ====================

  /**
   * 检测风险等级
   */
  private detectRiskLevel(data: AuditLogData): AuditRiskLevel {
    // 基于操作类型和上下文自动检测风险等级
    const highRiskActions = [
      'user.delete',
      'tenant.delete',
      'security.breach',
      'data.export.bulk',
      'permission.admin'
    ];

    const criticalActions = [
      'system.root',
      'security.emergency',
      'data.breach'
    ];

    if (criticalActions.some(action => data.action.includes(action))) {
      return 'CRITICAL';
    }

    if (highRiskActions.some(action => data.action.includes(action))) {
      return 'HIGH';
    }

    if (data.details?.suspicious || data.details?.anomaly) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * 判断是否需要触发警报
   */
  private shouldTriggerAlert(auditLog: AuditLog): boolean {
    return auditLog.riskLevel === 'CRITICAL' ||
           (auditLog.riskLevel === 'HIGH' && this.isHighRiskPattern(auditLog));
  }

  /**
   * 检查是否为高风险模式
   */
  private isHighRiskPattern(auditLog: AuditLog): boolean {
    // 检查是否是重复的失败尝试
    const patterns = [
      'auth.login.failed',
      'permission.denied',
      'security.violation'
    ];

    return patterns.some(pattern => auditLog.action.includes(pattern));
  }

  // 其他私有方法的实现...
}
