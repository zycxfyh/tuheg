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
var Task_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.Task = void 0
const common_1 = require('@nestjs/common')
let Task = (Task_1 = class Task {
  name
  config
  logger = new common_1.Logger(Task_1.name)
  constructor(name, config) {
    this.name = name
    this.config = config
  }
  getName() {
    return this.name
  }
  getConfig() {
    return this.config
  }
  getDependencies() {
    return this.config.dependencies ?? []
  }
  getPriority() {
    return this.config.priority ?? 5
  }
  async execute(agent, context) {
    const startTime = Date.now()
    try {
      this.logger.debug(`Task "${this.name}" executing with agent "${agent.getName()}"`)
      if (this.config.timeout) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Task "${this.name}" timed out after ${this.config.timeout}ms`))
          }, this.config.timeout)
        })
        const executionPromise = agent.execute(this.config.description, {
          ...context.globalContext,
          taskContext: context.input,
          dependencies: context.dependencies,
        })
        const result = await Promise.race([executionPromise, timeoutPromise])
        if (!result.success) {
          throw new Error(result.error ?? 'Task execution failed')
        }
        const executionTime = Date.now() - startTime
        return {
          taskName: this.name,
          success: true,
          output: result.output,
          agent: agent.getName(),
          executionTime,
          metadata: {
            ...this.config.metadata,
            toolsUsed: result.toolsUsed,
          },
        }
      }
      const result = await agent.execute(this.config.description, {
        ...context.globalContext,
        taskContext: context.input,
        dependencies: context.dependencies,
      })
      if (!result.success) {
        throw new Error(result.error ?? 'Task execution failed')
      }
      const executionTime = Date.now() - startTime
      return {
        taskName: this.name,
        success: true,
        output: result.output,
        agent: agent.getName(),
        executionTime,
        metadata: {
          ...this.config.metadata,
          toolsUsed: result.toolsUsed,
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Task "${this.name}" execution failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      )
      return {
        taskName: this.name,
        success: false,
        output: null,
        agent: agent.getName(),
        executionTime,
        error: errorMessage,
        metadata: this.config.metadata,
      }
    }
  }
  canExecute(completedTasks) {
    const dependencies = this.getDependencies()
    return dependencies.every((dep) => completedTasks.has(dep))
  }
})
exports.Task = Task
exports.Task =
  Task =
  Task_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [String, Object])],
      Task
    )
//# sourceMappingURL=task.js.map
