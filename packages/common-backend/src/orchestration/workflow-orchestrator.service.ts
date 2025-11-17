import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { IntelligentSchedulerService, TaskRequirements, SchedulingResult } from './intelligent-scheduler.service'
import { AgentRegistryService, AgentInfo } from './agent-registry.service'

export interface WorkflowStep {
  id: string
  name: string
  description: string
  agentType?: 'creation' | 'logic' | 'narrative' | 'custom'
  capability: string
  inputMapping: Record<string, string> // 输入数据映射
  outputMapping: Record<string, string> // 输出数据映射
  conditions?: {
    prerequisiteSteps?: string[] // 前置步骤
    successCriteria?: any // 成功条件
    retryPolicy?: {
      maxAttempts: number
      backoffStrategy: 'linear' | 'exponential'
      baseDelay: number
    }
  }
  timeout?: number // 超时时间(ms)
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  steps: WorkflowStep[]
  globalConfig?: {
    maxExecutionTime?: number
    parallelExecution?: boolean
    errorHandling?: 'fail-fast' | 'continue-on-error'
  }
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  currentStep?: string
  completedSteps: string[]
  failedSteps: string[]
  stepResults: Map<string, any>
  context: Record<string, any> // 共享上下文数据
  error?: string
}

export interface WorkflowExecutionResult {
  executionId: string
  status: WorkflowExecution['status']
  duration: number
  results: Map<string, any>
  errors: string[]
  context: Record<string, any>
}

@Injectable()
export class WorkflowOrchestratorService {
  private readonly logger = new Logger(WorkflowOrchestratorService.name)
  private readonly activeExecutions = new Map<string, WorkflowExecution>()
  private readonly workflowDefinitions = new Map<string, WorkflowDefinition>()

  constructor(
    private scheduler: IntelligentSchedulerService,
    private agentRegistry: AgentRegistryService,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * 注册工作流定义
   */
  registerWorkflow(definition: WorkflowDefinition): void {
    this.workflowDefinitions.set(definition.id, definition)
    this.logger.log(`Workflow registered: ${definition.name} (${definition.id})`)
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string,
    initialContext: Record<string, any> = {}
  ): Promise<WorkflowExecutionResult> {
    const definition = this.workflowDefinitions.get(workflowId)
    if (!definition) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const executionId = `exec-${workflowId}-${Date.now()}`
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      completedSteps: [],
      failedSteps: [],
      stepResults: new Map(),
      context: { ...initialContext }
    }

    this.activeExecutions.set(executionId, execution)

    try {
      this.logger.log(`Starting workflow execution: ${executionId}`)
      execution.status = 'running'
      this.eventEmitter.emit('workflow.started', execution)

      const result = await this.executeWorkflowSteps(definition, execution)

      execution.status = 'completed'
      execution.endTime = new Date()

      this.logger.log(`Workflow execution completed: ${executionId}`)
      this.eventEmitter.emit('workflow.completed', execution)

      return result

    } catch (error) {
      execution.status = 'failed'
      execution.endTime = new Date()
      execution.error = error.message

      this.logger.error(`Workflow execution failed: ${executionId}`, error)
      this.eventEmitter.emit('workflow.failed', execution)

      throw error
    } finally {
      // 清理活跃执行记录
      setTimeout(() => {
        this.activeExecutions.delete(executionId)
      }, 60000) // 1分钟后清理
    }
  }

  /**
   * 执行工作流步骤
   */
  private async executeWorkflowSteps(
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<WorkflowExecutionResult> {
    const { steps, globalConfig } = definition
    const errors: string[] = []

    // 构建步骤依赖图
    const stepGraph = this.buildStepDependencyGraph(steps)

    if (globalConfig?.parallelExecution) {
      // 并行执行
      await this.executeStepsInParallel(steps, execution, stepGraph, errors)
    } else {
      // 顺序执行
      await this.executeStepsSequentially(steps, execution, stepGraph, errors)
    }

    const duration = execution.endTime
      ? execution.endTime.getTime() - execution.startTime.getTime()
      : Date.now() - execution.startTime.getTime()

    return {
      executionId: execution.id,
      status: execution.status,
      duration,
      results: execution.stepResults,
      errors,
      context: execution.context
    }
  }

  /**
   * 顺序执行步骤
   */
  private async executeStepsSequentially(
    steps: WorkflowStep[],
    execution: WorkflowExecution,
    stepGraph: Map<string, Set<string>>,
    errors: string[]
  ): Promise<void> {
    for (const step of steps) {
      try {
        await this.executeStep(step, execution)
        execution.completedSteps.push(step.id)
      } catch (error) {
        execution.failedSteps.push(step.id)
        errors.push(`Step ${step.id} failed: ${error.message}`)

        if (execution.status !== 'failed') {
          execution.status = 'failed'
          break
        }
      }
    }
  }

  /**
   * 并行执行步骤
   */
  private async executeStepsInParallel(
    steps: WorkflowStep[],
    execution: WorkflowExecution,
    stepGraph: Map<string, Set<string>>,
    errors: string[]
  ): Promise<void> {
    const executing = new Set<string>()
    const completed = new Set<string>()

    while (completed.size < steps.length) {
      // 找出可以并行执行的步骤
      const readySteps = steps.filter(step =>
        !executing.has(step.id) &&
        !completed.has(step.id) &&
        this.arePrerequisitesMet(step, completed)
      )

      if (readySteps.length === 0) {
        // 检查是否有死锁
        if (executing.size === 0) {
          throw new Error('Workflow deadlock detected')
        }
        // 等待正在执行的步骤
        await new Promise(resolve => setTimeout(resolve, 100))
        continue
      }

      // 并行执行准备好的步骤
      const promises = readySteps.map(async (step) => {
        executing.add(step.id)
        try {
          await this.executeStep(step, execution)
          completed.add(step.id)
          execution.completedSteps.push(step.id)
        } catch (error) {
          execution.failedSteps.push(step.id)
          errors.push(`Step ${step.id} failed: ${error.message}`)
          if (execution.status !== 'failed') {
            execution.status = 'failed'
          }
        } finally {
          executing.delete(step.id)
        }
      })

      await Promise.allSettled(promises)
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    execution.currentStep = step.id
    this.logger.debug(`Executing step: ${step.id} (${step.name})`)

    // 准备输入数据
    const inputData = this.mapInputData(step.inputMapping, execution)

    // 调度合适的Agent
    const schedulingResult = await this.scheduler.scheduleTask({
      taskId: `${execution.id}-${step.id}`,
      requirements: {
        capability: step.capability,
        priority: 'high',
        maxLatency: step.timeout
      }
    })

    if (!schedulingResult) {
      throw new Error(`No suitable agent found for capability: ${step.capability}`)
    }

    // 执行Agent调用
    const result = await this.executeAgentCall(schedulingResult, inputData, step.timeout)

    // 存储结果并更新上下文
    execution.stepResults.set(step.id, result)
    this.mapOutputData(step.outputMapping, result, execution)

    this.logger.debug(`Step completed: ${step.id}`)
  }

  /**
   * 执行Agent调用
   */
  private async executeAgentCall(
    schedulingResult: SchedulingResult,
    inputData: any,
    timeout?: number
  ): Promise<any> {
    const { agent, capability } = schedulingResult

    // 创建带超时的Promise
    const executionPromise = this.callAgent(agent, capability, inputData)

    if (timeout) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Step execution timeout: ${timeout}ms`)), timeout)
      })

      return Promise.race([executionPromise, timeoutPromise])
    }

    return executionPromise
  }

  /**
   * 调用Agent (模拟实现)
   */
  private async callAgent(agent: AgentInfo, capability: any, inputData: any): Promise<any> {
    // 这里应该是实际的Agent调用逻辑
    // 暂时返回模拟结果
    this.logger.debug(`Calling agent ${agent.id} for capability ${capability.name}`)

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    // 返回模拟结果
    return {
      success: true,
      data: {
        result: `Result from ${agent.name} for ${capability.name}`,
        timestamp: new Date().toISOString(),
        ...inputData
      }
    }
  }

  /**
   * 映射输入数据
   */
  private mapInputData(mapping: Record<string, string>, execution: WorkflowExecution): any {
    const result: any = {}

    for (const [inputKey, contextPath] of Object.entries(mapping)) {
      result[inputKey] = this.getValueFromContext(contextPath, execution)
    }

    return result
  }

  /**
   * 映射输出数据
   */
  private mapOutputData(mapping: Record<string, string>, result: any, execution: WorkflowExecution): void {
    for (const [outputKey, contextPath] of Object.entries(mapping)) {
      this.setValueInContext(contextPath, result[outputKey], execution)
    }
  }

  /**
   * 从上下文获取值
   */
  private getValueFromContext(path: string, execution: WorkflowExecution): any {
    const keys = path.split('.')
    let value = execution.context

    for (const key of keys) {
      if (key.startsWith('$step.')) {
        // 引用其他步骤的结果
        const stepId = key.substring(6)
        const stepResult = execution.stepResults.get(stepId)
        value = stepResult
      } else {
        value = value?.[key]
      }
    }

    return value
  }

  /**
   * 在上下文设置值
   */
  private setValueInContext(path: string, value: any, execution: WorkflowExecution): void {
    const keys = path.split('.')
    let target = execution.context

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!target[key]) {
        target[key] = {}
      }
      target = target[key]
    }

    target[keys[keys.length - 1]] = value
  }

  /**
   * 构建步骤依赖图
   */
  private buildStepDependencyGraph(steps: WorkflowStep[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>()

    steps.forEach(step => {
      graph.set(step.id, new Set(step.conditions?.prerequisiteSteps || []))
    })

    return graph
  }

  /**
   * 检查前置条件是否满足
   */
  private arePrerequisitesMet(step: WorkflowStep, completedSteps: Set<string>): boolean {
    const prerequisites = step.conditions?.prerequisiteSteps || []
    return prerequisites.every(prereq => completedSteps.has(prereq))
  }

  /**
   * 获取活跃执行列表
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values())
  }

  /**
   * 取消执行
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId)
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled'
      execution.endTime = new Date()
      this.eventEmitter.emit('workflow.cancelled', execution)
      return true
    }
    return false
  }

  /**
   * 获取编排统计信息
   */
  getOrchestratorStats() {
    return {
      registeredWorkflows: this.workflowDefinitions.size,
      activeExecutions: this.activeExecutions.size,
      workflowNames: Array.from(this.workflowDefinitions.values()).map(w => w.name)
    }
  }
}
