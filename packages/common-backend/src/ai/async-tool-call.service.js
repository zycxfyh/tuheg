'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var AsyncToolCallService_1
var _a
Object.defineProperty(exports, '__esModule', { value: true })
exports.AsyncToolCallService = exports.AsyncToolCallStatus = void 0
const common_1 = require('@nestjs/common')
const event_emitter_1 = require('@nestjs/event-emitter')
const uuid_1 = require('uuid')
var AsyncToolCallStatus
;(function (AsyncToolCallStatus) {
  AsyncToolCallStatus['PENDING'] = 'pending'
  AsyncToolCallStatus['RUNNING'] = 'running'
  AsyncToolCallStatus['COMPLETED'] = 'completed'
  AsyncToolCallStatus['FAILED'] = 'failed'
  AsyncToolCallStatus['TIMEOUT'] = 'timeout'
})(AsyncToolCallStatus || (exports.AsyncToolCallStatus = AsyncToolCallStatus = {}))
let AsyncToolCallService = (AsyncToolCallService_1 = class AsyncToolCallService {
  eventEmitter
  logger = new common_1.Logger(AsyncToolCallService_1.name)
  activeTasks = new Map()
  completedTasks = new Map()
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter
  }
  async callToolAsync(toolName, input, context = {}, config = {}) {
    const taskId = (0, uuid_1.v4)()
    const correlationId = context.correlationId || (0, uuid_1.v4)()
    const task = {
      id: taskId,
      toolName,
      input,
      context: { ...context, correlationId },
      status: AsyncToolCallStatus.PENDING,
      createdAt: new Date(),
      timeoutMs: config.timeoutMs || 30000,
      correlationId,
    }
    this.activeTasks.set(taskId, task)
    this.executeToolAsync(task, config).catch((error) => {
      this.logger.error(`Async tool execution failed for task ${taskId}:`, error)
      this.updateTaskStatus(taskId, AsyncToolCallStatus.FAILED, undefined, error.message)
    })
    this.logger.debug(`Async tool call initiated: ${toolName} (task: ${taskId})`)
    if (config.enableWebSocket !== false) {
      this.eventEmitter.emit('async-tool-call.started', {
        taskId,
        toolName,
        correlationId,
      })
    }
    return taskId
  }
  async executeToolAsync(task, config) {
    const { id: taskId, toolName, input, timeoutMs } = task
    try {
      this.updateTaskStatus(taskId, AsyncToolCallStatus.RUNNING)
      task.startedAt = new Date()
      const toolPromise = this.executeToolByName(toolName, input)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      })
      const result = await Promise.race([toolPromise, timeoutPromise])
      this.updateTaskStatus(taskId, AsyncToolCallStatus.COMPLETED, result)
      this.eventEmitter.emit('async-tool-call.completed', {
        taskId,
        toolName,
        result,
        correlationId: task.correlationId,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const status = errorMessage.includes('timeout')
        ? AsyncToolCallStatus.TIMEOUT
        : AsyncToolCallStatus.FAILED
      this.updateTaskStatus(taskId, status, undefined, errorMessage)
      this.eventEmitter.emit('async-tool-call.failed', {
        taskId,
        toolName,
        error: errorMessage,
        correlationId: task.correlationId,
      })
    }
  }
  async executeToolByName(toolName, input) {
    switch (toolName) {
      case 'web_search':
        return this.mockWebSearch(input)
      case 'file_operation':
        return this.mockFileOperation(input)
      case 'data_analysis':
        return this.mockDataAnalysis(input)
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }
  getTaskStatus(taskId) {
    return this.activeTasks.get(taskId) || this.completedTasks.get(taskId) || null
  }
  getActiveTasks() {
    return Array.from(this.activeTasks.values())
  }
  getTasksByCorrelationId(correlationId) {
    const allTasks = [
      ...Array.from(this.activeTasks.values()),
      ...Array.from(this.completedTasks.values()),
    ]
    return allTasks.filter((task) => task.correlationId === correlationId)
  }
  async waitForTaskCompletion(taskId, timeoutMs = 30000) {
    const startTime = Date.now()
    while (Date.now() - startTime < timeoutMs) {
      const task = this.getTaskStatus(taskId)
      if (!task) {
        throw new Error(`Task ${taskId} not found`)
      }
      if (task.status === AsyncToolCallStatus.COMPLETED) {
        return task
      }
      if (
        task.status === AsyncToolCallStatus.FAILED ||
        task.status === AsyncToolCallStatus.TIMEOUT
      ) {
        throw new Error(`Task ${taskId} failed: ${task.error}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`Task ${taskId} did not complete within ${timeoutMs}ms`)
  }
  cleanupCompletedTasks(maxAgeMs = 3600000) {
    const now = Date.now()
    let cleaned = 0
    for (const [taskId, task] of this.completedTasks.entries()) {
      if (task.completedAt && now - task.completedAt.getTime() > maxAgeMs) {
        this.completedTasks.delete(taskId)
        cleaned++
      }
    }
    this.logger.debug(`Cleaned up ${cleaned} completed async tool tasks`)
    return cleaned
  }
  updateTaskStatus(taskId, status, result, error) {
    const task = this.activeTasks.get(taskId)
    if (!task) return
    task.status = status
    task.result = result
    task.error = error
    if (status === AsyncToolCallStatus.RUNNING) {
      task.startedAt = new Date()
    } else if (
      status === AsyncToolCallStatus.COMPLETED ||
      status === AsyncToolCallStatus.FAILED ||
      status === AsyncToolCallStatus.TIMEOUT
    ) {
      task.completedAt = new Date()
      this.activeTasks.delete(taskId)
      this.completedTasks.set(taskId, task)
    }
    this.logger.debug(`Task ${taskId} status updated to ${status}`)
  }
  async mockWebSearch(input) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return {
      query: input,
      results: [
        { title: '示例搜索结果1', url: 'https://example.com/1', snippet: '这是搜索结果的摘要...' },
        { title: '示例搜索结果2', url: 'https://example.com/2', snippet: '另一个搜索结果...' },
      ],
      timestamp: new Date().toISOString(),
    }
  }
  async mockFileOperation(input) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      operation: 'read',
      file: input,
      content: '文件内容示例...',
      size: 1024,
      timestamp: new Date().toISOString(),
    }
  }
  async mockDataAnalysis(input) {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return {
      data: input,
      analysis: {
        summary: '数据分析完成',
        insights: ['发现趋势A', '发现模式B', '建议行动C'],
        confidence: 0.85,
      },
      timestamp: new Date().toISOString(),
    }
  }
})
exports.AsyncToolCallService = AsyncToolCallService
exports.AsyncToolCallService =
  AsyncToolCallService =
  AsyncToolCallService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [
          typeof (_a =
            typeof event_emitter_1.EventEmitter2 !== 'undefined' &&
            event_emitter_1.EventEmitter2) === 'function'
            ? _a
            : Object,
        ]),
      ],
      AsyncToolCallService
    )
//# sourceMappingURL=async-tool-call.service.js.map
