var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
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
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var Crew_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.Crew = void 0
const common_1 = require('@nestjs/common')
let Crew = (Crew_1 = class Crew {
  name
  config
  logger = new common_1.Logger(Crew_1.name)
  agents = new Map()
  tasks = new Map()
  constructor(name, config = {}) {
    this.name = name
    this.config = config
  }
  addAgent(name, agent) {
    this.agents.set(name, agent)
    this.logger.debug(`Added agent "${name}" to crew "${this.name}"`)
  }
  addTask(name, task) {
    this.tasks.set(name, task)
    this.logger.debug(`Added task "${name}" to crew "${this.name}"`)
  }
  getAgent(name) {
    return this.agents.get(name)
  }
  getTask(name) {
    return this.tasks.get(name)
  }
  async execute(context = {}) {
    const startTime = Date.now()
    const results = []
    const completedTasks = new Set()
    const executionMode = this.config.executionMode ?? 'sequential'
    const continueOnError = this.config.continueOnError ?? false
    this.logger.log(`Starting crew "${this.name}" execution (mode: ${executionMode})`)
    try {
      if (executionMode === 'sequential') {
        const sortedTasks = this.sortTasksByDependencies()
        for (const task of sortedTasks) {
          if (!task.canExecute(completedTasks)) {
            const error = `Task "${task.getName()}" dependencies not met`
            this.logger.error(error)
            if (!continueOnError) {
              throw new Error(error)
            }
            continue
          }
          const agent = this.selectAgentForTask(task)
          if (!agent) {
            const error = `No agent available for task "${task.getName()}"`
            this.logger.error(error)
            if (!continueOnError) {
              throw new Error(error)
            }
            continue
          }
          const result = await task.execute(agent, {
            input: context,
            dependencies: this.getDependencyResults(task.getName(), results),
            globalContext: context,
          })
          results.push(result)
          completedTasks.add(task.getName())
          if (!result.success && !continueOnError) {
            throw new Error(result.error ?? 'Task execution failed')
          }
        }
      } else {
        const maxConcurrency = this.config.maxConcurrency ?? 3
        const sortedTasks = this.sortTasksByDependencies()
        const taskQueue = [...sortedTasks]
        const executingTasks = new Set()
        while (taskQueue.length > 0 || executingTasks.size > 0) {
          while (taskQueue.length > 0 && executingTasks.size < maxConcurrency) {
            const task = taskQueue[0]
            if (!task.canExecute(completedTasks)) {
              taskQueue.shift()
              continue
            }
            const agent = this.selectAgentForTask(task)
            if (!agent) {
              taskQueue.shift()
              continue
            }
            const taskName = task.getName()
            executingTasks.add(taskName)
            taskQueue.shift()
            task
              .execute(agent, {
                input: context,
                dependencies: this.getDependencyResults(taskName, results),
                globalContext: context,
              })
              .then((result) => {
                results.push(result)
                completedTasks.add(taskName)
                executingTasks.delete(taskName)
                if (!result.success && !continueOnError) {
                  throw new Error(result.error ?? 'Task execution failed')
                }
              })
              .catch((error) => {
                executingTasks.delete(taskName)
                if (!continueOnError) {
                  throw error
                }
              })
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
      const totalExecutionTime = Date.now() - startTime
      const allSuccess = results.every((r) => r.success)
      this.logger.log(
        `Crew "${this.name}" execution completed in ${totalExecutionTime}ms (success: ${allSuccess})`
      )
      return {
        success: allSuccess,
        results,
        totalExecutionTime,
        metadata: {
          ...this.config.metadata,
          executionMode,
          crewName: this.name,
        },
      }
    } catch (error) {
      const totalExecutionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Crew "${this.name}" execution failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      )
      return {
        success: false,
        results,
        totalExecutionTime,
        error: errorMessage,
        metadata: {
          ...this.config.metadata,
          executionMode,
          crewName: this.name,
        },
      }
    }
  }
  sortTasksByDependencies() {
    const tasks = Array.from(this.tasks.values())
    const sorted = []
    const visited = new Set()
    const visiting = new Set()
    const visit = (task) => {
      if (visiting.has(task.getName())) {
        throw new Error(`Circular dependency detected in crew "${this.name}"`)
      }
      if (visited.has(task.getName())) {
        return
      }
      visiting.add(task.getName())
      const dependencies = task.getDependencies()
      for (const depName of dependencies) {
        const depTask = this.tasks.get(depName)
        if (depTask) {
          visit(depTask)
        }
      }
      visiting.delete(task.getName())
      visited.add(task.getName())
      sorted.push(task)
    }
    for (const task of tasks) {
      if (!visited.has(task.getName())) {
        visit(task)
      }
    }
    return sorted
  }
  selectAgentForTask(task) {
    const taskConfig = task.getConfig()
    if (taskConfig.agent) {
      return this.agents.get(taskConfig.agent)
    }
    return Array.from(this.agents.values())[0]
  }
  getDependencyResults(taskName, results) {
    const task = this.tasks.get(taskName)
    if (!task) {
      return {}
    }
    const dependencies = task.getDependencies()
    const dependencyResults = {}
    for (const depName of dependencies) {
      const depResult = results.find((r) => r.taskName === depName)
      if (depResult) {
        dependencyResults[depName] = depResult
      }
    }
    return dependencyResults
  }
})
exports.Crew = Crew
exports.Crew =
  Crew =
  Crew_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [String, Object])],
      Crew
    )
//# sourceMappingURL=crew.js.map
