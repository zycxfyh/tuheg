/**
 * 创世星环 - 协作管理器插件
 * 多用户协作创作和实时同步工具
 */

const axios = require('axios')
const winston = require('winston')
const crypto = require('crypto')

// 创世星环协作管理器插件
class CollaborationManager {
  constructor() {
    this.name = 'CollaborationManager'
    this.description = '多用户协作创作和实时同步工具'
    this.version = '1.0.0'
    this.author = 'Creation Ring Team'

    // 支持的工具
    this.tools = {
      session: this.createSession.bind(this),
      join: this.joinSession.bind(this),
      sync: this.syncChanges.bind(this),
      merge: this.mergeContributions.bind(this),
      review: this.reviewChanges.bind(this),
      permission: this.managePermissions.bind(this),
      history: this.trackHistory.bind(this),
    }

    // 配置
    this.config = {
      model: process.env.COLLABORATION_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.MAX_COLLABORATION_TOKENS || '1500', 10),
      temperature: 0.3,
      apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.API_KEY,
      maxSessionUsers: parseInt(process.env.MAX_SESSION_USERS || '10', 10),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '480', 10), // 8小时
    }

    // 日志器
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [CollaborationManager] ${level.toUpperCase()}: ${message}`
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/collaboration-manager.log',
        }),
      ],
    })

    // 协作会话存储
    this.activeSessions = new Map()
    this.userSessions = new Map()
    this.sessionTimeouts = new Map()

    // 权限级别
    this.permissionLevels = {
      owner: 100,
      editor: 70,
      reviewer: 50,
      reader: 20,
      guest: 10,
    }
  }

  /**
   * VCP插件初始化
   */
  async initialize(vcpContext) {
    this.vcp = vcpContext

    // 启动会话清理定时器
    this.startSessionCleanupTimer()

    this.logger.info('协作管理器插件初始化完成')
  }

  /**
   * 处理工具调用
   */
  async processToolCall(toolName, parameters, sessionId) {
    this.logger.info(`处理工具调用: ${toolName}`, { parameters, sessionId })

    if (!this.tools[toolName]) {
      throw new Error(`未知工具: ${toolName}`)
    }

    try {
      const result = await this.tools[toolName](parameters, sessionId)
      this.logger.info(`工具调用完成: ${toolName}`)
      return result
    } catch (error) {
      this.logger.error(`工具调用失败: ${toolName}`, error)
      throw error
    }
  }

  /**
   * 创建协作会话
   */
  async createSession(parameters, sessionId) {
    const {
      name,
      description,
      projectType = 'story',
      maxUsers = this.config.maxSessionUsers,
      privacy = 'private',
      tags = [],
      settings = {},
    } = parameters

    this.logger.info('创建协作会话', { name, projectType, privacy })

    const session = {
      id: `collab-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      name,
      description,
      projectType,
      maxUsers,
      privacy,
      tags,
      settings,
      owner: sessionId,
      createdAt: new Date(),
      status: 'active',
      participants: [
        {
          userId: sessionId,
          role: 'owner',
          permissions: this.permissionLevels.owner,
          joinedAt: new Date(),
          status: 'active',
        },
      ],
      content: {
        story: null,
        characters: [],
        world: null,
        chapters: [],
        notes: [],
      },
      version: 1,
      history: [
        {
          version: 1,
          timestamp: new Date(),
          changes: ['会话创建'],
          author: sessionId,
        },
      ],
      conflicts: [],
      reviews: [],
    }

    this.activeSessions.set(session.id, session)
    this.userSessions.set(sessionId, session.id)

    // 设置会话超时
    this.setSessionTimeout(session.id)

    this.logger.info('协作会话创建成功', { sessionId: session.id })

    return {
      success: true,
      session: this.sanitizeSessionForUser(session, sessionId),
      metadata: {
        createdAt: new Date(),
        sessionId: session.id,
      },
    }
  }

  /**
   * 加入协作会话
   */
  async joinSession(parameters, sessionId) {
    const { sessionId: targetSessionId, role = 'editor', message = '' } = parameters

    this.logger.info('用户加入会话', { targetSessionId, role })

    const session = this.activeSessions.get(targetSessionId)
    if (!session) {
      throw new Error('协作会话不存在')
    }

    if (session.status !== 'active') {
      throw new Error('协作会话已结束')
    }

    if (session.participants.length >= session.maxUsers) {
      throw new Error('协作会话已满员')
    }

    // 检查是否已经在会话中
    const existingParticipant = session.participants.find((p) => p.userId === sessionId)
    if (existingParticipant) {
      return {
        success: true,
        message: '您已经在协作会话中',
        session: this.sanitizeSessionForUser(session, sessionId),
      }
    }

    // 添加参与者
    const participant = {
      userId: sessionId,
      role,
      permissions: this.permissionLevels[role] || this.permissionLevels.editor,
      joinedAt: new Date(),
      status: 'active',
      joinMessage: message,
    }

    session.participants.push(participant)
    this.userSessions.set(sessionId, targetSessionId)

    // 记录历史
    session.history.push({
      version: session.version,
      timestamp: new Date(),
      changes: [`用户 ${sessionId} 加入会话，角色：${role}`],
      author: sessionId,
    })

    // 广播加入通知
    await this.broadcastToSession(targetSessionId, {
      type: 'user_joined',
      userId: sessionId,
      role,
      message,
    })

    this.logger.info('用户成功加入协作会话', { targetSessionId, sessionId })

    return {
      success: true,
      session: this.sanitizeSessionForUser(session, sessionId),
      metadata: {
        joinedAt: new Date(),
        role,
      },
    }
  }

  /**
   * 同步更改
   */
  async syncChanges(parameters, sessionId) {
    const { sessionId: targetSessionId, changes, version, type = 'content' } = parameters

    this.logger.info('同步更改', { targetSessionId, version, type })

    const session = this.activeSessions.get(targetSessionId)
    if (!session) {
      throw new Error('协作会话不存在')
    }

    const participant = session.participants.find((p) => p.userId === sessionId)
    if (!participant || participant.status !== 'active') {
      throw new Error('您不是协作会话的活跃参与者')
    }

    // 验证权限
    if (!this.hasPermission(participant.permissions, 'editor')) {
      throw new Error('权限不足，无法进行编辑操作')
    }

    // 检查版本冲突
    if (version !== session.version) {
      // 版本冲突，需要合并
      return await this.handleVersionConflict(session, changes, version, sessionId)
    }

    // 应用更改
    session.version++
    session.lastModified = new Date()

    // 记录历史
    session.history.push({
      version: session.version,
      timestamp: new Date(),
      changes: [`${type} 更新：${changes.length} 处更改`],
      author: sessionId,
      details: changes,
    })

    // 应用具体更改
    this.applyChangesToSession(session, changes, type)

    // 广播更改
    await this.broadcastToSession(
      targetSessionId,
      {
        type: 'content_updated',
        changes,
        version: session.version,
        author: sessionId,
        timestamp: new Date(),
      },
      sessionId
    ) // 排除发送者

    return {
      success: true,
      version: session.version,
      conflicts: [],
      metadata: {
        syncedAt: new Date(),
        changeCount: changes.length,
      },
    }
  }

  /**
   * 合并贡献
   */
  async mergeContributions(parameters, sessionId) {
    const { sessionId: targetSessionId, contributions, mergeStrategy = 'consensus' } = parameters

    this.logger.info('合并贡献', { targetSessionId, mergeStrategy })

    const session = this.activeSessions.get(targetSessionId)
    if (!session) {
      throw new Error('协作会话不存在')
    }

    const participant = session.participants.find((p) => p.userId === sessionId)
    if (!participant || !this.hasPermission(participant.permissions, 'editor')) {
      throw new Error('权限不足，无法进行合并操作')
    }

    // 使用AI分析和合并贡献
    const mergePrompt = this.buildMergePrompt({
      contributions,
      mergeStrategy,
      session,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个专业的协作内容整合专家。请智能地合并多个贡献者的内容。',
      userPrompt: mergePrompt,
      maxTokens: 2000,
    })

    const mergedContent = this.parseMergedContent(aiResponse)

    // 创建新的版本
    session.version++
    session.lastModified = new Date()

    // 记录历史
    session.history.push({
      version: session.version,
      timestamp: new Date(),
      changes: [`合并 ${contributions.length} 项贡献，策略：${mergeStrategy}`],
      author: sessionId,
      details: mergedContent,
    })

    // 应用合并的内容
    this.applyMergedContent(session, mergedContent)

    // 广播合并结果
    await this.broadcastToSession(targetSessionId, {
      type: 'content_merged',
      version: session.version,
      author: sessionId,
      strategy: mergeStrategy,
    })

    return {
      success: true,
      mergedContent,
      version: session.version,
      metadata: {
        mergedAt: new Date(),
        strategy: mergeStrategy,
        contributorCount: contributions.length,
      },
    }
  }

  /**
   * 审查更改
   */
  async reviewChanges(parameters, sessionId) {
    const {
      sessionId: targetSessionId,
      version,
      reviewType = 'content',
      comments = [],
      approval = null,
    } = parameters

    this.logger.info('审查更改', { targetSessionId, version, reviewType })

    const session = this.activeSessions.get(targetSessionId)
    if (!session) {
      throw new Error('协作会话不存在')
    }

    const participant = session.participants.find((p) => p.userId === sessionId)
    if (!participant || !this.hasPermission(participant.permissions, 'reviewer')) {
      throw new Error('权限不足，无法进行审查操作')
    }

    const review = {
      id: `review-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      version,
      reviewer: sessionId,
      reviewType,
      comments,
      approval,
      timestamp: new Date(),
      status: 'completed',
    }

    session.reviews.push(review)

    // 记录历史
    session.history.push({
      version: session.version,
      timestamp: new Date(),
      changes: [`版本 ${version} 审查完成，状态：${approval ? '通过' : '驳回'}`],
      author: sessionId,
    })

    // 广播审查结果
    await this.broadcastToSession(targetSessionId, {
      type: 'review_completed',
      review,
      version,
    })

    return {
      success: true,
      review,
      metadata: {
        reviewedAt: new Date(),
        version,
      },
    }
  }

  /**
   * 管理权限
   */
  async managePermissions(parameters, sessionId) {
    const { sessionId: targetSessionId, userId, action, newRole = null } = parameters

    this.logger.info('管理权限', { targetSessionId, userId, action })

    const session = this.activeSessions.get(targetSessionId)
    if (!session) {
      throw new Error('协作会话不存在')
    }

    // 只有所有者可以管理权限
    if (session.owner !== sessionId) {
      throw new Error('只有会话所有者可以管理权限')
    }

    const targetParticipant = session.participants.find((p) => p.userId === userId)
    if (!targetParticipant) {
      throw new Error('目标用户不在协作会话中')
    }

    switch (action) {
      case 'promote':
        if (!newRole || !this.permissionLevels[newRole]) {
          throw new Error('无效的角色')
        }
        targetParticipant.role = newRole
        targetParticipant.permissions = this.permissionLevels[newRole]
        break

      case 'demote':
        if (targetParticipant.role === 'owner') {
          throw new Error('无法降低所有者权限')
        }
        targetParticipant.role = 'reader'
        targetParticipant.permissions = this.permissionLevels.reader
        break

      case 'remove':
        if (targetParticipant.role === 'owner') {
          throw new Error('无法移除所有者')
        }
        targetParticipant.status = 'removed'
        this.userSessions.delete(userId)
        break

      default:
        throw new Error('无效的操作')
    }

    // 记录历史
    session.history.push({
      version: session.version,
      timestamp: new Date(),
      changes: [`权限管理：${action} 用户 ${userId}`],
      author: sessionId,
    })

    // 广播权限更改
    await this.broadcastToSession(targetSessionId, {
      type: 'permissions_updated',
      userId,
      action,
      newRole: targetParticipant.role,
    })

    return {
      success: true,
      userId,
      action,
      newRole: targetParticipant.role,
      metadata: {
        updatedAt: new Date(),
      },
    }
  }

  /**
   * 跟踪历史
   */
  async trackHistory(parameters, sessionId) {
    const {
      sessionId: targetSessionId,
      fromVersion = 1,
      toVersion = null,
      author = null,
    } = parameters

    this.logger.info('跟踪历史', { targetSessionId, fromVersion, toVersion })

    const session = this.activeSessions.get(targetSessionId)
    if (!session) {
      throw new Error('协作会话不存在')
    }

    const participant = session.participants.find((p) => p.userId === sessionId)
    if (!participant) {
      throw new Error('您不是协作会话的参与者')
    }

    let history = session.history.filter((h) => h.version >= fromVersion)

    if (toVersion) {
      history = history.filter((h) => h.version <= toVersion)
    }

    if (author) {
      history = history.filter((h) => h.author === author)
    }

    // 按版本排序
    history.sort((a, b) => b.version - a.version)

    return {
      success: true,
      history,
      metadata: {
        sessionId: targetSessionId,
        fromVersion,
        toVersion,
        totalEntries: history.length,
      },
    }
  }

  // ==================== 辅助方法 ====================

  sanitizeSessionForUser(session, userId) {
    const participant = session.participants.find((p) => p.userId === userId)
    const permissionLevel = participant ? participant.permissions : 0

    // 根据权限过滤敏感信息
    const sanitized = { ...session }

    if (permissionLevel < this.permissionLevels.editor) {
      // 读者只能看到基本信息
      sanitized.content = undefined
      sanitized.history = undefined
      sanitized.reviews = undefined
    }

    return sanitized
  }

  hasPermission(userPermissions, requiredRole) {
    return userPermissions >= this.permissionLevels[requiredRole]
  }

  async handleVersionConflict(session, _changes, clientVersion, _userId) {
    // 简单版本冲突解决：总是接受最新版本
    const serverVersion = session.version

    return {
      success: false,
      conflict: true,
      serverVersion,
      clientVersion,
      message: '版本冲突，请刷新后重试',
      resolution: 'server_wins',
    }
  }

  applyChangesToSession(session, changes, type) {
    // 根据更改类型应用到会话内容
    switch (type) {
      case 'story':
        if (!session.content.story) session.content.story = {}
        Object.assign(session.content.story, changes)
        break
      case 'character':
        // 处理角色更改
        break
      case 'world':
        if (!session.content.world) session.content.world = {}
        Object.assign(session.content.world, changes)
        break
      default:
        // 通用更改应用
        Object.assign(session.content, changes)
    }
  }

  async broadcastToSession(sessionId, message, excludeUserId = null) {
    // 通过WebSocket广播消息
    // 这里需要与WebSocket服务器集成
    try {
      if (this.vcp?.webSocketServer) {
        const session = this.activeSessions.get(sessionId)
        session.participants.forEach((participant) => {
          if (participant.status === 'active' && participant.userId !== excludeUserId) {
            // 发送WebSocket消息
            this.vcp.webSocketServer.sendToUser(participant.userId, {
              type: 'collaboration_update',
              sessionId,
              ...message,
            })
          }
        })
      }
    } catch (error) {
      this.logger.warn('广播消息失败:', error.message)
    }
  }

  buildMergePrompt(options) {
    const { contributions, mergeStrategy, session } = options

    const prompt = `请合并以下协作贡献：

会话类型：${session.projectType}
合并策略：${mergeStrategy}

贡献内容：
${contributions
  .map((contrib, index) => `贡献 ${index + 1}：\n${JSON.stringify(contrib, null, 2)}`)
  .join('\n\n')}

请根据合并策略智能地整合这些贡献，确保：
1. 内容的一致性和连贯性
2. 保留各个贡献的精华部分
3. 解决可能的冲突
4. 保持叙事逻辑的完整性

请提供合并后的最终内容。`

    return prompt
  }

  parseMergedContent(aiResponse) {
    return {
      content: aiResponse.choices[0].message.content,
      mergedAt: new Date(),
      quality: 'high', // 可以后续评估
    }
  }

  applyMergedContent(session, mergedContent) {
    // 将合并的内容应用到会话
    session.content.mergedContent = mergedContent
    session.lastMerged = new Date()
  }

  setSessionTimeout(sessionId) {
    const timeout = setTimeout(
      () => {
        this.endSession(sessionId, 'timeout')
      },
      this.config.sessionTimeout * 60 * 1000
    )

    this.sessionTimeouts.set(sessionId, timeout)
  }

  startSessionCleanupTimer() {
    // 每小时清理一次过期会话
    setInterval(
      () => {
        this.cleanupExpiredSessions()
      },
      60 * 60 * 1000
    )
  }

  cleanupExpiredSessions() {
    const now = Date.now()
    const expiredSessions = []

    for (const [sessionId, session] of this.activeSessions) {
      const sessionAge = now - session.createdAt.getTime()
      if (sessionAge > this.config.sessionTimeout * 60 * 1000) {
        expiredSessions.push(sessionId)
      }
    }

    expiredSessions.forEach((sessionId) => {
      this.endSession(sessionId, 'cleanup')
    })

    if (expiredSessions.length > 0) {
      this.logger.info(`🧹 清理了 ${expiredSessions.length} 个过期会话`)
    }
  }

  endSession(sessionId, reason) {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = 'ended'
      session.endedAt = new Date()
      session.endReason = reason

      // 清理参与者会话映射
      session.participants.forEach((participant) => {
        this.userSessions.delete(participant.userId)
      })

      // 清理超时定时器
      const timeout = this.sessionTimeouts.get(sessionId)
      if (timeout) {
        clearTimeout(timeout)
        this.sessionTimeouts.delete(sessionId)
      }

      // 广播会话结束
      this.broadcastToSession(sessionId, {
        type: 'session_ended',
        reason,
        endedAt: new Date(),
      })

      this.logger.info(`协作会话结束: ${sessionId}, 原因: ${reason}`)
    }
  }

  async callAI(options) {
    const { systemPrompt, userPrompt, maxTokens } = options

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: this.config.temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error) {
      this.logger.error('AI调用失败', error.response?.data || error.message)
      throw new Error('AI服务调用失败')
    }
  }

  /**
   * VCP插件清理
   */
  async cleanup() {
    // 清理所有会话
    for (const sessionId of this.activeSessions.keys()) {
      this.endSession(sessionId, 'shutdown')
    }

    // 清理所有超时定时器
    for (const timeout of this.sessionTimeouts.values()) {
      clearTimeout(timeout)
    }

    this.logger.info('协作管理器插件清理完成')
  }
}

module.exports = CollaborationManager
