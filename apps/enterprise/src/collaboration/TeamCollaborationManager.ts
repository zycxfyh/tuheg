// 团队协作管理器
// 实现企业级的团队协作功能，支持多用户实时协作创作

import { EventEmitter } from 'events'
import { crossMemoryNetwork, MemoryEntry } from '../../vcptoolbox/src/PluginFramework'

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  permissions: TeamPermission[]
  joinedAt: Date
  lastActive: Date
  contributionStats: {
    projectsCreated: number
    editsMade: number
    commentsPosted: number
    timeSpent: number // 分钟
  }
}

export interface TeamPermission {
  resource: 'project' | 'narrative' | 'character' | 'world' | 'settings'
  action: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export'
  scope: 'all' | 'owned' | 'shared'
}

export interface CollaborationSession {
  id: string
  projectId: string
  teamId: string
  status: 'active' | 'paused' | 'ended'
  participants: SessionParticipant[]
  startedAt: Date
  lastActivity: Date
  settings: CollaborationSettings
  activityLog: CollaborationActivity[]
}

export interface SessionParticipant {
  memberId: string
  userId: string
  joinedAt: Date
  role: 'host' | 'collaborator' | 'observer'
  currentFocus: string // 当前正在编辑的元素ID
  cursorPosition?: { x: number; y: number }
  isActive: boolean
}

export interface CollaborationSettings {
  realTimeSync: boolean
  conflictResolution: 'manual' | 'automatic' | 'versioned'
  autoSave: boolean
  notifications: boolean
  maxParticipants: number
  sessionTimeout: number // 分钟
}

export interface CollaborationActivity {
  id: string
  timestamp: Date
  participantId: string
  action: 'join' | 'leave' | 'edit' | 'comment' | 'create' | 'delete' | 'merge'
  targetType: 'narrative' | 'character' | 'world' | 'scene' | 'dialogue'
  targetId: string
  details: any
  version?: string
}

export interface Team {
  id: string
  name: string
  description: string
  ownerId: string
  members: TeamMember[]
  projects: TeamProject[]
  settings: TeamSettings
  createdAt: Date
  updatedAt: Date
  stats: TeamStats
}

export interface TeamProject {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'completed' | 'archived'
  members: string[] // member IDs
  permissions: Record<string, TeamPermission[]> // memberId -> permissions
  collaborationHistory: CollaborationSession[]
  createdAt: Date
  updatedAt: Date
}

export interface TeamSettings {
  defaultPermissions: TeamPermission[]
  collaborationEnabled: boolean
  maxProjects: number
  storageLimit: number // GB
  apiRateLimit: number
  customRoles: TeamRole[]
}

export interface TeamRole {
  id: string
  name: string
  description: string
  permissions: TeamPermission[]
  color: string
}

export interface TeamStats {
  totalMembers: number
  activeProjects: number
  totalProjects: number
  storageUsed: number // GB
  collaborationHours: number
  avgSessionDuration: number
  topContributors: Array<{
    memberId: string
    contributions: number
    hoursSpent: number
  }>
}

class TeamCollaborationManager extends EventEmitter {
  private teams: Map<string, Team> = new Map()
  private activeSessions: Map<string, CollaborationSession> = new Map()
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map()

  // 创建团队
  async createTeam(ownerId: string, teamData: {
    name: string
    description: string
    settings?: Partial<TeamSettings>
  }): Promise<Team> {
    const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const defaultSettings: TeamSettings = {
      defaultPermissions: [
        { resource: 'project', action: 'read', scope: 'shared' },
        { resource: 'narrative', action: 'read', scope: 'shared' }
      ],
      collaborationEnabled: true,
      maxProjects: 50,
      storageLimit: 100,
      apiRateLimit: 1000,
      customRoles: []
    }

    const team: Team = {
      id: teamId,
      name: teamData.name,
      description: teamData.description,
      ownerId,
      members: [],
      projects: [],
      settings: { ...defaultSettings, ...teamData.settings },
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalMembers: 0,
        activeProjects: 0,
        totalProjects: 0,
        storageUsed: 0,
        collaborationHours: 0,
        avgSessionDuration: 0,
        topContributors: []
      }
    }

    // 添加所有者为团队成员
    const ownerMember: TeamMember = {
      id: `member-${ownerId}`,
      userId: ownerId,
      teamId,
      role: 'owner',
      permissions: [
        { resource: 'project', action: 'create', scope: 'all' },
        { resource: 'project', action: 'read', scope: 'all' },
        { resource: 'project', action: 'update', scope: 'all' },
        { resource: 'project', action: 'delete', scope: 'all' },
        { resource: 'settings', action: 'update', scope: 'all' }
      ],
      joinedAt: new Date(),
      lastActive: new Date(),
      contributionStats: {
        projectsCreated: 0,
        editsMade: 0,
        commentsPosted: 0,
        timeSpent: 0
      }
    }

    team.members.push(ownerMember)
    team.stats.totalMembers = 1

    this.teams.set(teamId, team)

    this.emit('teamCreated', team)
    return team
  }

  // 邀请团队成员
  async inviteMember(teamId: string, inviterId: string, inviteeData: {
    email: string
    role: TeamMember['role']
    customPermissions?: TeamPermission[]
  }): Promise<{ invitationId: string; inviteLink: string }> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    // 检查邀请者权限
    const inviter = team.members.find(m => m.userId === inviterId)
    if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
      throw new Error('Insufficient permissions to invite members')
    }

    const invitationId = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const inviteLink = `https://creation-ring.com/team/${teamId}/join/${invitationId}`

    // 这里应该发送邀请邮件
    // await this.sendInvitationEmail(inviteeData.email, team.name, inviteLink)

    this.emit('memberInvited', { teamId, invitationId, inviteeData, inviterId })

    return { invitationId, inviteLink }
  }

  // 接受邀请加入团队
  async acceptInvitation(invitationId: string, userId: string): Promise<TeamMember> {
    // 这里应该验证邀请的有效性
    // 暂时模拟接受邀请

    const teamId = 'team-demo' // 从邀请ID中解析
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error('Invalid invitation')
    }

    // 检查是否已经是成员
    const existingMember = team.members.find(m => m.userId === userId)
    if (existingMember) {
      throw new Error('Already a member of this team')
    }

    // 创建新成员
    const newMember: TeamMember = {
      id: `member-${userId}`,
      userId,
      teamId,
      role: 'editor', // 默认角色
      permissions: team.settings.defaultPermissions,
      joinedAt: new Date(),
      lastActive: new Date(),
      contributionStats: {
        projectsCreated: 0,
        editsMade: 0,
        commentsPosted: 0,
        timeSpent: 0
      }
    }

    team.members.push(newMember)
    team.stats.totalMembers++

    this.emit('memberJoined', { teamId, member: newMember })
    return newMember
  }

  // 创建协作项目
  async createProject(teamId: string, creatorId: string, projectData: {
    name: string
    description: string
    initialMembers?: string[]
  }): Promise<TeamProject> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    // 检查创建者权限
    const creator = team.members.find(m => m.userId === creatorId)
    if (!creator) {
      throw new Error('Not a member of this team')
    }

    const canCreate = creator.permissions.some(p =>
      p.resource === 'project' && p.action === 'create'
    )
    if (!canCreate) {
      throw new Error('Insufficient permissions to create projects')
    }

    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const project: TeamProject = {
      id: projectId,
      name: projectData.name,
      description: projectData.description,
      status: 'planning',
      members: [creatorId, ...(projectData.initialMembers || [])],
      permissions: {},
      collaborationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 设置默认权限
    project.members.forEach(memberId => {
      const member = team.members.find(m => m.userId === memberId)
      if (member) {
        project.permissions[memberId] = member.permissions.filter(p =>
          ['project', 'narrative', 'character', 'world'].includes(p.resource)
        )
      }
    })

    team.projects.push(project)
    team.stats.totalProjects++

    this.emit('projectCreated', { teamId, project })
    return project
  }

  // 启动协作会话
  async startCollaborationSession(
    teamId: string,
    projectId: string,
    hostId: string,
    settings?: Partial<CollaborationSettings>
  ): Promise<CollaborationSession> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    const project = team.projects.find(p => p.id === projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    // 检查主机权限
    const host = team.members.find(m => m.userId === hostId)
    if (!host) {
      throw new Error('Not a member of this team')
    }

    const defaultSettings: CollaborationSettings = {
      realTimeSync: true,
      conflictResolution: 'automatic',
      autoSave: true,
      notifications: true,
      maxParticipants: 10,
      sessionTimeout: 120
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      teamId,
      status: 'active',
      participants: [{
        memberId: host.id,
        userId: hostId,
        joinedAt: new Date(),
        role: 'host',
        currentFocus: '',
        isActive: true
      }],
      startedAt: new Date(),
      lastActivity: new Date(),
      settings: { ...defaultSettings, ...settings },
      activityLog: [{
        id: `activity-${Date.now()}`,
        timestamp: new Date(),
        participantId: host.id,
        action: 'join',
        targetType: 'narrative',
        targetId: projectId,
        details: { role: 'host' }
      }]
    }

    this.activeSessions.set(sessionId, session)

    // 设置会话超时
    const timeout = setTimeout(() => {
      this.endCollaborationSession(sessionId, 'timeout')
    }, session.settings.sessionTimeout * 60 * 1000)

    this.sessionTimeouts.set(sessionId, timeout)

    this.emit('collaborationStarted', { session, teamId, projectId })
    return session
  }

  // 加入协作会话
  async joinCollaborationSession(sessionId: string, userId: string, teamId: string): Promise<SessionParticipant> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active')
    }

    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    // 检查参与者限制
    if (session.participants.length >= session.settings.maxParticipants) {
      throw new Error('Session is full')
    }

    // 检查用户权限
    const member = team.members.find(m => m.userId === userId)
    if (!member) {
      throw new Error('Not a member of this team')
    }

    const project = team.projects.find(p => p.id === session.projectId)
    if (!project || !project.members.includes(userId)) {
      throw new Error('No access to this project')
    }

    // 添加参与者
    const participant: SessionParticipant = {
      memberId: member.id,
      userId,
      joinedAt: new Date(),
      role: 'collaborator',
      currentFocus: '',
      isActive: true
    }

    session.participants.push(participant)
    session.lastActivity = new Date()

    // 记录活动
    session.activityLog.push({
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      participantId: member.id,
      action: 'join',
      targetType: 'narrative',
      targetId: session.projectId,
      details: { role: 'collaborator' }
    })

    this.emit('participantJoined', { sessionId, participant })
    return participant
  }

  // 记录协作活动
  async recordActivity(sessionId: string, activity: Omit<CollaborationActivity, 'id' | 'timestamp'>): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    const fullActivity: CollaborationActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date()
    }

    session.activityLog.push(fullActivity)
    session.lastActivity = new Date()

    // 更新参与者统计
    const participant = session.participants.find(p => p.memberId === activity.participantId)
    if (participant) {
      participant.isActive = true
    }

    // 重置会话超时
    const timeout = this.sessionTimeouts.get(sessionId)
    if (timeout) {
      clearTimeout(timeout)
    }

    const newTimeout = setTimeout(() => {
      this.endCollaborationSession(sessionId, 'timeout')
    }, session.settings.sessionTimeout * 60 * 1000)

    this.sessionTimeouts.set(sessionId, newTimeout)

    this.emit('activityRecorded', { sessionId, activity: fullActivity })
  }

  // 结束协作会话
  async endCollaborationSession(sessionId: string, reason: 'manual' | 'timeout' | 'error' = 'manual'): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    session.status = 'ended'

    // 计算会话统计
    const duration = Date.now() - session.startedAt.getTime()
    const activeParticipants = session.participants.filter(p => p.isActive).length

    // 清理超时定时器
    const timeout = this.sessionTimeouts.get(sessionId)
    if (timeout) {
      clearTimeout(timeout)
      this.sessionTimeouts.delete(sessionId)
    }

    // 记录到项目历史
    const team = this.teams.get(session.teamId)
    if (team) {
      const project = team.projects.find(p => p.id === session.projectId)
      if (project) {
        project.collaborationHistory.push(session)
        project.updatedAt = new Date()
      }
    }

    this.activeSessions.delete(sessionId)

    this.emit('collaborationEnded', { sessionId, session, reason, duration, activeParticipants })
  }

  // 获取团队统计
  getTeamStats(teamId: string): TeamStats | null {
    const team = this.teams.get(teamId)
    return team ? team.stats : null
  }

  // 获取活跃会话
  getActiveSessions(teamId?: string): CollaborationSession[] {
    const sessions = Array.from(this.activeSessions.values())

    if (teamId) {
      return sessions.filter(s => s.teamId === teamId)
    }

    return sessions
  }

  // 获取用户的所有团队
  getUserTeams(userId: string): Team[] {
    return Array.from(this.teams.values())
      .filter(team => team.members.some(member => member.userId === userId))
  }

  // 团队记忆共享
  async shareMemoryToTeam(teamId: string, memory: Omit<MemoryEntry, 'id' | 'agentId'>): Promise<string> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    // 创建团队共享记忆
    const teamMemory: Omit<MemoryEntry, 'id' | 'agentId'> = {
      ...memory,
      tags: [...(memory.tags || []), 'team-shared', `team-${teamId}`],
      metadata: {
        ...memory.metadata,
        sharedByTeam: teamId,
        sharedAt: new Date()
      }
    }

    // 为团队中每个活跃成员创建记忆副本
    const memoryPromises = team.members
      .filter(member => member.role !== 'viewer') // 不为只读成员创建
      .map(member => crossMemoryNetwork.addMemory({
        ...teamMemory,
        agentId: member.userId
      }))

    const memoryIds = await Promise.all(memoryPromises)

    this.emit('memorySharedToTeam', { teamId, memoryIds, originalMemory: teamMemory })

    return memoryIds[0] // 返回第一个记忆ID作为代表
  }

  // 团队冲突解决
  async resolveConflict(sessionId: string, conflictData: {
    targetId: string
    conflictType: 'edit' | 'delete' | 'merge'
    participants: string[]
    resolution: 'merge' | 'override' | 'version'
    resolverId: string
  }): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // 记录冲突解决活动
    await this.recordActivity(sessionId, {
      participantId: conflictData.resolverId,
      action: 'merge',
      targetType: 'narrative',
      targetId: conflictData.targetId,
      details: {
        conflictType: conflictData.conflictType,
        resolution: conflictData.resolution,
        participants: conflictData.participants
      }
    })

    this.emit('conflictResolved', { sessionId, conflict: conflictData })
  }

  // 导出团队数据
  async exportTeamData(teamId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<any> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    const exportData = {
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        stats: team.stats,
        exportedAt: new Date()
      },
      members: team.members.map(member => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        contributionStats: member.contributionStats
      })),
      projects: team.projects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        members: project.members,
        createdAt: project.createdAt
      }))
    }

    // 根据格式处理数据
    switch (format) {
      case 'json':
        return exportData
      case 'csv':
        return this.convertToCSV(exportData)
      case 'pdf':
        return this.convertToPDF(exportData)
      default:
        return exportData
    }
  }

  private convertToCSV(data: any): string {
    // 简化的CSV转换逻辑
    return JSON.stringify(data, null, 2)
  }

  private convertToPDF(data: any): Buffer {
    // 简化的PDF转换逻辑
    return Buffer.from(JSON.stringify(data, null, 2))
  }

  // 清理非活跃会话
  private cleanupInactiveSessions(): void {
    const now = Date.now()
    const inactiveThreshold = 30 * 60 * 1000 // 30分钟

    for (const [sessionId, session] of this.activeSessions) {
      const timeSinceActivity = now - session.lastActivity.getTime()

      if (timeSinceActivity > inactiveThreshold) {
        this.endCollaborationSession(sessionId, 'timeout')
      }
    }
  }

  // 初始化清理定时器
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupInactiveSessions()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }

  constructor() {
    super()
    this.startCleanupTimer()
  }
}

// 创建全局团队协作管理器实例
export const teamCollaborationManager = new TeamCollaborationManager()
