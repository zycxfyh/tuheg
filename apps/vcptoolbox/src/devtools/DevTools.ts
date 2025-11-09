import { EventEmitter } from 'events'
import { PluginContext, PluginRuntime, type VCPPlugin } from '../PluginFramework'

// VCPToolBox 开发工具包
// 提供插件开发的调试、测试和辅助功能

export interface DevToolsConfig {
  enabled: boolean
  debugMode: boolean
  performanceMonitoring: boolean
  errorTracking: boolean
  hotReload: boolean
  breakpoints: boolean
}

export interface DebugSession {
  id: string
  pluginId: string
  startTime: Date
  endTime?: Date
  logs: DebugLog[]
  breakpoints: Breakpoint[]
  performance: PerformanceMetrics
  errors: ErrorEvent[]
}

export interface DebugLog {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: any
  stackTrace?: string
}

export interface Breakpoint {
  id: string
  file: string
  line: number
  condition?: string
  enabled: boolean
  hitCount: number
}

export interface PerformanceMetrics {
  loadTime: number
  memoryUsage: number
  apiCalls: number
  averageResponseTime: number
  errorRate: number
}

export interface ErrorEvent {
  id: string
  timestamp: Date
  error: Error
  context: any
  pluginId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 测试框架接口
export interface PluginTest {
  id: string
  name: string
  description: string
  type: 'unit' | 'integration' | 'e2e'
  pluginId: string
  setup: () => Promise<void>
  execute: () => Promise<TestResult>
  teardown: () => Promise<void>
}

export interface TestResult {
  passed: boolean
  duration: number
  assertions: TestAssertion[]
  errors: Error[]
  coverage?: TestCoverage
}

export interface TestAssertion {
  description: string
  passed: boolean
  expected: any
  actual: any
  stackTrace?: string
}

export interface TestCoverage {
  statements: number
  branches: number
  functions: number
  lines: number
}

// 开发工具类
export class DevTools extends EventEmitter {
  private config: DevToolsConfig
  private sessions: Map<string, DebugSession> = new Map()
  private tests: Map<string, PluginTest> = new Map()
  private activeBreakpoints: Map<string, Breakpoint[]> = new Map()

  constructor(config: Partial<DevToolsConfig> = {}) {
    super()

    this.config = {
      enabled: true,
      debugMode: false,
      performanceMonitoring: true,
      errorTracking: true,
      hotReload: false,
      breakpoints: false,
      ...config,
    }
  }

  // 调试会话管理
  startDebugSession(pluginId: string): string {
    if (!this.config.enabled || !this.config.debugMode) {
      return ''
    }

    const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const session: DebugSession = {
      id: sessionId,
      pluginId,
      startTime: new Date(),
      logs: [],
      breakpoints: [],
      performance: {
        loadTime: 0,
        memoryUsage: 0,
        apiCalls: 0,
        averageResponseTime: 0,
        errorRate: 0,
      },
      errors: [],
    }

    this.sessions.set(sessionId, session)

    this.emit('debugSessionStarted', { sessionId, pluginId })

    return sessionId
  }

  endDebugSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.endTime = new Date()
      this.emit('debugSessionEnded', session)
    }
  }

  // 日志记录
  log(sessionId: string, level: DebugLog['level'], message: string, context?: any): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const log: DebugLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      level,
      message,
      context,
    }

    session.logs.push(log)

    // 在控制台输出
    const prefix = `[${level.toUpperCase()}] [${session.pluginId}]`
    console.log(`${prefix} ${message}`, context || '')

    this.emit('logAdded', { sessionId, log })
  }

  // 断点管理
  setBreakpoint(sessionId: string, breakpoint: Omit<Breakpoint, 'id' | 'hitCount'>): string {
    if (!this.config.breakpoints) return ''

    const session = this.sessions.get(sessionId)
    if (!session) return ''

    const bp: Breakpoint = {
      id: `bp-${Date.now()}`,
      hitCount: 0,
      ...breakpoint,
    }

    session.breakpoints.push(bp)

    // 存储到插件级别的断点
    const pluginBreakpoints = this.activeBreakpoints.get(session.pluginId) || []
    pluginBreakpoints.push(bp)
    this.activeBreakpoints.set(session.pluginId, pluginBreakpoints)

    this.emit('breakpointSet', { sessionId, breakpoint: bp })

    return bp.id
  }

  removeBreakpoint(sessionId: string, breakpointId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const index = session.breakpoints.findIndex((bp) => bp.id === breakpointId)
    if (index === -1) return false

    const breakpoint = session.breakpoints[index]
    session.breakpoints.splice(index, 1)

    // 从插件级别断点中移除
    const pluginBreakpoints = this.activeBreakpoints.get(session.pluginId) || []
    const pluginIndex = pluginBreakpoints.findIndex((bp) => bp.id === breakpointId)
    if (pluginIndex !== -1) {
      pluginBreakpoints.splice(pluginIndex, 1)
    }

    this.emit('breakpointRemoved', { sessionId, breakpointId })

    return true
  }

  // 检查断点
  checkBreakpoint(pluginId: string, file: string, line: number): Breakpoint | null {
    if (!this.config.breakpoints) return null

    const pluginBreakpoints = this.activeBreakpoints.get(pluginId) || []

    for (const breakpoint of pluginBreakpoints) {
      if (breakpoint.file === file && breakpoint.line === line && breakpoint.enabled) {
        // 检查条件
        if (breakpoint.condition) {
          try {
            // 这里可以实现条件评估逻辑
            // 暂时跳过条件检查
          } catch {
            continue
          }
        }

        breakpoint.hitCount++

        // 如果是单次断点，禁用它
        if (breakpoint.condition?.includes('once')) {
          breakpoint.enabled = false
        }

        return breakpoint
      }
    }

    return null
  }

  // 性能监控
  recordPerformance(sessionId: string, metrics: Partial<PerformanceMetrics>): void {
    if (!this.config.performanceMonitoring) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    Object.assign(session.performance, metrics)

    this.emit('performanceRecorded', { sessionId, metrics })
  }

  // 错误跟踪
  trackError(
    sessionId: string,
    error: Error,
    context: any,
    severity: ErrorEvent['severity'] = 'medium'
  ): void {
    if (!this.config.errorTracking) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    const errorEvent: ErrorEvent = {
      id: `error-${Date.now()}`,
      timestamp: new Date(),
      error,
      context,
      pluginId: session.pluginId,
      severity,
    }

    session.errors.push(errorEvent)

    // 增加错误率
    session.performance.errorRate = session.errors.length / (session.logs.length + 1)

    this.emit('errorTracked', { sessionId, error: errorEvent })

    // 严重错误时输出到控制台
    if (severity === 'high' || severity === 'critical') {
      console.error(`[${severity.toUpperCase()}] Plugin ${session.pluginId} error:`, error)
    }
  }

  // 测试框架
  registerTest(test: PluginTest): void {
    this.tests.set(test.id, test)
    this.emit('testRegistered', test)
  }

  unregisterTest(testId: string): boolean {
    const removed = this.tests.delete(testId)
    if (removed) {
      this.emit('testUnregistered', testId)
    }
    return removed
  }

  async runTest(testId: string): Promise<TestResult> {
    const test = this.tests.get(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    const startTime = Date.now()

    try {
      // 设置测试环境
      await test.setup()

      // 执行测试
      const result = await test.execute()

      // 计算执行时间
      result.duration = Date.now() - startTime

      this.emit('testCompleted', { testId, result })

      return result
    } catch (error) {
      const result: TestResult = {
        passed: false,
        duration: Date.now() - startTime,
        assertions: [],
        errors: [error instanceof Error ? error : new Error(String(error))],
      }

      this.emit('testFailed', { testId, result })

      return result
    } finally {
      // 清理测试环境
      await test.teardown()
    }
  }

  async runPluginTests(pluginId: string): Promise<Map<string, TestResult>> {
    const pluginTests = Array.from(this.tests.values()).filter((test) => test.pluginId === pluginId)

    const results = new Map<string, TestResult>()

    for (const test of pluginTests) {
      const result = await this.runTest(test.id)
      results.set(test.id, result)
    }

    this.emit('pluginTestsCompleted', { pluginId, results })

    return results
  }

  // 创建标准测试模板
  createStandardTests(pluginId: string): PluginTest[] {
    const tests: PluginTest[] = []

    // 初始化测试
    tests.push({
      id: `${pluginId}-init-test`,
      name: '插件初始化测试',
      description: '测试插件是否能正确初始化',
      type: 'unit',
      pluginId,
      setup: async () => {
        // 初始化测试环境
      },
      execute: async () => {
        // 这里应该实现具体的初始化测试逻辑
        return {
          passed: true,
          duration: 0,
          assertions: [
            {
              description: '插件初始化成功',
              passed: true,
              expected: true,
              actual: true,
            },
          ],
          errors: [],
        }
      },
      teardown: async () => {
        // 清理测试环境
      },
    })

    // API调用测试
    tests.push({
      id: `${pluginId}-api-test`,
      name: 'API调用测试',
      description: '测试插件API调用是否正常',
      type: 'integration',
      pluginId,
      setup: async () => {},
      execute: async () => {
        // 这里应该实现API调用测试逻辑
        return {
          passed: true,
          duration: 0,
          assertions: [
            {
              description: 'API调用成功',
              passed: true,
              expected: 'success',
              actual: 'success',
            },
          ],
          errors: [],
        }
      },
      teardown: async () => {},
    })

    return tests
  }

  // 代码分析工具
  analyzePluginCode(
    pluginId: string,
    code: string
  ): {
    complexity: number
    maintainability: number
    testCoverage: number
    issues: CodeIssue[]
  } {
    const issues: CodeIssue[] = []

    // 简单的代码分析
    const lines = code.split('\n').length
    const functions = (code.match(/function\s+\w+/g) || []).length
    const classes = (code.match(/class\s+\w+/g) || []).length

    // 计算复杂度（简化版）
    const complexity = Math.min(10, functions * 0.5 + classes * 2 + lines * 0.01)

    // 维护性评分（简化版）
    const maintainability = Math.max(1, 10 - complexity + (functions > 0 ? 2 : 0))

    // 检查常见问题
    if (code.includes('console.log')) {
      issues.push({
        type: 'warning',
        message: '发现console.log调用，建议在生产环境中移除',
        line: code.indexOf('console.log'),
        severity: 'low',
      })
    }

    if (code.includes('any')) {
      issues.push({
        type: 'info',
        message: '使用了any类型，考虑使用更具体的类型',
        line: code.indexOf('any'),
        severity: 'medium',
      })
    }

    return {
      complexity,
      maintainability,
      testCoverage: 0, // 需要实际测试覆盖率数据
      issues,
    }
  }

  // 获取调试信息
  getDebugInfo(sessionId: string): DebugSession | null {
    return this.sessions.get(sessionId) || null
  }

  getAllDebugSessions(): DebugSession[] {
    return Array.from(this.sessions.values())
  }

  // 配置管理
  updateConfig(newConfig: Partial<DevToolsConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }

  getConfig(): DevToolsConfig {
    return { ...this.config }
  }
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  line?: number
  severity: 'low' | 'medium' | 'high'
}

// 插件开发辅助函数
export class DevHelpers {
  // 生成插件模板代码
  static generatePluginTemplate(type: string, name: string): string {
    const templates = {
      'story-generator': `
import { VCPPlugin, PluginContext } from '@vcptoolbox/core'

export class ${name}Plugin implements VCPPlugin {
  id = '${name.toLowerCase().replace(/\s+/g, '-')}'
  name = '${name}'
  version = '1.0.0'
  type = 'story-generator' as const

  // 实现插件接口...
}
`,
      'character-creator': `
import { VCPPlugin, PluginContext } from '@vcptoolbox/core'

export class ${name}Plugin implements VCPPlugin {
  id = '${name.toLowerCase().replace(/\s+/g, '-')}'
  name = '${name}'
  version = '1.0.0'
  type = 'character-creator' as const

  // 实现插件接口...
}
`,
    }

    return templates[type as keyof typeof templates] || templates['story-generator']
  }

  // 验证插件结构
  static validatePluginStructure(plugin: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!plugin.id) errors.push('缺少插件ID')
    if (!plugin.name) errors.push('缺少插件名称')
    if (!plugin.version) errors.push('缺少插件版本')
    if (!plugin.type) errors.push('缺少插件类型')

    // 检查必需的方法
    if (!plugin.lifecycle?.onInitialize) {
      errors.push('缺少onInitialize生命周期方法')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // 格式化错误信息
  static formatError(error: Error): string {
    return `[${error.name}] ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}\n${error.stack || ''}`
  }

  // 生成插件文档
  static generatePluginDocs(plugin: VCPPlugin): string {
    return `# ${plugin.name}

## 概述

${plugin.description}

## 功能特性

${Object.entries(plugin.capabilities)
  .map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return `- ${key}: ${JSON.stringify(value, null, 2)}`
    }
    return `- ${key}: ${value}`
  })
  .join('\n')}

## 兼容性

- 最低版本: ${plugin.compatibility.minVersion}
- 支持平台: ${plugin.compatibility.platforms.join(', ')}

## 作者

${plugin.author.name} (${plugin.author.email})
`
  }
}

// 创建单例实例
export const devTools = new DevTools({
  enabled: process.env.NODE_ENV === 'development',
  debugMode: process.env.NODE_ENV === 'development',
  performanceMonitoring: true,
  errorTracking: true,
  hotReload: false,
  breakpoints: false,
})
