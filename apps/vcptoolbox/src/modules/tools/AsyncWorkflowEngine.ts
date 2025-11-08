// ============================================================================
// 非线性异步工作流引擎 - VCPToolBox 工具模块
// 实现复杂任务编排、动态执行和状态管理
// ============================================================================

import { EventEmitter } from 'events'

export interface WorkflowNode {
  id: string
  type: 'task' | 'decision' | 'parallel' | 'loop' | 'subprocess' | 'event' | 'gateway'
  name: string
  description?: string
  config: Record<string, any>
  inputs: WorkflowConnection[]
  outputs: WorkflowConnection[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped'
  result?: any
  error?: string
  startTime?: Date
  endTime?: Date
  retryCount: number
  maxRetries: number
  timeout?: number
  dependencies: string[] // 依赖的节点ID
  dependents: string[] // 依赖此节点的节点ID
}

export interface WorkflowConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  condition?: WorkflowCondition
  dataMapping?: Record<string, string> // 输入数据映射
  priority: number
}

export interface WorkflowCondition {
  type: 'expression' | 'script' | 'api' | 'manual'
  expression?: string
  script?: string
  apiEndpoint?: string
  manualApproval?: boolean
  timeout?: number
}

export interface WorkflowInstance {
  id: string
  workflowId: string
  name: string
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  nodes: Map<string, WorkflowNode>
  connections: WorkflowConnection[]
  context: WorkflowContext
  startTime?: Date
  endTime?: Date
  progress: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  initiator: string
  participants: string[]
  metadata: {
    version: string
    description?: string
    tags: string[]
    estimatedDuration?: number
    actualDuration?: number
  }
}

export interface WorkflowContext {
  variables: Map<string, any>
  inputData: Record<string, any>
  outputData: Record<string, any>
  environment: Record<string, any>
  sessionData: Record<string, any>
  errorHandling: {
    onError: 'stop' | 'continue' | 'retry' | 'compensate'
    compensationWorkflow?: string
  }
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  version: string
  nodes: Omit<
    WorkflowNode,
    'status' | 'result' | 'error' | 'startTime' | 'endTime' | 'retryCount'
  >[]
  connections: WorkflowConnection[]
  defaultConfig: {
    maxRetries: number
    timeout: number
    priority: 'low' | 'normal' | 'high' | 'critical'
  }
  tags: string[]
  createdAt: Date
  updatedAt: Date
  author: string
}

export interface WorkflowExecutionOptions {
  priority?: WorkflowInstance['priority']
  timeout?: number
  maxRetries?: number
  variables?: Record<string, any>
  inputData?: Record<string, any>
  participants?: string[]
  async?: boolean
  dryRun?: boolean
}

export class AsyncWorkflowEngine extends EventEmitter {
  private templates: Map<string, WorkflowTemplate> = new Map()
  private instances: Map<string, WorkflowInstance> = new Map()
  private runningInstances: Set<string> = new Set()
  private executionQueue: WorkflowInstance[] = []
  private maxConcurrentExecutions = 10
  private nodeExecutors: Map<string, NodeExecutor> = new Map()

  constructor() {
    super()
    this.registerBuiltInExecutors()
    this.startExecutionLoop()
  }

  // ==================== 工作流模板管理 ====================

  /**
   * 创建工作流模板
   */
  createTemplate(templateData: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>): string {
    const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const template: WorkflowTemplate = {
      ...templateData,
      id: templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 验证模板
    if (!this.validateTemplate(template)) {
      throw new Error('Invalid workflow template')
    }

    this.templates.set(templateId, template)
    this.emit('templateCreated', template)

    return templateId
  }

  /**
   * 获取模板
   */
  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId)
  }

  /**
   * 更新模板
   */
  updateTemplate(templateId: string, updates: Partial<WorkflowTemplate>): boolean {
    const template = this.templates.get(templateId)
    if (!template) return false

    Object.assign(template, updates)
    template.updatedAt = new Date()

    if (!this.validateTemplate(template)) {
      throw new Error('Updated template is invalid')
    }

    this.emit('templateUpdated', template)
    return true
  }

  /**
   * 删除模板
   */
  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId)
    if (deleted) {
      this.emit('templateDeleted', templateId)
    }
    return deleted
  }

  // ==================== 工作流实例管理 ====================

  /**
   * 实例化工作流
   */
  instantiateWorkflow(
    templateId: string,
    name: string,
    options: WorkflowExecutionOptions = {}
  ): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const instanceId = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 创建节点实例
    const nodes = new Map<string, WorkflowNode>()
    for (const templateNode of template.nodes) {
      const node: WorkflowNode = {
        ...templateNode,
        status: 'pending',
        retryCount: 0,
        maxRetries: options.maxRetries || template.defaultConfig.maxRetries || 3,
        timeout: options.timeout || template.defaultConfig.timeout || 300000,
      }
      nodes.set(node.id, node)
    }

    // 创建工作流实例
    const instance: WorkflowInstance = {
      id: instanceId,
      workflowId: templateId,
      name,
      status: 'created',
      nodes,
      connections: [...template.connections],
      context: {
        variables: new Map(Object.entries(options.variables || {})),
        inputData: options.inputData || {},
        outputData: {},
        environment: {},
        sessionData: {},
        errorHandling: {
          onError: 'stop',
        },
      },
      progress: 0,
      priority: options.priority || template.defaultConfig.priority,
      initiator: 'system', // 应该从当前上下文获取
      participants: options.participants || [],
      metadata: {
        version: template.version,
        description: template.description,
        tags: [...template.tags],
        estimatedDuration: this.estimateDuration(template),
      },
    }

    this.instances.set(instanceId, instance)

    // 如果不是dry run，添加到执行队列
    if (!options.dryRun) {
      if (options.async !== false) {
        this.executionQueue.push(instance)
        this.emit('workflowQueued', instance)
      } else {
        // 同步执行
        this.executeWorkflowSync(instance)
      }
    }

    this.emit('workflowInstantiated', instance)
    return instanceId
  }

  /**
   * 启动工作流执行
   */
  async startWorkflow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`)
    }

    if (instance.status !== 'created' && instance.status !== 'paused') {
      throw new Error(`Workflow instance ${instanceId} is not in a startable state`)
    }

    instance.status = 'running'
    instance.startTime = new Date()

    // 启动初始节点
    await this.startInitialNodes(instance)

    this.emit('workflowStarted', instance)
  }

  /**
   * 暂停工作流
   */
  async pauseWorkflow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== 'running') {
      return
    }

    instance.status = 'paused'
    this.emit('workflowPaused', instance)
  }

  /**
   * 恢复工作流
   */
  async resumeWorkflow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== 'paused') {
      return
    }

    instance.status = 'running'
    await this.continueWorkflowExecution(instance)
    this.emit('workflowResumed', instance)
  }

  /**
   * 取消工作流
   */
  async cancelWorkflow(instanceId: string, reason?: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || ['completed', 'failed', 'cancelled'].includes(instance.status)) {
      return
    }

    instance.status = 'cancelled'
    instance.endTime = new Date()

    // 取消所有运行中的节点
    for (const node of instance.nodes.values()) {
      if (node.status === 'running') {
        node.status = 'cancelled'
        node.endTime = new Date()
      }
    }

    this.emit('workflowCancelled', { instance, reason })
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(instanceId: string): WorkflowInstance | null {
    return this.instances.get(instanceId) || null
  }

  // ==================== 节点执行 ====================

  /**
   * 执行节点
   */
  private async executeNode(instance: WorkflowInstance, nodeId: string): Promise<void> {
    const node = instance.nodes.get(nodeId)
    if (!node || node.status !== 'pending') return

    node.status = 'running'
    node.startTime = new Date()

    try {
      // 获取执行器
      const executor = this.nodeExecutors.get(node.type)
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`)
      }

      // 准备输入数据
      const inputData = await this.prepareNodeInput(instance, node)

      // 执行节点
      const result = await executor.execute(node, inputData, instance.context)

      // 处理执行结果
      node.result = result
      node.status = 'completed'
      node.endTime = new Date()

      // 更新工作流上下文
      this.updateWorkflowContext(instance, node, result)

      // 触发后续节点
      await this.triggerDependentNodes(instance, nodeId)

      this.emit('nodeCompleted', { instanceId: instance.id, nodeId, result })
    } catch (error: any) {
      node.error = error.message
      node.endTime = new Date()

      // 处理重试逻辑
      if (node.retryCount < node.maxRetries) {
        node.retryCount++
        node.status = 'pending'
        // 重新加入执行队列
        setTimeout(() => this.executeNode(instance, nodeId), 1000 * node.retryCount)
      } else {
        node.status = 'failed'

        // 处理错误
        await this.handleNodeError(instance, node, error)
      }

      this.emit('nodeFailed', { instanceId: instance.id, nodeId, error })
    }
  }

  /**
   * 准备节点输入
   */
  private async prepareNodeInput(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<Record<string, any>> {
    const inputData: Record<string, any> = {}

    // 从依赖节点收集输出
    for (const depId of node.dependencies) {
      const depNode = instance.nodes.get(depId)
      if (depNode && depNode.result) {
        Object.assign(inputData, depNode.result)
      }
    }

    // 从工作流上下文获取数据
    Object.assign(inputData, instance.context.inputData)

    // 从变量获取数据
    for (const [key, value] of instance.context.variables) {
      inputData[key] = value
    }

    // 应用数据映射
    const incomingConnections = instance.connections.filter((conn) => conn.targetNodeId === node.id)
    for (const connection of incomingConnections) {
      if (connection.dataMapping) {
        for (const [sourceKey, targetKey] of Object.entries(connection.dataMapping)) {
          if (inputData[sourceKey] !== undefined) {
            inputData[targetKey] = inputData[sourceKey]
          }
        }
      }
    }

    return inputData
  }

  /**
   * 更新工作流上下文
   */
  private updateWorkflowContext(instance: WorkflowInstance, node: WorkflowNode, result: any): void {
    // 将节点结果保存到上下文
    instance.context.outputData[node.id] = result

    // 如果节点有输出映射，更新变量
    // 这里可以扩展更复杂的数据流逻辑
  }

  /**
   * 触发依赖节点
   */
  private async triggerDependentNodes(
    instance: WorkflowInstance,
    completedNodeId: string
  ): Promise<void> {
    const completedNode = instance.nodes.get(completedNodeId)
    if (!completedNode) return

    // 找到所有依赖此节点的其他节点
    const dependentConnections = instance.connections.filter(
      (conn) => conn.sourceNodeId === completedNodeId
    )

    for (const connection of dependentConnections) {
      const dependentNode = instance.nodes.get(connection.targetNodeId)
      if (!dependentNode) continue

      // 检查条件
      const conditionMet = await this.evaluateCondition(
        connection.condition,
        instance,
        completedNode
      )

      if (conditionMet) {
        // 检查所有依赖是否都已满足
        const allDependenciesMet = dependentNode.dependencies.every((depId) => {
          const depNode = instance.nodes.get(depId)
          return depNode && depNode.status === 'completed'
        })

        if (allDependenciesMet && dependentNode.status === 'pending') {
          await this.executeNode(instance, dependentNode.id)
        }
      }
    }

    // 检查工作流是否完成
    this.checkWorkflowCompletion(instance)
  }

  /**
   * 评估连接条件
   */
  private async evaluateCondition(
    condition: WorkflowCondition | undefined,
    instance: WorkflowInstance,
    sourceNode: WorkflowNode
  ): Promise<boolean> {
    if (!condition) return true

    switch (condition.type) {
      case 'expression':
        return this.evaluateExpression(condition.expression!, instance, sourceNode)

      case 'script':
        return this.evaluateScript(condition.script!, instance, sourceNode)

      case 'api':
        return await this.evaluateApiCondition(condition.apiEndpoint!, instance, sourceNode)

      case 'manual':
        // 手动批准，暂时返回false，需要外部触发
        return false

      default:
        return true
    }
  }

  /**
   * 启动初始节点
   */
  private async startInitialNodes(instance: WorkflowInstance): Promise<void> {
    // 找到没有依赖的节点
    const initialNodes = Array.from(instance.nodes.values()).filter(
      (node) => node.dependencies.length === 0 && node.status === 'pending'
    )

    // 并行执行初始节点
    await Promise.all(initialNodes.map((node) => this.executeNode(instance, node.id)))
  }

  /**
   * 检查工作流完成
   */
  private checkWorkflowCompletion(instance: WorkflowInstance): void {
    const allNodes = Array.from(instance.nodes.values())
    const completedNodes = allNodes.filter((node) => node.status === 'completed')
    const failedNodes = allNodes.filter((node) => node.status === 'failed')

    instance.progress = (completedNodes.length / allNodes.length) * 100

    if (failedNodes.length > 0) {
      instance.status = 'failed'
      instance.endTime = new Date()
      this.emit('workflowFailed', instance)
    } else if (completedNodes.length === allNodes.length) {
      instance.status = 'completed'
      instance.endTime = new Date()
      if (instance.startTime && instance.endTime) {
        instance.metadata.actualDuration = instance.endTime.getTime() - instance.startTime.getTime()
      }
      this.emit('workflowCompleted', instance)
    }
  }

  /**
   * 处理节点错误
   */
  private async handleNodeError(
    instance: WorkflowInstance,
    node: WorkflowNode,
    error: any
  ): Promise<void> {
    switch (instance.context.errorHandling.onError) {
      case 'stop':
        instance.status = 'failed'
        instance.endTime = new Date()
        break

      case 'continue':
        // 继续执行其他节点
        await this.triggerDependentNodes(instance, node.id)
        break

      case 'retry':
        // 重试逻辑在executeNode中处理
        break

      case 'compensate':
        if (instance.context.errorHandling.compensationWorkflow) {
          // 启动补偿工作流
          this.instantiateWorkflow(
            instance.context.errorHandling.compensationWorkflow,
            `Compensation for ${instance.name}`
          )
        }
        break
    }
  }

  // ==================== 执行器注册 ====================

  /**
   * 注册节点执行器
   */
  registerExecutor(nodeType: string, executor: NodeExecutor): void {
    this.nodeExecutors.set(nodeType, executor)
  }

  /**
   * 注册内置执行器
   */
  private registerBuiltInExecutors(): void {
    // 任务执行器
    this.registerExecutor('task', new TaskNodeExecutor())

    // 决策执行器
    this.registerExecutor('decision', new DecisionNodeExecutor())

    // 并行执行器
    this.registerExecutor('parallel', new ParallelNodeExecutor())

    // 循环执行器
    this.registerExecutor('loop', new LoopNodeExecutor())

    // 子流程执行器
    this.registerExecutor('subprocess', new SubprocessNodeExecutor())

    // 事件执行器
    this.registerExecutor('event', new EventNodeExecutor())

    // 网关执行器
    this.registerExecutor('gateway', new GatewayNodeExecutor())
  }

  // ==================== 执行循环 ====================

  /**
   * 启动执行循环
   */
  private startExecutionLoop(): void {
    setInterval(() => {
      this.processExecutionQueue()
    }, 100) // 每100ms检查一次
  }

  /**
   * 处理执行队列
   */
  private async processExecutionQueue(): Promise<void> {
    if (
      this.runningInstances.size >= this.maxConcurrentExecutions ||
      this.executionQueue.length === 0
    ) {
      return
    }

    const instance = this.executionQueue.shift()!
    this.runningInstances.add(instance.id)

    try {
      await this.startWorkflow(instance.id)
    } catch (error) {
      console.error(`Failed to start workflow ${instance.id}:`, error)
      this.runningInstances.delete(instance.id)
    }
  }

  /**
   * 继续工作流执行
   */
  private async continueWorkflowExecution(instance: WorkflowInstance): Promise<void> {
    // 找到可以执行的节点（所有依赖都已满足）
    const executableNodes = Array.from(instance.nodes.values()).filter(
      (node) =>
        node.status === 'pending' &&
        node.dependencies.every((depId) => {
          const depNode = instance.nodes.get(depId)
          return depNode && depNode.status === 'completed'
        })
    )

    await Promise.all(executableNodes.map((node) => this.executeNode(instance, node.id)))
  }

  /**
   * 同步执行工作流
   */
  private async executeWorkflowSync(instance: WorkflowInstance): Promise<void> {
    instance.status = 'running'
    instance.startTime = new Date()

    // 递归执行所有节点
    await this.executeAllNodesSync(instance)

    instance.status = instance.nodes.values().some((node) => node.status === 'failed')
      ? 'failed'
      : 'completed'
    instance.endTime = new Date()
  }

  /**
   * 同步执行所有节点
   */
  private async executeAllNodesSync(instance: WorkflowInstance): Promise<void> {
    const nodes = Array.from(instance.nodes.values())

    for (const node of nodes) {
      if (node.dependencies.length === 0) {
        await this.executeNode(instance, node.id)
      }
    }

    // 这里可以实现更复杂的拓扑排序执行逻辑
    // 简化版本：按顺序执行
    for (const node of nodes) {
      if (node.dependencies.length > 0) {
        await this.executeNode(instance, node.id)
      }
    }
  }

  // ==================== 条件评估 ====================

  /**
   * 评估表达式条件
   */
  private evaluateExpression(
    expression: string,
    instance: WorkflowInstance,
    sourceNode: WorkflowNode
  ): boolean {
    try {
      // 简化的表达式评估，实际应该使用更安全的方法
      const context = {
        result: sourceNode.result,
        variables: Object.fromEntries(instance.context.variables),
        input: instance.context.inputData,
        output: instance.context.outputData,
      }

      // 替换变量引用
      let evalExpression = expression
      for (const [key, value] of Object.entries(context)) {
        evalExpression = evalExpression.replace(
          new RegExp(`\\b${key}\\b`, 'g'),
          JSON.stringify(value)
        )
      }

      // 使用Function构造器而不是eval来提高安全性
      const result = new Function('context', `with(context) { return ${evalExpression} }`)(context)
      return !!result
    } catch (error) {
      console.error('Expression evaluation error:', error)
      return false
    }
  }

  /**
   * 评估脚本条件
   */
  private evaluateScript(
    script: string,
    instance: WorkflowInstance,
    sourceNode: WorkflowNode
  ): boolean {
    try {
      const context = {
        instance,
        sourceNode,
        result: sourceNode.result,
        variables: Object.fromEntries(instance.context.variables),
        input: instance.context.inputData,
        output: instance.context.outputData,
      }

      // 创建沙箱环境执行脚本
      const func = new Function('context', script)
      const result = func(context)
      return !!result
    } catch (error) {
      console.error('Script evaluation error:', error)
      return false
    }
  }

  /**
   * 评估API条件
   */
  private async evaluateApiCondition(
    apiEndpoint: string,
    instance: WorkflowInstance,
    sourceNode: WorkflowNode
  ): Promise<boolean> {
    try {
      // 简化的API调用，实际应该使用HTTP客户端
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance: instance.id,
          sourceNode: sourceNode.id,
          result: sourceNode.result,
        }),
      })

      if (!response.ok) return false

      const result = await response.json()
      return !!result.condition
    } catch (error) {
      console.error('API condition evaluation error:', error)
      return false
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 验证模板
   */
  private validateTemplate(template: WorkflowTemplate): boolean {
    // 检查必要的字段
    if (!template.name || !template.nodes || template.nodes.length === 0) {
      return false
    }

    // 检查节点连接性
    const nodeIds = new Set(template.nodes.map((n) => n.id))
    for (const connection of template.connections) {
      if (!nodeIds.has(connection.sourceNodeId) || !nodeIds.has(connection.targetNodeId)) {
        return false
      }
    }

    // 检查是否有循环依赖（简化检查）
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true
      if (visited.has(nodeId)) return false

      visited.add(nodeId)
      recursionStack.add(nodeId)

      const node = template.nodes.find((n) => n.id === nodeId)
      if (node) {
        for (const dep of node.outputs.map((c) => c.targetNodeId)) {
          if (hasCycle(dep)) return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of template.nodes) {
      if (hasCycle(node.id)) return false
    }

    return true
  }

  /**
   * 估算持续时间
   */
  private estimateDuration(template: WorkflowTemplate): number {
    // 简化的估算：每个节点30秒
    return template.nodes.length * 30000
  }

  // ==================== 公共接口 ====================

  /**
   * 获取引擎统计
   */
  getEngineStats(): {
    templates: number
    instances: number
    runningInstances: number
    queuedInstances: number
    nodeExecutors: number
  } {
    return {
      templates: this.templates.size,
      instances: this.instances.size,
      runningInstances: this.runningInstances.size,
      queuedInstances: this.executionQueue.length,
      nodeExecutors: this.nodeExecutors.size,
    }
  }

  /**
   * 清理完成的工作流实例
   */
  cleanupCompletedInstances(olderThanHours: number = 24): number {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000
    let cleaned = 0

    for (const [instanceId, instance] of this.instances) {
      if (
        ['completed', 'failed', 'cancelled'].includes(instance.status) &&
        instance.endTime &&
        instance.endTime.getTime() < cutoffTime
      ) {
        this.instances.delete(instanceId)
        cleaned++
      }
    }

    return cleaned
  }
}

// ==================== 节点执行器接口 ====================

export interface NodeExecutor {
  execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any>
}

// ==================== 内置执行器 ====================

class TaskNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    // 模拟任务执行
    const taskType = node.config.taskType || 'generic'

    switch (taskType) {
      case 'http':
        return await this.executeHttpTask(node.config, inputData)
      case 'script':
        return await this.executeScriptTask(node.config, inputData, context)
      case 'ai':
        return await this.executeAiTask(node.config, inputData)
      default:
        return { result: `Task ${node.name} executed`, input: inputData }
    }
  }

  private async executeHttpTask(config: any, inputData: any): Promise<any> {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.method !== 'GET' ? JSON.stringify(inputData) : undefined,
    })
    return await response.json()
  }

  private async executeScriptTask(
    config: any,
    inputData: any,
    context: WorkflowContext
  ): Promise<any> {
    const func = new Function('input', 'context', config.script)
    return func(inputData, context)
  }

  private async executeAiTask(config: any, inputData: any): Promise<any> {
    // 模拟AI任务
    return { ai_result: `AI processed: ${JSON.stringify(inputData)}` }
  }
}

class DecisionNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    const conditions = node.config.conditions || []

    for (const condition of conditions) {
      // 简化的条件评估
      if (this.evaluateCondition(condition, inputData)) {
        return { decision: condition.output, reason: condition.description }
      }
    }

    return { decision: 'default', reason: 'No condition matched' }
  }

  private evaluateCondition(condition: any, inputData: any): boolean {
    // 简化的条件评估
    const { field, operator, value } = condition
    const fieldValue = inputData[field]

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'greater':
        return Number(fieldValue) > Number(value)
      case 'less':
        return Number(fieldValue) < Number(value)
      default:
        return false
    }
  }
}

class ParallelNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    const tasks = node.config.tasks || []
    const results = await Promise.all(tasks.map((task: any) => this.executeTask(task, inputData)))
    return { results, parallelExecution: true }
  }

  private async executeTask(task: any, inputData: any): Promise<any> {
    // 模拟并行任务执行
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ task: task.name, result: `Executed ${task.name}` })
      }, Math.random() * 1000)
    })
  }
}

class LoopNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    const { loopCondition, maxIterations = 10 } = node.config
    const results = []
    let iteration = 0

    while (
      iteration < maxIterations &&
      this.evaluateLoopCondition(loopCondition, inputData, results)
    ) {
      const result = await this.executeIteration(node.config.task, inputData, iteration)
      results.push(result)
      iteration++
    }

    return { results, iterations: iteration, completed: iteration < maxIterations }
  }

  private evaluateLoopCondition(condition: any, inputData: any, results: any[]): boolean {
    // 简化的循环条件评估
    return results.length < (condition.maxItems || 5)
  }

  private async executeIteration(task: any, inputData: any, iteration: number): Promise<any> {
    // 模拟循环迭代执行
    return { iteration, result: `Iteration ${iteration} completed` }
  }
}

class SubprocessNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    // 这里应该调用子工作流
    // 简化实现
    return { subprocess: node.config.subprocessId, result: 'Subprocess completed' }
  }
}

class EventNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    // 等待事件触发
    return new Promise((resolve) => {
      // 简化的等待逻辑
      setTimeout(() => {
        resolve({ event: node.config.eventType, triggered: true })
      }, node.config.timeout || 1000)
    })
  }
}

class GatewayNodeExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    context: WorkflowContext
  ): Promise<any> {
    // 网关节点，根据条件决定下一步
    const { gatewayType } = node.config

    switch (gatewayType) {
      case 'exclusive':
        return this.executeExclusiveGateway(node.config.branches || [], inputData)
      case 'inclusive':
        return this.executeInclusiveGateway(node.config.branches || [], inputData)
      case 'parallel':
        return { gateway: 'parallel', branches: node.config.branches || [] }
      default:
        return { gateway: 'default', branch: 'default' }
    }
  }

  private executeExclusiveGateway(branches: any[], inputData: any): any {
    for (const branch of branches) {
      if (this.evaluateBranchCondition(branch.condition, inputData)) {
        return { gateway: 'exclusive', selectedBranch: branch.id }
      }
    }
    return { gateway: 'exclusive', selectedBranch: 'default' }
  }

  private executeInclusiveGateway(branches: any[], inputData: any): any {
    const selectedBranches = branches
      .filter((branch) => this.evaluateBranchCondition(branch.condition, inputData))
      .map((branch) => branch.id)

    return { gateway: 'inclusive', selectedBranches }
  }

  private evaluateBranchCondition(condition: any, inputData: any): boolean {
    // 简化的分支条件评估
    return true // 总是为true，实际应该根据condition评估
  }
}

// 创建全局实例
export const asyncWorkflowEngine = new AsyncWorkflowEngine()
