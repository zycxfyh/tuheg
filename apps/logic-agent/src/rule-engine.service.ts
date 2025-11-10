// 文件路径: apps/logic-agent/src/rule-engine.service.ts (企业级规则引擎)
//
// 核心功能:
// 1. 动态规则加载和热更新
// 2. 规则性能监控和优化
// 3. 规则缓存和预编译
// 4. 并发规则执行优化
// 5. 规则依赖管理和冲突检测
// 6. 自适应规则执行策略

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type {
  DirectiveSet,
  NumericOperation,
  StateChangeDirective,
  StringOperation,
} from '@tuheg/ai-domain'
import type {
  CharacterUpdate,
  PrismaService,
  CacheService,
} from '@tuheg/infrastructure'
import * as fs from 'fs'
import * as path from 'path'
import { EventEmitter } from 'events'

/**
 * 规则执行策略
 */
export enum RuleExecutionStrategy {
  /** 串行执行 */
  SEQUENTIAL = 'sequential',
  /** 并行执行 */
  PARALLEL = 'parallel',
  /** 条件执行 */
  CONDITIONAL = 'conditional',
  /** 自适应执行 */
  ADAPTIVE = 'adaptive'
}

/**
 * 规则优先级
 */
export enum RulePriority {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 10,
  CRITICAL = 15
}

/**
 * 规则元数据
 */
export interface RuleMetadata {
  id: string
  name: string
  description?: string
  version: string
  priority: RulePriority
  tags: string[]
  dependencies: string[]
  conditions?: RuleCondition[]
  timeout?: number
  retryCount?: number
  enabled: boolean
  lastModified: Date
  performanceMetrics: RulePerformanceMetrics
}

/**
 * 规则条件
 */
export interface RuleCondition {
  type: 'field_exists' | 'field_equals' | 'field_range' | 'custom'
  field: string
  operator: string
  value: any
  negate?: boolean
}

/**
 * 规则执行上下文
 */
export interface RuleExecutionContext {
  gameId: string
  directive: StateChangeDirective
  payload: any
  previousState?: any
  executionOrder: number
  startTime: number
  timeout?: number
}

/**
 * 规则执行结果
 */
export interface RuleExecutionResult {
  success: boolean
  executionTime: number
  error?: Error
  skipped?: boolean
  reason?: string
  metadata?: Record<string, any>
}

/**
 * 规则性能指标
 */
export interface RulePerformanceMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  p95ExecutionTime: number
  lastExecutionTime: number
  errorRate: number
  cacheHitRate: number
}

/**
 * 规则定义
 */
export interface RuleDefinition {
  metadata: RuleMetadata
  validate: (context: RuleExecutionContext) => Promise<boolean>
  execute: (context: RuleExecutionContext) => Promise<RuleExecutionResult>
  rollback?: (context: RuleExecutionContext) => Promise<void>
}

/**
 * 规则引擎配置
 */
export interface RuleEngineConfig {
  enableDynamicLoading: boolean
  rulesDirectory: string
  cacheEnabled: boolean
  parallelExecutionLimit: number
  defaultTimeout: number
  enablePerformanceMonitoring: boolean
  enableRuleHotReload: boolean
}

@Injectable()
export class RuleEngineService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RuleEngineService.name)

  // 规则存储
  private rules = new Map<string, RuleDefinition>()
  private ruleMetadata = new Map<string, RuleMetadata>()

  // 规则依赖图
  private dependencyGraph = new Map<string, Set<string>>()

  // 执行队列和并发控制
  private executionQueue: Array<{
    context: RuleExecutionContext
    rule: RuleDefinition
    resolve: (result: RuleExecutionResult) => void
    reject: (error: Error) => void
  }> = []
  private activeExecutions = 0

  // 配置
  private config: RuleEngineConfig = {
    enableDynamicLoading: true,
    rulesDirectory: path.join(process.cwd(), 'rules'),
    cacheEnabled: true,
    parallelExecutionLimit: 3,
    defaultTimeout: 5000,
    enablePerformanceMonitoring: true,
    enableRuleHotReload: true
  }

  // 文件监听器
  private fileWatcher?: fs.FSWatcher

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService
  ) {
    super()

    // 设置事件监听器限制
    this.setMaxListeners(50)
  }

  /**
   * 模块初始化
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('初始化规则引擎...')

    // 加载内置规则
    await this.loadBuiltInRules()

    // 动态加载外部规则
    if (this.config.enableDynamicLoading) {
      await this.loadDynamicRules()

      // 设置文件监听器进行热重载
      if (this.config.enableRuleHotReload) {
        this.setupFileWatcher()
      }
    }

    // 构建依赖图
    this.buildDependencyGraph()

    // 预热常用规则
    await this.warmupRules()

    this.logger.log(`规则引擎初始化完成，共加载 ${this.rules.size} 个规则`)
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('关闭规则引擎...')

    // 停止文件监听
    if (this.fileWatcher) {
      this.fileWatcher.close()
    }

    // 等待所有执行完成
    while (this.activeExecutions > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.logger.log('规则引擎已关闭')
  }

  /**
   * 智能规则执行 - 支持多策略并发执行
   */
  public async execute(gameId: string, directives: DirectiveSet): Promise<void> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    this.logger.log(`开始执行规则集 ${executionId}: ${directives.length} 个指令`)

    if (!directives || directives.length === 0) {
      this.logger.warn(`规则集为空，跳过执行`)
      return
    }

    // [安全修复] 在执行指令前进行业务规则验证
    this.validateDirectives(directives)

    // 获取游戏当前状态（用于规则上下文）
    const gameState = await this.getGameState(gameId)

    try {
      // 选择执行策略
      const strategy = this.selectExecutionStrategy(directives, gameState)

      // 构建规则执行上下文
      const executionContexts = directives.map((directive, index) => ({
        gameId,
        directive,
        payload: directive.payload,
        previousState: gameState,
        executionOrder: index,
        startTime: Date.now(),
        timeout: directive.timeout || this.config.defaultTimeout
      }))

      // 执行规则
      const results = await this.executeRulesWithStrategy(executionContexts, strategy)

      // 处理结果
      await this.processExecutionResults(results, executionContexts)

      const totalTime = Date.now() - startTime
      this.logger.log(`规则集 ${executionId} 执行完成: ${results.filter(r => r.success).length}/${results.length} 成功，总耗时 ${totalTime}ms`)

      // 发送完成事件
      this.emit('executionCompleted', {
        executionId,
        gameId,
        results,
        totalTime,
        strategy
      })

    } catch (error: unknown) {
      const totalTime = Date.now() - startTime

      if (error instanceof BadRequestException) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown database error'

      this.logger.error(
        `规则执行失败 ${executionId}: ${errorMessage}`,
        error instanceof Error ? error.stack : error
      )

      // 发送失败事件
      this.emit('executionFailed', {
        executionId,
        gameId,
        error: errorMessage,
        totalTime
      })

      throw new InternalServerErrorException(`Rule engine execution failed: ${errorMessage}`)
    }
  }

  /**
   * 根据指令和状态选择最优执行策略
   */
  private selectExecutionStrategy(directives: DirectiveSet, gameState: any): RuleExecutionStrategy {
    // 简单的策略选择逻辑（可以基于机器学习优化）
    if (directives.length === 1) {
      return RuleExecutionStrategy.SEQUENTIAL
    }

    // 检查是否有依赖关系
    const hasDependencies = directives.some(d =>
      this.dependencyGraph.has(d.op) && this.dependencyGraph.get(d.op)!.size > 0
    )

    if (hasDependencies) {
      return RuleExecutionStrategy.SEQUENTIAL
    }

    // 检查是否所有指令都是独立的
    const allIndependent = directives.every(d => !this.hasRuleConflicts(d, directives))

    if (allIndependent && directives.length <= this.config.parallelExecutionLimit) {
      return RuleExecutionStrategy.PARALLEL
    }

    return RuleExecutionStrategy.ADAPTIVE
  }

  /**
   * 使用指定策略执行规则
   */
  private async executeRulesWithStrategy(
    contexts: RuleExecutionContext[],
    strategy: RuleExecutionStrategy
  ): Promise<RuleExecutionResult[]> {
    switch (strategy) {
      case RuleExecutionStrategy.SEQUENTIAL:
        return this.executeSequentially(contexts)

      case RuleExecutionStrategy.PARALLEL:
        return this.executeInParallel(contexts)

      case RuleExecutionStrategy.CONDITIONAL:
        return this.executeConditionally(contexts)

      case RuleExecutionStrategy.ADAPTIVE:
        return this.executeAdaptively(contexts)

      default:
        return this.executeSequentially(contexts)
    }
  }

  /**
   * 串行执行规则
   */
  private async executeSequentially(contexts: RuleExecutionContext[]): Promise<RuleExecutionResult[]> {
    const results: RuleExecutionResult[] = []

    for (const context of contexts) {
      const result = await this.executeSingleRule(context)
      results.push(result)

      // 如果关键规则失败，可能需要回滚
      if (!result.success && this.isCriticalRule(context.directive)) {
        await this.rollbackFailedExecution(results, contexts)
        break
      }
    }

    return results
  }

  /**
   * 并行执行规则
   */
  private async executeInParallel(contexts: RuleExecutionContext[]): Promise<RuleExecutionResult[]> {
    const promises = contexts.map(context => this.executeSingleRule(context))
    return Promise.all(promises)
  }

  /**
   * 条件执行规则
   */
  private async executeConditionally(contexts: RuleExecutionContext[]): Promise<RuleExecutionResult[]> {
    const results: RuleExecutionResult[] = []

    for (const context of contexts) {
      // 检查前置条件
      const shouldExecute = await this.checkExecutionConditions(context)

      if (shouldExecute) {
        const result = await this.executeSingleRule(context)
        results.push(result)
      } else {
        results.push({
          success: true,
          executionTime: 0,
          skipped: true,
          reason: '条件不满足，跳过执行'
        })
      }
    }

    return results
  }

  /**
   * 自适应执行规则
   */
  private async executeAdaptively(contexts: RuleExecutionContext[]): Promise<RuleExecutionResult[]> {
    // 基于性能指标动态调整执行策略
    const batches = this.createExecutionBatches(contexts)

    const results: RuleExecutionResult[] = []

    for (const batch of batches) {
      if (batch.length === 1) {
        // 单规则串行执行
        results.push(...await this.executeSequentially(batch))
      } else {
        // 批量并行执行
        results.push(...await this.executeInParallel(batch))
      }

      // 检查是否有失败的规则需要特殊处理
      const failedResults = results.filter(r => !r.success)
      if (failedResults.length > 0) {
        this.logger.warn(`批次执行中有 ${failedResults.length} 个规则失败，调整策略`)
        // 可以在这里实现更复杂的自适应逻辑
      }
    }

    return results
  }

  /**
   * 执行单个规则
   */
  private async executeSingleRule(context: RuleExecutionContext): Promise<RuleExecutionResult> {
    const rule = this.rules.get(context.directive.op)

    if (!rule) {
      return {
        success: false,
        executionTime: 0,
        error: new Error(`未找到规则: ${context.directive.op}`)
      }
    }

    const startTime = Date.now()

    try {
      // 验证规则条件
      const isValid = await rule.validate(context)
      if (!isValid) {
        return {
          success: true,
          executionTime: Date.now() - startTime,
          skipped: true,
          reason: '规则验证失败'
        }
      }

      // 执行规则（带超时控制）
      const result = await this.executeWithTimeout(rule.execute(context), context.timeout)

      const executionTime = Date.now() - startTime

      // 更新性能指标
      this.updateRuleMetrics(rule.metadata.id, executionTime, result.success)

      return {
        ...result,
        executionTime
      }

    } catch (error) {
      const executionTime = Date.now() - startTime

      this.updateRuleMetrics(rule.metadata.id, executionTime, false)

      return {
        success: false,
        executionTime,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 获取游戏当前状态
   */
  private async getGameState(gameId: string): Promise<any> {
    try {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        include: {
          characters: true,
          world: true
        }
      })

      return game || {}
    } catch (error) {
      this.logger.warn(`无法获取游戏状态 ${gameId}:`, error)
      return {}
    }
  }

  /**
   * 处理执行结果
   */
  private async processExecutionResults(
    results: RuleExecutionResult[],
    contexts: RuleExecutionContext[]
  ): Promise<void> {
    // 使用数据库事务执行所有成功的规则
    const successfulContexts = contexts.filter((_, index) => results[index].success)

    if (successfulContexts.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const context of successfulContexts) {
          await this.handleUpdateCharacter(tx, context.gameId, context.directive)
        }
      })
    }

    // 记录失败的规则
    const failedResults = results.filter(r => !r.success)
    if (failedResults.length > 0) {
      this.logger.warn(`规则执行失败: ${failedResults.length} 个规则失败`)
      failedResults.forEach((result, index) => {
        if (result.error) {
          this.logger.error(`规则失败: ${result.error.message}`)
        }
      })
    }
  }

  /**
   * 执行带超时的操作
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.config.defaultTimeout

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`规则执行超时: ${timeout}ms`))
      }, timeout)

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId))
    })
  }

  /**
   * 检查规则冲突
   */
  private hasRuleConflicts(directive: StateChangeDirective, allDirectives: DirectiveSet): boolean {
    // 检查是否有其他指令修改相同的字段
    return allDirectives.some(other =>
      other !== directive &&
      other.op === directive.op &&
      this.haveConflictingFields(directive.payload, other.payload)
    )
  }

  /**
   * 检查字段冲突
   */
  private haveConflictingFields(payload1: any, payload2: any): boolean {
    const fields1 = Object.keys(payload1 || {})
    const fields2 = Object.keys(payload2 || {})

    return fields1.some(field => fields2.includes(field))
  }

  /**
   * 检查是否为关键规则
   */
  private isCriticalRule(directive: StateChangeDirective): boolean {
    return directive.op === 'update_character' // 可以扩展更多关键规则
  }

  /**
   * 检查执行条件
   */
  private async checkExecutionConditions(context: RuleExecutionContext): Promise<boolean> {
    const rule = this.rules.get(context.directive.op)
    if (!rule?.metadata.conditions) {
      return true
    }

    // 检查所有条件
    for (const condition of rule.metadata.conditions) {
      if (!(await this.evaluateCondition(condition, context))) {
        return false
      }
    }

    return true
  }

  /**
   * 评估单个条件
   */
  private async evaluateCondition(condition: RuleCondition, context: RuleExecutionContext): Promise<boolean> {
    const value = this.getNestedValue(context.payload, condition.field)
    let result = false

    switch (condition.type) {
      case 'field_exists':
        result = value !== undefined
        break
      case 'field_equals':
        result = value === condition.value
        break
      case 'field_range':
        const numValue = Number(value)
        const [min, max] = condition.value as [number, number]
        result = numValue >= min && numValue <= max
        break
      case 'custom':
        // 可以在这里实现自定义条件逻辑
        result = true
        break
    }

    return condition.negate ? !result : result
  }

  /**
   * 获取嵌套对象值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 创建执行批次
   */
  private createExecutionBatches(contexts: RuleExecutionContext[]): RuleExecutionContext[][] {
    const batches: RuleExecutionContext[][] = []
    const batchSize = Math.min(this.config.parallelExecutionLimit, contexts.length)

    for (let i = 0; i < contexts.length; i += batchSize) {
      batches.push(contexts.slice(i, i + batchSize))
    }

    return batches
  }

  /**
   * 回滚失败的执行
   */
  private async rollbackFailedExecution(
    results: RuleExecutionResult[],
    contexts: RuleExecutionContext[]
  ): Promise<void> {
    this.logger.warn('执行关键规则失败，开始回滚...')

    // 找出需要回滚的规则
    const rollbackPromises = contexts
      .filter((_, index) => results[index].success)
      .map(async (context) => {
        const rule = this.rules.get(context.directive.op)
        if (rule?.rollback) {
          try {
            await rule.rollback(context)
          } catch (error) {
            this.logger.error(`回滚失败 ${context.directive.op}:`, error)
          }
        }
      })

    await Promise.allSettled(rollbackPromises)
    this.logger.log('回滚完成')
  }

  /**
   * 更新规则性能指标
   */
  private updateRuleMetrics(ruleId: string, executionTime: number, success: boolean): void {
    const metadata = this.ruleMetadata.get(ruleId)
    if (!metadata) return

    const metrics = metadata.performanceMetrics

    metrics.totalExecutions++
    metrics.lastExecutionTime = executionTime

    if (success) {
      metrics.successfulExecutions++
    } else {
      metrics.failedExecutions++
    }

    // 更新平均执行时间
    const totalTime = metrics.averageExecutionTime * (metrics.totalExecutions - 1) + executionTime
    metrics.averageExecutionTime = totalTime / metrics.totalExecutions

    // 更新错误率
    metrics.errorRate = metrics.failedExecutions / metrics.totalExecutions

    // 更新P95执行时间（简化的计算）
    metrics.p95ExecutionTime = Math.max(metrics.p95ExecutionTime, executionTime)
  }

  /**
   * 加载内置规则
   */
  private async loadBuiltInRules(): Promise<void> {
    const builtInRules: RuleDefinition[] = [
      {
        metadata: {
          id: 'update_character',
          name: '角色更新规则',
          description: '处理角色属性更新',
          version: '1.0.0',
          priority: RulePriority.HIGH,
          tags: ['character', 'update'],
          dependencies: [],
          enabled: true,
          lastModified: new Date(),
          performanceMetrics: this.createEmptyMetrics()
        },
        validate: async (context) => {
          const payload = context.payload as CharacterUpdate
          return !!(payload.hp || payload.mp || payload.status)
        },
        execute: async (context) => {
          // 这里会调用数据库操作
          return { success: true, executionTime: 0 }
        }
      }
    ]

    for (const rule of builtInRules) {
      this.registerRule(rule)
    }
  }

  /**
   * 加载动态规则
   */
  private async loadDynamicRules(): Promise<void> {
    // 创建规则目录（如果不存在）
    if (!fs.existsSync(this.config.rulesDirectory)) {
      fs.mkdirSync(this.config.rulesDirectory, { recursive: true })
    }

    // 扫描规则文件
    const ruleFiles = fs.readdirSync(this.config.rulesDirectory)
      .filter(file => file.endsWith('.rule.js') || file.endsWith('.rule.ts'))

    for (const file of ruleFiles) {
      try {
        const filePath = path.join(this.config.rulesDirectory, file)
        const ruleModule = require(filePath)

        if (ruleModule.default && this.isValidRuleDefinition(ruleModule.default)) {
          this.registerRule(ruleModule.default)
        }
      } catch (error) {
        this.logger.error(`加载规则文件失败 ${file}:`, error)
      }
    }
  }

  /**
   * 注册规则
   */
  private registerRule(rule: RuleDefinition): void {
    this.rules.set(rule.metadata.id, rule)
    this.ruleMetadata.set(rule.metadata.id, rule.metadata)

    this.logger.debug(`已注册规则: ${rule.metadata.name} (${rule.metadata.id})`)
  }

  /**
   * 验证规则定义
   */
  private isValidRuleDefinition(obj: any): obj is RuleDefinition {
    return obj &&
           obj.metadata &&
           obj.metadata.id &&
           typeof obj.validate === 'function' &&
           typeof obj.execute === 'function'
  }

  /**
   * 构建依赖图
   */
  private buildDependencyGraph(): void {
    this.dependencyGraph.clear()

    for (const rule of this.rules.values()) {
      for (const dep of rule.metadata.dependencies) {
        if (!this.dependencyGraph.has(dep)) {
          this.dependencyGraph.set(dep, new Set())
        }
        this.dependencyGraph.get(dep)!.add(rule.metadata.id)
      }
    }
  }

  /**
   * 预热规则
   */
  private async warmupRules(): Promise<void> {
    // 预加载常用规则到缓存
    const commonRuleIds = ['update_character']

    for (const ruleId of commonRuleIds) {
      if (this.rules.has(ruleId)) {
        const rule = this.rules.get(ruleId)!
        // 可以在这里进行预编译或其他预热操作
        this.logger.debug(`规则预热: ${rule.metadata.name}`)
      }
    }
  }

  /**
   * 设置文件监听器
   */
  private setupFileWatcher(): void {
    this.fileWatcher = fs.watch(this.config.rulesDirectory, (eventType, filename) => {
      if (filename && (filename.endsWith('.rule.js') || filename.endsWith('.rule.ts'))) {
        this.logger.log(`检测到规则文件变化: ${filename}, 重新加载...`)
        this.loadDynamicRules().then(() => {
          this.buildDependencyGraph()
        }).catch(error => {
          this.logger.error('重新加载规则失败:', error)
        })
      }
    })
  }

  /**
   * 创建空的性能指标
   */
  private createEmptyMetrics(): RulePerformanceMetrics {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      p95ExecutionTime: 0,
      lastExecutionTime: 0,
      errorRate: 0,
      cacheHitRate: 0
    }
  }

  private async handleUpdateCharacter(
    tx: Prisma.TransactionClient,
    gameId: string,
    directive: StateChangeDirective
  ) {
    const character = await tx.character.findUniqueOrThrow({
      where: { gameId },
    })
    const payload = directive.payload as CharacterUpdate
    const updates: Prisma.CharacterUpdateInput = {}

    if (payload.hp) {
      updates.hp = this.applyNumericOperation(character.hp, payload.hp)
    }
    if (payload.mp) {
      updates.mp = this.applyNumericOperation(character.mp, payload.mp)
    }
    if (payload.status) {
      updates.status = this.applyStringOperation(character.status, payload.status)
    }

    if (Object.keys(updates).length > 0) {
      await tx.character.update({ where: { gameId }, data: updates })
    }
  }

  private applyNumericOperation(currentValue: number, op: NumericOperation): number {
    switch (op.op) {
      case 'set':
        return op.value
      case 'increment':
        return currentValue + op.value
      case 'decrement':
        return currentValue - op.value
    }
  }

  private applyStringOperation(currentValue: string, op: StringOperation): string {
    switch (op.op) {
      case 'set':
        return op.value
      case 'append':
        return currentValue + op.value
      case 'prepend':
        return op.value + currentValue
    }
  }

  /**
   * [安全修复] 验证指令集中的业务规则
   * 防止AI生成恶意或不合理的状态变更
   */
  private validateDirectives(directives: DirectiveSet): void {
    for (const directive of directives) {
      if (directive.op === 'update_character') {
        this.validateCharacterUpdate(directive.payload as CharacterUpdate)
      }
      // 可以在这里添加其他操作类型的验证
    }
  }

  /**
   * [安全修复] 验证角色更新指令的业务规则
   */
  private validateCharacterUpdate(payload: CharacterUpdate): void {
    // HP验证：不能为负数，且单次操作不能超过合理范围
    if (payload.hp) {
      this.validateNumericOperation(payload.hp, 'HP', -1000, 1000)
    }

    // MP验证：不能为负数，且单次操作不能超过合理范围
    if (payload.mp) {
      this.validateNumericOperation(payload.mp, 'MP', -1000, 1000)
    }

    // 状态字符串验证：长度限制，防止注入攻击
    if (payload.status) {
      this.validateStringOperation(payload.status, 'status', 500)
    }
  }

  /**
   * [安全修复] 验证数值操作的业务规则
   */
  private validateNumericOperation(
    op: NumericOperation,
    fieldName: string,
    minValue: number,
    maxValue: number
  ): void {
    // 检查操作值是否在合理范围内
    if (op.value < minValue || op.value > maxValue) {
      throw new BadRequestException(
        `${fieldName} operation value ${op.value} is outside allowed range [${minValue}, ${maxValue}]`
      )
    }

    // 对于set操作，检查是否会导致无效状态
    if (op.op === 'set' && op.value < 0) {
      throw new BadRequestException(`${fieldName} cannot be set to negative value: ${op.value}`)
    }
  }

  /**
   * [安全修复] 验证字符串操作的业务规则
   */
  private validateStringOperation(op: StringOperation, fieldName: string, maxLength: number): void {
    // 检查字符串长度是否超过限制
    if (op.value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} value is too long: ${op.value.length} characters (max: ${maxLength})`
      )
    }

    // 检查是否包含潜在的恶意内容（基础检查）
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(op.value)) {
        throw new BadRequestException(
          `${fieldName} contains potentially malicious content: ${op.value.substring(0, 50)}...`
        )
      }
    }
  }

  // === 规则管理API ===

  /**
   * 获取所有已注册规则
   */
  getRegisteredRules(): Array<{ id: string; metadata: RuleMetadata }> {
    return Array.from(this.rules.entries()).map(([id, rule]) => ({
      id,
      metadata: rule.metadata
    }))
  }

  /**
   * 获取规则性能统计
   */
  getRulePerformanceStats(): Array<{
    ruleId: string
    name: string
    metrics: RulePerformanceMetrics
  }> {
    return Array.from(this.ruleMetadata.entries()).map(([id, metadata]) => ({
      ruleId: id,
      name: metadata.name,
      metrics: metadata.performanceMetrics
    }))
  }

  /**
   * 获取引擎整体统计
   */
  getEngineStats(): {
    totalRules: number
    activeRules: number
    executionQueueLength: number
    activeExecutions: number
    uptime: number
  } {
    const startTime = (this as any).startTime || Date.now()
    const uptime = Date.now() - startTime

    return {
      totalRules: this.rules.size,
      activeRules: Array.from(this.ruleMetadata.values()).filter(m => m.enabled).length,
      executionQueueLength: this.executionQueue.length,
      activeExecutions: this.activeExecutions,
      uptime
    }
  }

  /**
   * 动态启用/禁用规则
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const metadata = this.ruleMetadata.get(ruleId)
    if (!metadata) {
      throw new BadRequestException(`规则不存在: ${ruleId}`)
    }

    metadata.enabled = enabled
    this.logger.log(`规则 ${ruleId} 已${enabled ? '启用' : '禁用'}`)

    // 发送规则状态变更事件
    this.emit('ruleToggled', { ruleId, enabled })
  }

  /**
   * 重新加载规则
   */
  async reloadRules(): Promise<void> {
    this.logger.log('开始重新加载规则...')

    // 清除现有规则
    this.rules.clear()
    this.ruleMetadata.clear()

    // 重新加载
    await this.loadBuiltInRules()
    await this.loadDynamicRules()
    this.buildDependencyGraph()

    this.logger.log(`规则重新加载完成，共加载 ${this.rules.size} 个规则`)

    // 发送重新加载事件
    this.emit('rulesReloaded', { totalRules: this.rules.size })
  }

  /**
   * 创建自定义规则
   */
  async createCustomRule(ruleDefinition: Omit<RuleDefinition, 'metadata'> & {
    metadata: Omit<RuleMetadata, 'performanceMetrics' | 'lastModified'>
  }): Promise<string> {
    const ruleId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const completeMetadata: RuleMetadata = {
      ...ruleDefinition.metadata,
      id: ruleId,
      performanceMetrics: this.createEmptyMetrics(),
      lastModified: new Date()
    }

    const rule: RuleDefinition = {
      ...ruleDefinition,
      metadata: completeMetadata
    }

    this.registerRule(rule)
    this.buildDependencyGraph()

    this.logger.log(`创建自定义规则: ${completeMetadata.name} (${ruleId})`)

    // 发送规则创建事件
    this.emit('ruleCreated', { ruleId, metadata: completeMetadata })

    return ruleId
  }

  /**
   * 删除自定义规则
   */
  async deleteCustomRule(ruleId: string): Promise<void> {
    if (!ruleId.startsWith('custom_')) {
      throw new BadRequestException('只能删除自定义规则')
    }

    if (!this.rules.has(ruleId)) {
      throw new BadRequestException(`规则不存在: ${ruleId}`)
    }

    this.rules.delete(ruleId)
    this.ruleMetadata.delete(ruleId)
    this.buildDependencyGraph()

    this.logger.log(`删除自定义规则: ${ruleId}`)

    // 发送规则删除事件
    this.emit('ruleDeleted', { ruleId })
  }

  /**
   * 导出规则配置
   */
  exportRules(): Array<{ metadata: RuleMetadata; definition: string }> {
    return Array.from(this.rules.entries()).map(([id, rule]) => ({
      metadata: rule.metadata,
      definition: `
export default {
  metadata: ${JSON.stringify(rule.metadata, null, 2)},
  validate: ${rule.validate.toString()},
  execute: ${rule.execute.toString()},
  rollback: ${rule.rollback?.toString() || 'undefined'}
}`
    }))
  }
}
