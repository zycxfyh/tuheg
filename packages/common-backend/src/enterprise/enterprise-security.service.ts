import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from './audit.service'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { EventEmitter2 } from '@nestjs/event-emitter'

export interface EncryptionOptions {
  algorithm?: string
  keyLength?: number
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'permission_change' | 'data_access' | 'security_alert'
  userId?: string
  tenantId?: string
  resource: string
  action: string
  details: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class EnterpriseSecurityService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  private encryptionKey: Buffer

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2
  ) {
    // 初始化加密密钥
    this.initializeEncryptionKey()
  }

  // ==================== 数据加密 ====================

  /**
   * 加密敏感数据
   */
  encryptData(data: string, options?: EncryptionOptions): string {
    const algorithm = options?.algorithm || this.algorithm
    const iv = randomBytes(16)
    const cipher = createCipheriv(algorithm, this.encryptionKey, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // 返回格式: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  /**
   * 解密数据
   */
  decryptData(encryptedData: string, options?: EncryptionOptions): string {
    const algorithm = options?.algorithm || this.algorithm
    const parts = encryptedData.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = createDecipheriv(algorithm, this.encryptionKey, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * 加密对象中的敏感字段
   */
  encryptSensitiveFields<T extends Record<string, any>>(data: T, sensitiveFields: (keyof T)[]): T {
    const encrypted = { ...data }

    for (const field of sensitiveFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encryptData(encrypted[field]) as any
      }
    }

    return encrypted
  }

  /**
   * 解密对象中的敏感字段
   */
  decryptSensitiveFields<T extends Record<string, any>>(data: T, sensitiveFields: (keyof T)[]): T {
    const decrypted = { ...data }

    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decryptData(decrypted[field]) as any
        } catch (error) {
          // 如果解密失败，保持原值
          console.warn(`Failed to decrypt field ${String(field)}:`, error)
        }
      }
    }

    return decrypted
  }

  // ==================== 安全事件监控 ====================

  /**
   * 记录安全事件
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // 记录到审计日志
    await this.auditService.createAuditLog({
      action: `security.${event.type}`,
      resourceType: event.resource,
      resourceId: event.action,
      userId: event.userId,
      details: {
        ...event.details,
        riskLevel: event.riskLevel,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      },
      riskLevel: this.mapRiskLevel(event.riskLevel),
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      tenantId: event.tenantId,
    })

    // 触发安全事件
    this.eventEmitter.emit('security.event', event)

    // 检查是否需要安全警报
    if (this.shouldTriggerAlert(event)) {
      await this.triggerSecurityAlert(event)
    }
  }

  /**
   * 检测可疑活动
   */
  async detectSuspiciousActivity(
    userId: string,
    tenantId: string,
    activity: {
      type: string
      resource: string
      ipAddress: string
      userAgent: string
      timestamp: Date
    }
  ): Promise<{
    isSuspicious: boolean
    reasons: string[]
    riskScore: number
  }> {
    const reasons: string[] = []
    let riskScore = 0

    // 检查登录异常
    if (activity.type === 'login') {
      const unusualLogin = await this.detectUnusualLogin(userId, activity)
      if (unusualLogin.isUnusual) {
        reasons.push(...unusualLogin.reasons)
        riskScore += unusualLogin.riskScore
      }
    }

    // 检查高频操作
    const highFrequency = await this.detectHighFrequencyActivity(userId, tenantId, activity)
    if (highFrequency.isHighFrequency) {
      reasons.push(...highFrequency.reasons)
      riskScore += highFrequency.riskScore
    }

    // 检查敏感资源访问
    const sensitiveAccess = this.isSensitiveResourceAccess(activity.resource)
    if (sensitiveAccess) {
      reasons.push('Access to sensitive resource')
      riskScore += 30
    }

    // 检查地理位置异常
    const geoAnomaly = await this.detectGeographicAnomaly(userId, activity.ipAddress)
    if (geoAnomaly.isAnomaly) {
      reasons.push(...geoAnomaly.reasons)
      riskScore += geoAnomaly.riskScore
    }

    const isSuspicious = riskScore >= 50

    if (isSuspicious) {
      await this.logSecurityEvent({
        type: 'security_alert',
        userId,
        tenantId,
        resource: activity.resource,
        action: activity.type,
        details: {
          reasons,
          riskScore,
          activity,
        },
        riskLevel: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'medium',
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
      })
    }

    return {
      isSuspicious,
      reasons,
      riskScore,
    }
  }

  // ==================== 访问控制 ====================

  /**
   * 验证用户权限
   */
  async validatePermissions(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<{
    hasPermission: boolean
    reasons: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }> {
    const reasons: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // 获取用户在租户中的角色
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    })

    if (!tenantUser) {
      reasons.push('User is not a member of the tenant')
      return { hasPermission: false, reasons, riskLevel: 'high' }
    }

    // 检查租户级别的权限
    const tenantPermission = this.checkTenantPermission(tenantUser.role as any, resource, action)
    if (!tenantPermission.hasPermission) {
      reasons.push(...tenantPermission.reasons)
      riskLevel = 'medium'
    }

    // 检查资源特定的权限（如果适用）
    if (context?.resourceId) {
      const resourcePermission = await this.checkResourcePermission(
        userId,
        tenantId,
        context.resourceId,
        resource,
        action
      )

      if (!resourcePermission.hasPermission) {
        reasons.push(...resourcePermission.reasons)
        riskLevel = 'high'
      }
    }

    // 检查时间-based限制
    const timeRestriction = this.checkTimeRestrictions(action)
    if (timeRestriction.restricted) {
      reasons.push(...timeRestriction.reasons)
      riskLevel = 'medium'
    }

    const hasPermission = reasons.length === 0

    // 记录权限检查
    await this.auditService.createAuditLog({
      action: `permission.check`,
      resourceType: resource,
      resourceId: context?.resourceId,
      userId,
      details: {
        action,
        hasPermission,
        reasons,
        riskLevel,
        context,
      },
      riskLevel: this.mapRiskLevel(riskLevel),
      tenantId,
    })

    return {
      hasPermission,
      reasons,
      riskLevel,
    }
  }

  /**
   * 创建临时访问令牌
   */
  async createTemporaryAccessToken(
    userId: string,
    tenantId: string,
    resource: string,
    permissions: string[],
    expiresIn: number // 秒
  ): Promise<string> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    const token = await this.prisma.temporaryAccessToken.create({
      data: {
        userId,
        tenantId,
        resource,
        permissions,
        expiresAt,
      },
    })

    // 记录令牌创建
    await this.auditService.createAuditLog({
      action: 'temporary_token.created',
      resourceType: 'token',
      resourceId: token.id,
      userId,
      details: {
        resource,
        permissions,
        expiresAt,
      },
      riskLevel: 'LOW',
      tenantId,
    })

    return token.id
  }

  /**
   * 验证临时访问令牌
   */
  async validateTemporaryToken(
    tokenId: string,
    resource: string,
    action: string
  ): Promise<{
    valid: boolean
    userId?: string
    tenantId?: string
    permissions?: string[]
  }> {
    const token = await this.prisma.temporaryAccessToken.findUnique({
      where: { id: tokenId },
    })

    if (!token) {
      return { valid: false }
    }

    // 检查是否过期
    if (token.expiresAt < new Date()) {
      return { valid: false }
    }

    // 检查权限
    if (!token.permissions.includes(action) && !token.permissions.includes('*')) {
      return { valid: false }
    }

    // 检查资源匹配
    if (token.resource !== resource && token.resource !== '*') {
      return { valid: false }
    }

    return {
      valid: true,
      userId: token.userId,
      tenantId: token.tenantId,
      permissions: token.permissions,
    }
  }

  // ==================== 合规性检查 ====================

  /**
   * 执行GDPR合规检查
   */
  async performGDPRComplianceCheck(tenantId: string): Promise<{
    compliant: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    // 检查数据加密
    const encryptionCheck = await this.checkDataEncryption(tenantId)
    if (!encryptionCheck.encrypted) {
      issues.push('Sensitive data is not properly encrypted')
      recommendations.push('Implement end-to-end encryption for all sensitive data')
    }

    // 检查数据保留政策
    const retentionCheck = await this.checkDataRetentionPolicies(tenantId)
    if (!retentionCheck.hasPolicy) {
      issues.push('No data retention policy defined')
      recommendations.push('Define and implement data retention policies')
    }

    // 检查审计日志
    const auditCheck = await this.checkAuditLogging(tenantId)
    if (!auditCheck.enabled) {
      issues.push('Audit logging is not enabled')
      recommendations.push('Enable comprehensive audit logging')
    }

    // 检查数据处理同意
    const consentCheck = await this.checkDataProcessingConsent(tenantId)
    if (!consentCheck.consentCollected) {
      issues.push('User consent for data processing not collected')
      recommendations.push('Implement user consent management system')
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations,
    }
  }

  /**
   * 执行安全健康检查
   */
  async performSecurityHealthCheck(tenantId: string): Promise<{
    score: number
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 100

    // 检查密码策略
    const passwordPolicy = await this.checkPasswordPolicy(tenantId)
    if (!passwordPolicy.strong) {
      issues.push('Weak password policy')
      recommendations.push('Implement strong password requirements')
      score -= 20
    }

    // 检查多因素认证
    const mfaCheck = await this.checkMFAEnabled(tenantId)
    if (!mfaCheck.enabled) {
      issues.push('Multi-factor authentication not enabled')
      recommendations.push('Enable MFA for all users')
      score -= 15
    }

    // 检查API密钥安全
    const apiKeyCheck = await this.checkAPIKeySecurity(tenantId)
    if (!apiKeyCheck.secure) {
      issues.push('API keys are not properly secured')
      recommendations.push('Implement API key rotation and secure storage')
      score -= 10
    }

    // 检查网络安全
    const networkCheck = await this.checkNetworkSecurity(tenantId)
    if (!networkCheck.secure) {
      issues.push('Network security vulnerabilities detected')
      recommendations.push('Implement network security best practices')
      score -= 15
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化加密密钥
   */
  private initializeEncryptionKey(): void {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }

    this.encryptionKey = scryptSync(key, 'salt', this.keyLength)
  }

  /**
   * 映射风险等级
   */
  private mapRiskLevel(riskLevel: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (riskLevel) {
      case 'low':
        return 'LOW'
      case 'medium':
        return 'MEDIUM'
      case 'high':
        return 'HIGH'
      case 'critical':
        return 'CRITICAL'
      default:
        return 'LOW'
    }
  }

  /**
   * 判断是否需要触发警报
   */
  private shouldTriggerAlert(event: SecurityEvent): boolean {
    return event.riskLevel === 'high' || event.riskLevel === 'critical'
  }

  /**
   * 触发安全警报
   */
  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // 这里可以集成邮件通知、Slack通知等
    console.warn('Security Alert:', event)

    this.eventEmitter.emit('security.alert', event)
  }

  // 其他检测方法的实现...
}
