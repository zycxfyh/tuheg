// ============================================================================
// Agent协作框架 - 完全集成VCPToolBox理念
// 实现独立多Agent封装、非线性超异步工作流、自主协商协作
// ============================================================================

import { EventEmitter } from 'node:events'
import { crossMemoryNetwork, type MemoryEntry, tarVariableManager } from './PluginFramework'

export interface Agent {
  id: string
  name: string
  role: 'creation' | 'logic' | 'narrative' | 'character' | 'world' | 'dialogue' | 'plot' | 'custom'
  capabilities: string[]
  expertise: string[]
  status: 'idle' | 'working' | 'waiting' | 'error'
  currentTask?: Task
  memory: AgentMemory
  personality: AgentPersonality
  communication: AgentCommunication
}

export interface AgentMemory {
  shortTerm: MemoryEntry[]
  longTerm: MemoryEntry[]
  sharedMemories: Map<string, MemoryEntry> // 与其他Agent共享的记忆
  memoryNetwork: Map<string, string[]> // 记忆关联网络
}

export interface AgentPersonality {
  creativity: number // 0-1, 创造性水平
  analytical: number // 0-1, 分析能力
  collaborative: number // 0-1, 协作意愿
  riskTolerance: number // 0-1, 风险承受度
  communicationStyle: 'direct' | 'diplomatic' | 'creative' | 'technical'
  preferredTools: string[]
  workingStyle: 'independent' | 'team-player' | 'leader' | 'supporter'
}

export interface AgentCommunication {
  preferredChannels: ('direct' | 'broadcast' | 'negotiation')[]
  languageStyle: string
  responseTime: number // 平均响应时间(ms)
  trustLevels: Map<string, number> // 对其他Agent的信任度
  communicationHistory: CommunicationRecord[]
}

export interface CommunicationRecord {
  id: string
  fromAgent: string
  toAgent: string
  type: 'request' | 'response' | 'proposal' | 'agreement' | 'disagreement' | 'information'
  content: any
  timestamp: Date
  success: boolean
  context: string // 通信上下文
}

export interface Task {
  id: string
  title: string
  description: string
  type: 'creation' | 'analysis' | 'collaboration' | 'review' | 'execution'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed'
  assignee?: string
  dependencies: string[] // 依赖的其他任务ID
  subtasks: string[]
  deadline?: Date
  progress: number // 0-100
  requirements: TaskRequirement[]
  context: TaskContext
  collaboration: TaskCollaboration
}

export interface TaskRequirement {
  type: 'skill' | 'tool' | 'resource' | 'permission'
  name: string
  value: any
  mandatory: boolean
}

export interface TaskContext {
  projectId: string
  narrativeContext?: any
  userPreferences?: any
  constraints?: any[]
  previousWork?: any
}

export interface TaskCollaboration {
  mode: 'independent' | 'sequential' | 'parallel' | 'negotiated'
  participants: string[]
  communicationProtocol: 'direct' | 'mediated' | 'broadcast'
  conflictResolution: 'manual' | 'automatic' | 'voting'
  progressSharing: boolean
}

export interface CollaborationSession {
  id: string
  name: string
  goal: string
  participants: Agent[]
  tasks: Task[]
  status: 'planning' | 'active' | 'paused' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  progress: number
  communicationLog: CommunicationRecord[]
  conflictLog: ConflictRecord[]
  outcome: any
}

export interface ConflictRecord {
  id: string
  type: 'resource' | 'opinion' | 'priority' | 'methodology'
  description: string
  participants: string[]
  resolution: string
  resolvedBy: string
  timestamp: Date
}

export interface NegotiationProposal {
  id: string
  proposer: string
  taskId: string
  proposal: any
  reasoning: string
  alternatives: any[]
  deadline: Date
  votes: Map<string, 'accept' | 'reject' | 'modify'>
  status: 'open' | 'accepted' | 'rejected' | 'modified'
}

class AgentCollaborationFramework extends EventEmitter {
  private agents: Map<string, Agent> = new Map()
  private activeSessions: Map<string, CollaborationSession> = new Map()
  private negotiations: Map<string, NegotiationProposal> = new Map()
  private communicationBus: CommunicationBus

  constructor() {
    super()
    this.communicationBus = new CommunicationBus()
    this.setupCommunicationHandlers()
    this.initializeSystemAgents()
  }

  // ==================== Agent管理 ====================

  /**
   * 注册新Agent
   */
  async registerAgent(
    agentConfig: Omit<Agent, 'id' | 'status' | 'currentTask' | 'memory' | 'communication'>
  ): Promise<string> {
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const agent: Agent = {
      id: agentId,
      ...agentConfig,
      status: 'idle',
      memory: {
        shortTerm: [],
        longTerm: [],
        sharedMemories: new Map(),
        memoryNetwork: new Map(),
      },
      communication: {
        preferredChannels: ['direct'],
        languageStyle: 'professional',
        responseTime: 1000,
        trustLevels: new Map(),
        communicationHistory: [],
      },
    }

    this.agents.set(agentId, agent)
    await this.initializeAgentMemory(agentId)

    this.emit('agentRegistered', agent)
    return agentId
  }

  /**
   * 获取Agent
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId)
  }

  /**
   * 获取所有Agent
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  /**
   * 根据角色获取Agent
   */
  getAgentsByRole(role: Agent['role']): Agent[] {
    return this.getAllAgents().filter((agent) => agent.role === role)
  }

  // ==================== 协作会话管理 ====================

  /**
   * 创建协作会话
   */
  async createCollaborationSession(
    name: string,
    goal: string,
    participantIds: string[],
    tasks: Omit<Task, 'id' | 'status' | 'assignee' | 'progress'>[]
  ): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 验证参与者
    const participants = participantIds.map((id) => this.agents.get(id)).filter(Boolean) as Agent[]

    if (participants.length === 0) {
      throw new Error('No valid participants found')
    }

    // 创建任务
    const sessionTasks: Task[] = tasks.map((taskData) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...taskData,
      status: 'pending',
      progress: 0,
      collaboration: taskData.collaboration || {
        mode: 'independent',
        participants: [],
        communicationProtocol: 'direct',
        conflictResolution: 'manual',
        progressSharing: true,
      },
    }))

    const session: CollaborationSession = {
      id: sessionId,
      name,
      goal,
      participants,
      tasks: sessionTasks,
      status: 'planning',
      startTime: new Date(),
      progress: 0,
      communicationLog: [],
      conflictLog: [],
      outcome: null,
    }

    this.activeSessions.set(sessionId, session)

    // 初始化Agent信任关系
    await this.initializeTrustRelationships(session)

    // 启动任务分配
    await this.initiateTaskAssignment(session)

    this.emit('collaborationStarted', session)
    return sessionId
  }

  /**
   * 启动任务分配 - Agent自主协商
   */
  private async initiateTaskAssignment(session: CollaborationSession): Promise<void> {
    // 分析任务需求
    const taskRequirements = session.tasks.map((task) => ({
      task,
      requirements: this.analyzeTaskRequirements(task),
      suitableAgents: this.findSuitableAgents(task, session.participants),
    }))

    // 启动协商过程
    // biome-ignore lint/correctness/noUnusedVariables: 预留用于将来任务协商逻辑
    for (const { task, requirements, suitableAgents } of taskRequirements) {
      if (suitableAgents.length === 1) {
        // 直接分配
        await this.assignTaskToAgent(task.id, suitableAgents[0].id, session.id)
      } else if (suitableAgents.length > 1) {
        // 启动协商
        await this.startTaskNegotiation(task, suitableAgents, session.id)
      } else {
        // 无人适合，标记为问题
        await this.handleUnsuitableTask(task, session)
      }
    }

    // 所有任务分配完成后，开始执行
    if (session.tasks.every((task) => task.status !== 'pending')) {
      session.status = 'active'
      await this.startTaskExecution(session)
    }
  }

  /**
   * 分析任务需求
   */
  private analyzeTaskRequirements(task: Task): TaskRequirement[] {
    const requirements: TaskRequirement[] = []

    // 基于任务类型的智能需求分析
    switch (task.type) {
      case 'creation':
        requirements.push(
          { type: 'skill', name: 'creativity', value: 0.7, mandatory: true },
          { type: 'skill', name: 'writing', value: 0.6, mandatory: true }
        )
        break
      case 'analysis':
        requirements.push(
          { type: 'skill', name: 'analytical', value: 0.8, mandatory: true },
          { type: 'tool', name: 'data-analysis', value: true, mandatory: false }
        )
        break
      case 'collaboration':
        requirements.push({ type: 'skill', name: 'collaborative', value: 0.7, mandatory: true })
        break
    }

    return requirements
  }

  /**
   * 寻找适合的任务执行者
   */
  private findSuitableAgents(task: Task, participants: Agent[]): Agent[] {
    return participants
      .filter((agent) => {
        const score = this.calculateAgentSuitability(agent, task)
        return score >= 0.6 // 适合度阈值
      })
      .sort(
        (a, b) => this.calculateAgentSuitability(b, task) - this.calculateAgentSuitability(a, task)
      )
  }

  /**
   * 计算Agent对任务的适合度
   */
  private calculateAgentSuitability(agent: Agent, task: Task): number {
    let score = 0
    const requirements = this.analyzeTaskRequirements(task)

    for (const req of requirements) {
      if (req.type === 'skill') {
        const agentSkill = this.getAgentSkillLevel(agent, req.name)
        if (agentSkill >= req.value) {
          score += 0.3
        } else if (agentSkill >= req.value * 0.8) {
          score += 0.2
        }
      }
    }

    // 考虑Agent的当前负载
    if (agent.status === 'idle') {
      score += 0.2
    } else if (agent.status === 'working') {
      score -= 0.1
    }

    // 考虑Agent的专业领域匹配
    if (agent.expertise.includes(task.type)) {
      score += 0.3
    }

    // 考虑Agent的协作意愿
    score += agent.personality.collaborative * 0.2

    return Math.max(0, Math.min(1, score))
  }

  /**
   * 获取Agent技能水平
   */
  private getAgentSkillLevel(agent: Agent, skillName: string): number {
    // 基于Agent的能力和过往表现计算技能水平
    const baseCapability = agent.capabilities.includes(skillName) ? 0.8 : 0.3

    // 从记忆中学习技能水平
    const relevantMemories = agent.memory.longTerm.filter(
      (mem) => mem.tags.includes(skillName) && mem.type === 'experience'
    )

    if (relevantMemories.length > 0) {
      const avgSuccess =
        relevantMemories.reduce((sum, mem) => sum + (mem.metadata.success ? 1 : 0), 0) /
        relevantMemories.length

      return Math.min(1, baseCapability + avgSuccess * 0.3)
    }

    return baseCapability
  }

  /**
   * 启动任务协商
   */
  private async startTaskNegotiation(
    task: Task,
    candidates: Agent[],
    sessionId: string
  ): Promise<void> {
    const negotiationId = `neg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const proposal: NegotiationProposal = {
      id: negotiationId,
      proposer: 'system',
      taskId: task.id,
      proposal: {
        assignment: 'auto-assign',
        reasoning: `Task ${task.title} has ${candidates.length} suitable candidates`,
      },
      reasoning: 'Automated task assignment negotiation',
      alternatives: candidates.map((agent) => ({
        assignee: agent.id,
        suitability: this.calculateAgentSuitability(agent, task),
      })),
      deadline: new Date(Date.now() + 300000), // 5分钟截止
      votes: new Map(),
      status: 'open',
    }

    this.negotiations.set(negotiationId, proposal)

    // 通知候选Agent
    for (const agent of candidates) {
      await this.communicationBus.sendMessage({
        from: 'system',
        to: agent.id,
        type: 'proposal',
        content: {
          negotiationId,
          task: task.title,
          proposal: proposal.proposal,
        },
        context: sessionId,
      })
    }

    // 设置协商超时
    setTimeout(() => {
      this.resolveNegotiation(negotiationId)
    }, 300000)
  }

  /**
   * 解决协商
   */
  private async resolveNegotiation(negotiationId: string): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId)
    if (!negotiation || negotiation.status !== 'open') return

    const votes = Array.from(negotiation.votes.entries())
    if (votes.length === 0) {
      // 无投票，随机分配
      const alternatives = negotiation.alternatives as any[]
      const winner = alternatives[Math.floor(Math.random() * alternatives.length)]
      await this.assignTaskToAgent(negotiation.taskId, winner.assignee, 'system')
    } else {
      // 基于投票结果分配
      const winner = votes.reduce((best, current) => {
        const bestAgent = negotiation.alternatives.find((alt: any) => alt.assignee === best[0])
        const currentAgent = negotiation.alternatives.find(
          (alt: any) => alt.assignee === current[0]
        )

        return (bestAgent?.suitability || 0) > (currentAgent?.suitability || 0) ? best : current
      })

      await this.assignTaskToAgent(negotiation.taskId, winner[0], 'system')
    }

    negotiation.status = 'accepted'
  }

  /**
   * 分配任务给Agent
   */
  private async assignTaskToAgent(
    taskId: string,
    agentId: string,
    sessionId: string
  ): Promise<void> {
    const agent = this.agents.get(agentId)
    const session = this.activeSessions.get(sessionId)

    if (!agent || !session) return

    const task = session.tasks.find((t) => t.id === taskId)
    if (!task) return

    // 更新任务状态
    task.status = 'assigned'
    task.assignee = agentId

    // 更新Agent状态
    agent.status = 'working'
    agent.currentTask = task

    // 通知Agent
    await this.communicationBus.sendMessage({
      from: 'system',
      to: agentId,
      type: 'assignment',
      content: {
        taskId,
        task: task.title,
        sessionId,
      },
      context: sessionId,
    })

    this.emit('taskAssigned', { taskId, agentId, sessionId })
  }

  /**
   * 开始任务执行
   */
  private async startTaskExecution(session: CollaborationSession): Promise<void> {
    // 按照依赖关系排序任务
    const sortedTasks = this.topologicalSortTasks(session.tasks)

    for (const task of sortedTasks) {
      if (task.assignee) {
        const agent = this.agents.get(task.assignee)
        if (agent) {
          await this.executeTaskByAgent(task, agent, session)
        }
      }
    }

    // 检查会话完成
    if (session.tasks.every((task) => task.status === 'completed')) {
      session.status = 'completed'
      session.endTime = new Date()
      session.progress = 100

      this.emit('collaborationCompleted', session)
    }
  }

  /**
   * Agent执行任务
   */
  private async executeTaskByAgent(
    task: Task,
    agent: Agent,
    session: CollaborationSession
  ): Promise<void> {
    try {
      task.status = 'in-progress'

      // 根据任务类型调用相应的Agent能力
      const result = await this.callAgentCapability(agent, task)

      // 更新任务进度
      task.progress = 100
      task.status = 'completed'

      // 存储执行结果到记忆
      await this.storeTaskResult(agent, task, result, session.id)

      this.emit('taskCompleted', { taskId: task.id, agentId: agent.id, result })
    } catch (error) {
      task.status = 'failed'

      // 记录失败原因
      await this.handleTaskFailure(task, agent, error, session)

      this.emit('taskFailed', { taskId: task.id, agentId: agent.id, error })
    }
  }

  /**
   * 调用Agent能力
   */
  private async callAgentCapability(agent: Agent, task: Task): Promise<any> {
    // 模拟Agent执行任务
    // 实际实现中会调用具体的AI模型或工具

    switch (agent.role) {
      case 'creation':
        return await this.callCreationAgent(agent, task)
      case 'logic':
        return await this.callLogicAgent(agent, task)
      case 'narrative':
        return await this.callNarrativeAgent(agent, task)
      case 'character':
        return await this.callCharacterAgent(agent, task)
      case 'world':
        return await this.callWorldAgent(agent, task)
      case 'dialogue':
        return await this.callDialogueAgent(agent, task)
      default:
        throw new Error(`Unknown agent role: ${agent.role}`)
    }
  }

  // Agent能力实现
  private async callCreationAgent(agent: Agent, task: Task): Promise<any> {
    // 使用Tar变量获取当前环境信息
    const timeNow = await tarVariableManager.getVariableValue('VarTimeNow')
    const city = await tarVariableManager.getVariableValue('VarCity')
    const weather = await tarVariableManager.getVariableValue('VCPWeatherInfo')

    // 基于记忆进行创作
    const relevantMemories = await crossMemoryNetwork.queryMemories({
      agentId: agent.id,
      tags: ['creation', task.type],
      limit: 5,
    })

    return {
      type: 'creation',
      content: `基于${timeNow}在${city}(${weather})的创作灵感...`,
      inspiration: relevantMemories.map((m) => m.content),
      quality: 0.85,
    }
  }

  private async callLogicAgent(_agent: Agent, _task: Task): Promise<any> {
    // 逻辑推理和验证
    return {
      type: 'logic',
      analysis: '逻辑分析结果',
      validation: true,
      confidence: 0.9,
    }
  }

  private async callNarrativeAgent(_agent: Agent, _task: Task): Promise<any> {
    // 叙事构建
    return {
      type: 'narrative',
      structure: '故事框架',
      coherence: 0.88,
      engagement: 0.92,
    }
  }

  private async callCharacterAgent(_agent: Agent, _task: Task): Promise<any> {
    // 角色塑造
    return {
      type: 'character',
      profile: '角色描述',
      development: '性格弧线',
      consistency: 0.95,
    }
  }

  private async callWorldAgent(_agent: Agent, _task: Task): Promise<any> {
    // 世界构建
    return {
      type: 'world',
      setting: '世界设定',
      lore: '背景故事',
      immersion: 0.9,
    }
  }

  private async callDialogueAgent(_agent: Agent, _task: Task): Promise<any> {
    // 对话生成
    return {
      type: 'dialogue',
      conversations: '对话内容',
      naturalness: 0.87,
      emotional: 0.82,
    }
  }

  /**
   * 存储任务结果到记忆
   */
  private async storeTaskResult(
    agent: Agent,
    task: Task,
    result: any,
    sessionId: string
  ): Promise<void> {
    const memoryEntry: Omit<MemoryEntry, 'id' | 'timestamp'> = {
      agentId: agent.id,
      type: 'experience',
      content: {
        task: task.title,
        result,
        sessionId,
      },
      tags: ['task-execution', task.type, agent.role],
      importance: result.quality || 0.8,
      connections: [],
      metadata: {
        success: true,
        executionTime: Date.now(),
        collaborationMode: task.collaboration.mode,
      },
    }

    const _memoryId = await crossMemoryNetwork.addMemory(memoryEntry)

    // 更新Agent记忆网络
    agent.memory.shortTerm.push(
      await crossMemoryNetwork.queryMemories({ agentId: agent.id, limit: 1 })
    )[0]
    if (agent.memory.shortTerm.length > 10) {
      agent.memory.shortTerm.shift()
    }
  }

  /**
   * 处理任务失败
   */
  private async handleTaskFailure(
    task: Task,
    agent: Agent,
    error: any,
    session: CollaborationSession
  ): Promise<void> {
    // 记录冲突
    const conflict: ConflictRecord = {
      id: `conflict-${Date.now()}`,
      type: 'resource',
      description: `Task ${task.title} failed: ${error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)}`,
      participants: [agent.id],
      resolution: 'Task reassigned',
      resolvedBy: 'system',
      timestamp: new Date(),
    }

    session.conflictLog.push(conflict)

    // 尝试重新分配任务
    const alternativeAgents = session.participants.filter(
      (p) => p.id !== agent.id && p.role === agent.role
    )

    if (alternativeAgents.length > 0) {
      const alternative = alternativeAgents[0]
      await this.assignTaskToAgent(task.id, alternative.id, session.id)
    }
  }

  /**
   * 拓扑排序任务（处理依赖关系）
   */
  private topologicalSortTasks(tasks: Task[]): Task[] {
    const sorted: Task[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (task: Task) => {
      if (visited.has(task.id)) return
      if (visiting.has(task.id)) {
        throw new Error('Circular dependency detected')
      }

      visiting.add(task.id)

      for (const depId of task.dependencies) {
        const depTask = tasks.find((t) => t.id === depId)
        if (depTask) {
          visit(depTask)
        }
      }

      visiting.delete(task.id)
      visited.add(task.id)
      sorted.push(task)
    }

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task)
      }
    }

    return sorted
  }

  // ==================== 通信系统 ====================

  /**
   * 设置通信处理器
   */
  private setupCommunicationHandlers(): void {
    this.communicationBus.on('message', async (message: CommunicationMessage) => {
      await this.handleAgentCommunication(message)
    })
  }

  /**
   * 处理Agent间通信
   */
  private async handleAgentCommunication(message: CommunicationMessage): Promise<void> {
    const fromAgent = this.agents.get(message.from)
    const toAgent = this.agents.get(message.to)

    if (!fromAgent || !toAgent) return

    // 记录通信历史
    const record: CommunicationRecord = {
      id: `comm-${Date.now()}`,
      fromAgent: message.from,
      toAgent: message.to,
      type: message.type,
      content: message.content,
      timestamp: new Date(),
      success: true,
      context: message.context,
    }

    fromAgent.communication.communicationHistory.push(record)
    toAgent.communication.communicationHistory.push(record)

    // 更新信任度
    this.updateTrustLevel(fromAgent.id, toAgent.id, message.type === 'agreement' ? 0.1 : -0.05)

    // 处理不同类型的通信
    switch (message.type) {
      case 'request':
        await this.handleCommunicationRequest(message, toAgent)
        break
      case 'proposal':
        await this.handleCommunicationProposal(message, toAgent)
        break
      case 'agreement':
      case 'disagreement':
        await this.handleCommunicationResponse(message, toAgent)
        break
    }

    this.emit('communicationProcessed', { message, record })
  }

  /**
   * 处理通信请求
   */
  private async handleCommunicationRequest(
    message: CommunicationMessage,
    toAgent: Agent
  ): Promise<void> {
    // Agent根据自身状态和信任度决定是否响应
    const trustLevel = toAgent.communication.trustLevels.get(message.from) || 0.5
    const responseProbability = trustLevel * 0.8 + 0.2 // 基础20% + 信任度影响

    if (Math.random() < responseProbability) {
      await this.communicationBus.sendMessage({
        from: toAgent.id,
        to: message.from,
        type: 'agreement',
        content: { response: 'accepted', reasoning: 'Based on trust and capability assessment' },
        context: message.context,
      })
    } else {
      await this.communicationBus.sendMessage({
        from: toAgent.id,
        to: message.from,
        type: 'disagreement',
        content: { response: 'declined', reasoning: 'Current workload or capability constraints' },
        context: message.context,
      })
    }
  }

  /**
   * 处理通信提案
   */
  private async handleCommunicationProposal(
    message: CommunicationMessage,
    toAgent: Agent
  ): Promise<void> {
    // 查找相关协商
    const negotiation = this.negotiations.get(message.content.negotiationId)
    if (negotiation) {
      // 记录投票
      negotiation.votes.set(toAgent.id, 'accept') // 简化实现，默认接受
    }
  }

  /**
   * 处理通信响应
   */
  private async handleCommunicationResponse(
    message: CommunicationMessage,
    toAgent: Agent
  ): Promise<void> {
    // 更新协作状态或任务分配
    console.log(`Communication response from ${toAgent.id}: ${message.type}`)
  }

  /**
   * 更新信任度
   */
  private updateTrustLevel(fromAgent: string, toAgent: string, delta: number): void {
    const from = this.agents.get(fromAgent)
    const to = this.agents.get(toAgent)

    if (from && to) {
      const currentTrust = from.communication.trustLevels.get(toAgent) || 0.5
      const newTrust = Math.max(0, Math.min(1, currentTrust + delta))
      from.communication.trustLevels.set(toAgent, newTrust)
    }
  }

  // ==================== 系统Agent初始化 ====================

  /**
   * 初始化系统Agent
   */
  private async initializeSystemAgents(): Promise<void> {
    // 创建核心Agent
    const agents = [
      {
        name: 'Creation Agent',
        role: 'creation' as const,
        capabilities: ['creative-writing', 'idea-generation', 'content-creation'],
        expertise: ['creation', 'writing'],
        personality: {
          creativity: 0.9,
          analytical: 0.6,
          collaborative: 0.8,
          riskTolerance: 0.7,
          communicationStyle: 'creative' as const,
          preferredTools: ['text-generator', 'image-generator'],
          workingStyle: 'independent' as const,
        },
      },
      {
        name: 'Logic Agent',
        role: 'logic' as const,
        capabilities: ['logical-reasoning', 'validation', 'consistency-check'],
        expertise: ['analysis', 'logic'],
        personality: {
          creativity: 0.4,
          analytical: 0.9,
          collaborative: 0.7,
          riskTolerance: 0.3,
          communicationStyle: 'technical' as const,
          preferredTools: ['validator', 'analyzer'],
          workingStyle: 'supporter' as const,
        },
      },
      {
        name: 'Narrative Agent',
        role: 'narrative' as const,
        capabilities: ['story-structure', 'plot-development', 'narrative-flow'],
        expertise: ['narrative', 'structure'],
        personality: {
          creativity: 0.8,
          analytical: 0.7,
          collaborative: 0.9,
          riskTolerance: 0.5,
          communicationStyle: 'diplomatic' as const,
          preferredTools: ['story-builder', 'plot-analyzer'],
          workingStyle: 'team-player' as const,
        },
      },
    ]

    for (const agentConfig of agents) {
      await this.registerAgent(agentConfig)
    }
  }

  /**
   * 初始化Agent记忆
   */
  private async initializeAgentMemory(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return

    // 创建初始记忆条目
    const initialMemories: Omit<MemoryEntry, 'id' | 'timestamp'>[] = [
      {
        agentId,
        type: 'knowledge',
        content: `I am ${agent.name}, specialized in ${agent.role} tasks.`,
        tags: ['self-introduction', 'identity'],
        importance: 1.0,
        connections: [],
        metadata: { type: 'initialization' },
      },
      {
        agentId,
        type: 'experience',
        content: `Initialized with capabilities: ${agent.capabilities.join(', ')}`,
        tags: ['capabilities', 'initialization'],
        importance: 0.8,
        connections: [],
        metadata: { type: 'initialization' },
      },
    ]

    for (const memory of initialMemories) {
      await crossMemoryNetwork.addMemory(memory)
    }
  }

  /**
   * 初始化信任关系
   */
  private async initializeTrustRelationships(session: CollaborationSession): Promise<void> {
    for (const agent1 of session.participants) {
      for (const agent2 of session.participants) {
        if (agent1.id !== agent2.id) {
          // 基于角色相似性和历史协作设置初始信任度
          let initialTrust = 0.5

          if (agent1.role === agent2.role) {
            initialTrust += 0.2 // 同类型Agent信任度更高
          }

          if (agent1.personality.collaborative > 0.7 && agent2.personality.collaborative > 0.7) {
            initialTrust += 0.1 // 协作型Agent间信任度更高
          }

          agent1.communication.trustLevels.set(agent2.id, initialTrust)
          agent2.communication.trustLevels.set(agent1.id, initialTrust)
        }
      }
    }
  }

  // ==================== 公共接口 ====================

  /**
   * 创建叙事协作任务
   */
  async createNarrativeCollaboration(prompt: string, style?: string): Promise<string> {
    const agents = this.getAllAgents()

    const tasks: Omit<Task, 'id' | 'status' | 'assignee' | 'progress'>[] = [
      {
        title: '创意生成',
        description: `基于提示"${prompt}"生成创意概念`,
        type: 'creation',
        priority: 'high',
        dependencies: [],
        subtasks: [],
        requirements: [{ type: 'skill', name: 'creativity', value: 0.7, mandatory: true }],
        context: { projectId: 'narrative-gen', narrativeContext: { prompt, style } },
        collaboration: {
          mode: 'independent',
          participants: [],
          communicationProtocol: 'direct',
          conflictResolution: 'automatic',
          progressSharing: true,
        },
      },
      {
        title: '逻辑验证',
        description: '验证创意概念的逻辑一致性',
        type: 'analysis',
        priority: 'medium',
        dependencies: ['task-1'], // 将在创建时动态设置
        subtasks: [],
        requirements: [{ type: 'skill', name: 'analytical', value: 0.8, mandatory: true }],
        context: { projectId: 'narrative-gen' },
        collaboration: {
          mode: 'sequential',
          participants: [],
          communicationProtocol: 'direct',
          conflictResolution: 'manual',
          progressSharing: true,
        },
      },
      {
        title: '叙事构建',
        description: '构建完整的故事框架',
        type: 'collaboration',
        priority: 'high',
        dependencies: ['task-2'],
        subtasks: [],
        requirements: [{ type: 'skill', name: 'narrative', value: 0.8, mandatory: true }],
        context: { projectId: 'narrative-gen' },
        collaboration: {
          mode: 'parallel',
          participants: agents
            .filter((a) => ['narrative', 'character', 'world'].includes(a.role))
            .map((a) => a.id),
          communicationProtocol: 'mediated',
          conflictResolution: 'automatic',
          progressSharing: true,
        },
      },
    ]

    const sessionId = await this.createCollaborationSession(
      `叙事创作: ${prompt.substring(0, 50)}...`,
      `基于用户提示创作完整叙事: ${prompt}`,
      agents.map((a) => a.id),
      tasks
    )

    return sessionId
  }

  /**
   * 获取协作状态
   */
  getCollaborationStatus(sessionId: string): CollaborationSession | null {
    return this.activeSessions.get(sessionId) || null
  }

  /**
   * 销毁框架
   */
  destroy(): void {
    // 清理资源
    this.activeSessions.clear()
    this.negotiations.clear()
    this.communicationBus.removeAllListeners()
  }
}

// 通信总线
class CommunicationBus extends EventEmitter {
  private messageQueue: CommunicationMessage[] = []
  private processing = false

  async sendMessage(message: CommunicationMessage): Promise<void> {
    this.messageQueue.push(message)
    await this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return

    this.processing = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      this.emit('message', message)

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    this.processing = false
  }
}

export interface CommunicationMessage {
  from: string
  to: string
  type: 'request' | 'response' | 'proposal' | 'agreement' | 'disagreement' | 'information'
  content: any
  context: string
}

// 创建全局Agent协作框架实例
export const agentCollaborationFramework = new AgentCollaborationFramework()
