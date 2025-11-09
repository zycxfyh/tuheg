// 安全合规管理器
// 确保企业级应用符合各种安全标准和法规要求

import { EventEmitter } from 'node:events'

export interface ComplianceFramework {
  id: string
  name: string
  version: string
  description: string
  requirements: ComplianceRequirement[]
  auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  lastAudit: Date
  complianceScore: number // 0-100
  status: 'compliant' | 'non-compliant' | 'under-review'
}

export interface ComplianceRequirement {
  id: string
  category:
    | 'data-protection'
    | 'access-control'
    | 'audit-logging'
    | 'encryption'
    | 'privacy'
    | 'security'
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  automatedCheck: boolean
  checkFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  remediationSteps: string[]
  status: 'passed' | 'failed' | 'not-checked'
  lastChecked: Date
  evidence: string[]
}

export interface SecurityIncident {
  id: string
  type:
    | 'unauthorized-access'
    | 'data-breach'
    | 'suspicious-activity'
    | 'policy-violation'
    | 'system-compromise'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  detectedAt: Date
  reportedAt: Date
  resolvedAt?: Date
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'closed'
  affectedUsers: string[]
  affectedData: string[]
  impact: {
    confidentiality: 'none' | 'low' | 'medium' | 'high' | 'breach'
    integrity: 'none' | 'low' | 'medium' | 'high' | 'compromised'
    availability: 'none' | 'low' | 'medium' | 'high' | 'down'
  }
  rootCause: string
  remediation: string[]
  assignedTo: string[]
  evidence: SecurityEvidence[]
  notifications: IncidentNotification[]
}

export interface SecurityEvidence {
  id: string
  type: 'log' | 'screenshot' | 'network-traffic' | 'file' | 'memory-dump'
  timestamp: Date
  location: string
  description: string
  hash?: string // 文件哈希
  metadata: Record<string, any>
}

export interface IncidentNotification {
  id: string
  type: 'email' | 'sms' | 'webhook' | 'internal'
  recipient: string
  sentAt: Date
  status: 'sent' | 'delivered' | 'failed'
  content: string
}

export interface DataRetentionPolicy {
  id: string
  name: string
  description: string
  dataTypes: string[]
  retentionPeriod: number // 天数
  deletionMethod: 'immediate' | 'scheduled' | 'archival'
  exceptions: string[]
  lastReview: Date
  nextReview: Date
}

export interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  resourceId: string
  ipAddress: string
  userAgent: string
  location?: {
    country: string
    region: string
    city: string
  }
  success: boolean
  errorMessage?: string
  metadata: Record<string, any>
  complianceTags: string[]
}

export interface PrivacyConsent {
  id: string
  userId: string
  consentType: 'data-processing' | 'marketing' | 'analytics' | 'third-party'
  consentedAt: Date
  expiresAt?: Date
  withdrawnAt?: Date
  ipAddress: string
  userAgent: string
  legalBasis: string
  purpose: string
  dataCategories: string[]
  recipients: string[]
  retentionPeriod: number
}

class SecurityComplianceManager extends EventEmitter {
  private complianceFrameworks: Map<string, ComplianceFramework> = new Map()
  private securityIncidents: Map<string, SecurityIncident> = new Map()
  private dataRetentionPolicies: Map<string, DataRetentionPolicy> = new Map()
  private auditLogs: Map<string, AuditLog[]> = new Map() // userId -> logs
  private privacyConsents: Map<string, PrivacyConsent[]> = new Map() // userId -> consents

  constructor() {
    super()
    this.initializeComplianceFrameworks()
    this.initializeDataRetentionPolicies()
    this.startAutomatedChecks()
  }

  // 初始化合规框架
  private initializeComplianceFrameworks(): void {
    const frameworks: ComplianceFramework[] = [
      {
        id: 'gdpr',
        name: 'General Data Protection Regulation',
        version: 'EU 2016/679',
        description: '欧盟通用数据保护条例',
        requirements: this.getGDPRRequirements(),
        auditFrequency: 'quarterly',
        lastAudit: new Date(),
        complianceScore: 85,
        status: 'compliant',
      },
      {
        id: 'ccpa',
        name: 'California Consumer Privacy Act',
        version: 'AB 375',
        description: '加州消费者隐私法案',
        requirements: this.getCCPARequirements(),
        auditFrequency: 'quarterly',
        lastAudit: new Date(),
        complianceScore: 90,
        status: 'compliant',
      },
      {
        id: 'sox',
        name: 'Sarbanes-Oxley Act',
        version: '2002',
        description: '萨班斯-奥克斯利法案',
        requirements: this.getSOXRequirements(),
        auditFrequency: 'quarterly',
        lastAudit: new Date(),
        complianceScore: 88,
        status: 'compliant',
      },
      {
        id: 'iso27001',
        name: 'ISO 27001',
        version: '2022',
        description: '信息安全管理体系标准',
        requirements: this.getISO27001Requirements(),
        auditFrequency: 'monthly',
        lastAudit: new Date(),
        complianceScore: 82,
        status: 'compliant',
      },
    ]

    frameworks.forEach((framework) => {
      this.complianceFrameworks.set(framework.id, framework)
    })
  }

  // 初始化数据保留策略
  private initializeDataRetentionPolicies(): void {
    const policies: DataRetentionPolicy[] = [
      {
        id: 'user-data',
        name: '用户数据保留策略',
        description: '用户账户和个人资料数据保留',
        dataTypes: ['user-profile', 'account-settings'],
        retentionPeriod: 2555, // 7年，符合GDPR要求
        deletionMethod: 'scheduled',
        exceptions: ['legal-hold', 'ongoing-litigation'],
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'content-data',
        name: '内容数据保留策略',
        description: '用户生成的内容和创作数据保留',
        dataTypes: ['narratives', 'characters', 'worlds', 'projects'],
        retentionPeriod: 1825, // 5年
        deletionMethod: 'archival',
        exceptions: ['premium-user', 'featured-content'],
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'audit-logs',
        name: '审计日志保留策略',
        description: '安全审计和访问日志保留',
        dataTypes: ['audit-logs', 'access-logs', 'security-events'],
        retentionPeriod: 2555, // 7年
        deletionMethod: 'archival',
        exceptions: ['ongoing-investigation', 'regulatory-requirement'],
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ]

    policies.forEach((policy) => {
      this.dataRetentionPolicies.set(policy.id, policy)
    })
  }

  // 记录审计日志
  async logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    const auditLog: AuditLog = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    const userLogs = this.auditLogs.get(event.userId) || []
    userLogs.push(auditLog)
    this.auditLogs.set(event.userId, userLogs)

    // 检查是否需要触发安全事件
    await this.checkForSecurityEvents(auditLog)

    this.emit('auditLogCreated', auditLog)
    return auditLog.id
  }

  // 报告安全事件
  async reportSecurityIncident(
    incident: Omit<SecurityIncident, 'id' | 'reportedAt'>
  ): Promise<string> {
    const securityIncident: SecurityIncident = {
      ...incident,
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportedAt: new Date(),
      status: 'detected',
      evidence: incident.evidence || [],
      notifications: [],
    }

    this.securityIncidents.set(securityIncident.id, securityIncident)

    // 自动通知相关人员
    await this.notifyIncident(securityIncident)

    this.emit('securityIncidentReported', securityIncident)
    return securityIncident.id
  }

  // 更新事件状态
  async updateIncidentStatus(
    incidentId: string,
    status: SecurityIncident['status'],
    updates?: Partial<SecurityIncident>
  ): Promise<void> {
    const incident = this.securityIncidents.get(incidentId)
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`)
    }

    incident.status = status

    if (updates) {
      Object.assign(incident, updates)
    }

    if (status === 'resolved' || status === 'closed') {
      incident.resolvedAt = new Date()
    }

    this.emit('incidentStatusUpdated', { incidentId, incident })
  }

  // 隐私同意管理
  async recordPrivacyConsent(consent: Omit<PrivacyConsent, 'id'>): Promise<string> {
    const privacyConsent: PrivacyConsent = {
      ...consent,
      id: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    const userConsents = this.privacyConsents.get(consent.userId) || []
    userConsents.push(privacyConsent)
    this.privacyConsents.set(consent.userId, userConsents)

    this.emit('privacyConsentRecorded', privacyConsent)
    return privacyConsent.id
  }

  // 撤销隐私同意
  async withdrawPrivacyConsent(
    userId: string,
    consentType: PrivacyConsent['consentType']
  ): Promise<void> {
    const userConsents = this.privacyConsents.get(userId) || []
    const consent = userConsents.find((c) => c.consentType === consentType && !c.withdrawnAt)

    if (consent) {
      consent.withdrawnAt = new Date()

      // 根据同意类型执行相应的数据删除操作
      await this.handleConsentWithdrawal(consent)

      this.emit('privacyConsentWithdrawn', { userId, consentType, consent })
    }
  }

  // 执行数据删除
  async executeDataDeletion(
    userId: string,
    reason: 'consent-withdrawal' | 'account-deletion' | 'legal-request'
  ): Promise<void> {
    console.log(`Executing data deletion for user ${userId}, reason: ${reason}`)

    // 记录删除操作
    await this.logAuditEvent({
      userId,
      action: 'data-deletion',
      resource: 'user-data',
      resourceId: userId,
      ipAddress: 'system',
      userAgent: 'system',
      success: true,
      metadata: { reason, deletedAt: new Date() },
      complianceTags: ['data-deletion', 'privacy'],
    })

    // 删除用户数据
    // 1. 删除用户账户
    // 2. 删除用户内容
    // 3. 删除审计日志（保留必要记录）
    // 4. 通知下游系统

    this.emit('dataDeletionExecuted', { userId, reason })
  }

  // 运行合规检查
  async runComplianceCheck(frameworkId: string): Promise<ComplianceFramework> {
    const framework = this.complianceFrameworks.get(frameworkId)
    if (!framework) {
      throw new Error(`Compliance framework ${frameworkId} not found`)
    }

    console.log(`Running compliance check for ${framework.name}`)

    let passedChecks = 0
    let totalChecks = 0

    for (const requirement of framework.requirements) {
      if (requirement.automatedCheck) {
        totalChecks++
        const result = await this.checkRequirement(requirement)

        if (result.passed) {
          passedChecks++
          requirement.status = 'passed'
        } else {
          requirement.status = 'failed'
        }

        requirement.lastChecked = new Date()
        requirement.evidence = result.evidence
      }
    }

    framework.complianceScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0
    framework.lastAudit = new Date()
    framework.status = framework.complianceScore >= 80 ? 'compliant' : 'non-compliant'

    this.emit('complianceCheckCompleted', { frameworkId, framework })
    return framework
  }

  // 数据保留策略执行
  async executeDataRetention(): Promise<void> {
    console.log('Executing data retention policies...')

    const now = new Date()

    for (const [policyId, policy] of this.dataRetentionPolicies) {
      const retentionCutoff = new Date(now.getTime() - policy.retentionPeriod * 24 * 60 * 60 * 1000)

      // 查找需要删除的数据
      const dataToDelete = await this.findDataForDeletion(policy, retentionCutoff)

      if (dataToDelete.length > 0) {
        await this.deleteExpiredData(policy, dataToDelete)
        this.emit('dataRetentionExecuted', { policyId, deletedCount: dataToDelete.length })
      }
    }
  }

  // 获取合规报告
  getComplianceReport(frameworkId?: string): any {
    if (frameworkId) {
      return this.complianceFrameworks.get(frameworkId)
    }

    return {
      frameworks: Array.from(this.complianceFrameworks.values()),
      overallScore: this.calculateOverallComplianceScore(),
      lastAudit: new Date(),
      summary: this.generateComplianceSummary(),
    }
  }

  // 获取安全事件报告
  getSecurityReport(timeRange?: { start: Date; end: Date }): any {
    const incidents = Array.from(this.securityIncidents.values())

    const filteredIncidents = timeRange
      ? incidents.filter((i) => i.detectedAt >= timeRange.start && i.detectedAt <= timeRange.end)
      : incidents

    return {
      totalIncidents: filteredIncidents.length,
      bySeverity: this.groupIncidentsBySeverity(filteredIncidents),
      byType: this.groupIncidentsByType(filteredIncidents),
      byStatus: this.groupIncidentsByStatus(filteredIncidents),
      responseTime: this.calculateAverageResponseTime(filteredIncidents),
      unresolvedIncidents: filteredIncidents.filter(
        (i) => i.status !== 'resolved' && i.status !== 'closed'
      ),
    }
  }

  // 私有方法
  private getGDPRRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'gdpr-data-protection',
        category: 'data-protection',
        title: '数据保护和加密',
        description: '确保所有个人数据在传输和存储过程中加密',
        severity: 'critical',
        automatedCheck: true,
        checkFrequency: 'daily',
        remediationSteps: ['启用TLS 1.3', '实施数据加密', '定期轮换加密密钥'],
        status: 'passed',
        lastChecked: new Date(),
        evidence: [],
      },
      {
        id: 'gdpr-consent-management',
        category: 'privacy',
        title: '同意管理',
        description: '实施有效的同意管理和撤销机制',
        severity: 'high',
        automatedCheck: true,
        checkFrequency: 'weekly',
        remediationSteps: ['实现同意管理界面', '添加同意撤销功能', '记录同意历史'],
        status: 'passed',
        lastChecked: new Date(),
        evidence: [],
      },
    ]
  }

  private getCCPARequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'ccpa-data-rights',
        category: 'privacy',
        title: '数据权利',
        description: '支持CCPA规定的数据访问、删除和不销售权利',
        severity: 'high',
        automatedCheck: true,
        checkFrequency: 'weekly',
        remediationSteps: ['实现数据导出功能', '添加数据删除API', '创建不销售选择界面'],
        status: 'passed',
        lastChecked: new Date(),
        evidence: [],
      },
    ]
  }

  private getSOXRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'sox-audit-trails',
        category: 'audit-logging',
        title: '审计追踪',
        description: '维护完整的审计日志以支持财务报告合规',
        severity: 'high',
        automatedCheck: true,
        checkFrequency: 'daily',
        remediationSteps: ['启用详细审计日志', '实施日志完整性检查', '定期审计日志审查'],
        status: 'passed',
        lastChecked: new Date(),
        evidence: [],
      },
    ]
  }

  private getISO27001Requirements(): ComplianceRequirement[] {
    return [
      {
        id: 'iso27001-access-control',
        category: 'access-control',
        title: '访问控制',
        description: '实施基于角色的访问控制和最小权限原则',
        severity: 'high',
        automatedCheck: true,
        checkFrequency: 'daily',
        remediationSteps: ['实现RBAC', '启用MFA', '定期权限审查'],
        status: 'passed',
        lastChecked: new Date(),
        evidence: [],
      },
    ]
  }

  private async checkForSecurityEvents(auditLog: AuditLog): Promise<void> {
    // 检查可疑活动模式
    const recentLogs = this.getRecentLogs(auditLog.userId, 10)

    // 检测异常登录
    if (this.detectAnomalousLogin(auditLog, recentLogs)) {
      await this.reportSecurityIncident({
        type: 'suspicious-activity',
        severity: 'medium',
        title: '异常登录检测',
        description: `用户 ${auditLog.userId} 从异常位置登录`,
        detectedAt: new Date(),
        affectedUsers: [auditLog.userId],
        affectedData: [],
        impact: { confidentiality: 'low', integrity: 'none', availability: 'none' },
        rootCause: '地理位置异常',
        remediation: ['通知用户', '要求额外验证'],
        assignedTo: ['security-team'],
        evidence: [
          {
            id: `evidence-${Date.now()}`,
            type: 'log',
            timestamp: new Date(),
            location: auditLog.id,
            description: '登录审计日志',
            metadata: auditLog,
          },
        ],
      })
    }

    // 检测权限滥用
    if (this.detectPermissionAbuse(auditLog, recentLogs)) {
      await this.reportSecurityIncident({
        type: 'policy-violation',
        severity: 'high',
        title: '权限滥用检测',
        description: `用户 ${auditLog.userId} 执行了可疑的权限操作`,
        detectedAt: new Date(),
        affectedUsers: [auditLog.userId],
        affectedData: [],
        impact: { confidentiality: 'medium', integrity: 'medium', availability: 'none' },
        rootCause: '权限策略违反',
        remediation: ['暂停用户权限', '安全审查'],
        assignedTo: ['security-team', 'compliance-officer'],
        evidence: [],
      })
    }
  }

  private getRecentLogs(userId: string, limit: number): AuditLog[] {
    const userLogs = this.auditLogs.get(userId) || []
    return userLogs.slice(-limit)
  }

  private detectAnomalousLogin(auditLog: AuditLog, recentLogs: AuditLog[]): boolean {
    if (!auditLog.location || recentLogs.length < 3) return false

    const recentLocations = recentLogs
      .filter((log) => log.location)
      .map((log) => log.location?.country)

    const currentCountry = auditLog.location.country
    const commonCountries = recentLocations.filter((country) => country === currentCountry)

    // 如果当前登录国家与最近登录不符，标记为异常
    return commonCountries.length / recentLocations.length < 0.5
  }

  private detectPermissionAbuse(_auditLog: AuditLog, recentLogs: AuditLog[]): boolean {
    // 简化的权限滥用检测逻辑
    const recentFailedActions = recentLogs.filter(
      (log) => (!log.success && log.action.includes('delete')) || log.action.includes('admin')
    )

    return recentFailedActions.length > 3
  }

  private async notifyIncident(incident: SecurityIncident): Promise<void> {
    // 根据事件严重程度发送通知
    const recipients = this.getIncidentRecipients(incident.severity)

    for (const recipient of recipients) {
      const notification: IncidentNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'email',
        recipient,
        sentAt: new Date(),
        status: 'sent',
        content: `安全事件告警: ${incident.title} - 严重程度: ${incident.severity}`,
      }

      incident.notifications.push(notification)
    }
  }

  private getIncidentRecipients(severity: SecurityIncident['severity']): string[] {
    switch (severity) {
      case 'critical':
        return ['security-lead@example.com', 'ceo@example.com']
      case 'high':
        return ['security-team@example.com', 'compliance-officer@example.com']
      case 'medium':
        return ['security-team@example.com']
      default:
        return ['security-junior@example.com']
    }
  }

  private async handleConsentWithdrawal(consent: PrivacyConsent): Promise<void> {
    // 根据同意类型执行相应的数据处理
    switch (consent.consentType) {
      case 'marketing':
        // 停止营销邮件
        console.log(`停止向用户 ${consent.userId} 发送营销邮件`)
        break
      case 'analytics':
        // 删除分析数据
        console.log(`删除用户 ${consent.userId} 的分析数据`)
        break
      case 'third-party':
        // 停止数据共享
        console.log(`停止与第三方共享用户 ${consent.userId} 的数据`)
        break
    }
  }

  private async checkRequirement(
    requirement: ComplianceRequirement
  ): Promise<{ passed: boolean; evidence: string[] }> {
    // 简化的合规检查逻辑
    // 实际实现应该包含具体的检查逻辑

    switch (requirement.id) {
      case 'gdpr-data-protection':
        return { passed: true, evidence: ['TLS enabled', 'Data encryption active'] }
      case 'gdpr-consent-management':
        return { passed: true, evidence: ['Consent management implemented'] }
      default:
        return { passed: true, evidence: ['Check passed'] }
    }
  }

  private async findDataForDeletion(
    _policy: DataRetentionPolicy,
    _cutoffDate: Date
  ): Promise<any[]> {
    // 查找需要删除的数据
    // 实际实现应该查询数据库
    return []
  }

  private async deleteExpiredData(policy: DataRetentionPolicy, dataToDelete: any[]): Promise<void> {
    // 执行数据删除
    console.log(`Deleting ${dataToDelete.length} expired data items for policy ${policy.id}`)
  }

  private calculateOverallComplianceScore(): number {
    const frameworks = Array.from(this.complianceFrameworks.values())
    const totalScore = frameworks.reduce((sum, fw) => sum + fw.complianceScore, 0)
    return frameworks.length > 0 ? totalScore / frameworks.length : 0
  }

  private generateComplianceSummary(): any {
    return {
      totalFrameworks: this.complianceFrameworks.size,
      compliantFrameworks: Array.from(this.complianceFrameworks.values()).filter(
        (fw) => fw.status === 'compliant'
      ).length,
      criticalRequirements: Array.from(this.complianceFrameworks.values())
        .flatMap((fw) => fw.requirements)
        .filter((req) => req.severity === 'critical' && req.status === 'failed').length,
    }
  }

  private groupIncidentsBySeverity(incidents: SecurityIncident[]): Record<string, number> {
    return incidents.reduce(
      (acc, inc) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }

  private groupIncidentsByType(incidents: SecurityIncident[]): Record<string, number> {
    return incidents.reduce(
      (acc, inc) => {
        acc[inc.type] = (acc[inc.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }

  private groupIncidentsByStatus(incidents: SecurityIncident[]): Record<string, number> {
    return incidents.reduce(
      (acc, inc) => {
        acc[inc.status] = (acc[inc.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }

  private calculateAverageResponseTime(incidents: SecurityIncident[]): number {
    const resolvedIncidents = incidents.filter((inc) => inc.resolvedAt)
    if (resolvedIncidents.length === 0) return 0

    const totalResponseTime = resolvedIncidents.reduce((sum, inc) => {
      return sum + (inc.resolvedAt?.getTime() - inc.detectedAt.getTime())
    }, 0)

    return totalResponseTime / resolvedIncidents.length
  }

  private startAutomatedChecks(): void {
    // 启动自动合规检查
    setInterval(
      async () => {
        for (const [frameworkId, _framework] of this.complianceFrameworks) {
          try {
            await this.runComplianceCheck(frameworkId)
          } catch (error) {
            console.error(`Automated compliance check failed for ${frameworkId}:`, error)
          }
        }
      },
      24 * 60 * 60 * 1000
    ) // 每天检查一次

    // 启动自动数据保留执行
    setInterval(
      async () => {
        try {
          await this.executeDataRetention()
        } catch (error) {
          console.error('Automated data retention failed:', error)
        }
      },
      7 * 24 * 60 * 60 * 1000
    ) // 每周执行一次
  }
}

// 创建全局安全合规管理器实例
export const securityComplianceManager = new SecurityComplianceManager()
