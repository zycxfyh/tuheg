#!/usr/bin/env node

/**
 * 增强测试工具 - 参考GitHub Actions和现代CI/CD最佳实践
 *
 * 特性：
 * - 智能模块解析和重试
 * - 高级超时管理
 * - 资源监控和泄漏检测
 * - 分层测试执行策略
 * - 详细的诊断报告
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * 信号量类 - 用于控制并发访问
 * 参考操作系统的信号量算法实现
 */
class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent
    this.currentCount = 0
    this.waitQueue = []
  }

  /**
   * 获取信号量许可
   * 使用Promise实现异步等待
   */
  async acquire() {
    return new Promise((resolve) => {
      if (this.currentCount < this.maxConcurrent) {
        this.currentCount++
        resolve()
      } else {
        this.waitQueue.push(resolve)
      }
    })
  }

  /**
   * 释放信号量许可
   */
  release() {
    this.currentCount--
    if (this.waitQueue.length > 0) {
      const nextResolve = this.waitQueue.shift()
      this.currentCount++
      nextResolve()
    }
  }

  /**
   * 获取当前状态信息
   */
  getStats() {
    return {
      current: this.currentCount,
      max: this.maxConcurrent,
      waiting: this.waitQueue.length,
    }
  }
}

class TestEnhancer {
  constructor() {
    this.startTime = Date.now()
    this.testResults = []
    this.performanceMetrics = {
      slowTests: [],
      memoryUsage: [],
      timeouts: [],
      retries: [],
    }
    this.activeProcesses = new Map() // 跟踪活跃进程 ID -> 进程信息
    this.processCleanupQueue = [] // 进程清理队列
    this.semaphore = new Semaphore(2) // 并发控制信号量，最大2个并发

    // 进程清理定时器
    this.cleanupTimer = setInterval(() => {
      this.performProcessCleanup()
    }, 5000)

    this.config = {
      maxRetries: 3,
      timeoutMs: 45000, // 优化超时时间
      slowTestThreshold: 8000, // 8秒慢测试阈值
      memoryThreshold: 150 * 1024 * 1024, // 150MB内存阈值
      enableResourceMonitoring: true,
      enableIntelligentRetry: true,
      maxConcurrentTests: 2,
      // 针对不同项目类型的特殊配置
      projectTimeouts: {
        frontend: 120000, // 前端测试给更多时间
        'common-backend': 30000,
        default: 60000,
      },
      // 进程清理配置
      cleanupInterval: 5000,
      maxProcessAge: 300000, // 5分钟
    }
  }

  /**
   * 进程清理 - 定期清理超时的进程
   */
  performProcessCleanup() {
    const now = Date.now()

    // 清理超时的进程
    for (const [pid, processInfo] of this.activeProcesses.entries()) {
      if (now - processInfo.startTime > this.config.maxProcessAge) {
        console.warn(`🧹 清理超时进程: ${pid} (${processInfo.pattern})`)
        try {
          process.kill(pid, 'SIGTERM')
        } catch (error) {
          console.warn(`无法终止进程 ${pid}:`, error.message)
        }
        this.activeProcesses.delete(pid)
      }
    }

    // 清理资源
    if (this.activeProcesses.size === 0 && this.processCleanupQueue.length > 0) {
      console.log(`🧽 执行资源清理: ${this.processCleanupQueue.length} 项`)
      this.processCleanupQueue.forEach((cleanup) => cleanup())
      this.processCleanupQueue.length = 0
    }
  }

  /**
   * 根据项目类型计算超时时间
   */
  calculateProjectTimeout(pattern) {
    const projectName = this.extractProjectName(pattern).replace('@tuheg/', '')

    // 特殊项目超时配置
    if (this.config.projectTimeouts[projectName]) {
      return this.config.projectTimeouts[projectName]
    }

    // 前端项目特殊处理
    if (pattern.includes('/frontend/')) {
      return this.config.projectTimeouts.frontend
    }

    // common-backend特殊处理
    if (pattern.includes('/common-backend/')) {
      return this.config.projectTimeouts['common-backend']
    }

    return this.config.projectTimeouts.default
  }

  /**
   * 智能模块解析 - 参考Jest和TypeScript的解析算法
   */
  resolveModule(modulePath, testFile) {
    const testDir = path.dirname(testFile)
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json']

    // 尝试不同扩展名
    for (const ext of extensions) {
      const fullPath = path.resolve(testDir, modulePath + ext)
      if (fs.existsSync(fullPath)) {
        return fullPath
      }
    }

    // 尝试目录索引文件
    const indexPath = path.resolve(testDir, modulePath, 'index.ts')
    if (fs.existsSync(indexPath)) {
      return indexPath
    }

    throw new Error(`Cannot resolve module '${modulePath}' from '${testFile}'`)
  }

  /**
   * 高级超时管理 - 基于测试历史的动态调整
   */
  calculateTimeout(testName, previousDuration) {
    const baseTimeout = this.config.timeoutMs
    const multiplier = previousDuration ? Math.max(1, previousDuration / 5000) : 1
    return Math.min(baseTimeout * multiplier, 120000) // 最大2分钟
  }

  /**
   * 智能重试算法 - 基于失败模式分析
   */
  shouldRetry(testResult, attemptNumber) {
    if (attemptNumber >= this.config.maxRetries) return false

    const failureReason = testResult.failureReason

    // 网络相关失败 - 高概率重试成功
    if (
      failureReason.includes('ECONNREFUSED') ||
      failureReason.includes('timeout') ||
      failureReason.includes('ENOTFOUND')
    ) {
      return true
    }

    // 资源竞争失败 - 中等概率重试
    if (failureReason.includes('EPIPE') || failureReason.includes('resource busy')) {
      return attemptNumber < 2
    }

    // 模块解析失败 - 通常不重试，除非是临时问题
    if (failureReason.includes('Cannot find module')) {
      return false // 模块问题通常需要代码修复
    }

    // 其他失败 - 低概率重试
    return attemptNumber === 1
  }

  /**
   * 资源监控 - 检测内存泄漏和资源泄漏
   */
  monitorResources() {
    if (!this.config.enableResourceMonitoring) return

    const memUsage = process.memoryUsage()
    this.performanceMetrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    })

    // 内存泄漏检测
    if (memUsage.heapUsed > this.config.memoryThreshold) {
      console.warn(`⚠️ High memory usage detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
    }
  }

  /**
   * 分层测试执行策略
   */
  async executeTestsInLayers() {
    const layers = [
      {
        name: '基础工具测试',
        pattern: ['**/common-backend/**'],
        priority: 'high',
        timeoutMultiplier: 1,
      },
      {
        name: '核心服务测试',
        pattern: ['**/backend-gateway/**', '**/creation-agent/**'],
        priority: 'high',
        timeoutMultiplier: 1.5,
      },
      {
        name: '业务逻辑测试',
        pattern: ['**/logic-agent/**', '**/narrative-agent/**'],
        priority: 'medium',
        timeoutMultiplier: 2,
      },
      {
        name: '前端集成测试',
        pattern: ['**/frontend/**'],
        priority: 'low',
        timeoutMultiplier: 3,
      },
    ]

    for (const layer of layers) {
      console.log(`\n🎯 执行${layer.name}...`)
      await this.executeTestLayer(layer)
    }
  }

  /**
   * 执行测试层 - 改进的并发控制算法
   * 使用信号量控制并发，避免资源竞争
   */
  async executeTestLayer(layer) {
    console.log(`🎯 开始执行${layer.name}，并发控制: ${this.semaphore.getStats().max} max`)

    const results = []

    // 并发执行所有测试，使用信号量控制
    const testPromises = layer.pattern.map(async (pattern, index) => {
      // 获取信号量许可
      await this.semaphore.acquire()

      try {
        console.log(`▶️  开始测试 ${index + 1}/${layer.pattern.length}: ${pattern}`)

        // 使用智能超时计算
        const baseTimeout = this.calculateProjectTimeout(pattern)
        const timeout = baseTimeout * layer.timeoutMultiplier

        let result
        let attemptNumber = 1
        const maxRetries = this.config.maxRetries

        // 记录进程开始
        const processId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        this.activeProcesses.set(processId, {
          pattern,
          startTime: Date.now(),
          timeout,
          layer: layer.name,
        })

        // 智能重试循环
        while (attemptNumber <= maxRetries) {
          const startTime = Date.now()

          try {
            result = await this.runJestWithTimeout(pattern, timeout)
            const duration = Date.now() - startTime

            // 如果成功或者错误不可重试，跳出循环
            if (result.success || !result.shouldRetry) {
              result.duration = duration
              result.attempts = attemptNumber
              break
            }

            // 可重试的错误，记录重试信息
            console.log(`🔄 重试测试 ${pattern} (尝试 ${attemptNumber}/${maxRetries})`)

            this.performanceMetrics.retries.push({
              pattern,
              attempt: attemptNumber,
              error: result.error,
              duration,
            })

            attemptNumber++

            // 重试间隔 - 指数退避
            if (attemptNumber <= maxRetries) {
              const delay = Math.min(1000 * 2 ** (attemptNumber - 1), 10000)
              console.log(`⏳ 等待 ${delay}ms 后重试...`)
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          } catch (timeoutError) {
            // 超时错误，记录并重试
            console.log(`⏰ 超时重试 ${pattern} (尝试 ${attemptNumber}/${maxRetries})`)

            this.performanceMetrics.timeouts.push({
              pattern,
              attempt: attemptNumber,
              timeout,
              layer: layer.name,
            })

            attemptNumber++

            if (attemptNumber > maxRetries) {
              result = {
                success: false,
                code: 1,
                error: timeoutError.message,
                category: 'timeout',
                duration: Date.now() - startTime,
                attempts: attemptNumber - 1,
              }
              break
            }
          }
        }

        const testResult = {
          layer: layer.name,
          pattern,
          result,
          duration: result.duration || 0,
          startTime: Date.now() - (result.duration || 0),
          endTime: Date.now(),
          attempts: result.attempts || 1,
        }

        this.testResults.push(testResult)
        results.push(testResult)

        // 记录性能指标
        if (testResult.duration > this.config.slowTestThreshold) {
          this.performanceMetrics.slowTests.push({
            pattern,
            duration: testResult.duration,
            layer: layer.name,
            attempts: testResult.attempts,
          })
        }

        // 清理进程记录
        this.activeProcesses.delete(processId)

        const status = result.success ? '成功' : '失败'
        const retryInfo = testResult.attempts > 1 ? ` (重试${testResult.attempts}次)` : ''
        console.log(`✅ 完成测试 ${pattern}: ${status} (${testResult.duration}ms)${retryInfo}`)

        return testResult
      } catch (error) {
        console.error(`❌ ${layer.name}失败: ${pattern}`, error.message)

        const errorResult = {
          layer: layer.name,
          pattern,
          result: { success: false, error: error.message },
          duration: Date.now() - Date.now(),
          error: true,
          attempts: 1,
        }

        this.testResults.push(errorResult)
        results.push(errorResult)

        // 清理失败的进程记录
        const failedProcesses = Array.from(this.activeProcesses.entries()).filter(
          ([_, info]) => info.pattern === pattern
        )

        failedProcesses.forEach(([pid]) => {
          this.activeProcesses.delete(pid)
        })

        return errorResult
      } finally {
        // 释放信号量许可
        this.semaphore.release()

        // 添加到清理队列
        this.processCleanupQueue.push(() => {
          // 执行必要的清理工作
          console.log(`🧹 清理测试资源: ${pattern}`)
        })
      }
    })

    // 等待所有测试完成
    await Promise.allSettled(testPromises)

    // 输出层级统计
    const layerStats = this.getLayerStats(layer.name, results)
    console.log(`📊 ${layer.name}完成: ${layerStats.successful}/${layerStats.total} 成功`)

    return results
  }

  /**
   * 智能错误诊断 - 分析测试失败原因
   */
  diagnoseTestFailure(pattern, error) {
    const diagnostics = {
      category: 'unknown',
      suggestions: [],
      rootCause: 'unknown',
    }

    const errorMessage = error.message || ''

    // Nx项目不存在
    if (errorMessage.includes('Cannot find project') || errorMessage.includes('does not exist')) {
      diagnostics.category = 'nx_project_not_found'
      diagnostics.rootCause = '项目名称解析错误'
      diagnostics.suggestions = [
        '检查nx.json中是否定义了该项目',
        '验证项目名称格式是否正确',
        '运行 `nx show projects` 查看可用项目',
      ]
    }

    // Jest配置问题
    else if (
      errorMessage.includes('Cannot find module') ||
      errorMessage.includes('module resolution')
    ) {
      diagnostics.category = 'jest_config_issue'
      diagnostics.rootCause = 'Jest模块解析配置错误'
      diagnostics.suggestions = [
        '检查jest.config.js中的moduleNameMapper配置',
        '验证tsconfig.json中的路径映射',
        '检查package.json中的依赖是否正确安装',
      ]
    }

    // TypeScript编译错误
    else if (errorMessage.includes('TS2307') || errorMessage.includes('Cannot find module')) {
      diagnostics.category = 'typescript_error'
      diagnostics.rootCause = 'TypeScript类型错误'
      diagnostics.suggestions = [
        '运行 `npx tsc --noEmit` 检查类型错误',
        '检查tsconfig.json配置',
        '验证导入路径是否正确',
      ]
    }

    // 权限或环境问题
    else if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      diagnostics.category = 'permission_error'
      diagnostics.rootCause = '文件权限或环境问题'
      diagnostics.suggestions = ['检查文件权限', '验证Node.js版本兼容性', '检查系统资源限制']
    }

    // 通用失败
    else {
      diagnostics.category = 'generic_failure'
      diagnostics.rootCause = '未知测试执行错误'
      diagnostics.suggestions = [
        '查看完整的错误日志',
        '尝试单独运行该项目的测试',
        '检查项目依赖是否完整',
      ]
    }

    console.log(`🔍 错误诊断 [${diagnostics.category}]: ${diagnostics.rootCause}`)
    diagnostics.suggestions.forEach((suggestion) => {
      console.log(`  💡 ${suggestion}`)
    })

    return diagnostics
  }

  /**
   * 带超时的Jest执行 - 改进的超时控制算法
   * 使用多层超时保护和智能错误分类
   */
  runJestWithTimeout(pattern, timeout) {
    return new Promise((resolve, reject) => {
      let timeoutId
      let processKilled = false

      // 多层超时保护
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        processKilled = true
      }

      timeoutId = setTimeout(() => {
        console.warn(`⏰ 测试超时警告: ${pattern} 超过 ${timeout}ms`)
        cleanup()
        reject(new Error(`Test timeout after ${timeout}ms for pattern: ${pattern}`))
      }, timeout)

      // 额外的安全超时（比主要超时长一倍）
      const safetyTimeoutId = setTimeout(() => {
        if (!processKilled) {
          console.error(`🚨 严重超时: ${pattern} 超过 ${timeout * 2}ms，强制终止`)
          cleanup()
          reject(new Error(`Critical timeout after ${timeout * 2}ms for pattern: ${pattern}`))
        }
      }, timeout * 2)

      try {
        const projectName = this.extractProjectName(pattern)
        const command = `npx nx run-many --target=test --projects=${projectName} --passWithNoTests --maxWorkers=1 --bail=false --silent`

        console.log(`🔧 执行测试命令: ${command} (超时: ${timeout}ms)`)

        const result = execSync(command, {
          stdio: 'pipe', // 改为pipe以便捕获输出
          timeout: timeout,
          env: {
            ...process.env,
            JEST_TIMEOUT: timeout.toString(),
            // 添加测试环境变量
            NODE_ENV: 'test',
            CI: process.env.CI || 'false',
          },
          maxBuffer: 20 * 1024 * 1024, // 增加到20MB buffer
          killSignal: 'SIGTERM', // 使用更温和的终止信号
        })

        // 成功完成
        clearTimeout(timeoutId)
        clearTimeout(safetyTimeoutId)
        timeoutId = null

        console.log(`✅ 测试完成: ${pattern}`)
        resolve({ success: true, code: 0, output: result.toString() })
      } catch (error) {
        clearTimeout(timeoutId)
        clearTimeout(safetyTimeoutId)
        timeoutId = null

        // 智能错误诊断
        const diagnostics = this.diagnoseTestFailure(pattern, error)

        // 智能错误分类和重试策略
        let errorCategory = diagnostics.category
        let shouldRetry = false

        // 基于诊断结果决定重试策略
        if (diagnostics.category === 'nx_project_not_found') {
          shouldRetry = false // 项目不存在无需重试
        } else if (diagnostics.category === 'jest_config_issue') {
          shouldRetry = false // 配置问题无需重试
        } else if (diagnostics.category === 'typescript_error') {
          shouldRetry = false // 类型错误无需重试
        } else if (diagnostics.category === 'permission_error') {
          shouldRetry = true // 权限问题可能重试
        } else if (error.signal === 'SIGTERM') {
          errorCategory = 'timeout'
          shouldRetry = true
        } else if (error.code === 'ENOENT') {
          errorCategory = 'command_not_found'
          shouldRetry = false
        } else if (error.status === 1) {
          errorCategory = 'test_failure'
          shouldRetry = false
        }

        const errorInfo = {
          success: false,
          code: error.status || 1,
          error: error.message,
          category: errorCategory,
          shouldRetry,
          pattern,
          diagnostics, // 包含诊断信息
        }

        console.log(
          `❌ 测试失败 [${errorCategory}]: ${pattern} - ${error.message.substring(0, 100)}...`
        )

        // 对于可重试的错误，返回错误信息但不reject
        resolve(errorInfo)
      }
    })
  }

  /**
   * 获取层级统计信息
   */
  getLayerStats(layerName, results) {
    const layerResults = results.filter((r) => r.layer === layerName)
    const successful = layerResults.filter((r) => r.result?.success).length
    const total = layerResults.length

    return {
      successful,
      total,
      failed: total - successful,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0',
    }
  }

  /**
   * 从模式中提取项目名称
   */
  extractProjectName(pattern) {
    // 智能项目名称解析策略
    const strategies = [
      // 1. 直接匹配Nx项目名
      () => {
        const nxProjects = [
          'backend-gateway',
          'creation-agent',
          'logic-agent',
          'narrative-agent',
          'frontend',
          'vcptoolbox',
          'vcptoolbox-core',
          'vcptoolbox-sdk',
          'plugin-generator',
          'api-doc-generator',
          'common-backend',
        ]

        for (const project of nxProjects) {
          if (pattern.includes(project)) {
            return project
          }
        }
        return null
      },

      // 2. 从路径模式中提取
      () => {
        const match = pattern.match(/([^/]+)(?=\/\*\*)/)
        return match ? match[1] : null
      },

      // 3. 特殊包名处理
      () => {
        if (pattern.includes('/common-backend/')) return 'common-backend'
        if (pattern.includes('/vcptoolbox/')) return 'vcptoolbox'
        if (pattern.includes('/vcptoolbox-core/')) return 'vcptoolbox-core'
        if (pattern.includes('/vcptoolbox-sdk/')) return 'vcptoolbox-sdk'
        return null
      },
    ]

    for (const strategy of strategies) {
      const result = strategy()
      if (result) {
        console.log(`📋 项目名称解析: ${pattern} -> ${result}`)
        return result
      }
    }

    console.warn(`⚠️ 无法解析项目名称: ${pattern}`)
    return pattern
  }

  /**
   * 生成增强报告
   */
  generateEnhancedReport() {
    const duration = Date.now() - this.startTime
    const report = {
      summary: {
        totalDuration: duration,
        totalTests: this.testResults.length,
        successfulTests: this.testResults.filter((r) => r.result?.success).length,
        failedTests: this.testResults.filter((r) => !r.result?.success).length,
      },
      performance: this.performanceMetrics,
      recommendations: this.generateRecommendations(),
      layerResults: this.testResults,
    }

    // 保存详细报告
    const reportPath = path.join(process.cwd(), 'test-results', 'enhanced-report.json')
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`\n📊 增强测试报告已保存: ${reportPath}`)
    console.log(`⏱️ 总执行时间: ${Math.round(duration / 1000)}s`)
    console.log(`✅ 成功: ${report.summary.successfulTests}/${report.summary.totalTests}`)

    return report
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = []

    if (this.performanceMetrics.slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `发现${this.performanceMetrics.slowTests.length}个慢测试，建议优化或拆分`,
      })
    }

    if (this.performanceMetrics.timeouts.length > 0) {
      recommendations.push({
        type: 'timeout',
        priority: 'high',
        message: '存在超时测试，建议增加超时时间或优化测试逻辑',
      })
    }

    if (this.performanceMetrics.memoryUsage.some((m) => m.heapUsed > this.config.memoryThreshold)) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: '检测到高内存使用，建议检查内存泄漏',
      })
    }

    return recommendations
  }

  /**
   * 主执行方法
   */
  async run() {
    console.log('🚀 启动增强测试执行器...')
    console.log(`📋 配置: 最大重试${this.config.maxRetries}次, 超时${this.config.timeoutMs}ms`)

    try {
      // 启动资源监控
      if (this.config.enableResourceMonitoring) {
        setInterval(() => this.monitorResources(), 5000)
      }

      // 分层执行测试
      await this.executeTestsInLayers()

      // 生成报告
      const report = this.generateEnhancedReport()

      // 基于结果决定退出码
      const hasFailures = report.summary.failedTests > 0
      process.exit(hasFailures ? 1 : 0)
    } catch (error) {
      console.error('💥 测试执行器异常:', error)

      // 清理资源
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer)
      }

      // 强制清理所有活跃进程
      for (const [pid, info] of this.activeProcesses.entries()) {
        console.warn(`🔴 强制清理进程: ${pid} (${info.pattern})`)
        try {
          process.kill(pid, 'SIGKILL')
        } catch (killError) {
          console.warn(`无法强制终止进程 ${pid}:`, killError.message)
        }
      }

      process.exit(1)
    } finally {
      // 最终清理
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer)
      }
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const enhancer = new TestEnhancer()
  enhancer.run().catch(console.error)
}

module.exports = TestEnhancer
